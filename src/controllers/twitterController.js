'use strict'
//Imports
var md_auth = require("../middlewares/authenticated");
var bcrypt = require('bcrypt-nodejs')
var User = require('../models/usuario')
var Tweet = require('../models/tweet')
var jwt= require('../services/jwt')
var path = require('path');
var fs = require('fs');

const firstUser = {
    nombre: 'Miguel',
    username: 'Managerkey',
    fechaCumple: null,
    email:'miguel@yahoo.es',
    password: 123789,
    fUnio: null,
} 
var key = new User(firstUser);

//token para Login y Register.
let managerkey =  "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI1ZjIwZGViZTJiNzc2NDQxMWM2Yzk1OWIiLCJub21icmUiOiJNaWd1ZWwiLCJ1c2VybmFtZSI6Ik1hbmFnZXJrZXkiLCJmZWNoYUN1bXBsZSI6bnVsbCwiZW1haWwiOiJtaWd1ZWxAeWFob28uZXMiLCJwYXNzd29yZCI6IiQyYSQxMCR5ZGU3aGpKNVJLZkE2c3RPOHdGNy51NWxWVkJhWlljc3VjSGFoSThtQm9KTDZlMFZXbFE3YSIsImZVbmlvIjpudWxsLCJpYXQiOjE1OTU5ODk4MjcsImV4cCI6MTYwMzU5MzAyN30.HCSTPs41lpNnX1V4i2PW45n4nzlEiIeIbWzD3zpsv_8";

function Control(req, res) {
    var user = new User();
    var tweet = new Tweet();
    var cadReq = req.body.global;
    var params = cadReq.split(',');
    var opc = params[0].toLowerCase(); //convierte mays. a mins.

       if(key&& key.length >=1){

        }else{
            bcrypt.hash(firstUser.password, null, null,(err, hash)=>{
                key.password = hash;}
            );
            key.save();   
        }  

    switch (opc) {
        
        case 'register':
            if(params[1] && params[4] && params[5]){
                user.nombre = params[1];
                user.username = '@'+params[2];        
                user.fechaCumple = params[3];
                user.email = params[4];
                user.password = params[5];
                user.fUnio = new Date();                //se genera cuando se registra por primera vez 

                User.find({ $or: [
                    {username: user.username},
                    {email: user.email}
                ]}).exec((err, usuario)=>{
                    if(err) return res.status(500).send({message: 'Error en la peticion'})
                    if(usuario && usuario.length >=1){
                        return res.status(500).send({message: 'Usted ya fue registrado'})
                    }else{
                        bcrypt.hash(params[5], null, null,(err, hash)=>{
                            user.password = hash;

                            user.save((err, usuarioG)=>{
                                if(err) return res.status(500).send({message: 'Error al guardar'})
                                if(usuarioG){
                                    return res.status(200).send({User: usuarioG})
                                }else{
                                    return res.status(404).send({message: 'No se ha podido guardar el Usuario'})
                                }
                            })
                        })
                    }
                })
            }else{
                return res.status(200).send({message: 'Rellene los campos necesarios'})
            }
        
        break;
            
        case 'login':
            User.findOne({username:params[1]},(err,usuario)=>{
                if(err) return res.status(500).send({message: 'usuario no encontrado'})
                if(usuario){
                    bcrypt.compare(params[2], usuario.password,(err,check)=>{
                        if(err) return res.status(500).send({message: 'Los datos no coinciden'})
                        if(check){
                            if(params[3]){
                                return res.status(200).send({
                                    token: jwt.createToken(usuario)
                                })
                            }else{
                                usuario.password = undefined;
                                return res.status(404).send({user: usuario})
                            }
                        }else{
                            return res.status(404).send({message: 'La verificacion del usuario ha sido erronea'})
                        }
                    })
                }else{
                    return res.status(404).send({message: 'El usuario no se ha podido logear'})
                }
            })
        break;
            
        case 'addtweet': 
            //token = req.user
            if(params[1]){
                tweet.userId = req.user.sub;
                tweet.tweet = params[1];
                tweet.accountant = 0;
        
                if(params[1].length >= 280){
                    return res.status(500).send({message: 'El tweet ha sobrepasado el limite de caracteres permitidos'})
                }else{
                    tweet.save((err, tweetG)=>{
                        if(err) return res.status(500).send({message: 'Error al Guardar'})
                        if(tweetG){
                            res.status(200).send({tweet: tweetG})
                            User.findByIdAndUpdate(tweet.userId, {$push: {Tweets: tweetG._id}}, {new:true},(err,tweetAsig)=>{
                                if(err) return res.status(500).send({message: "Error en la peticion "})
                                if(!tweetAsig) return res.status(404).send({message: "Error al asignar"})
                                //return res.status(200).send({tweet: tweetAsig})
                            })
                        }else{
                            res.status(404).send({message: 'No se ha podido guardar'})
                        }
                       
                    })
                }      
            }else{
                res.status(200).send({message: 'Rellene los campos necesarios'})
            }
        break;

        case 'deletetweet':
            Tweet.findById(params[1], {userId:true}, (err,valido)=>{
                if(valido.userId == req.user.sub){
                    Tweet.findByIdAndRemove(params[1],(err, tweetEli)=>{
                        if (err) return res.status(500).send({message: 'Error en la peticion'}) 
                        if(!tweetEli) return res.status(404).send({message: 'No se ha podido eliminar'})
                        tweet.remove(function(err) {
                            if(err) { return handleError(res, err); }
                            return res.status(200).send({Tweet: tweetEli})
                        });
                        //eliminar referencia
                        User.findByIdAndUpdate(req.user.sub,{$pull: {Tweets:params[1]}}, {new : true},(err,foll)=>{})
                            
                    }) 
                }else{
                    return res.status(200).send({Tweet: 'No tiene los permisos necesarios para hacer esta accion'})
                } 
            })  

        break;

        case 'edittweet':
            Tweet.findById(params[1], {userId:true}, (err,valido)=>{
                if(valido.userId == req.user.sub){
                    Tweet.findByIdAndUpdate(params[1], { tweet : params[2]},{new: true},(err, tweetE)=>{
                        if (err) return res.status(500).send({message: 'Error en la peticion'}) 
                        if(!tweetE) return res.status(404).send({message: 'No se ha podido editar'})          
                        return res.status(200).send({Tweet: tweetE})
                
                    })
                }else{
                    return res.status(200).send({Tweet: 'No tiene los permisos necesarios para hacer esta accion'})
                }
            })
        
           
        break;

        case 'viewtweets':
          User.find({ username :params[1]}, {'Tweets':true, 'ReTweet':true} ,(err,mostrar)=>{
                if (err) return res.status(500).send({message: 'Error en la peticion'}) 
                if(!mostrar) return res.status(404).send({message: 'No se ha podido Mostrar'})
                Tweet.populate(mostrar, {path: 'Tweets'}, function(err,detalle){
                    return res.status(200).send({ View :detalle})
                }) 
            })
           
        break;
    
        case 'profile':
            User.find({ username :params[1]},(err,mostrar)=>{
                if (err) return res.status(500).send({message: 'Error en la peticion'}) 
                if(!mostrar) return res.status(404).send({message: 'No se ha podido Mostrar'})
                Tweet.populate(mostrar, {path: 'Tweets'}, function(err,detalle){
                    return res.status(200).send({ View :detalle})
                })
            })

        break;
    
        case 'follow':  
            
            User.find({ username :params[1]},{_id:true},(err,mostrar)=>{
                if(mostrar != req.user.sub){
                    User.findById(mostrar, {'FollowME': true},(err,mostrarFoll)=>{
                        if(mostrarFoll.FollowME==req.user.sub){
                            return res.status(500).send({message: 'Usted ya sigue a este usuario'})
                        }else{
                            User.findByIdAndUpdate(mostrar,{$push: {FollowME:req.user.sub}}, {new : true},(err,foll)=>{
                                if(err) return res.status(500).send({message: "Error en la peticion "})
                                if(!foll) return res.status(404).send({message: "Error al seguir"})
                                return res.status(200).send({ Follow : req.user.username +" "+"a comenzado a seguir a"+" "+foll.username})
                            })
                        }
                    })
                   
                }else{
                        return res.status(500).send({message: 'No puede seguirse a usted mismo.... ERROR!!'})
                }
                
            })
            
        break;

        case 'unfollow':
            User.find({ username: params[1]}, {_id:true},(err,mostrar)=>{
                if(mostrar != req.user.sub){
                    User.findByIdAndUpdate(mostrar,{$pull: {FollowME:req.user.sub}}, {new : true},(err,foll)=>{
                        if(err) return res.status(500).send({message: "Error en la peticion "})
                        if(!foll) return res.status(404).send({message: "Error al seguir"})
                        return res.status(200).send({ Follow : req.user.username +" "+"a dejado de seguir a "+" "+foll.username})
                    })
                }else{
                        return res.status(500).send({message: 'ERROR!!'})
                }
            })

        break;

        case 'like_tweet':
           
            if(params[1]){
                Tweet.findById(params[1], (err,mostrar)=>{
                    if(err) res.status(500).send({message: 'El tweet no existe'});

                    User.findById(mostrar.userId,(err,mostrarU)=>{
                        if(err) res.status(500).send({message: 'Error al buscar usuario'});
                        let cache =  mostrarU.FollowME;
                        User.populate(req.user.sub, {path: 'FollowME'},(err,detalle)=>{
                            if(cache=detalle){
                                var constN = mostrar.accountant;
                                Tweet.findOne({Like:req.user.sub},(err,valid)=>{
                                    if(valid){
                                        return res.status(200).send({ message: 'Usted ya ha dado Like'})
                                    }else{ 
                                        Tweet.findByIdAndUpdate(params[1], {accountant: ++constN, $push: {Like: req.user.sub}},{new:true},(err,likeAsig)=>{
                                            if(err) return res.status(500).send({message: "Error en la peticion Asignar"})
                                            if(!likeAsig) return res.status(404).send({message: "Error en la accion Like"})
                                            return res.status(200).send({ message : 'Usted'+' '+req.user.username+" "+"ha dado like"})
                                        })
                                    }   
                                })
                            }else{
                                return res.status(500).send({message: 'Usted debe seguir al Usuario para dar Like'})
                            }
                        })
                    })
                })
            }else{
                return res.status(200).send({message: 'Rellene los campos necesarios'})
            }
            
        break;
            
        case 'dislike_tweet':

            if(params[1]){
                Tweet.findById(params[1], (err,mostrar)=>{
                    if(err) res.status(500).send({message: 'El tweet no existe'});

                    User.findById(mostrar.userId,(err,mostrarU)=>{
                        if(err) res.status(500).send({message: 'Error al buscar usuario'});
                        let cache =  mostrarU.FollowME;
                        User.populate(req.user.sub, {path: 'FollowME'},(err,detalle)=>{
                            if(err) res.status(500).send({message: 'Error al buscar detalle'});
                            if(cache=detalle){
                                var constN = mostrar.accountant; //si contador 0 no se puede dar fav
                                Tweet.findOne({Like:req.user.sub},(err,valid)=>{
                                    if(valid){
                                        Tweet.findByIdAndUpdate(params[1], {accountant: --constN, $pull: {Like: req.user.sub}},{new:true},(err,likeAsig)=>{
                                            if(err) return res.status(500).send({message: "Error en la peticion Asignar"})
                                            if(!likeAsig) return res.status(404).send({message: "Error en la accion DisLike"})
                                            return res.status(200).send({ message : 'Usted'+' '+req.user.username+" "+"ha eliminado su like"})
                                        })
                                    }else{ 
                                        return res.status(200).send({ message: 'Usted no ha dado like a este tweet'})
                                    }   
                                })
                            }else{
                                return res.status(500).send({message: 'Usted debe seguir al Usuario para dar Like'})
                            }
                        })
                    })
                })
            }else{
                return res.status(200).send({message: 'Rellene los campos necesarios'})
            }

        break;

        case 'reply_tweet': 
            if(params[1] && params[2]){
                Tweet.findById(params[1], (err,mostrar)=>{
                    if(err) res.status(500).send({message: 'El tweet no existe'});
                    Tweet.findByIdAndUpdate(params[1], { $push: {Answers: { userId: req.user.sub, answer: {cont: params[2]} }}},{new:true},(err, answers)=>{
                        if (err) return res.status(500).send({message: 'Error en la peticion'}) 
                        if(!answers) return res.status(404).send({message: 'No se ha podido Respoder el Tweet'})          
                        return res.status(200).send(answers)
                        
                    })
                })
            }else{  
                return res.status(200).send({message: 'Rellene los campos necesarios'})
            }
        break;
    
        case 'retweet': 
            if(params[1]){

                Tweet.findById(params[1], (err,mostrar)=>{
                    if(err) res.status(500).send({message: 'El tweet no existe'});
                    var _idr = mostrar._id+'1';

                    User.findByIdAndUpdate(req.user.sub, {$pull: {ReTweet: {_idR:_idr}}},{new:true},(err,disRet)=>{})

                    if(params[2] == null){
                        
                        User.findByIdAndUpdate(req.user.sub, { $push: { ReTweet: { _idR: _idr, originTweet: params[1]}}}, { new: true}, (err,retweet)=>{
                            if(err) res.status(500).send({message: 'Error en la peticion'});
                            if(!retweet) res.status(404).send({message: 'No se ha podido completar el Retweet'});
                            return res.status(200).send(retweet)
                        })

                    }else{
                        
                        User.findByIdAndUpdate(req.user.sub, { $push: { ReTweet: { _idR: _idr, originTweet: params[1], comment: params[2]}}}, { new: true}, (err,retweet)=>{
                            if(err) res.status(500).send({message: 'Error en la peticion'});
                            if(!retweet) res.status(404).send({message: 'No se ha podido completar el Retweet'});
                            return res.status(200).send(retweet)
                        })

                    } 

                })

            }else{  
                return res.status(200).send({message: 'Rellene los campos necesarios'})
            }

        break;
    
    }
}

module.exports = { 
 Control
}