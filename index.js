//Load environment variables
require("dotenv").config();

//Used for routing and handling requests
const express = require('express');
const app = express()
const web_app = express()


//Used for database
const mongoose = require('mongoose');
const User = require('./models/User')
const Party = require('./models/Party')

//To use the native js promises
mongoose.Promise = global.Promise

//Configure Database
const db = require('./config/keys').MongoURI;

//Use this to parse json bodies
app.use(express.urlencoded({extended:true,limit: '50mb'})) //Allows parsing of nested JSON objects, VVV
app.use(express.json({limit: '50mb'})); //Increase limits for each request

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


const accountsRouter = require('./routes/accounts')
const partyManagementRouter = require('./routes/partyManagement')
const spotifyAuthRouter = require('./routes/spotifyAuth')
app.use('/api',accountsRouter)
app.use('/api',partyManagementRouter)
app.use('/api',spotifyAuthRouter)


//web_app.listen(80, console.log("Server started on port 80"))
//const websiteRouter = require('./routes/website')
//web_app.use(websiteRouter)

//app.post('/')
