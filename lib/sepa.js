class SEPA {

    // constructor
    constructor(subscribeURI, updateURI, queryURI){

	// reqs
	this.request = require("request");
	this.websocket = require("ws");

	// SEPA URIs
	this.sepaURIs = {};
	this.sepaURIs["subscribeURI"] = subscribeURI;
	this.sepaURIs["updateURI"] = updateURI;
	this.sepaURIs["queryURI"] = queryURI;
	
    }
    
    // update    
    doUpdate(updText, handler = null){

	// do the update!
	const options = {  
	    url: this.sepaURIs.updateURI,
	    method: 'POST',
	    headers: {
		'Accept': 'application/json',
		'Content-type': 'application/sparql-update'
	    },
	    body: updText
	};
	
	this.request(options, function(err, res, body){
	    if (err){
		console.log("Error performing SPARQL Update");
	    } else {	    
		if (handler !== null){
		    handler();
		}
	    }
	});
	
    };

    // query
    doQuery(){
	console.log("TODO -- Query yet to implement, sorry!");
    };

    // subscribe
    doSubscribe(subText, onMessage){

	// create a web socket connection
	var ws = new this.websocket(this.sepaURIs.subscribeURI)

	// handler for opened connection	
	ws.on("open", function open(){
	    ws.send(JSON.stringify({"subscribe":subText}));
	});

	// handler for closed connection
	ws.on("close", function (){
	    console.log("Subscription closed!");
	});

	// handler for received messages
	ws.on("message", onMessage);

	ws.on("error", function(err){
	    console.log("Subscription failed!");
        });
	
	// return the websocket
	return ws;
    }
    
} 

// export the class
module.exports.SEPA = SEPA;
