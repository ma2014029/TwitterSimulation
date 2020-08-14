'use strict'

var express = require("express")
var twitterController = require("../controllers/twitterController")
var md_auth = require("../middlewares/authenticated");
var api = express.Router();


api.post('/Accions', md_auth.ensureAuth, twitterController.Control)


module.exports = api;