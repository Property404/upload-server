const server_constants = require("./mediaserver-constants.js")
const argon2 = require("argon2")
const fs = require("fs")
const readline_sync = require("readline-sync")
const config = JSON.parse(fs.readFileSync(server_constants.CONFIGURATION_FILE))
const mysql = require("mysql");

const ARGON2_MIN_TIME_COST = 10;
const ARGON2_MIN_MEMORY_COST = 32*1024;//32MB
const ARGON2_MIN_PARALLELISM = 8;

const USER_TABLE_NAME = "Users";
const USER_TABLE_COLUMNS = 
	[
		{
			"name":"id",
			"type":"INT",
			"properties": "PRIMARY KEY AUTO_INCREMENT"
		},
		{
			"name":"user",
			"type":"VARCHAR(255)",
			"properties": "UNIQUE NOT NULL"
		},
		{
			"name":"hash",
			"type":"VARCHAR(255)",
			"properties": "NOT NULL"
		},
		{
			"name":"is_admin",
			"type": "BOOLEAN",
			"properties":"DEFAULT false"
		}
	];
const TORRENT_TABLE_NAME = "Torrents";
const TORRENT_TABLE_COLUMNS = 
	[
		{
			"name":"id",
			"type":"INT",
			"properties": "PRIMARY KEY AUTO_INCREMENT"
		},
		{
			"name":"link",
			"type":"VARCHAR(512)",
			"properties": "UNIQUE NOT NULL"
		},
		{
			"name":"hash",
			"type":"VARCHAR(255)",
			"properties": "UNIQUE NOT NULL"
		},
		{
			"name":"path",
			"type": "VARCHAR(255)",
			"properties":"NOT NULL"
		},
		{
			"name":"is_paused",
			"type": "BOOLEAN",
			"properties":"DEFAULT false"
		},
		{
			"name":"is_private",
			"type": "BOOLEAN",
			"properties":"DEFAULT false"
		}
	];

// Database setup
const db_user = (
	config.db_user == null?
	"root":
	config.db_user
);
const db_password = (
	config.db_password == null?
	readline_sync.question("Database password for @"+db_user+">", {hideEchoBack:true}):
	config.db_password
);
const conn = mysql.createConnection({
	host: "localhost",
	user: db_user,
	password: db_password,
	database: "mediaserver"
});

function createTable(name, columns, callback)
{
	let creation_query = `CREATE TABLE IF NOT EXISTS ${name} (`;
	for(const i in columns)
	{
		const column = columns[i];
		if(i>0)creation_query+=",";
		creation_query += `${column["name"]} ${column["type"]} ${column["properties"]}`
	}
	creation_query += ");"

	conn.query(creation_query, callback);
}


let database_ready = new Promise((resolve, reject)=>{

	conn.connect(function(err){
		if(err) reject(err);

		createTable(TORRENT_TABLE_NAME, TORRENT_TABLE_COLUMNS, function(err){
			if(err) reject(err);


			createTable(USER_TABLE_NAME, USER_TABLE_COLUMNS, function(err){
				if(err) reject(err);

				// If there are no rows, populate with an admin account
				const count_query = `SELECT 1 FROM ${USER_TABLE_NAME}`;
				conn.query(count_query, function(err, result){
					if(result.length == 0)
					{
						const new_user = readline_sync.question("Desired user name: ");
						while(true)
						{
							const new_pass = readline_sync.question("Password: ", {hideEchoBack:true});
							if(new_pass != readline_sync.question("Confirm: ", {hideEchoBack:true}))
							{
								console.log("Passwords don't match");
								continue;
							}
							module.exports.addUser(new_user, new_pass, is_admin=true);
							break;
						}
					}

					resolve(true);
					
				});

			});
		});

	});
});


// Pull users from database as json object
module.exports.getUsers = async function(callback){
	conn.query(`select * from ${USER_TABLE_NAME}`, callback);
}

// Add a user
module.exports.addUser = async function(username, password, is_admin=false, callback=null) {
	const argon2_options = {
		type: argon2.argon2id,
		timeCost: Math.max(argon2.defaults.timeCost, ARGON2_MIN_TIME_COST),
		memoryCost: Math.max(argon2.defaults.memoryCost, ARGON2_MIN_MEMORY_COST),
		parallelism: Math.max(argon2.defaults.parallelism, ARGON2_MIN_PARALLELISM),
	}
	const hash = await argon2.hash(password, argon2_options);
	const query = `INSERT INTO ${USER_TABLE_NAME} (user,hash, is_admin) VALUES (${conn.escape(username)}, '${hash}', ${is_admin});`;


	conn.query(query, callback);
}

module.exports.verifyUser = function(username, password, callback) {
	const query = `SELECT * FROM ${USER_TABLE_NAME} WHERE user=${conn.escape(username)}`;
	conn.query(query, function(err, result){
		if(err)
		{
			callback(err);
		}
		else
		{
			if(result.length === 0)
			{
				callback(Error("invalid username"));
			}
			else
			{
				const stored_hash = result[0].hash;
				argon2.verify(stored_hash, password).then(
					(is_valid)=>{callback(null, {valid:is_valid, user: is_valid?result[0]:null});},
					callback);
			}
		}
	});
}

// Return torrents that the user is allowed to see
module.exports.getTorrents = function(user, callback){
	if (user.is_admin)
		module.exports.getAllTorrents(callback)
	else
		conn.query(`SELECT * FROM ${TORRENT_TABLE_NAME} WHERE is_private=false;`, callback);
}

// Not part of API - returns all torrents
module.exports.getAllTorrents = function(callback){
	conn.query(`SELECT * FROM ${TORRENT_TABLE_NAME};`, callback);
}

// Remove torrent entry from database
module.exports.deleteTorrent = function(torrent, callback){
	const query =`DELETE FROM ${TORRENT_TABLE_NAME} where hash='${torrent.infoHash}';`

	conn.query(query, callback);
}

// Add torrent entry to database
module.exports.addTorrent = function(torrent, user, is_private, callback){
	const query = 
	`INSERT INTO ${TORRENT_TABLE_NAME} (link, hash, path, is_private)
	VALUES (${conn.escape(torrent.magnetURI)}, '${torrent.infoHash}', ${conn.escape(torrent.path)}, ${is_private});`;

	conn.query(query, callback);
}

module.exports.ready = database_ready;
