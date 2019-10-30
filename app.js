// Security stuff
const fs = require('fs');
const crypto = require("crypto");
const file_upload = require("express-fileupload");
const session = require("express-session");
const server_constants = require('./mediaserver-constants.js');
const https = require("https");
const webtorrent = require("webtorrent")
const http = require("http");
const config = JSON.parse(fs.readFileSync(server_constants.CONFIGURATION_FILE))
const private_key = fs.readFileSync(config.private_key_file)
const full_chain = fs.readFileSync(config.full_chain_file)
const cred =
	{
		cert: full_chain,
		key: private_key,
		secureOptions: server_constants.TLS_OPTIONS,
	};

// Database
const db_interface = require("./db_interface")

// Choose port
const args = process.argv.slice(2);
const port = args[0]?args[0]:443;
const insecure_port = args[1]?args[1]:80;

// Application
const express    = require('express')
const serveIndex = require('serve-index')
const app = express()
app.use(express.urlencoded({ extended: false }))
app.use(express.json());

// Torrent
const client = new webtorrent()
client.on("error", (error)=>{
	console.log(error);
});

// Session
const SESSION_SECRET = crypto.randomBytes(16).toString();
const HOUR = 3600000
const DAY = HOUR*24
const MONTH = DAY*30
app.use(session({
	secret: SESSION_SECRET,
	resave: false,
	saveUninitialized: true,
	cookie: {
		secret: true,
		secure: true,
		expires: new Date(Date.now() + MONTH),
		maxAge: MONTH
	}
}));

function isAuthorized(request)
{
	return request.session.auth === true;
}

// Serve public folder
// Intentionally don't redirect to HTTPS so non-browser applications can access
// easily if there's something wrong with the certificate
app.use('/public', express.static(server_constants.PUBLIC_FOLDER), serveIndex(server_constants.PUBLIC_FOLDER, {'icons': true, 'view':'details', 'stylesheet':'style.css'}))

// Determine if we should redirect to login
app.use('/', function(req, res, next){
	if
	(
		isAuthorized(req) || 
		req.url.endsWith(".css") ||
		req.url.endsWith(".js") || 
		req.url.endsWith(".ico") || 
		req.url.startsWith("/login/")||
		req.url.startsWith("/api/session/")
	)
	{
		// While we're here, may as well make sure we have a secure connection
		if(!req.secure)
		{
			res.redirect("https://"+req.headers.host + req.url);
		}
		else
		{
			// Use HSTS
			res.set('Strict-Transport-Security', `max-age=${MONTH}`);
			next();
		}
	}
	else
	{
		res.redirect("https://"+req.headers.host+"/login/?url="+req.url);
	}
});

// Our static HTML and CSS and such
app.use('/', express.static('static/'));

// File upload API
app.use(file_upload());
app.post('/api/file/upload', function(req, res){

	let redirect_to_form = function(success, message)
	{
		return res.redirect("/upload?success="+success+"&message="+message);
	}

	// Make sure file is valid
	let file = null;
	if (!req.files ||
		Object.keys(req.files).length === 0 ||
		(file = req.files.file) == null)
	{
		return redirect_to_form(false, "No files given");
	}

	// Sanitize name
	const name = file.name.replace(/[^a-z-.~0-9]/gi, '_').toLowerCase();
	if(name.replace(/[.]/gi, '') == "")
		return redirect_to_form(false, "Invalid file name");

	// Send to public folder
	file.mv(server_constants.UPLOADS_FOLDER+name, function(err) {
		if (err)
			return redirect_to_form(false, "Failed to upload");

		return redirect_to_form(true, "Success!");
	});
});


// Torrent service
app.post('/api/torrent/add', function(req, res){
	const magnet_uri = req.body.url;
	client.add(magnet_uri, {path: server_constants.TORRENTS_FOLDER}, function (torrent) {
		// Got torrent metadata!
		console.log('Client is downloading:', torrent.infoHash)
		torrent.on('done', function(){
			console.log("finished!");
		});
	});

	res.send("Adding torrent")

});

app.get('/api/torrent/progress', function(req, res){
	const torrents = client.torrents;
	const fields = ["name", "infoHash", "magnetURI", "progress", "ratio", "downloaded", "received", "uploaded", "downloadSpeed", "uploadSpeed", "ready", "paused", "length", "comment", "created", "createdBy", "timeRemaining", "path"]

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

app.post('/api/session/login', function(req, res){
	const user = req.body.user;
	const password = req.body.password;

	db_interface.verifyUser(user, password, function(err, result)
		{
			req.session.auth = result;
			req.session.save(function(err2){
				if(isAuthorized(req))
				{
					if(req.query.url)
						res.redirect(req.query.url);
					else
						res.redirect("/");
				}
				else
				{
					let url = "/";
					if(req.query.url)url=req.query.url;
					res.redirect("/login/?fail=true&url="+url);

					if(err)
					{
						console.log(`Attempted cred: ${user} | ${password}`);
					}
				}
			});
		});

});

app.get('/api/session/logout', function(req, res){
	req.session.destroy(function(err){
		res.redirect("/login");
	})
});

app.get('/api/admin/users', function(req, res){
	console.log(req.session.auth);
	const users = db_interface.getUsers(function(err, results){
		if(err)
		{
			console.log(err);
			res.send(err);
		}
		else
		{
			console.log(results);
			res.send(results);
		}
	});
});


// Listen
console.log(`Launching on ports ${port} and ${insecure_port}(insecure)`)
http.createServer(app).listen(insecure_port)
https.createServer(cred, app).listen(port);
