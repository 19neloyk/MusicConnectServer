//Creating a database schema for this user
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    password :String
  /*
      appleAccount: {
        type:String,
        required:false
    },
    spotifyAccount: {
        type:String,
        required:false
    },  */
});

const User = mongoose.model('User',UserSchema); //package model to be referred to
module.exports = User;