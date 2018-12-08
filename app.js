// Security stuff
const fs = require('fs');
const consts = require('constants');
const https = require("https");
const private_key = fs.readFileSync("/etc/letsencrypt/live/butterypumpkin.com/privkey.pem");
const full_chain = fs.readFileSync("/etc/letsencrypt/live/butterypumpkin.com/fullchain.pem");
const security_options = consts.SSL_OP_NO_TLSv1 | consts.SSL_OP_NO_TLSv1_1;
const cred =
	{
	cert: full_chain,
	key: private_key,
	secureOptions: security_options,
	};

// Choose port
const args = process.argv.slice(2);
const port = args[0]?args[0]:8443;

// Application
const express    = require('express')
const serveIndex = require('serve-index')
const app = express()

// Serve URLs like /ftp/thing as public/ftp/thing
// The express.static serves the file contents
// The serveIndex is this module serving the directory
app.use('/', express.static('public/'), serveIndex('public/', {'icons': true, 'view':'details', 'stylesheet':'style.css'}))

// Listen
console.log(`Launching on Port ${port}`)
https.createServer(cred, app).listen(port);
