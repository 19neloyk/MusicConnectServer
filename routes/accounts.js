const express = require('express')
const router = express.Router()
//Used for database
const mongoose = require('mongoose');
const User = require('../models/User')

router.post('/newuser', (req,res) => {
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
                    return
                } else {
                    //Create new user
                    const newUser = new User ({
                        name: username,
                        email:email,
                        password:password
                    });
                    newUser.save()
                    res.json({"heading":"Success",
                                    "statement":"Account created"});
                }
            });
        }
    });
});

router.post('/login', (req,res) => {
    console.log('What is poppin')
    const {username , password} = req.body
    User.findOne({name:username, password:password}).then(user => {
        if (user){
            res.json({"heading":"Success",
              "statement": "You have logged in successfully"});
        } else {
            res.json({"heading":"Incorrect username or password",
              "statement": "Try again"});
        }
    });
});

module.exports = router