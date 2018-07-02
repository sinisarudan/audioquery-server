var express = require('express');
const path = require('path');
var router = express.Router();

var initialized = false;

router.get('/*', (req, res, next) => {

if (!initialized) {
try {

 console.log("loaded");
    } catch (err) {
    console.error(err);
    res.send("Error " + err);
  }
};


  var dirfiles = ".." +"/client/index.html";

  res.sendFile( path.join(__dirname, dirfiles)); // updated to reflect dir structure
});




module.exports = router;
