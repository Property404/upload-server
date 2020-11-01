const argon2 = require("argon2")
const fs = require("fs")
const readline_sync = require("readline-sync")

const PASSWD_FILE="./passwd";

const ARGON2_MIN_TIME_COST = 20;
const ARGON2_MIN_MEMORY_COST = 32*1024;//32MB
const ARGON2_MIN_PARALLELISM = 10;

const MIN_PASSWORD_LENGTH = 6;
const MAX_PASSWORD_LENGTH = 256;
const MIN_NAME_LENGTH = 2;
const MAX_NAME_LENGTH = 32;
const ALLOWED_NAME_CHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ _-0123456789";

const data = JSON.parse(fs.readFileSync(PASSWD_FILE));

function isValidName(user)
{
	if(!user)
		return false;
	if(user.length < MIN_NAME_LENGTH || user.length > MAX_NAME_LENGTH)
	{
		return false;
	}
	for(const c of user)
	{
		if (!(ALLOWED_NAME_CHARS.includes(c)))
		{
			console.log("Invalid char: ",c);
			return false;
		}
	}
	return true;
}
function isValidPassword(password)
{
	if(!password)
		return false;
	if(password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH)
		return false;
	return true;
}

function fail(message)
{
		console.log(message);
		process.exit(1);
}

// Add a user
async function addUser() {
	let username = readline_sync.question("New Username> ", {hideEchoBack:false});
	if(!isValidName(username))
		fail("Invalid username");
	let password = readline_sync.question("New Password> ", {hideEchoBack:true});
	if(!isValidPassword(password))
		fail("Password too short");
	if(password !==
			 readline_sync.question("Confirm Password> ", {hideEchoBack:true}))
	{
		fail("Passwords don't match");
	}

	const argon2_options = {
		type: argon2.argon2id,
		timeCost: Math.max(argon2.defaults.timeCost, ARGON2_MIN_TIME_COST),
		memoryCost: Math.max(argon2.defaults.memoryCost, ARGON2_MIN_MEMORY_COST),
		parallelism: Math.max(argon2.defaults.parallelism, ARGON2_MIN_PARALLELISM),
	}
	const hash = await argon2.hash(password, argon2_options);
	data[username] = hash;
	if(!verifyUser(username, password))
		throw("Something went wrong");
	fs.writeFileSync(PASSWD_FILE, JSON.stringify(data));
}


async function verifyUser(username, password) {
	const stored_hash = data[username]
	if(!stored_hash || !username)
		return false;
	if(!isValidName(username) || !isValidPassword(password))
		return false;
	const result = await argon2.verify(stored_hash, password)
	return result;
}

async function main()
{
	const args = process.argv.slice(2);
	if(args[0])
		addUser(args[0]);
}

main();
module.exports.verifyUser = verifyUser;
