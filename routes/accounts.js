const express = require('express')
const router = express.Router()
//Used for database
const mongoose = require('mongoose');
const User = require('../models/User')
//Used for password encryption
const bcrypt = require('bcrypt')
//For jwt
const jwt = require('jsonwebtoken')


router.post('/newuser', async (req,res) => {
    console.log('What is poppin')
    const {username, email, password} = req.body
    User.findOne ({email:email})
    .then (user => {
        if (user){
            res.json({"heading":"Email taken",
                      "statement":"Use a different email"})
            return
        } else {
            User.findOne({name : username})
            .then (anotherUser => {
                if (anotherUser) {
                    res.json({"heading":"Username taken",
                      "statement":"Use a different Username"})
                } else {
                    //Encrypt password for database
                    bcrypt.hash(password,10,(err,encrypted) => { //encrypted represents the hashed password of the callback
                        if (err){
                            res.json({"heading":"Error",
                                    "statement":"Could not create account. Please try again."});
                        } else {    //Create new user
                            const newUser = new User ({
                                name: username,
                                email:email,
                                password:encrypted
                            });
                            newUser.save()
                            res.json({"heading":"Success",
                                            "statement":"Account created."});
                        }
                    }) 
                }
            });
        }
    });
});

router.post('/login', (req,res) => {
    console.log('What is poppin')
    const {username , password} = req.body
    User.findOne({name:username}).then(user => {
        if (user){
            bcrypt.compare(password,user.password,(err, same) => {
                if (err) {
                    res.json({"heading":"Error", "statement": "Could not log in. Please try again."});
                } else {
                    if (same) {
                        //Doing web token stuff
                        const thepayload = {name:username} //this goes in the jwt payload
                        const accessToken = jwt.sign(thepayload,process.env.ACCESS_TOKEN_SECRET) //Pull the secret from the environment variable; try not to have expiration if there is no refresh token
                        res.json({"heading":"Success", "statement": "You have logged in successfully","accessToken":accessToken});
                    } else {
                        res.json({"heading":"Incorrect password", "statement": "Please try again"});
                    }
                }
            })
        } else {
            res.json({"heading":"Account with entered username does not exist",
              "statement": "Try again"});
        }
    });
});

module.exports = router