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
        name : String,
        artists : [String],
        count : Number
    }], 
    peopleInParty : {
        type: Number,
        required: true
    }

});

const Party = mongoose.model('Party',PartySchema);
module.exports = Party;
