//Creating a database schema for this user
const mongoose = require('mongoose');

const PartySchema = new mongoose.Schema({
    hostName: {
        type: String,
        required: true
    },
    memberIds : [{
        type:String,
        required:false
    }],
    songs : [{
        _id : false,
        name : {
            type: String,
            required: true
        },
        artists: [{
            name: String
        }],
        count : {
            type: Number,
            required: true
        }
    }], 
    peopleInParty : {
        type: Number,
        required: true
    }

});

const Party = mongoose.model('Party',PartySchema);
module.exports = Party;
