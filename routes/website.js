const express = require('express')
const path = require('path');
const router = express.Router()

router.get('/',(req,res) => {
    res.sendFile("initial_webpage.html",{root:path.join(__dirname,'../')})
})

module.exports = router;