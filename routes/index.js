const express = require('express'),
      fs = require('fs'),
      path = require('path'),
      https = require('https'),
      _ = require('lodash');

const router = express.Router();

const freesoundInternalPrefix = '/freesound';
const freesoundHost = 'freesound.org';
const freesoundApiPrefix = '/apiv2';
const freesoundApiToken = '2rofapnyzy82X90HwjKw56VhDBVIUp8XMq5HWWVI';

const stringFromQuery = (queryObj) => {
  const queryStr =
    _.join(_.map( _.pairs(queryObj),
                  pair => _.join(_.map(pair, encodeURIComponent), '='), '&'));
  return queryStr ? '?' + queryStr : '';
};



router.all('/ciccio',() => console.log('cicciobusNew!'));

router.all(freesoundInternalPrefix, (req, resp, next) => {
  console.log(req);
  console.log({
    protocol: 'https', host: freesoundHost,
    path:
      freesoundApiPrefix + req.path.substr(freesoundInternalPrefix.length) +
      stringFromQuery(_.extend( req.query, {token: freesoundApiToken})),
    method: req.method, headers: req.headers
  });
  var req2 = https.request({
    protocol: 'https', host: freesoundHost,
    path:
      freesoundApiPrefix + req.path.substr(freesoundInternalPrefix.length) +
      stringFromQuery(_.extend( req.query, {token: freesoundApiToken})),
    method: req.method, headers: req.headers
  }, (resp2) => {
    console.log(resp);
    resp.writeHead(resp2.statusCode, resp2.headers);
    resp2.on('data', function (d) { resp.write(d); });
    resp2.on('end', function () { resp.end(); });
  });
  req.on('data', function (d) { req2.write(d); });
  req.on('end', function () { req2.end(); });
});


router.get('/*', (req, resp, next) => {
  var dirfiles = ".." +"/client/index.html";

  resp.sendFile( path.join(__dirname, dirfiles)); // updated to reflect dir structure
});

module.exports = router;

