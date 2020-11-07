const sqlite3 = require("sqlite3");
const fs = require("fs");
const db = new sqlite3.Database("database");
const auth = require("./auth");
const crypto = require("crypto");
const apimsg = require("./apimsg");

function getFilePath(id, filename)
{
	return `./files/${id}/file`;
}

function sanitizeFilename(filename)
{
	console.log({filename});
	if(!filename || filename.length < 1 || filename.length > 128)
		return null;
	if(typeof filename !== "string")
		return null;
	if(filename === "." || filename === "..")
		return null;
	return filename.replace(/[^\w\-. ]/g, "_");
}

function validatePair(username, password)
{
	if(!auth.validateUsername(username))
		return false;
	if(!auth.validatePassword(password))
		return false;
	return true;
}

async function construct()
{
	return await new Promise((res,rej)=>{
		db.run(`CREATE TABLE IF NOT EXISTS Users (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT,
			hash TEXT,
			admin BOOL
		)`, err=>{
			if(err)
			{
				rej(err);
				return;
			}
			db.run(
				`CREATE TABLE IF NOT EXISTS Files (
				id TEXT PRIMARY KEY,
				name TEXT,
				size INTEGER,
				owner INTEGER,
				FOREIGN KEY(owner) REFERENCES Users(id)
				)`
				,err=>{
					if(err)
					{
						rej(err);
						return;
					}
					res(true)
			})
		})
	});
}

async function newUser(username, password, admin)
{
	return await new Promise((res,rej)=>db.serialize(()=>{
		auth.hash(password).then(hash=>{
			if(!validatePair(username, password))
			{
				rej(apimsg("Invalid username/password"));
				return;
			}
			const prep = db.prepare("INSERT INTO Users (name, hash, admin) VALUES (?, ?, ?)");
			prep.run(username, hash, admin??false);
			prep.finalize();
			res(apimsg(`added new ${admin?"admin":"user"}: ${username}`));
		});
	}));
}

async function verifyUser(username, password)
{

	return await new Promise((res,rej)=>db.serialize(()=>{
		if(!validatePair(username, password))
		{
			rej(apimsg("Invalid username/password"));
			return;
		}
		db.get("SELECT * FROM Users WHERE name=?", username,(err,row)=>{
			if(err)
			{
				rej(apimsg("Query failed"));
				return;
			}
			if(!row)
			{
				rej(apimsg("No such username"));
				return;
			}
			const id = row["id"]
			const admin = row["admin"]
			const hash = row["hash"];
			auth.verify(password, hash).then(matches=>{
				if(matches)
				{
					res(apimsg({user_id: id, admin: admin}));
				}
				else
				{
					rej(apimsg("wrong password"));
				}
			});
		})
	}));
}

function deleteFile(id, owner)
{
	return new Promise((res,rej)=>{
		if(!id || owner == null)
		{
			rej(apimsg("id or owner not given"));
			return
		}
		db.get("SELECT * FROM Files WHERE id=?", id,(err, row)=>{
			if(err)
			{
				rej(apimsg(err));
				return;
			}
			if(!row)
			{
				rej(apimsg(`File with id ${id} does not exist in database`));
				return;
			}
			if(row.owner != owner)
			{
				rej(apimsg("You don't have permission to delete this file"));
				return;
			}
			db.run("DELETE FROM Files WHERE id=?", id, error=>{
				if(error)
				{
					rej(apimsg({message:"Could not delete file from database", error}));
					return;
				}
				fs.unlink(getFilePath(id, row.name), error=>{
					if(error)
					{
						rej(apimsg({"message":"Could not delete file from system", error}));
						return;
					}
					res(apimsg("Successfully deleted file"));
				});
			});
		});
	});
}

function uploadFile(file, user_id)
{
	return new Promise((res,rej)=>{
		const name = sanitizeFilename(file.name);
		if(!name)
		{
			rej(apimsg("invalid filename"));
			return
		}
		if(!user_id)
		{
			rej(apimsg("uploadFile requires a third parameter"));
			return;
		}
		crypto.randomBytes(8, (error,buffer)=>{
			if(error)
			{
				rej(apimsg("randomBytes failed"));
				return;
			}
			const id = buffer.toString("hex");
			file.mv(getFilePath(id, name));
			db.run("INSERT INTO Files (id, name, size, owner) VALUES (?, ?, ?, ?)",
				id, name, file.size, user_id,
				err=>{
					if(err){
						rej(apimsg(err));
						return;
					}
					db.get("SELECT * FROM Files WHERE id=?", id, (err, row)=>{
						if(err){
							rej(apimsg(err));
							return;
						}
						res(apimsg({message:"Successfully added new file", file:row}));
					});
				}
			);
		})
	});
}

async function getFiles(user_id, is_admin)
{
	function getFilesById(user_id, is_admin, callback)
	{
		if(is_admin)
			db.all("SELECT * FROM Files WHERE owner=?", user_id, callback);
		else
			db.all("SELECT * FROM Files ", callback);
	}
	return await new Promise((res,rej)=>db.serialize(()=>{
		getFilesById(user_id, is_admin, (err, rows)=>{
			if(err)
			{
				rej(failure(err));
				return;
			}
			res(apimsg({"files": rows}));
		});
	}));
}

async function main()
{
	let result;
	await construct();
	result = await newUser("dagan", "fishpaste", true);
	console.log(result);
	result = await verifyUser("dagan", "fishpaste");
	console.log(result);
}
main();
module.exports={
	verifyUser,
	uploadFile,
	getFiles,
	deleteFile
}
