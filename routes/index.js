var assert = require('assert');
var request = require('request');
var moment = require('moment');
var firebase = require('firebase');
var papaparse = require('papaparse');

// Initialize Firebase
var config = {
    apiKey: "AIzaSyB5BuTPSwcEHm2cS0xPWIWvSKx0jH07VEU",
    authDomain: "data-mining-70fc9.firebaseapp.com",
    databaseURL: "https://data-mining-70fc9.firebaseio.com",
    storageBucket: "data-mining-70fc9.appspot.com",
    messagingSenderId: "1010601239996"
};
firebase.initializeApp(config);

var sFBToken = '1669573800000279|rU-PiJzm1B9fL8brn_F7b4aHsD8';
var nSinceDate = 1470805200;
var oEndpoints = {};
oEndpoints.facebook = {
  page: 'https://graph.facebook.com/v2.8/*pageName*?fields=fan_count,category,checkins,name,feed.since(' + nSinceDate + '){comments,reactions}&access_token=' + sFBToken,
  searchPage: 'https://graph.facebook.com/v2.8/search?type=page&q=*artistName*&access_token=' + sFBToken  
};
oEndpoints.spotify = {
  top200Songs: 'https://spotifycharts.com/regional/mx/weekly/*startDate*--*endDate*/download'
};

global.btoa = function (str) {return new Buffer(str).toString('base64');};

exports.index =  function(req, res, next) {
  res.render('index', { title: 'Express' });
};

//Working
var getCommunityHelper = function(sPageName, sRootNode, db){
    if(!sPageName) return;

    var sURL = oEndpoints.facebook.page;
    sURL = sURL.replace('*pageName*', sPageName.replace(/ /g, '+'));
    
    console.log(sURL);
    
    var sTecCommunityNode = sRootNode; //'tecCommunity-counter'
    var oTecCommunity = firebase.database().ref(sTecCommunityNode);
    
    var oFeeds = [];
    var oPeople = [];
    
    var fSuccess = function(oError, oResponse, sData){
      if(!sData) return;
      
      //console.log(oResponse);
      var oData = JSON.parse(sData);
        
      var oFeed = oData.feed;
    
      if(!oFeed) return;
        
      //Request new feed
      oFeeds.push.apply(oFeeds, oFeed.data);
    
      if(oFeed.paging && oFeed.paging.next){
        //$.getJSON(oFeed.paging.next, fSuccessFeed);
        request(oFeed.paging.next, fSuccessFeed);
      }
    };

    var fSuccessFeed = function(oError, oResponse, sData){
      if(!sData) return;
      
      var oData = JSON.parse(sData);
      
      if(oData.data.length){
        //Feed found
        oFeeds.push.apply(oFeeds, oData.data);
      }

      if(oData.paging){
        //Paging enable
      
        //Request new feed
        //$.getJSON(oData.paging.next, fSuccessFeed);
        request(oData.paging.next, fSuccessFeed);
      }else{
        //Total feeds retrieved
        console.log("Reactions");
      
        //Retrieve all reactions of each feed
        var oReactions;
        var oComments;
        var oUsers = {};
      
        //Execute all reactions paginations
        for(var i = 0; i < oFeeds.length; i++){
          if(oFeeds[i].reactions){
            oReactions = oFeeds[i].reactions;
            if(oReactions.data.length){
              oPeople.push.apply(oPeople, oReactions.data);
      
              //Save users
              //var oUsers = {};
              var oUser = {};
              for(var j = 0; j < oReactions.data.length; j++){
                oUser = {
                  id: oReactions.data[j].id,
                  name: oReactions.data[j].name
                };
      
                oUsers[oUser.id] = oUser;
      
                //saveUser(oUser);
              }
            }
            if(oReactions.paging && oReactions.paging.next){
              //$.getJSON(oReactions.paging.next, fSuccessReactions);
              request(oReactions.paging.next, fSuccessReactions);
            }
          }
        }
        saveUsers(oUsers);
      }
    };

    var fSuccessReactions = function(oError, oResponse, sData){
      if(!sData) return;
      
      var oData = JSON.parse(sData);
      
      if(oData.data.length){
        oPeople.push.apply(oPeople, oData.data);
        //Save users
        var oUsers = {};
        var oUser = {};
        for(var i = 0; i < oData.data.length; i++){
          oUser = {
            id: oData.data[i].id,
            name: oData.data[i].name
          };
          oUsers[oUser.id] = oUser;
        }
        saveUsers(oUsers);
      }

      if(oData.paging && oData.paging.next){
        //Request next
        //$.getJSON(oData.paging.next, fSuccessReactions);
        request(oData.paging.next, fSuccessReactions);
      }else{
        //Total reactions retrieved
        var oUsers = {};
        //Retrieve all comments of each feed
        var oComments;
        for(var i = 0; i < oFeeds.length; i++){
          if(oFeeds[i].comments){
            oComments = oFeeds[i].comments;
  
            if(oComments.data.length){
  
              //Save users
              //var oUsers = {};
              var oUser = {};
              for(var j = 0; j < oComments.data.length; j++){
                oUser = {
                  id: oComments.data[j].from.id,
                  name: oComments.data[j].from.name
                };
  
                oUsers[oUser.id] = oUser;
  
                //saveUser(oUser);
              }
            }
  
            if(oComments.paging && oComments.paging.next){
              //$.getJSON(oComments.paging.next, fSuccessComments);
              request(oComments.paging.next, fSuccessComments);
            }
          }
        }

      saveUsers(oUsers);
    }
  };
    var fSuccessComments = function(oError, oResponse, sData){
      if(!sData) return;
      
      var oData = JSON.parse(sData);
      
      if(oData.data && oData.data.length){
        //Save users
        var oUsers = {};
        var oUser = {};
        for(var i = 0; i < oData.data.length; i++){
          oUser = {
            id: oData.data[i].from.id,
            name: oData.data[i].from.name
          };

          oUsers[oUser.id] = oUser;

          //saveUser(oUser);
        }

        saveUsers(oUsers);
      }

      if(oData.paging && oData.paging.next){
        //Request next
        //$.getJSON(oData.paging.next, fSuccessComments);
        request(oData.paging.next, fSuccessComments);
      }else{
        //Total comments retrieved (& reactions)
        //console.log(oPeople);
      }
    };

    var saveUsers = function(oUsers){
      //Initialize counter attr of oUsers
      for(var sUserID in oUsers){
        oUsers[sUserID].counter = 1;
      }

      //Get current counter of each user
      oTecCommunity.once('value')
        .then(function(oSnap){
          //Update counter of each user (local)
          oSnap.forEach(function(oChildSnap){
            var nCurrentCounter;
            if(oUsers[oChildSnap.key]){
              nCurrentCounter = oChildSnap.child('counter').val();
              oUsers[oChildSnap.key].counter = nCurrentCounter + 1;
            }
          });

          //Update counter of each user (remote)
          oTecCommunity.update(oUsers);
          
          console.log('Saved / Updated (' + Object.keys(oUsers).length + ') records');

          //$("#results").prepend($('<div>Saved / Updated <b>' + oUsers.length + '</b> records at ' + sTecCommunityNode + '</div>'));
      });
    };

    //$.getJSON(sURL, fSuccess);
    request(sURL, fSuccess);
};

//Working (POST)
//Payload
/*
{
  "pageName": "TecCampusGDL",
  "rootName": "tecCommunity"
}
*/
exports.getCommunity = function(req, res, next){
    console.log(req.body.rootNode);
    if(!req.body.rootNode || !req.body.pageName){
      console.log('Incomplete parameters');
      res.send('Incomplete parameters');
      return;
    }
    
    var sRootNode = req.body.rootNode;
    getCommunityHelper(req.body.pageName, sRootNode, req.db);
    
    res.send('NodeJS ' + sRootNode);
};

//Working (GET)
exports.getTecCommunity = function(req, res, next){
  var sGetCommunityURL = 'https://datamining-zdr00.c9users.io:8080/getCommunity';
  var sTecPageName = 'TecCampusGDL';
  var sRootNode = 'tecCommunityFB';
        
  var fCallback = function(oError, oResponse, sData){
    //NULL
    console.log('Response: ' + sData);
    console.log('getCommunity of <' + sTecPageName + '>');
  };
  
  request({
    url: sGetCommunityURL,
    method: "POST",
    json: true,
    body: {
      "pageName": sTecPageName,
      "rootNode": sRootNode
    }
  }, fCallback);
  
  res.send('Retrieving tecs community');
};

//Working (GET)
exports.getTopArtists = function(req, res, next){
  
  const FINAL_DAY = "28";
  const FINAL_MONTH = "10";
  const FINAL_YEAR = "2016";
  const FINAL_DATE =
  	moment(FINAL_YEAR + FINAL_MONTH + FINAL_DAY, "YYYYMMDD");
  
  var artists = {};
  
  var fetchArtists = function() {
  	var day = "12";
  	var month = "08";
  	var year = "2016";
  	var date = moment(year + month + day, "YYYYMMDD");
  	
  	while (parseInt(date.format("YYYYMMDD")) <=
  		parseInt(FINAL_DATE.format("YYYYMMDD"))) {
  		//console.log(date.format("YYYYMMDD"));
  		retrieveCSV(date);
  	}
  };
  var retrieveCSV = function(date) {
  	var link = oEndpoints.spotify.top200Songs;
  	link = link.replace('*startDate*', date.format("YYYY-MM-DD"));
  	link = link.replace('*endDate*', date.add(7, "days").format("YYYY-MM-DD"));
  	
  	request("https://crossorigin.me/" + link, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        console.log("artists");
        var result = papaparse.parse(body);
        
        //Remove header csv
    		result.data.splice(0, 1);
    
    		//Remove last trailing char
    		result.data.splice(result.data.length - 1, 1);
    
    		var oArtist = {};
    		var sArtist = "";
    		var sArtistName = "";
    		for (var i = 0; i < result.data.length; i++) {			
    			sArtistName = result.data[i][2];
    			sArtist = btoa(sArtistName);
    			sArtist = sArtist.replace(/\//g, "%");
    
    			if (artists[sArtist] == undefined) {
    				artists[sArtist] = {};
    				artists[sArtist].name = sArtistName;
    				artists[sArtist].count = 1;
    			} else {
    				artists[sArtist].count += 1;
    			}
    		}
    		
    		firebase.database().ref("artistsSpotify").update(artists);
      }
    });
  	
  }
  
  fetchArtists();

 
  res.send('Getting artists from Spotify Top 200 Songs Weekly');
};

//Working (GET)
exports.getArtistsCommunity = function(req, res, next){
  firebase.database().ref('artistsSpotify').once('value').then(function(oSnap){
    oSnap.forEach(function(oChildSnap){
      var sArtistID = oChildSnap.key;
      var sArtistName = oChildSnap.child('name').val();
      var oArtist = {
        "artist": {
          "data": {
            "id": sArtistID,
            "name": sArtistName
          },
          "key": sArtistID
        }
      };
      var sGetArtistFBPage = 'https://datamining-zdr00.c9users.io:8080/getArtistFBPage';
      var fCallback = function(oError, oResponse, sData){
        console.log('getArtistFBPage of <' + sArtistName  + '>');
      };
      
      request({
        url: sGetArtistFBPage,
        method: "POST",
        json: true,
        body: oArtist
      }, fCallback);
    });
  });
  
  res.send('Getting all artists community');
};


//Working (POST)
//Payload
/*
  {
  	"artist": {
        "data": {
          "id": "BASE64 id artist",
          "name": "Selena Gomez"
        },
        "key": "BASE64 id artist"
      }
  }
*/
exports.getArtistFBPage = function(req,res,next){
  var oArtist = req.body.artist;
  var sArtistName = oArtist.data.name;
  var sArtistID = oArtist.key;

  var sToken = sFBToken;

  var sURL = oEndpoints.facebook.searchPage;
  sURL = sURL.replace('*artistName*', sArtistName.replace(/ /g, '+'));
  request(sURL, function (error, response, sData) {
    var oData = JSON.parse(sData);
    
    if (!error && response.statusCode == 200) {
      if(oData.data.length){
        var sArtistFBID = oData.data[0].id;
        var sArtistFBName = oData.data[0].name;
        var sRootNode = 'artistsCommunityFB';
        var sArtistPath = sRootNode + '/' + sArtistID;
        var sArtistPathUsers = sArtistPath + '/users';
        var sGetCommunityURL = 'https://datamining-zdr00.c9users.io:8080/getCommunity';
        
        var fCallback = function(oError, oResponse, sData){
          //NULL
          console.log('Response: ' + sData);
          console.log('getCommunity of <' + sArtistFBName + '>');
        };

        //Add page node
        firebase.database().ref(sArtistPath).child("page").set({
          id: sArtistFBID,
          name: sArtistFBName
        });

        //Add users node
        request({
          url: sGetCommunityURL,
          method: "POST",
          json: true,
          body: {
            "pageName": sArtistFBID,
            "rootNode": sArtistPathUsers
          }
        }, fCallback);
        
        //getCommunity(sArtistFBID, sArtistPathUsers);
      }
    }
  });
  
  res.send('NodeJS getCommunity of <' + sArtistName + '>');
};

//Working (POST)
//Payload
/*
{
  "node": "node name to be deleted"
}
*/
exports.deleteNode = function(req, res, next){
  if(req.body.node){
    firebase.database().ref(req.body.node).set(null);
    
    res.send('Node ' + req.body.node + ' deleted');
  }else{
    res.send('Please give node to be deleted');
  }
};

var matchUsersHelper = function(oUsersA, oUsersB){
  console.log('matchUsersHelper');
};

exports.matchUsers = function(req, res, next){
  matchUsersHelper(null, null);
  res.send('matchUsers');
};