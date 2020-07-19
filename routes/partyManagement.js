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
  
  router.post('/joinparty', async(req, res) => {
    console.log("USER CONNECTING TO THE PARTY")
    const {hostName, songs} = req.body //Song will have field name and artists
    Party.findOne({hostName :hostName}).then (party => {
      if (party){
        curPartySongs = party.songs
        let songObjects = songs.map(song => ({
          artists : song.artists,
          name : song.name,
          count : 0
        }))
        newPartySongs = curPartySongs.concat(songObjects)
        console.log(newPartySongs)
        party.songs = newPartySongs
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
  