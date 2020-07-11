//Creating a database schema for this user
const mongoose = require('mongoose');

const PartySchema = new mongoose.Schema({
    hostName: {
        type: String,
        required:true
    },
    memberIds : [{
        type:String,
        required:false
    }],
    songs : [{
        required: true,
        name : {
            type: String,
            required: true
        },
        arists: [{
            name: {
                type: String,
                required: true
            }
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