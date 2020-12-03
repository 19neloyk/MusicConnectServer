//Creating a database schema for this user
const mongoose = require('mongoose');

const PartySchema = new mongoose.Schema({
    hostName: {
        type: String,
        required: true
    },
    memberNames : [String],
    songs : [{
        _id : false,
        name : String,
        artists : [String],
        count : Number
    }]

});

const Party = mongoose.model('Party',PartySchema);
module.exports = Party;
