//Creating a database schema for this user
const mongoose = require('mongoose');

const PartySchema = new mongoose.Schema({
    hostId: {
        type: String,
        required:true
    },
    memberIds : [{
        type:String,
        required:false
    }],
    songs : [{
        required: false,
        name : {
            type: String,
            required: true
        },
        isrc : {
            type: String,
            required: false
        },
        count : {
            type: Number,
            required: true
        }
    }]

});

const Party = mongoose.model('Party',PartySchema);
module.exports = Party;