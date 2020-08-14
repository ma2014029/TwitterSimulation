'use strict'

var jwt = require('jwt-simple')
var moment = require('moment')
var secret = 'clave_secreta_2018176'

exports.createToken = function (user){

    var payload = {
        sub: user._id,
        nombre: user.nombre,
        username: user.username,
        fechaCumple: user.fechaCumple,
        email: user.email,
        password : user.password,
        fUnio: user.fUnio,
        iat: moment().unix(),
        exp: moment().day(90, 'days').unix()
    }
    return jwt.encode(payload, secret)
}