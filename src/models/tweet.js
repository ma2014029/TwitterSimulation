'use strict'

var mongoose = require("mongoose")
var Schema = mongoose.Schema;

var UserSchema = Schema({
    userId: String,
    tweet: String,
    accountant: Number, //contador de likes
    Like: [
        {type: Schema.ObjectId, ref: 'user'}
    ],
    Answers:{
        userId: {type: Schema.ObjectId, ref: 'user'},
        answer: {cont: String},
    }

})

module.exports = mongoose.model('tweet', UserSchema);