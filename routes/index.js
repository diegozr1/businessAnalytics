var assert = require('assert');
var request = require('request');
var moment = require('moment');
var papaparse = require('papaparse');

var mongoose = require('mongoose');
//mongoose.connect('mongodb://localhost/data-mining');
mongoose.connect('mongodb://diego:tec@ds151707.mlab.com:51707/data-mining');
// Models of mongo
var ArtistSpotify = require('../models/artistSpotify');
var ArtistCommunityFB = require('../models/artistCommunityFB');
var UserTecCommunityFB = require('../models/userTecCommunityFB');

var sFBToken = '1669573800000279|rU-PiJzm1B9fL8brn_F7b4aHsD8';
var nSinceDate = 1470805200;
var oEndpoints = {};
oEndpoints.facebook = {
  page: 'https://graph.facebook.com/v2.8/*pageName*?fields=fan_count,category,checkins,name,feed.since(' + nSinceDate + '){comments,reactions.limit(100)}&access_token=' + sFBToken,
  searchPage: 'https://graph.facebook.com/v2.8/search?type=page&q=*artistName*&access_token=' + sFBToken  
};
oEndpoints.spotify = {
  top200Songs: 'https://spotifycharts.com/regional/mx/weekly/*startDate*--*endDate*/download'
};

var btoa = function (str) { return new Buffer(str).toString('base64'); };

var getCollection = function(sCollectionName, fCallback){
  mongoose.connection.db.collection(sCollectionName, fCallback);
};

var getCollectionData = function(sCollectionName, oFilter, fCallback){
  getCollection(sCollectionName, function(oError, oCollection){
    getData(oCollection, oFilter, fCallback);
  });
};

var getData = function(oCollection, oFilter, fCallback){
  oCollection.find(oFilter).toArray(fCallback);
};

//Working
var getCommunityHelper = function(sPageName, sRootNode, db, oExtra){
    if(!sPageName) return;

    var sURL = oEndpoints.facebook.page;
    sURL = sURL.replace('*pageName*', sPageName.replace(/ /g, '+'));
    
    console.log(sURL);
    //console.log(sRootNode);
    
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
        //console.log(oData.paging.next);
      
        //Request new feed
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
              }
            }
            if(oReactions.paging && oReactions.paging.next){
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
              }
            }
  
            if(oComments.paging && oComments.paging.next){
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
          //Save counter if user comments multiple times
          oUser = {
            id: oData.data[i].from.id,
            name: oData.data[i].from.name,
            counter: (oUsers[oData.data[i].from.id]) ? oUsers[oData.data[i].from.id].counter++ : 1
          };
          
          oUsers[oUser.id] = oUser;
        }

        saveUsers(oUsers);
      }

      if(oData.paging && oData.paging.next){
        //Request next
        request(oData.paging.next, fSuccessComments);
      }else{
        //Total comments retrieved (& reactions)
        //console.log(oPeople);
      }
    };

    var saveUsers = function(oUsers){
      var oQuery;
      
      //Save / Update users
      for(var sUserID in oUsers){
        oQuery = { id: sUserID  };
        
        if(oExtra){
          for(var sExtraAttr in oExtra){
            oQuery[sExtraAttr] = oExtra[sExtraAttr];
          }
        }
        
        //sRootNode
        getCollection(sRootNode, function(oError, oCollection){
          getData(oCollection, oQuery, function(oErrorData, aData){
            if(!aData) return;
            
            if(aData.length){
              //User exists; increment counter
              var nCurrentUserCounter = (oUsers[sUserID].counter) ? oUsers[sUserID].counter : 1;
              var nUpdatedCounter = aData[0].counter + nCurrentUserCounter;
              
              //Update only counter
              oCollection.findOneAndUpdate(oQuery, { $set: { counter: nUpdatedCounter }  }, { upsert: false, new: true }, function(oError, oUpdatedUserRecord){
                if(oError) throw oError;
                
                //Updated user's record
                console.log('User updated!');
              });
            }else{
              //New user, add
              var oUser = {
                id: sUserID,
                name: oUsers[sUserID].name,
                counter: 1
              };
              
              //Add extra data if exists
              if(oExtra){
                for(var sExtraAttr in oExtra){
                  oUser[sExtraAttr] = oExtra[sExtraAttr];
                }
              }
              
              oCollection.save(oUser, function(oErrorSave, oUserSaved){
                console.log('User created!');
              });
            }
          });
        });
      }
    };

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
    
    var oExtra = (req.body.extra) ? req.body.extra : null;
    var sRootNode = req.body.rootNode;
    getCommunityHelper(req.body.pageName, sRootNode, req.db, oExtra);
    
    res.send('NodeJS ' + sRootNode);
};

//Working with mongoDB (GET)
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
  
  res.send('Retrieving Tec\'s community');
};

//Working with mongoDB (GET)
exports.getTopArtists = function(req, res, next){
  const FINAL_DAY = "28";
  const FINAL_MONTH = "10";
  const FINAL_YEAR = "2016";
  const FINAL_DATE = moment(FINAL_YEAR + FINAL_MONTH + FINAL_DAY, "YYYYMMDD");
  
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
    var sStartDate = date.format("YYYY-MM-DD");
    var sEndDate = date.add(7, "days").format("YYYY-MM-DD");
  	var link = oEndpoints.spotify.top200Songs;
  	link = link.replace('*startDate*', sStartDate);
  	link = link.replace('*endDate*', sEndDate);
  	
  	request("https://crossorigin.me/" + link, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        console.log('Retrieving top 200 song of week ' + sStartDate + ' to ' + sEndDate);
        var result = papaparse.parse(body);
        
        //Remove header csv
    		result.data.splice(0, 1);
    
    		//Remove last trailing char
    		result.data.splice(result.data.length - 1, 1);
      
    		var oArtist = {};
    		var oQuery = {};
    		var sArtist = "";
    		var sArtistName = "";
    		for (var i = 0; i < result.data.length; i++) {			
    			sArtistName = result.data[i][2];
    			sArtist = btoa(sArtistName);
    			sArtist = sArtist.replace(/\//g, '%');
    
    			if (artists[sArtist] == undefined) {
    				artists[sArtist] = {};
    				artists[sArtist].id = sArtist;
    				artists[sArtist].name = sArtistName;
    				artists[sArtist].counter = 1;
    			} else {
    				artists[sArtist].counter += 1;
    			}
    		}
    		
    		//Save/Update artists
    		//Go through all artists found
    		for(var sArtistID in artists){
    		  //Build artist template
    			oArtist = {
      		  id: artists[sArtistID].id,
      		  name : artists[sArtistID].name,
      		  counter : artists[sArtistID].counter
      		};
      		
      		oQuery = {
      		  id: sArtistID
      		};
      		
      		ArtistSpotify.findOneAndUpdate(oQuery, oArtist, { upsert: true, new: true }, function(oError, oUpdatedArtistRecord){
      		  if(oError) throw oError;
      		  
      		  //Saved / Updated artist successfully
      		  console.log('Saved / Updated ' + oUpdatedArtistRecord.name + ' - counter(' +  oUpdatedArtistRecord.counter + ')');
      		});
    		}
      }
    });
  	
  }
  
  fetchArtists();

 
  res.send('Getting artists from Spotify Top 200 Songs Weekly');
};

//Working with mongoDB (GET)
exports.getArtistsCommunity = function(req, res, next){
  var sArtistsSpotifyNode = 'ArtistsSpotify';
  var oQuery = {};
  
  getCollectionData(sArtistsSpotifyNode, oQuery, function(oError, aArtists){
    var sGetArtistFBPage = 'https://datamining-zdr00.c9users.io:8080/getArtistFBPage';
    var sArtistID;
    var sArtistName;
    var oArtist;
    
    for(var i in aArtists){
      sArtistID = aArtists[i].id;
      sArtistName = aArtists[i].name;
      oArtist = {
        "artist": {
          "data": {
            "id": sArtistID,
            "name": sArtistName
          },
          "key": sArtistID
        }
      };
      
      console.log(oArtist);
      
      var fCallback = function(oError, oResponse, sData){
        console.log('getArtistFBPage of <' + sArtistName  + '>');
      };
      
      /*
      request({
        url: sGetArtistFBPage,
        method: "POST",
        json: true,
        body: oArtist
      }, fCallback);
      */
    }
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
        var sArtistsFBPages = 'artistsFBPages';
        var sArtistsCommunityFB = 'artistsCommunityFB';
        var sGetCommunityURL = 'https://datamining-zdr00.c9users.io:8080/getCommunity';
        
        var fCallback = function(oError, oResponse, sData){
          //NULL
          console.log('Response: ' + sData);
          console.log('getCommunity of <' + sArtistFBName + '>');
        };
        
        var oQuery;
        var oArtistFBPage;
        var oArtistFBCommunity;
        //Save artist FB page info
        getCollection(sArtistsFBPages, function(oError, oCollection){
          oQuery = {
            id: sArtistID
          };
          
          oArtistFBPage = {
            id: sArtistID,
            pageID: sArtistFBID,
            pageName: sArtistFBName
          };
          
          getData(oCollection, oQuery, function(oErrorData, aArtist){
            if(!aArtist.length){
              //New artits FB page
              oCollection.save(oArtistFBPage, function(oErrorSave, oArtistSaved){
                console.log('New artist - ' + sArtistFBName);
              });
            }
          });
        });
        
        //Save artist community FB
        //Add users node
        request({
          url: sGetCommunityURL,
          method: "POST",
          json: true,
          body: {
            "pageName": sArtistFBID,
            "rootNode": sArtistsCommunityFB,
            "extra": {
              artistID: sArtistID
            }
          }
        }, fCallback);
      }
    }
  });
  
  res.send('NodeJS getCommunity of <' + sArtistName + '>');
};

//Working
var matchUsers = function(oUsersA, oUsersB){
  var oUsersMatched = {};
  
  //Go through each user in set A
  for(var sUserIDA in oUsersA){
    //Check if user its in set B
    if(sUserIDA in oUsersB){
      
      //Save user matched
      oUsersMatched[sUserIDA] = 1;
    }
  }
  
  return oUsersMatched;
};

//Working (GET)
exports.matchTecVSArtistsCommunity = function(req, res, next){
  var sTecCommunityNode = 'tecCommunityFB';
  var sArtistCommunityNode = 'artistsCommunityFB';
  
  firebase.database().ref(sTecCommunityNode).once('value').then(function(oTecSnap){
    firebase.database().ref(sArtistCommunityNode).once('value').then(function(oArtistsSnap){
      var oTecUsers = oTecSnap.val();
      var oUsersMatched = {};
      var oMatchs = {};
      
      oArtistsSnap.forEach(function(oArtistChildSnap){
        var sArtistKey = oArtistChildSnap.key;
        var oArtistFBPage = oArtistChildSnap.child('page').val();
        var oArtistUsers = oArtistChildSnap.child('users');
        
        //Check if artists has user's community
        if(oArtistUsers.exists()){
          oArtistUsers = oArtistUsers.val();
          
          //Match artist's community vs tec's community
          oUsersMatched = matchUsers(oTecUsers, oArtistUsers);
          
          oMatchs[sArtistKey] = {
            'A': 'tecCommunityFB',
            'ACount': Object.keys(oTecUsers).length,
            'B': oArtistFBPage.name,
            'BCount': Object.keys(oArtistUsers).length,
            'page': oArtistFBPage,
            'match': oUsersMatched
          };
        }
      });
      
      res.send(oMatchs)
    });
  });
};