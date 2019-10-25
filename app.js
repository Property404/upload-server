// Security stuff
const fs = require('fs');
const consts = require('constants');
const https = require("https");
const webtorrent = require("webtorrent")
const http = require("http");
const config = JSON.parse(fs.readFileSync("config.json"))
const private_key = fs.readFileSync(config.private_key_file)
const full_chain = fs.readFileSync(config.full_chain_file)
const security_options = consts.SSL_OP_NO_TLSv1 |
	consts.SSL_OP_NO_TLSv1_0|
	consts.SSL_OP_NO_TLSv1_1;
const cred =
	{
		cert: full_chain,
		key: private_key,
		secureOptions: security_options,
	};

// Choose port
const args = process.argv.slice(2);
const port = args[0]?args[0]:443;
const insecure_port = args[1]?args[1]:80;

// Application
const express    = require('express')
const serveIndex = require('serve-index')
const app = express()

// Torrent
const client = new webtorrent()
client.on("error", (error)=>{
	console.log(error);
});

// Serve public folder
app.use('/', express.static('public/'), serveIndex('public/', {'icons': true, 'view':'details', 'stylesheet':'style.css'}))

// Torrent service
app.get('/api/add_torrent', function(req, res){
	const magnet_uri = req.query.url;

	client.add(magnet_uri, {path: './public/dtorrents/'}, function (torrent) {
		// Got torrent metadata!
		console.log('Client is downloading:', torrent.infoHash)
		torrent.on('done', function(){
			console.log("finished!");
		});
	});

	res.send("Adding torrent")

});
app.get('/api/progress', function(req, res){
	const torrents = client.torrents;
	const fields = ["name", "infoHash", "magnetURI", "progress", "ratio", "downloaded", "received", "uploaded", "downloadSpeed", "uploadSpeed", "ready", "paused", "length", "comment", "created", "createdBy", "timeRemaining"]

	let torrent_info = []
	for(const i in torrents)
	{
		let result = {}
		for (const field of fields)
		{
			result[field] = torrents[i][field]
		}
		torrent_info.push(result)
	}
	res.send(torrent_info);
});


// Listen
console.log(`Launching on ports ${port} and ${insecure_port}(insecure)`)
http.createServer(app).listen(insecure_port)
https.createServer(cred, app).listen(port);
