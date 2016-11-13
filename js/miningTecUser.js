var sFBToken = "1669573800000279|rU-PiJzm1B9fL8brn_F7b4aHsD8";

function getCommunity(sPageName, sRootNode){
  if(!sPageName) return;

  var nFeedCounts = 50;
  var nSince = 1470805200;
  var sToken = sFBToken;
  var sURL = "https://graph.facebook.com/v2.8/" + sPageName + "?fields=fan_count,category,checkins,name,feed.since(" + nSince + "){comments,reactions}&access_token=" + sToken;
  
  console.log(sURL);

  var sTecCommunityNode = sRootNode; //'tecCommunity-counter'
  var oTecCommunity = firebase.database().ref(sTecCommunityNode);

  var oFeeds = [];
  var oPeople = [];

  var fSuccess = function(oData){
    var oFeed = oData.feed;

    if(!oFeed) return;
    
    //Request new feed
    oFeeds.push.apply(oFeeds, oFeed.data);

    if(oFeed.paging && oFeed.paging.next){
      $.getJSON(oFeed.paging.next, fSuccessFeed);
    }
  };

  var fSuccessFeed = function(oData){
    if(oData.data.length){
      //Feed found
      oFeeds.push.apply(oFeeds, oData.data);
    }

    if(oData.paging){
      //Paging enable
      
      //Request new feed
      $.getJSON(oData.paging.next, fSuccessFeed);
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
            $.getJSON(oReactions.paging.next, fSuccessReactions);
          }
        }
      }

      saveUsers(oUsers);
    }
  };

  var fSuccessReactions = function(oData){
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

        //saveUser(oUser);
      }

      saveUsers(oUsers);
    }

    if(oData.paging && oData.paging.next){
      //Request next
      $.getJSON(oData.paging.next, fSuccessReactions);
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
            $.getJSON(oComments.paging.next, fSuccessComments);
          }
        }
      }

      saveUsers(oUsers);
    }
  };
  var fSuccessComments = function(oData){
    if(oData.data.length){
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
      $.getJSON(oData.paging.next, fSuccessComments);
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
          var currentCounter;
          if(oUsers[oChildSnap.key]){
            nCurrentCounter = oChildSnap.child('counter').val();
            oUsers[oChildSnap.key].counter = nCurrentCounter + 1;
          }
        });

        //Update counter of each user (remote)
        oTecCommunity.update(oUsers);

        $("#results").prepend($('<div>Saved / Updated <b>' + oUsers.length + '</b> records at ' + sTecCommunityNode + '</div>'));
      });
  };

  var saveUser = function(oUser){
    var sUserID = oUser.id;
    var sUserName = oUser.name;
    
    oTecCommunity.once('value')
      .then(function(oSnap){
        var oChild = oSnap.child(sUserID);

        if(oChild.exists()){
          //Increment counter
          var nCounter = oChild.child('counter').val();
          oTecCommunity.child(sUserID).update({
            counter: parseInt(nCounter) + 1
          });
        }else{
          //Add user
          oTecCommunity.child(sUserID).set({
            id: sUserID,
            name: sUserName,
            counter: 1
          });
        }
      });

    firebase.database().ref('tecCommunity/' + sUserID).set({
      id: sUserID,
      name: sUserName
    });
  };

  $.getJSON(sURL, fSuccess);
}

function getArtistFBPage(oArtist){
  var sArtistName = oArtist.data.name;
  var sArtistID = oArtist.key;

  var sToken = sFBToken;

  var sURL = "https://graph.facebook.com/v2.8/search?type=page&q="+sArtistName.replace(/ /g,"+")+"&access_token=" + sToken;
  var fCallback = function(oData){
    if(oData.data.length){
      var sArtistFBID = oData.data[0].id;
      var sArtistFBName = oData.data[0].name;

      //Add page node
      firebase.database().ref("artistsCommunityFB/" + sArtistID).child("page").set({
        id: sArtistFBID,
        name: sArtistFBName
      });

      //Add users node
      getCommunity(sArtistFBID, "artistsCommunityFB/" + sArtistID + "/users");
    }
  };
  $.getJSON(sURL, fCallback);
}