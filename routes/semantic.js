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
    console.log(process.cwd())
    configFile = "sparql/mapping.json"
    configFileFD = fs.readFileSync(configFile);
    configFileDict = JSON.parse(configFileFD);
    sparqlGen = configFileDict["sparql-generate"]["host"];
    console.log(sparqlGen);
    contentProviders = configFileDict["content-providers"];

    // initialize an rdf graph
    store = rdflib.graph();
    
    // read the request arguments
    keywords = req.body["tags"];

    // initialize promises
    var promises = [];
    
    // read queries    
    for (var cp in contentProviders){
    	console.log(contentProviders[cp])
	key = contentProviders[cp]["key"]

	// read the query for content provider cp
	try {

	    // get the query
	    queryFile = contentProviders[cp]["mappings"]["songs_by_name"]["query"]
	    query = fs.readFileSync(queryFile, "utf-8");

	    // replace token and keywords
	    query = query.replace(/\$token/g, contentProviders[cp]["key"]).replace("$pattern", escape(keywords));	   
	    console.log(query)

	    // promise for sparql-generate request
	    var p = new Promise(function(resolve, reject){
		var options = {url: sparqlGen, method: 'POST', form: {"query": query}};	
		request(options, function(err, res, body){
		    if (err){
			console.log("Error performing request to SPARQL-Generate");
			reject("Error with request");
		    } else {
			console.log("Request to SPARQL-Generate succesful");
			resolve(body);
		    }
		});
	    }).then(
		(data) => {
		    console.log(data)
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
	    console.log(values.length)
	    for (value in values){
		console.log(values[value])
	    	rdflib.parse(values[value], store, "http://example.org/something", 'text/n3');	
	    }

	    // perform the SPARQL query and return results
	    var sparqlQuery = `PREFIX rdf:<http://www.w3.org/1999/02/22-rdf-syntax-ns#>
            PREFIX dc: <http://purl.org/dc/elements/1.1/>
            PREFIX ac: <http://audiocommons.org/ns/audiocommons#>
	    SELECT ?clip ?title WHERE { ?clip rdf:type ac:AudioClip . ?clip dc:title ?title . }`;
	    var q = rdflib.SPARQLToQuery(sparqlQuery, false, store);
	    p = new Promise(
		function(resolve, reject){
		    var o = {};
		    var sqq = store.query(q,
					  // on results
					  function(result){
	    				      o[result["?clip"]["value"]] = result["?title"]["value"];},

					  // fetcher
					  function(){},

					  // on done
					  function(){resolve(o)})
		}
	    ).then(
		(data) => {
		    console.log("Ready to return data!");
		    console.log(data)
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
	(data) => { console.log("ERROR WITH PROMISES") }
    );    

    req.on('data', (d) => { console.log("DATA"); });
    req.on('end', () => { console.log("END"); });
    
});

module.exports = router;
