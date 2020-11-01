"use strict"
const PREFIX = "/upload/";

// Security stuff
const fs = require('fs');
const crypto = require("crypto");
const file_upload = require("express-fileupload");
const session = require("express-session");
const http = require("http");
const auth = require("./auth");

// Choose port
const args = process.argv.slice(2);
const port = args[0]?args[0]:1234;

// Application
const express    = require('express')
const serveIndex = require('serve-index')
const app = express()
app.use(express.urlencoded({ extended: false }))
app.use(express.json());

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
		secure: false,
		expires: new Date(Date.now() + MONTH),
		maxAge: MONTH
	}
}));

function isAuthorized(request)
{
	return request.session.auth?.valid;
}
function isAdmin(request)
{
	return isAuthorized(request) &&
		request.session.auth.user.is_admin == true;//MySQL won't return an actual boolean
}

// Serve public folder
// Intentionally don't redirect to HTTPS so non-browser applications can access
// easily if there's something wrong with the certificate
app.use('/files', express.static("uploads"), serveIndex("uploads", {'icons': true, 'view':'details', 'stylesheet':'style.css'}))

// Determine if we should redirect to login
app.use('/', function(req, res, next){
	const authorized = isAuthorized(req);
	if
	(
		isAuthorized(req) || 
		req.url.endsWith(".css") ||
		req.url.endsWith(".js") || 
		req.url.endsWith(".mjs") || 
		req.url.endsWith(".ico") || 
		req.url.startsWith("/login/")||
		req.url.startsWith("/api/session/")
	)
	{
		next();
	}
	else
	{
		res.redirect("/login/?url="+req.url);
	}
});

// Our static HTML and CSS and such
app.use('/', express.static('static/'));

// File upload API
app.use(file_upload());
app.post('/api/file/upload', function(req, res){

	let redirect_to_form = function(success, message, url)
	{
		return res.redirect(`/upload?success=${success}&message=${message}&url=${url}`);
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
	if(name.replace(/[.]/gi, '') == "" || name.length < 1 || name.length > 255)
		return redirect_to_form(false, "Invalid file name");

	// Send to public folder
	file.mv("./uploads/"+name, function(err) {
		if (err)
			return redirect_to_form(false, "Failed to upload");

		return redirect_to_form(true, "Success!", "/files/"+name);
	});
});




app.post('/api/session/login', function(req, res){
	const user = req.body.user;
	const password = req.body.password;

	auth.verifyUser(user, password).then(result=>
		{
			req.session.auth = {valid: result};
			req.session.save(function(err2){
				if(err2)
				{
					console.log("Err:", err2);
				}
				if(isAuthorized(req))
				{
					if(req.query.url)
						res.redirect(req.query.url);
					else
						res.redirect('/');
				}
				else
				{
					let url = "/";
					console.log(`Invalid pass for ${user?.length<512?user:'<redacted>'}`);
					if(req.query.url)url=req.query.url;
					res.redirect("/login/?fail=true&url="+url);
				}
			});
		});

});

app.get('/api/session/logout', function(req, res){
	req.session.destroy(function(err){
		res.redirect("/login");
	})
});

// Listen
console.log(`Launching on port ${port}`)
http.createServer(app).listen(port)
