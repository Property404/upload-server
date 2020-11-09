"use strict"
// Security stuff
const mime = require("mime-types");
const crypto = require("crypto");
const file_upload = require("express-fileupload");
const session = require("express-session");
const http = require("http");
const dbif = require("./dbif");
const apimsg = require("./apimsg");

// Choose port
const args = process.argv.slice(2);
const port = args[0]?args[0]:1234;

// Application
const express    = require('express')
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
		sameSite: "strict",
		expires: new Date(Date.now() + MONTH),
		maxAge: MONTH
	}
}));

function isAuthorized(request)
{
	return request.session.auth?.user_id != null;
}

function isAdmin(request)
{
	return isAuthorized(request) &&
		request.session.is_admin === true;
}

// Serve public folder
app.use('/files', express.static("uploads"));

// Determine if we should redirect to login
let origin = null;
app.use('/', function(req, res, next){
	req.url = req.url.replace("//","/");

	origin = origin ?? req.get("origin");
	res.header("Access-Control-Allow-Credentials", true);
	res.header("Access-Control-Allow-Origin", origin);
	res.header("Vary","Origin");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	res.header('Access-Control-Max-Age', 3600);

	if (isAuthorized(req) ||
		req.url.startsWith("/authenticate") ||
		req.url.startsWith("/file/") ||
		req.method === "OPTIONS")
	{
		next();
	}
	else
	{
		res.status(403).send(apimsg("You are not logged in"));
	}
});

// File upload API
app.use(file_upload({
	createParentPath:true
}));

app.post('/delete', function(req, res){
	const id = req.body.id;
	if(!id)
	{
		res.status(400).send(apimsg("No file id given"));
		return
	}
	const user_id = req.session.auth.user_id;

	dbif.deleteFile(id, user_id).then(result=>{
		res.send(result);
	})
	.catch(err=>{
		console.log("Deletion error", err);
		res.status(400).send(err)
	});
});

app.post('/upload', function(req, res){
	const files = req.files;
	if(!files)
	{
		res.status(400).send(apimsg("No files given"));
		return
	}
	const user_id = req.session.auth.user_id;

	dbif.uploadFiles(files, user_id).then(result=>{
		res.send(result);
	})
	.catch(err=>{
		res.status(400).send(err)
	});
});

app.post('/authenticate', function(req, res){
	const user = req.body.username;
	const password = req.body.password;

	dbif.verifyUser(user, password).then(result=>{
		req.session.auth = {user_id:result.user_id, is_admin:result.admin};
		req.session.save(err=>{
			if(err)
			{
				res.status(400).send(apimsg(err));
				return;
			}
			res.send(apimsg(result));
		}
		);
	})
	.catch(err=>res.status(400).send(err));
});

app.post("/logout", function(req,res){
	req.session.destroy(err=>{
		if(err)
		{
			res.status(400).send(apimsg(err));
			return;
		}
		res.send(apimsg("OK"));
	});
});


app.get('/files', function (req, res){
	dbif.getFiles(req.session.auth.user_id, req.session.auth.is_admin)
	.then(result=> {
		res.send(result);
	})
	.catch(err=>{
		res.status(400).send(apimsg(err));
	});
;
});

// Fetch file
function fetchFile(res, id_requested, name_requested)
{
	dbif.getFilePath(id_requested)
	.then(result=>{
		if(!name_requested)
		{
			res.redirect(301, `/file/${id_requested}/${result.name}`);
			return;
		}
		if(name_requested != result.name)
		{
			res.status(404).send("Mismatch");;
			return;
		}
		const mime_type = mime.lookup(name_requested) ||
			"application/octet-stream";
		res.sendFile(result.path, {
			root:".",
			headers:{
				"Content-Type":mime_type
			}
		});
	})
	.catch(err=>{
		res.status(404).send(err);
	});
}
app.get('/file/*/*', function (req, res){
	const path_components = req.url.split("/");
	const id = path_components[path_components.length-2];
	const name = path_components[path_components.length-1];
	fetchFile(res, id, decodeURIComponent(name));
});
app.get('/file/*', function (req, res){
	const path_components = req.url.split("/");
	const id = path_components[path_components.length-1];
	fetchFile(res, id);
});


// Listen
console.log(`Launching on port ${port}`)
http.createServer(app).listen(port)
