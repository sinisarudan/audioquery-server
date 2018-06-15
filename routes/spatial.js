var express = require('express');
const path = require('path');
var router = express.Router();

var initialized = false;

router.get('/*', (req, res, next) => {

if (!initialized) {
try {


    // res.io.emit("socketToMe", "room");
    var numUsers = 0;
    initialized = true;

    res.io.on('connection', function (socket) {
      //var addedUser = false;
      var addedUser = false;
      //console.log('a user connected');

      // when the client emits 'new message', this listens and executes
      socket.on('new message', function (data) {
        // we tell the client to execute 'new message'
        socket.broadcast.emit('new message', {
          username: socket.username,
          message: data
        });
      });

      // when the client emits 'add user', this listens and executes
      socket.on('add user', function (username) {
        if (addedUser) return;

        // we store the username in the socket session for this client
        socket.username = username;
        ++numUsers;
        addedUser = true;
        socket.emit('login', {
          numUsers: numUsers
        });
        // echo globally (all clients) that a person has connected
        socket.broadcast.emit('user joined', {
          username: socket.username,
          numUsers: numUsers
        });
      });

      // when the client emits 'typing', we broadcast it to others
      socket.on('typing', function () {
        socket.broadcast.emit('typing', {
          username: socket.username
        });
      });

      // when the client emits 'stop typing', we broadcast it to others
      socket.on('stop typing', function () {
        socket.broadcast.emit('stop typing', {
          username: socket.username
        });
      });

      // when the user disconnects.. perform this
      socket.on('disconnect', function () {
        if (addedUser) {
          --numUsers;

          // echo globally that this client has left
          socket.broadcast.emit('user left', {
            username: socket.username,
            numUsers: numUsers
          });
        }
      });
  });

    } catch (err) {
    console.error(err);
    res.send("Error " + err);
  }
};


  var dirfiles = ".." +"/client/index.html";

  res.sendFile( path.join(__dirname, dirfiles)); // updated to reflect dir structure
});




module.exports = router;
