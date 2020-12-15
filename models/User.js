//Creating a database schema for this user
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    password :String,
      appleAccount: {
        type:String,
        required:false
    },
    spotifyAccount: {
        type:String,
        required:false
    },
    joinedPartyHost: String,
    songs : [
        {
            _id : false,
            name : String,
            artists : [String]
        }
    ],

    lastJoinedPartyHosts : [String],

    //To check if songs should currently be loaded
    lastTimeMusicLoaded : {type: Date, default : Date('1987-10-26')}
});

const User = mongoose.model('User',UserSchema); //package model to be referred to
module.exports = User;