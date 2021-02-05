const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const axios = require('axios')

const Party = require('../models/Party')
const User = require('../models/User')

const musicAPI = require('../musicServiceAPICalls');
const fineTuning = require('../partyFineTuning');

//For jwt (verifiable requests)
const jwt = require('jsonwebtoken')

//To start a new party
router.post('/newparty', authenticateToken, (req,res) => {
    //console.log(req.user)
    const hostName = req.user 
    //console.log('Trying to start a new party by the name of ' + hostName);
    Party.findOne({hostName : hostName}). then (party => {
        if (party) {
          res.json({"title" : "Redundant",
        "message" : "Party already exists", 
        "isSuccessful" : false})
        } else {
          //console.log("A")
          const newParty = new Party ({
            hostName: hostName,
            memberNames : [],
            songs : []
          });
          newParty.save();
          //console.log("A")
          res.json({"title" : "Success",
          "message" : "A new party has been made", 
          "isSuccessful" : true})
        }
    });
  });
  
  //To check if party exists with the current hosts name --> Collects the songs of the host and shows them if it does exist
  router.post('/checkparty', authenticateToken, (req,res) => {
    const hostName = req.user
    //console.log("Checking if party exists")
    Party.findOne({hostName : hostName}).then(theParty => {
      if (theParty) {
        var partySongs = theParty.songs
        //This sorts the songs to be in assending order
        partySongs.sort(function(songA,songB) { return parseFloat(songB.count) - parseFloat(songA.count) } );
        //console.log(partySongs)
        const songsLimit = 100
        let songsToSend =  partySongs.map(song => ({
          name : song.name,
          artists : song.artists,
          count : song.count,
          isrc : song.isrc
        })).slice(0,songsLimit)
        //console.log(songsToSend)
        res.json({
          "title": "Success",
          "message": "Party exists",
          "doesPartyExist" : true,
          "topSongs" : songsToSend,
          "members" :theParty.memberNames
          });
      } else {
        res.json({
          "title": "Party Not Found",
          "message": "Party does not exist",
          "doesPartyExist" : false});
      }
    })
  });

  //Checks if multiple parties exists with host's name
   router.post('/hitparties', authenticateToken, async (req,res) => {
      const {partyHosts} = req.body
      var hitPartiesPromises = []
      for (var i = 0; i < partyHosts.length; i++) {
        const curHost = partyHosts[i]
        hitPartiesPromises[i] = new Promise (async (resolve) => {
          const party = await Party.findOne({hostName :curHost});
          console.log(curHost);
          if (party) {
            console.log("true")
            resolve({partyHostUsername : curHost,partyIsActive : true});
          } else {
            console.log("false")
            resolve({partyHostUsername : curHost,partyIsActive : false});
          }
        });
      };
      try {
        const results = await Promise.all(hitPartiesPromises);
        console.log(results)
        res.json(results);
      } catch(err) {
        console.log(err)
        res.json({"title":"Oops","message":"There was an issue retrieving party information."})
      }
   }); 

  //Compare function for sorting the songs on the database
  function songCompare (song1, song2) { //Comparison function used for javascript sort function as well as binary search implementation
  //  console.log("Song 1: " +song1)
  //  console.log("Song 2: " +song2)
    if (song1.isrc !== null && song1.isrc === song2.isrc) {
      return true;
    }
    if (song1.name > song2.name) { //Case where first name is greater
      return 1
    } else if (song1.name < song2.name){ //Case where second name is greater
      return -1
    } else { //Case where song names are the same
      //ç  console.log("activate")
      if (song1.artists.filter(value => song2.artists.includes(value)).length > 0){   //Case where songs have the same song name and one artist in common (assumption that this quality indicates the same songs)
        return 0
      } else if (song1.artists[0] > song2.artists[0]){ //Case where first artists listed between the two songs is greater for song1
        return 1 
      } else {  //Case where first artists listed between the two songs is greater for song2
        return -1
      }
    }
  }

  //Search function to increment song counts or (if query song is not present in the party) add song to party
  function songAdd (songArr, aSong){
    var start = 0
    var end = songArr.length 
    while (start <= end) {
      var mid = Math.floor((start+end)/2)
      if (mid >= songArr.length || mid < 0) {
        break;
      }
     // console.log("Current middle index: " + mid)
      if (songCompare(aSong,songArr[mid]) === 0){
        songArr[mid].count += 1
        return 
      } else if (songCompare(aSong,songArr[mid]) > 0){
        start = mid + 1
      } else {
        end = mid - 1
      }
    }
    //Case where song is not found in songArr; add song to party
    songArr.splice(start, 0, {      //start is exactly one position after end and we know that aSong belongs between start and end 
      artists : aSong.artists,
      name : aSong.name,
      count : 1
    })
  }

  router.post('/uploadsongs',authenticateToken, async(req, res) => {
    const userName = req.user
    const {usingApple, usingSpotify, spotifyAccessToken, appleUserToken, appleDeveloperToken} = req.body;
    console.log("UPLOADING SONGS")
    console.log(req.body)
    console.log(usingApple)
    console.log(usingSpotify)
    console.log(spotifyAccessToken)
    console.log(appleUserToken)
    console.log(appleDeveloperToken)

    var songs = [];
    if (usingSpotify) {
      try {
        songs = await musicAPI.getUsersSpotifySongs(spotifyAccessToken);
      } catch (err) {
        console.log(err);
      }
    } else {
      try {
        songs = await musicAPI.getUsersAppleMusicSongs(appleDeveloperToken,appleUserToken);
      } catch (err) {
        console.log(err);
      }
    }

    if (songs.length < 1) {
      res.json ({"title": "Oops", "message" : "There was a problem with uploading your songs", "haveSongsBeenUploaded" : false});
      return;
    }


    try {

      var user = await User.findOne({name: userName});
      
      user.songs = songs.map(song => ({ 
          artists : song.artists,
          name : song.name,
          litness: 0,
          isrc : song.isrc
        }));
      
      //console.log(user.songs);

        user.lastTimeMusicLoaded = new Date();
      
        user.markModified("songs");
        user.markModified("lastTimeMusicLoaded");
        
        user.save(err => {console.log(err)});
        res.json ({"title": "Success", "message" : "Songs have been uploaded", "haveSongsBeenUploaded" : true});

    } catch(err) {
      
      console.log(err);
      res.json ({"title": "Oops", "message" : "There was a problem with uploading your songs", "haveSongsBeenUploaded" : false});
    }

  });

  router.post('/joinparty',authenticateToken, async(req, res) => {
    //console.log("USER CONNECTING TO THE PARTY")
    const userName = req.user
    const {hostName} = req.body //Song will have field name and artists
    try {
      var user = await User.findOne({name : userName});
        
        if (user.joinedPartyHost != ""){
          res.json({"title":"Oops","message":"You are already in a party.", "isSuccessful" : false})
          return
        }

      var party = await Party.findOne({hostName :hostName});

      //SAVING SONGS TO THE PARTY
      if (party.songs.length < 2){

        let songObjects = user.songs.map(song => ({
          artists : song.artists,
          name : song.name,
          isrc: song.isrc,
          count : 1
        }))
        party.songs = songObjects.sort(songCompare)
      } else { 

        for (var i = 0; i < user.songs.length; i ++){
          songAdd(party.songs, user.songs[i])
        }
      }

      party.markModified('songs');
      party.memberNames.push(userName)
      party.markModified('memberNames');
      party.save(err => {console.log(err)});

      //Code for saving the most recent party hosts that the user has joined
      try {
      if (user.lastJoinedPartyHosts.includes(hostName)) {
        var index = user.lastJoinedPartyHosts.indexOf(hostName);
        if (index != -1) {
          user.lastJoinedPartyHosts.splice(index, 1);
        }
      }

      user.lastJoinedPartyHosts.unshift(hostName);
      if (user.lastJoinedPartyHosts.length > 5){    //Makes sure that the array is 5 elements long
        user.lastJoinedPartyHosts.splice(5);
      }
      user.markModified("lastJoinedPartyHosts");
    } catch (err) {
      console.log("AN ERROR WITH USER'S SONGS: ")
      console.log(err)
    }
      user.joinedPartyHost = hostName;
      user.markModified('joinedPartyHost');
      user.save(err => {console.log(err)});
      //console.log(user.joinedPartyHost);
      res.json({"title":"Success","message":"Party has been joined", "isSuccessful" : true});
    } catch (err) {
      console.log(err);
      res.json({"title":"Oops.","message":"Party not Found", "isSuccessful" : false});
      return
    }
  });

  function songDecrement (songArr, aSong){
    var start = 0
    var end = songArr.length 
    while (start <= end) {
      var mid = Math.floor((start+end)/2)
      if (mid >= songArr.length || mid < 0) {
        break;
      }
     // console.log("Current middle index: " + mid)
      if (songCompare(aSong,songArr[mid]) === 0){
        songArr[mid].count -= 1
        if (songArr[mid].count === 0) {
          songArr.splice(mid,1)
        }
        return; 
      } else if (songCompare(aSong,songArr[mid]) > 0){
        start = mid + 1
      } else {
        end = mid - 1
      }
    }
  }
  
  router.post('/removeparty',authenticateToken, (req,res) => {
    const hostName = req.user;
    //First, we must delete this party as the joined party host for each user who was in the party
    User.updateMany({ joinedPartyHost: hostName}, { joinedPartyHost: "" }, (err,raw) => { 
      if (err) {
      res.json({"title":"Error","message":"Could not delete party"});
      //console.log(err);
      return;
      }
    });
    //Now we actually remove the party itself from the database
    Party.findOneAndRemove({hostName: hostName}, err => {
      if (err) {
        console.log(err)
         res.json({"title":"Error","message":"Could not delete party","isSuccessful" : false});
         return;
      }
     });
    res.json({"title":"Success","message":"Party deletion successful","isSuccessful" : true});
    return;
  });

  router.post('/leaveparty',authenticateToken, async (req,res) => {
    const userName = req.user
    const {partyHost} = req.body
    try {
      var user = await User.findOne({name : userName});
      //console.log ("User found:")
      //console.log (user)
      let partyHost = user.joinedPartyHost
      user.joinedPartyHost = "";
      user.markModified('joinedPartyHost');
      user.save();
      //console.log ("User changes saved")
      try {
      var joinedParty = await Party.findOne({hostName : partyHost});
      //console.log("Host:")
      //console.log(partyHost)
      var index = joinedParty.memberNames.indexOf(userName);
        if (index !== -1) {
          //console.log("Decrement step!")
          //Edit memberNames array
          var memNames = joinedParty.memberNames
          memNames.splice(index,1);
          joinedParty.memberNames = memNames;
          joinedParty.markModified("memberNames");
          //Decrement this user's songs
          var partySongs = joinedParty.songs
          for (var k = 0; k < user.songs.length; k++){
            songDecrement(partySongs,user.songs[k]);
          }
          joinedParty.songs = partySongs
          joinedParty.markModified("songs");
          joinedParty.save((err) => console.log(err))
          //console.log ("Party saved")
        }
      } catch(err){
        console.log(err)
      }
      res.json({"title":"Success","message":"Party deletion successful","isSuccessful" : true});
    } catch (err){
      console.log(err)
      res.json({"title":"Failure","message":"Could not join party","isSuccessful" : false});
    }
  });

  router.get('/getjoinstatus',authenticateToken, async (req,res) => {
    const userName =  req.user
    try {
      var user = await User.findOne({name : userName});
      console.log(user.joinedPartyHost);

      console.log("date stuff------------")
      //Checking if there is a need to upload music right now (depends on whether they have already been uploaded in the past month)
      var isMusicLoaded = false;
      var now = new Date();

      //Dealing with the music date difference --> **IN THE FUTURE, YOU REALLY ONLY NEED TO IMPLEMENT THIS ON THE CHRON JOB**
      var lastMusicLoad = new Date(user.lastTimeMusicLoaded);
      var timeSinceLastMusicLoad = Math.abs(now.getTime() - lastMusicLoad.getTime());
      var daysSinceLastMusicLoad = Math.ceil(timeSinceLastMusicLoad / (1000 * 60 * 60 * 24));
      if (daysSinceLastMusicLoad < 31) {
        isMusicLoaded = true;
      }

      console.log(isMusicLoaded);

      console.log("--------------------")

      if (user.joinedPartyHost === "") {
          res.json({"title":"Success","message": "Received user's status",
          "userHasHost" : false,
          "lastJoinedPartyHosts":user.lastJoinedPartyHosts,
          "hasMusicBeenLoaded" : isMusicLoaded});
       } else {
          var party = await Party.findOne({hostName : user.joinedPartyHost});
          if (party) {
            res.json({"title":"Success",
            "message": "Received user's status", 
            "userHasHost" : true, 
            "partyHostName" : user.joinedPartyHost});
          } else {  //Case where party has been deleted
            console.log("B")
            user.joinedPartyHost = ""
            user.markModified("joinedPartyHost")
            user.markModified("songs")
            user.save()
            res.json({"title":"Success",
            "message": "Received user's status", 
            "userHasHost" : false, 
            "lastJoinedPartyHosts":user.lastJoinedPartyHosts,
            "hasMusicBeenLoaded" : isMusicLoaded}); 
          }
        }
    } catch (err) {
      console.log(err)
      res.json({"title":"Failure","message": "Could not get user's status","userHasHost" : false});
    }
  });

  function authenticateToken(req,res,next) {    //This is middleware to verify json web token requests// next represents the otherwise callback function of express routes
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1] //First checks if there is header; then looks at header which is in the form 'BEARER <TOKEN>'; note that token is second element of the split string array
    if (token == null){  //case where token does not exist and authHeader = null
      return res.json({"title":"Action unavailable","message":"The action could not be completed","isSuccessful": false}) 
    }
    //Now, verify the jwt
    jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err, user) => { //Remember that a user is result of the callback because the payload has a user object
      if (err){
        return res.json({"title":"Token Invalid","message":"You do not have access" , "isSuccessful": false}) 
      }
      req.user = user.name 
      //console.log(req.user)
      next()
    })
  }


  //For all this code to be accessible by index.js
  module.exports = router
  