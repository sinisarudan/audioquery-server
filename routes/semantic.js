// requirements
const fs = require('fs')
const _ = require('lodash')
const path = require('path')
const https = require('https')
const rdflib = require("rdflib");
const uuidv4 = require('uuid/v4');
const express = require('express');
const request = require("request");	   

// express router
const router = express.Router();

// configure routes
router.all('*', (req, resp, next) => {

    // debug print
    console.log("Invoked Semantic processor");

    // initial configuration
    configFile = "sparql/mapping.json"
    configFileFD = fs.readFileSync(configFile);
    configFileDict = JSON.parse(configFileFD);
    sparqlGen = configFileDict["sparql-generate"]["host"];
    contentProviders = configFileDict["content-providers"];

    // initialize an rdf graph
    store = rdflib.graph();
    
    // read the request arguments
    keywords = req.body["tags"];

    // initialize promises
    var promises = [];
    
    // read queries    
    for (var cp in contentProviders){
	key = contentProviders[cp]["key"]

	// read the query for content provider cp
	try {

	    // get the variable
	    varName = cp.toUpperCase() + "_KEY";
	    key = process.env[varName];
	    
	    // get the query
	    queryFile = contentProviders[cp]["mappings"]["songs_by_name"]["query"]
	    query = fs.readFileSync(queryFile, "utf-8");

	    // replace token and keywords
	    query = query.replace(/\$token/g, key).replace("$pattern", escape(keywords));
	    console.log(query)

	    // promise for sparql-generate request
	    var p = new Promise(function(resolve, reject){
		var options = {url: sparqlGen, method: 'POST', form: {"query": query}};	
		request(options, function(err, res, body){
		    if (err){
			console.log("Error performing request to SPARQL-Generate");
			reject("Error with request");
		    } else {
			console.log("Request to SPARQL-Generate for " + cp + " succesful");
			resolve(body);
		    }
		});
	    }).then(
		(data) => {
		    return data
			  }
	    ).catch(
		(data) => { return null }
	    );
	    promises.push(p);
	    	    
	} catch(error){
	    console.log(queryFile + " not found!");
	}	
    }

    // wait for all the promises to be completed
    Promise.all(promises).then(
	values => {
		    
	    // debug print
	    console.log("Promises completed!");

	    // copy RDF results in the graph
	    for (value in values){
	    	rdflib.parse(values[value], store, "http://example.org/something", 'text/n3');	
	    }

	    // perform the SPARQL query and return results
	    var sparqlQuery = `PREFIX rdf:<http://www.w3.org/1999/02/22-rdf-syntax-ns#>
            PREFIX dc: <http://purl.org/dc/elements/1.1/>
            PREFIX ac: <http://audiocommons.org/ns/audiocommons#>
            PREFIX prov: <http://www.w3.org/ns/prov#>
            PREFIX foaf: <http://xmlns.com/foaf/0.1/>
	    SELECT ?clip ?title ?prov ?provURI WHERE { ?clip rdf:type ac:AudioClip . ?clip dc:title ?title . ?clip prov:wasAttributedTo ?provURI . ?provURI foaf:name ?prov . }`;
	    var q = rdflib.SPARQLToQuery(sparqlQuery, false, store);
	    p = new Promise(
		function(resolve, reject){
		    var o = {};
		    var sqq = store.query(q,
					  // on results
					  function(result){
	    				      o[result["?clip"]["value"]] = {
						  "title":result["?title"]["value"],
						  "prov":result["?prov"]["value"],
						  "provURI":result["?provURI"]["value"]
					      };
					  },

					  // fetcher
					  function(){},

					  // on done
					  function(){resolve(o)})
		}
	    ).then(
		(data) => {
		    console.log("Ready to return data!");
		    console.log(data);
		    resp.writeHead("200", {'Content-Type':'text/plain'});
		    resp.write(JSON.stringify(data));
		    resp.end();
		}
	    ).catch(
		(data) => {
		    console.log("Error!");
		    console.log(data);
		}
	    );		    	    
	   
	}
    ).catch(
	(data) => { console.log("Error with promises") }
    );    

    req.on('data', (d) => { console.log("DATA"); });
    req.on('end', () => { console.log("END"); });
    
});

module.exports = router;
