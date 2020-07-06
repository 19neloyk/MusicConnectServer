//Used for routing and handling requests
const express = require('express');
const app = express()

//Used for database
const mongoose = require('mongoose');

//Used for managing Spotify token
const btoa = require("btoa"); // base64 encoder
const axios = require("axios"); // http library
const qs = require("qs"); // querystring parsing
SPOTIFY_CLIENT_ID = "044b2c45e77f45aca8da89e338849b6a"
SPOTIFY_CLIENT_SECRET = "c7d838bc6f3d40889cb11517afc8e3f3"
SPOTIFY_CLIENT_CALLBACK_URL = "spotify-login-sdk-test-app://spotify-login-callback"
ENCRYPTION_SECRET = "cFJLyifeUJUBFWdHzVbykfDmPHtLKLGzViHW9aHGmyTLD8hGXC"

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

// accept form-urlencoded submissions
axios.interceptors.request.use(request => {
    if (request.data && request.headers['Content-Type'] === 'application/x-www-form-urlencoded') {
      request.data = qs.stringify(request.data);
    }
    return request;
  });

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

app.post('/newparty', (req,res) => {
    res.send('hello');
    //Create new party
});

// POST /api/token
app.post("/spotifyauth/token", ({body: {code: authorization_code}}, response) => {
    console.log("REQUEST RECEIVED")
    axios({
      method: "POST",
      url: "https://accounts.spotify.com/api/token",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": "Basic " + btoa(SPOTIFY_CLIENT_ID + ":" + SPOTIFY_CLIENT_SECRET)
      },
      data: {
        grant_type: "authorization_code",
        redirect_uri: SPOTIFY_CLIENT_CALLBACK_URL,
        code: authorization_code
      }
    }).then(({data: json}) => {
      // ▾▾▾ --- encrypted code --- ▾▾▾
      // let encrypted_access_token = encrypt(json.access_token, ENCRYPTION_SECRET);
      // response.set("Content-Type", "text/json").status(200).send(Object.assign({}, json, {refresh_token: encrypted_access_token}));
      
      // ▾▾▾ --- unencrypted code --- ▾▾▾
      console.log("UNENCRYPTED CODE SENT")
      response.set("Content-Type", "text/json").status(200).send(json);
    }).catch(({response: err}) => {
      console.log("ERROR SENT")
      response.set("Content-Type", "text/json").status(402).send(err.data);
    });
  });
  
  // POST /api/refresh_token
  app.post("/spotifyrefresh_token", ({body: {refresh_token}}, response) => {
    console.log("REQUEST RECEIVED")
    axios({
      method: "POST",
      url: "https://accounts.spotify.com/api/token",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": "Basic " + btoa(SPOTIFY_CLIENT_ID + ":" + SPOTIFY_CLIENT_SECRET)
      },
      data: {
        grant_type: "refresh_token",
        // ▾▾▾ --- unencrypted code --- ▾▾▾
        refresh_token: refresh_token,
        
        // ▾▾▾ --- encrypted code --- ▾▾▾
        // refresh_token: decrypt(refresh_token, ENCRYPTION_SECRET),
      }
    }).then(({data: json}) => {
      response.set("Content-Type", "text/json").status(200).send(json);
    }).catch(({response: err}) => {
      response.set("Content-Type", "text/json").status(402).send(err.data);
    });
  });
//app.post('/')