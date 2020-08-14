'use strict'

var mongoose = require("mongoose");
const tweet = require("./tweet");
var Schema = mongoose.Schema;


var UserSchema = Schema({
    nombre: String,
    username: String,
    fechaCumple: Date,
    email: String,
    password: String,
    fUnio: Date,
    Tweets: [
        {type: Schema.ObjectId, ref: 'tweet'}
    ],

    FollowME:[
        {type: Schema.ObjectId, ref: 'user'}
    ],
    ReTweet:{
        _idR: String,
        originTweet:{type: Schema.ObjectId, ref: 'tweer'},
        comment: String
    }
})

module.exports = mongoose.model('user', UserSchema);