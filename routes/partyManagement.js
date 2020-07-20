const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')

const Party = require('../models/Party')

//To start a new party
router.post('/newparty', (req,res) => {
    console.log(req.body)
    const {hostName} = req.body 
    console.log(hostName)
    console.log('Trying to start a new party by the name of ' + hostName);
    Party.findOne({hostName : hostName}). then (party => {
        if (party) {
          res.json({"title":"Redundant",
        "message":"Party already exists"})
        } else {
          console.log("A")
          const newParty = new Party ({
            hostName: hostName,
            memberIds : [],
            songs : [],
            peopleInParty: 1
          });
          newParty.save();
          console.log("A")
          res.json({"title":"Success",
          "message":"A new party has been made"})
        }
    });
  });
  
  //To check if party exists with the current hosts name
  router.post('/checkparty', (req,res) => {
    const {hostName} = req.body
    console.log("Checking if party exists")
    Party.findOne({hostName : hostName}).then(theParty => {
      if (theParty) {
        var partySongs = theParty.songs
        //This sorts the songs to be in assending order
        partySongs.sort(function(songA,songB) { return parseFloat(songB.count) - parseFloat(songA.count) } );
        let songsToSend =  partySongs.map(song => ({
          name : song.name,
          artists : song.artists,
          count : song.count
        })).slice(0,15)
        res.json({
          "title": "Success",
          "message": "Party exists",
          "doesPartyExist" : true,
          "topSongs" : songsToSend
          });
      } else {
        res.json({
          "title": "Party Not Found",
          "message": "Party does not exist",
          "doesPartyExist" : false});
      }
    })
  });

  //Compare function for sorting the songs on the database
  function songCompare (song1, song2) { //Comparison function used for javascript sort function as well as binary search implementation
    if (song1.name > song2.name) { //Case where first name is greater
      return 1
    } else if (song1.name < song2.name){ //Case where second name is greater
      return -1
    } else { //Case where song names are the same
      if (song1.artists.filter(value => song2.artists.includes(value)).length > 1){   //Case where songs have the same song name and one artist in common (assumption that this quality indicates the same songs)
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

  router.post('/joinparty', async(req, res) => {
    console.log("USER CONNECTING TO THE PARTY")
    const {hostName, songs} = req.body //Song will have field name and artists
    Party.findOne({hostName :hostName}).then (party => {
      if (party){
        if (party.songs.length < 2){
          curPartySongs = party.songs
          let songObjects = songs.map(song => ({
            artists : song.artists,
            name : song.name,
            count : 1
          }))
          newPartySongs = curPartySongs.concat(songObjects)
          newPartySongs = newPartySongs.sort(songCompare)
          console.log(newPartySongs)
          party.songs = newPartySongs
        } else { 
          curPartySongs = party.songs
          for (aSong in songs){
            songAdd(curPartySongs, songs)
          }
          newPartySongs = curPartySongs
          console.log(newPartySongs)
          party.songs = newPartySongs
        }
        party.markModified('songs');
        party.save(err => {console.log(err)});
        res.json({"title":"Success",
        "message":"Success joining party"});
      } else {
        res.json({"title":"Error","message":"Failure joining party"});
      }
    });
  });
  
  router.post('/removeparty', (req,res) => {
    const {hostName} = req.body;
    Party.findOneAndRemove({hostName: hostName}, err => {
      if (err){
        res.json({"title":"Error","message":"Could not delete party"});
      } else {
        res.json({"title":"Success","message":"Party deletion successful"});
      }
    });
  });


  module.exports = router
  