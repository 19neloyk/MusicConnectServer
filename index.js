const express = require('express');
const mongoose = require('mongoose');

const app = express()

const User = require('./models/User')
const Party = require('./models/Party')

//Configure Database
const db = require('./config/keys').MongoURI;

//Use this to parse json bodies
app.use(express.json())
app.use(express.urlencoded({extended:true})) //Allows parsing of nested JSON objects

//Connect to Database 
mongoose.connect(db, {useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB Connected...')) 
    .catch(err => console.log(err))

    const PORT = process.env.PORT || 5000; // "process.env.PORT" accesses what
                                           // is in the environment variable "PORT"
                                           // or 5000 (if the variable "PORT does 
                                           // not exist"). This is useful for 
                                           // deployment  

app.listen(PORT,console.log(`Server started on port ${PORT}`))        



app.post('/newuser', (req,res) => {
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

app.post('/login', (req,res) => {

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

app.get('/newparty', (req,res) => {
    
    res.json({"statement":"HELLOOOO"})
    console.log('What is poopin')
});

app.post('/newparty', (req,res) => {
    res.send('hello');
    //Create new party
});

//app.post('/')