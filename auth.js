const argon2 = require("argon2")

const ARGON2_MIN_TIME_COST = 20;
const ARGON2_MIN_MEMORY_COST = 32*1024;//32MB
const ARGON2_MIN_PARALLELISM = 10;

const MIN_PASSWORD_LENGTH = 6;
const MAX_PASSWORD_LENGTH = 256;
const MIN_USERNAME_LENGTH = 2;
const MAX_USERNAME_LENGTH = 32;
const ALLOWED_USERNAME_CHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ _-0123456789";

function validateUsername(user)
{
	if(!user)
		return false;
	if(user.length < MIN_USERNAME_LENGTH || user.length > MAX_USERNAME_LENGTH)
	{
		return false;
	}
	for(const c of user)
	{
		if (!(ALLOWED_USERNAME_CHARS.includes(c)))
		{
			console.log("Invalid char: ",c);
			return false;
		}
	}
	return true;
}

function validatePassword(password)
{
	if(!password)
		return false;
	if(password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH)
		return false;
	return true;
}

// Add a user
async function hash(password) {
	if(!validatePassword(password))
		throw("Invalid password");

	const argon2_options = {
		type: argon2.argon2id,
		timeCost: Math.max(argon2.defaults.timeCost, ARGON2_MIN_TIME_COST),
		memoryCost: Math.max(argon2.defaults.memoryCost, ARGON2_MIN_MEMORY_COST),
		parallelism: Math.max(argon2.defaults.parallelism, ARGON2_MIN_PARALLELISM),
	}
	const digest = await argon2.hash(password, argon2_options);
	if(!verify(password, digest))
		throw("Something went wrong");
	return digest;
}


async function verify(password, stored_hash) {
	if(!stored_hash || !password)
		return false;
	if(!validatePassword(password))
		return false;
	return await argon2.verify(stored_hash, password);
}

module.exports = {
	verify:verify,
	hash:hash,
	validatePassword: validatePassword,
	validateUsername: validateUsername
}
