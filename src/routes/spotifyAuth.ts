//Used for managing Spotify token
const express = require('express');
const btoa = require("btoa"); // base64 encoder
const axios = require("axios"); // http library
const qs = require("qs"); // querystring parsing
SPOTIFY_CLIENT_ID = "b4d0a9bfec0d450387f9373cd02a7ac4"
SPOTIFY_CLIENT_SECRET = "1e3b14c018df41fea5b45ea3720a0533"
SPOTIFY_CLIENT_CALLBACK_URL = "musicmatch://spotify-login-callback"

SPOTIFY_MESSAROUND_ID = "044b2c45e77f45aca8da89e338849b6a"
SPOTIFY_MESSAROUND_SECRET = "c7d838bc6f3d40889cb11517afc8e3f3"
SPOTIFY_MESSAROUND_CALLBACK_URL = "spotify-login-sdk-test-app://spotify-login-callback"

// FUCK AROUND!!!
// SPOTIFY_CLIENT_ID = SPOTIFY_MESSAROUND_ID
// SPOTIFY_CLIENT_SECRET = SPOTIFY_MESSAROUND_SECRET
// SPOTIFY_CLIENT_CALLBACK_URL = SPOTIFY_MESSAROUND_CALLBACK_URL

ENCRYPTION_SECRET = "cFJLyifeUJUBFWdHzVbykfDmPHtLKLGzViHW9aHGmyTLD8hGXC"

// accept form-urlencoded submissions
axios.interceptors.request.use(request => {
    if (request.data && request.headers['Content-Type'] === 'application/x-www-form-urlencoded') {
      request.data = qs.stringify(request.data);
    }
    return request;
  });

//ROUTING THIS
const router = express.Router()

// POST /api/token 
router.post("/spotifyauth/token", ({body: {code: authorization_code}}, response) => {
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
      //console.log("Here was the response")
      //console.log(json)
      response.set("Content-Type", "text/json").status(200).send(json);
    }).catch(({response: err}) => {
      console.log("ERROR SENT")
      response.set("Content-Type", "text/json").status(402).send(err.data);
    });
  });
  
  // POST /api/refresh_token
  router.post("/spotifyauth/refresh_token", ({body: {refresh_token}}, response) => {
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

  module.exports = router