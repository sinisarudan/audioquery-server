// requirements
const fs = require('fs')
const _ = require('lodash')
const path = require('path')
const https = require('https')
const uuidv4 = require('uuid/v4');
const ysap = require('../lib/ysap');
const sepa = require('../lib/sepa');
const express = require('express');
const td = new ysap.YSAP("td.yaml");
const querystring = require('querystring');
const WebSocketServer = require('ws').Server;

// express router
const router = express.Router();

// configure routes
router.all('*', (req, resp, next) => {

    // debug print
    console.log("Invoked Semantic processor");

    // generate a random request number
    reqid = uuidv4();
    
    // configure/create basic URIs for:
    // - the action to be invoked
    // - the action instance to be created
    actionURI = "<" + td.getNamespace("qmul") + "recommendAction>";
    actionInstance = "<" + td.getNamespace("qmul") + "recommendAction_Inst_" + reqid + ">";
    outputGraph = "<" + td.getNamespace("qmul") + "recommendAction_Output_" + reqid + ">";
    
    // create a KP (i.e. Knowledge Processor, the SEPA client)
    kp = new sepa.SEPA(td.getSubscribeURI(), td.getUpdateURI(), td.getQueryURI());

    // subscribe to action results before invoking the action
    var fb =  {	"graph": outputGraph,
    		"instance": actionInstance };
    var ws4 = kp.doSubscribe(td.getQuery("ACTION_RESULTS", fb), function (data) {

    	// ignore ping messages
    	if (!(data.includes("ping"))){

    	    // check if it's a confirmation message
    	    if (data.includes("subscribed"))
    		console.log("Recommendation Subscription confirmed");
	    
    	    // if it's a real notification
    	    else {

    		// debug print of results
    		console.log("Recommendation Notification received:");
		console.log(data);

		outres = [];
		parsedRes = JSON.parse(data);
		for (r in parsedRes["results"]["addedresults"]["bindings"]){
		    outres.push({"title": parsedRes["results"]["addedresults"]["bindings"][r]["title"]["value"],
				 "url": parsedRes["results"]["addedresults"]["bindings"][r]["audioFile"]["value"]})
		}		
		
		// reply to the client
		resp.writeHead("200", {'Content-Type':'text/plain'});
		resp.write(JSON.stringify(outres));
		resp.end();

    		// close the subscription and delete request and response
    		fb = { "instance": actionInstance }
    		updText = td.getUpdate("DELETE_SEARCH_REQUEST", fb);
    		kp.doUpdate(updText);
		
    		this.close()
		
    	    }
    	}})

    // do an update to request the execution of an action
    console.log("Invoking Recommender Web Thing");
    fb =  {"actionURI": actionURI,
    	   "dataValue": "'" + JSON.stringify(req.body) + "'",
    	   "instance": actionInstance,
    	   "graphURI": outputGraph };
    updText = td.getUpdate("INSERT_SEARCH_REQUEST", fb);
    kp.doUpdate(updText);

    req.on('data', (d) => { console.log("DATA"); });
    req.on('end', () => { console.log("END"); });
    
});

module.exports = router;
