var app = angular.module('app', [
    'ngRoute',
    'ngTouch',
    'ngSanitize'


]).config(function($sceProvider){
    $sceProvider.enabled(false);
    //para permitir links externos
});


function addLeadingZeros (n, length)
{
    var str = (n > 0 ? n : -n) + "";
    var zeros = "";
    for (var i = length - str.length; i > 0; i--)
        zeros += "0";
    zeros += str;
    return n >= 0 ? zeros : "-" + zeros;
}





//testController end

//prevent reloading of page when changing adress
app.run(['$route', '$location', '$rootScope', function ($route, $location, $rootScope) {
        var original = $location.path;
        $location.path = function (path, reload) {
            if (reload === false) {
                var lastRoute = $route.current;
                var un = $rootScope.$on('$locationChangeSuccess', function () {
                    $route.current = lastRoute;
                    un();
                });
            }

            return original.apply($location, [path]);
        };
    }])


app.config(function ($routeProvider, $locationProvider, $httpProvider) {

    $locationProvider.html5Mode(true);
    $routeProvider
      .when('/chat', {
            templateUrl: 'parts/chat.html',
            controller: 'queryController'
        }).when('/connect', {
            templateUrl: 'parts/connect.html',
            controller: 'queryController'
        }).otherwise({
        templateUrl: 'parts/list.html',
            controller: 'queryController'
    });

            //$locationProvider.html5Mode(true);

  //headers http
$httpProvider.defaults.useXDomain = true;
$httpProvider.defaults.withCredentials = true;
delete $httpProvider.defaults.headers.common["X-Requested-With"];
$httpProvider.defaults.headers.common["Accept"] = "application/json";
$httpProvider.defaults.headers.common["Content-Type"] = "application/json";

  });

app.directive('ngMain', function() {
  return {

    templateUrl: 'parts/query.html'
    }

});

//custom player for audioquery
app.directive ('assPlayer', ['$rootScope', function($rootScope){

  return {
    restrict: 'E',
    //transclude: true,
    scope: {
      'audiodata' : '='
    },
    templateUrl: 'parts/ass-player.html',
    link: function ($scope, element, attribute) {
      var audiodata = $scope.audiodata;
      // use audiodata.playerid
      var req = {
        method: 'GET', 
        url: '/freesound/sounds/' + audiodata.id + '/?fields=id,name,previews,images,duration,license,username,url' ,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      };

      $.ajax(req).
        then(function(response) {
        // when the response is available

          $scope.$apply(function () {
            $scope.freesound = response;
            $scope.soundsrc = $scope.freesound.previews['preview-hq-mp3'];
            // var sound = ngAudio.load($scope.freesound.previews['preview-hq-mp3']);

          }); 

          var itemid = $scope.freesound.id;
          var itemsrc = $scope.freesound.previews['preview-hq-mp3'];
          //create audio element
          // console.log($scope.audiodata.newsound);
          var itemauthor = $scope.freesound.username;
          var credits = document.createElement("span");
          var license = $scope.freesound.license;
          credits.innerHTML =  'sound: ' + $scope.freesound.name + ' by: ' + itemauthor + '; ';
          
          if (license == "http://creativecommons.org/licenses/by/3.0/") {
                      document.getElementById('sources').appendChild(credits);
          }
          //this has to be replaced
          
          
          var imgid = '#img' + audiodata.playerid;
          var divid = 'audio' + audiodata.playerid;

          $scope.windowid = 'imgwindow' + audiodata.playerid;
          $scope.containerid = 'windowcont' + audiodata.playerid;

          // $scope.loopstart = 'start' + audiodata.playerid;
          // $scope.loopend = 'end' + audiodata.playerid;

          $scope.loopstart = 0;
          $scope.loopend = $scope.freesound.duration;

          

          var myBuffer;
          var msource;
          //not sure about this
          var response;
          //init values here

          var sound      = document.createElement('audio');
          

          //function init

          // var sound;

          // $scope.loop = false;
          $scope.soundvolume = 0.5;
          //$scope.soundspeed = 1;
          $scope.isPlaying = false;
          //this is needed for slider
          //$scope.durationMax = sound.duration;
          //$scope.durationMax = 1000;
          // $scope.playing = false;
          //$scope.seekpos = 0;
          // $scope.offset=0;


          
          //$scope.source = audioCtx.createBufferSource();


          // if (sound.currentTime){
          //   $scope.seekpos = sound.currentTime;
          // };

          //$scope.seekpos = $scope.sound.getCurrentTime;

          
          /* this is for audio element
          $scope.sound.crossOrigin = "anonymous";
          $scope.sound.id       = 'aud' + audiodata.playerid;
          $scope.sound.preload = 'preload';
          // sound.controls = 'controls';
          // sound.loop = 'loop';
          $scope.sound.src      = itemsrc;
          $scope.sound.type     = 'audio/mpeg';
          
          */

          speedslider = document.getElementById("speed-" + audiodata.playerid);
                  
            $scope.soundspeed = speedslider.value;

          var elapsed = audioCtx.currentTime - $scope.startedAt;
          $scope.seekpos = elapsed;



          $scope.Sound = function(buffer){

            $scope.sourceNode = null;
            $scope.startedAt = 0;
            $scope.pausedAt = 0;
            $scope.offset = 0;
            $scope.myVar = 0;
            $scope.loop = false;
            $scope.soundspeed = 1;
            //$scope.loop = false;


            $scope.newloopstart = 0;
            $scope.newloopend = buffer.duration;

            

            //$scope.playing = true;
            //console.log($scope.loop);
            
            //runs once
            

            

            $scope.loopupdate = function(time){
              if ($scope.sourceNode){
                  
                  $scope.sourceNode.loop = $scope.loop;
                  $scope.sourceNode.loopStart = $scope.newloopstart;
                  $scope.sourceNode.loopEnd = $scope.newloopend;


                
                  console.log("loop updated");
              }
            }
            
            // $scope.loopStart = 0;
            // $scope.loopEnd = buffer.duration;

                $scope.play =  function() {
                      //$scope.offset = $scope.pausedAt;
                      //var x = $scope.windowid.offsetLeft, y = $scope.windowid.offsetTop;
                      //console.log(x);
                      //$scope.newoffset = 0;
                      $scope.sourceNode = audioCtx.createBufferSource();
                      $scope.volume = audioCtx.createGain();
                      $scope.sourceNode.connect($scope.volume);
                      $scope.volume.connect(gainNode);
                      //console.log(buffer);
                      $scope.sourceNode.buffer = buffer;

                      $scope.sourceNode.loop = $scope.loop;

                      $scope.setspeed($scope.soundspeed);


                      $scope.sourceNode.start(0, $scope.offset);

                     
                      $scope.startedAt = audioCtx.currentTime - $scope.offset;

                      //$scope.timenow = audioCtx.currentTime;

                      

                      //console.log("playing");
                      $scope.onplay();
                      //run the function that updates the seek
                      //console.log('started at ' + $scope.startedAt);
                      // $scope.elapsed = audioCtx.currentTime - $scope.startedAt;

                      
                      // $scope.$watch('elapsed', function(newValue, oldValue) {

                      // console.log(newValue);
                      // //$scope.updateSeek();

                      // }, true);


                      //$scope.pausedAt = 0;
                      $scope.offset = 0;
                      $scope.playing = true;
                      // $scope.watch;

                      //$scope.currentTime = $scope.getCurrentTime();

                      

                     // console.log("currentTime" + $scope.getCurrentTime());

                      $scope.sourceNode.onended = function(event) {

                        
                        //$scope.seekpos = 0;

                         $scope.$apply(function () {
                          $scope.stop();
                          });
                        
                  

                        //$scope.stop();
                        console.log("ended");
                        // $scope.seekpos = 0;
                        // $scope.updateSeek();
                        //$scope.stop();
                        //console.log("currentTime" + $scope.getCurrentTime());
                      }
                      

                  };

                   $scope.pause = function() {
                    //console.log('started at ' + audioCtx.currentTime);
                      var elapsed = audioCtx.currentTime - $scope.startedAt;
                      $scope.onpause();
                      $scope.stop();
                      //$scope.playing = false;

               
                    

                      //console.log(elapsed + "elapsed");
                      $scope.seekpos = elapsed;
                      //this works fine;
                      //$scope.pausedAt = elapsed;
                      $scope.offset = elapsed;
                      //$scope.playing = false;
                      console.log("current" + $scope.getCurrentTime());
                  };

                   $scope.stop = function() {
                      if ($scope.sourceNode) {          
                          $scope.sourceNode.disconnect();
                          $scope.sourceNode.stop(0);
                          $scope.sourceNode = null;
                      }
                      //$scope.pausedAt = 0;
                      $scope.startedAt = 0;
                      $scope.offset=0;
                      $scope.seekpos = 0;

                      $scope.playing = false;
                  };

                  $scope.getPlaying = function() {
                      return $scope.playing;
                  };
                
                  $scope.getCurrentTime = function() {
                      if($scope.offset) {
                          //console.log($scope.offset + "is offset");
                          return $scope.offset;
                      }
                      else if($scope.startedAt) {
                        //console.log($scope.startedAt + "startedAt");
                        //console.log(audioCtx.currentTime - $scope.startedAt + "return");
                          var elaps = audioCtx.currentTime - $scope.startedAt;
                          if (elaps >= $scope.loopend){
                            return loopstart;
                          }

                          return audioCtx.currentTime - $scope.startedAt;
                      }
                      //console.log("else zero");
                      return 0;
                  };

                  //$scope.currentTime = $scope.getCurrentTime();
                 // console.log($scope.currentTime);
                 // $scope.seekpos = $scope.getCurrentTime();
                  

                  // $scope.$apply(function () {
                  // $scope.seekpos = $scope.getCurrentTime();
                  // })

                  //relative mousex maps to duration of the song

                  //$scope.loopstart = $( "windowid" ).onmousemove(sendx());

                  // $( "dragstart" ).mousemove(function( event ) {
                  // var pageCoords = "( " + event.pageX + ", " + event.pageY + " )";
                  // var clientCoords = "( " + event.clientX + ", " + event.clientY + " )";
                  // console.log(pageCoords);
                  // console.log(clientCoords);
                  // console.log("10KKKKK");
                  // // $( "span:first" ).text( "( event.pageX, event.pageY ) : " + pageCoords );
                  // // $( "span:last" ).text( "( event.clientX, event.clientY ) : " + clientCoords );
                  // });

                //$scope.windowid.addEventListener("loopstart", function(){ setloopstart(); });
                  
                  

                  $scope.setloopstart = function(){

                    var element = document.getElementById($scope.loopstart);
                    var boxwidth = angular.element(document.getElementById($scope.containerid))[0].clientWidth;
                     console.log("pix start: " + element.offsetLeft);
                    $scope.newloopstart = element.offsetLeft * $scope.sourceNode.buffer.duration / boxwidth;                   
                    console.log("sample start: " +  $scope.newloopstart);
                    $scope.loopupdate();
                    // if ($scope.sourceNode){
                    //   $scope.sourceNode.loopStart = $scope.newloopstart;
                      
                    // }

                  }

                    $scope.setloopend = function(){
                    
                    var element = document.getElementById($scope.loopend);
                    var boxwidth = angular.element(document.getElementById($scope.containerid))[0].clientWidth;
                     console.log("pix end: " + element.offsetLeft);
                    $scope.newloopend = element.offsetLeft * $scope.sourceNode.buffer.duration / boxwidth;                   
                    console.log("sample end: " +  $scope.newloopend);

                    var timetostop = $scope.newloopend - $scope.seekpos;


                    $scope.loopupdate(timetostop);
                    // if ($scope.sourceNode){
                    //   $scope.sourceNode.loopEnd = $scope.newloopend;
                      
                    // }
                    

                  }


                
                  ////////////////////////
                  //updates the value of the player with the new value
                  $scope.setseek = function(val){

                    // $scope.offset=val;
                    // console.log($scope.offset);
                    

                    if ($scope.getPlaying()){

                      $scope.pause();

                    // $scope.pause();
                    $scope.offset=val;
                    // console.log($scope.seekpos + " is seekpos");
                    $scope.play();

                    //$scope.sourceNode.start(0, $scope.offset);

                    //$scope.playpause();
                    }
                    else{
                    $scope.offset=val;
                    //$scope.playpause();
                    //$scope.pause();
                    }
                    //sound.currentTime=val;
                  }

                  seekslider = document.getElementById("slider-" + audiodata.playerid);
                  //console.log(seekslider);
                  //seekslider.addEventListener("onclick", function(){ seektimeupdate(); });

                  // function seektimeupdate(){

                  // //seekslider = document.getElementById("slider-" + audiodata.playerid);
                  
                  // //console.log(seekslider.value);
                  // // var nt = sound.currentTime;
                  // // seekslider.value = nt;
                  // console.log("timeupdate");
                  // var nt = $scope.getCurrentTime();
                  // console.log(nt);
                  // //seekslider.value = nt;
                  // //console.log(nt);
                  // var curmins = Math.floor(nt / 60);
                  // var cursecs = Math.floor(nt - curmins * 60);
                  // var durmins = Math.floor(getDuration() / 60);
                  // var dursecs = Math.floor(getDuration() - durmins * 60);
                  // if(cursecs < 10){ cursecs = "0"+cursecs; }
                  // if(dursecs < 10){ dursecs = "0"+dursecs; }
                  // if(curmins < 10){ curmins = "0"+curmins; }
                  // if(durmins < 10){ durmins = "0"+durmins; }
            
                  // }
                  /////////////////////

                  

                
                  $scope.getDuration = function() {
                    return buffer.duration;
                  };

                  $scope.setvolume = function(val){
                  //$scope.sourceNode.volume = val;
                   if ($scope.sourceNode){
                    $scope.volume.gain.value = val;
                    }
                    else {
                      $scope.playpause();
                    }
                    
                    //gainNode.gain.value = val;
                    borderval = val + 'px';

                  }

                  $scope.setspeed = function(val){
                    if ($scope.sourceNode){
                    $scope.sourceNode.playbackRate.value = val;
                    }
                    else {

                      console.log("you have to play first");
                    }
                  }



                  $scope.playpause = function(){
                    if ($scope.getPlaying()) {
                      $scope.pause();
                      $scope.playing = false;

                    } else {
                      $scope.play();
                      $scope.playing = true;
                      
                    }
                  }

               

                  if (audiodata.newsound === 1) {
                    //sound.autoplay = 'autoplay';
                    //play the sound invoking the playsound function
                    //$scope.isPlaying = true;
                    $scope.playing = false;

                     $scope.$apply(function () {
                      $scope.playpause();
                      $scope.playing = true;
                    });

                    //$scope.playing = false;
                    

                    
                  }
                  counter=0;

                   // put element on playlist
                  document.getElementById(divid).appendChild(sound);

                }

              var init = function (buffer){
                //console.log(buffer);
                sound = new $scope.Sound(buffer);
                //$scope.playing=true;
              }

            var getsound = function (){

              var request = new XMLHttpRequest();
                request.open('GET', itemsrc, true);
                request.responseType = 'arraybuffer';
                request.addEventListener('load', function() {
                    audioCtx.decodeAudioData(
                        request.response,
                        function(buffer) {
                            init(buffer);
                           
                        },
                        function(e) {
                            console.error('ERROR: context.decodeAudioData:', e);
                        }
                    );
                });
                request.send();
              }

            getsound();

  

          $scope.onplay = function() {




            if(!$scope.loop){

              $scope.$parent.logger2('played: ' + $scope.freesound.name);
               // window.setInterval(function() {

               //    $scope.$apply(function () {
               //          $scope.seekpos = $scope.getCurrentTime();
               //          });
               //          //console.log('hi' + $scope.timenow);
               //        }, 100); 
              //console.log("currentTime" + $scope.getCurrentTime());
            }
            else{
              if(counter<1){
                $scope.$parent.logger2('looping: ' + $scope.freesound.name);
                 // window.setInterval(function() {

                 //  $scope.$apply(function () {
                 //        $scope.seekpos = $scope.getCurrentTime();
                 //        });
                 //        //console.log('hi' + $scope.timenow);
                 //      }, 100); 
                //console.log("currentTime" + $scope.getCurrentTime());
              }
              counter++;
              //console.log("currentTime" + $scope.getCurrentTime());
            }


            // $scope.$apply(function () {
            //   $scope.seekpos = $scope.getCurrentTime();
              
            // });
          }

          $scope.onpause = function() {
              $scope.$parent.logger2('paused: ' + $scope.freesound.name);
          }

          $scope.removethis = function() {
          //$scope.$parent.sounds.splice(index, 1);
          $scope.$parent.removeitem(audiodata.playerid);
          $scope.$parent.logger2('removed: ' + $scope.freesound.name);
          $scope.stop();
        }

       


          $scope.updateSeek = function() {
            if ($scope.sourceNode){

              
              $scope.$apply(function () {
                $scope.seekpos = $scope.elapsed;
              });
            // $scope.seekpos = $scope.getCurrentTime();
            
            }
          }

          window.setInterval(function() {
            if ($scope.sourceNode){
              $scope.$apply(function () {
              $scope.seekpos = $scope.getCurrentTime();
              // $scope.updateSeek();
              });
            }
                        //console.log('hi' + $scope.timenow);
          }, 100);

          // $scope.seekpos = $scope.$watch('currentTime', function(newValue, oldValue) {

          //             //console.log(newValue);

          //             return $scope.currentTime

          //   }, true);

          var thistime = 0;

          if ($scope.sourceNode){
            thistime = getCurrentTime();
          }
          else{
            thistime = 0;
          }

          // $scope.$watch('elapsed', function() {
          //     //alert('hey, myVar has changed!');
          //     $scope.seekpos = $scope.elapsed;
          // });

         //  $scope.$watch('audioCtx.currentTime', function(newValue, oldValue) {

         //  //             //console.log(newValue);

         //  //             return $scope.currentTime




         //  }, true);

         //  if ($scope.sourceNode){

         //   $scope.$apply(function () {
                  
         //          $scope.seekpos = $scope.getCurrentTime();
         //    });

         // }
          
          // $scope.$watch('masterval', function(newValue, oldValue) {

          // console.log($scope.masterval);

          // }, true);

          /*
          $scope.$watch('loop', function(newValue, oldValue) {
          // if (newValue)
          //   console.log($scope.loop.booleanVal);
          console.log($scope.loop);
            $scope.sourceNode.addEventListener('onended', function() {


              if ($scope.loop) {

                // $scope.offset=0;
                // $scope.play();
                // this.currentTime = 0;
                // $scope.isPlaying = false;
                // $scope.playsound();
                // sound.play();
                
              }
              else{
               
               //console.log($scope.loop.booleanVal);
                // sound.pause();
                // $scope.offset=0;
                
                $scope.$parent.logger2('loopstop: ' + $scope.freesound.name);
                counter=0;
              }
              return $scope.isPlaying; 

          }, false);
        }, true);
        */



          /*
        $scope.playsound = function() {

          var sourcePlay = audioCtx.createBufferSource();


         if ($scope.isPlaying){
          //sound.pause();

          //sourcePlay.stop();
          //store the playHead
          sourcePlay.disconnect();
          // sourcePlay.stop(0);
          sourcePlay = null;

          $scope.isPlaying = false;
          console.log('play' + $scope.isPlaying);
          //console.log(" in playing" + buffers);
          }
          else{

            var playPromise = sound.play();


            //sourcePlay.loop
            //sourcePlay.loopStart and sourcePlay.loopEnd
            //sourcePlay.playbackRate , can be inverse
            //sourcePlay
            //must be of same sample rate of audiocontext or a NotSupported exception must be thrown
            //sourcePlay.sampleRate
            //sourcePlay.start(offset)

            sourcePlay.buffer = $scope.source.buffer;
            sourcePlay.start();
            sourcePlay.connect(gainNode);
            sources.push(sourcePlay);

             $scope.isPlaying = true;
            }

            if (playPromise !== undefined) {
                playPromise.then(_ => {

                // $scope.isPlaying = true;
                console.log('play' + $scope.isPlaying);
      
            // Automatic playback started!
            // Show playing UI.
            })
            .catch(error => {
            // Auto-play was prevented
            // Show paused UI.
            });
            }
          }

          */
          // source.start(0);
          // itemsrc.start(0);
 


      //   $scope.playsound = function() {

          
      //     var playPromise = sound.play();

      //     if (playPromise !== undefined) {
      //         playPromise.then(_ => {

      //         if ($scope.isPlaying){
      //           sound.pause();
      //           $scope.isPlaying = false;
      //       console.log('pause' + $scope.isPlaying);
            

      //     }
      //     else {
      //         //sound.play();
      //         $scope.isPlaying = true;
      //         console.log('hu');

      //     }
      // // Automatic playback started!
      // // Show playing UI.
      //     })
      //     .catch(error => {
      // // Auto-play was prevented
      // // Show paused UI.
      //     });
      //     }



      //     // source.start(0);
      //     // itemsrc.start(0);
      //   }  




      /*
        $scope.setvolume = function(val){
          // console.log($scope.soundvolume);
          // source.volume = val;
          sourcePlay.volume = val;
          //sound.volume = val;
          // console.log(sound.volume);
          // msource.volume = val;
          borderval = val + 'px';

        }

        $scope.setspeed = function(val){
          // console.log($scope.soundspeed);
          // source.playbackRate = 1/val;
          sound.playbackRate = 1/val;
          // msource.playbackRate = 1/val;
          // borderval = val + 'px';

        }
        */

        // $scope.stopsound = function(){
          
        //   $scope.isPlaying = false;
        //   sound.pause();
        //   sound.currentTime = 0;
        //   // msource.playbackRate = 1/val;
        //   // borderval = val + 'px';

        // }

        


      



        // console.log(msource.buffer);
        //           // msource.buffer = buffer;
        // console.log(msource.buffer.length);

        //console.log($scope.loop);

        
///
        // console.log(itemsrc);

      // var mySource = audioCtx.createBufferSource();
    // myBuffer.start(0);
    // myBuffer.loop;
      // mySource.connect(gainNode);

        // var msource = audioCtx.createMediaElementSource(sound);
//begin old code        
        // msource.connect(gainNode);
        // sources.push(msource);
//end old code

        //sources.push(source);
        $scope.conversion  = $scope.freesound.duration;
        // $scope.conversion =  function() {

        //   var stretched = $scope.freesound.duration;

        //   //var stretched = $scope.freesound.duration / $scope.setspeed
        //   console.log(stretched);

        //   return stretched;
        // }

      //$scope.updateSeek();
        



      }, function(response) {
        // error.
        //ok
      });

    },

  }
}]);



app.directive('resizable', function(){

    var resizableConfig = {containment: ".imgcontainer"};
    var draggableConfig = {containment: ".imgcontainer"};

    //console.log(jQuery.ui);


    return {
        restrict: 'A',
        scope: {
            callback: '&onResize'
        },
        link: function postLink(scope, elem) {
            elem.resizable(resizableConfig);
            elem.draggable(draggableConfig);
            elem.on('resizestop', function () {
                if (scope.callback) scope.callback();
            });
        }
    };


});


app.directive('audiosource', function(){
});

app.directive('dragMe', function() {
  return {
    restrict: 'A',
    link: function(scope, elem, attr, ctrl) {
      elem.draggable({containment:'parent', axis: 'x'});
      //elem.resizable({containment:'parent'});
    }
  };
});



app.directive('ngMain2', function() {
  return {
    templateUrl: 'parts/query.html'
  }
});

app.filter('reverse', function() {
  return function(items) {
    return items.slice().reverse();
  };
});

app.filter('numberFixedLen', function () {
    return function (a, b) {
        return (1e4 + a + "").slice(-b)
    }
});

app.filter('shortnum', function () {
    return function (a, b) {
        return (1e4 + a + "").slice(-b)
    }
});

app.filter('sectime', [function() {
    return function(seconds) {
        return new Date(1970, 0, 1).setSeconds(seconds);
    };
}])

app.filter('tostring', function() {
  return function(a) {
    return a.toString();
  };
});

app.filter('numberStr', function () {
    return function (string) {
        parseInt(number);
    }
});

app.filter('rawHtml', ['$sce', function($sce){
  return function(val) {
    return $sce.trustAsHtml(val);
  };
}]);

app.filter('reverse', function() {
  return function(items) {
    return items.slice().reverse();
  };
});


app.filter('array', function() {
  return function(items) {
    var filtered = [];
    angular.forEach(items, function(item) {
      filtered.push(item);
    });
   return filtered;
  };
});

app.filter("trustUrl", ['$sce', function ($sce) {
return function (recordingUrl) {
return $sce.trustAsResourceUrl(recordingUrl);
};
}]);


app.filter('urlnode', function(){
  return function(item) {
    var str = item;
 str.replace("http://freesound.org/apiv2/", "/freesound/");
  };
});

function findinarray(arraytosearch, key, valuetosearch) {

    for (var i = 0; i < arraytosearch.length; i++) {

    if (arraytosearch[i][key] == valuetosearch) {
    return i;
    }
    }
    return null;
    }
