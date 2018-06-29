const express = require('express');
const fs = require('fs');
const path = require('path');
const https = require('https');
const _ = require('lodash');
const querystring = require('querystring');
const router = express.Router();

// yandex application ID and api key
var yandexURI = "translate.yandex.net";
var yandexPath = "/api/v1.5/tr.json/translate";
var yandexKey = process.env.YANDEX_KEY;

const stringFromQuery = (queryObj) => {
  const queryStr = querystring.stringify(queryObj);
  return queryStr ? '?' + queryStr : '';
};

router.all('*', (req, resp, next) => {

    // prepare request path    
    finalURI = yandexPath + "?key=" + yandexKey + "&text=" + req.url.split("/")[1] + "&lang=en";

    // setting request options
    const options = {
	hostname: yandexURI,
	port: 443,
	path: finalURI,
	method: 'GET'
    };
    
    // initialize output
    output = ""
    statusCode = null

    // do the request
    const req2 = https.request(options, (res2) => {

	// initialize the response to the client
	// by sending status code and headers
	resp.writeHead("200", {});

	// read the status code of the oxford's reply
	statusCode = res2.statusCode;

	// read input data
	res2.on('data', (d) => {
	    output = output + d
	    resp.write(d)
	});
	
    });    
    req2.on('error', (e) => {
	console.error(e);
    });
    req2.on('close', (e) => {

	// close the connection to the client
	resp.end();
	
    });
    req2.end();

    
});

module.exports = router;
