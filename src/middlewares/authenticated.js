//https://www.it-swarm.dev/es/angular/como-decodificar-la-carga-util-del-token-codificado-jwt-en-el-lado-del-cliente-en-angular-5/836916932/
'use strict'

var jwt = require('jwt-simple')
var moment = require('moment')
var secret = 'clave_secreta_2018176'
var token = "";

exports.ensureAuth = function (req, res, next){
    if(!req.headers.authorization){
        return res.status(403).send({message: 'La peticion no tiene la cabecera de autenticacion'})
    }

    var token = req.headers.authorization.replace(/['"]+/g, '');

    try{
        var playload = jwt.decode(token, secret)
        if(playload.exp <= moment.unix()){
            return res.status(401).send({
                message: 'El token ha expirado'
            })
        }
    }catch(error){
        return res.status(404).send({
            message: 'El token no es valido'
        })
    }
    req.user = playload
    next()
}

