const express    = require('express')
const serveIndex = require('serve-index')
const fs = require('fs');
const https = require("https");
const private_key = fs.readFileSync("/etc/letsencrypt/live/butterypumpkin.com/privkey.pem");
const full_chain = fs.readFileSync("/etc/letsencrypt/live/butterypumpkin.com/fullchain.pem");
const cred = {cert: full_chain, key: private_key};

const app = express()

// Serve URLs like /ftp/thing as public/ftp/thing
// The express.static serves the file contents
// The serveIndex is this module serving the directory
app.use('/', express.static('public/'), serveIndex('public/', {'icons': true, 'view':'details', 'stylesheet':'style.css'}))

// Listen
https.createServer(cred, app).listen(8443);
