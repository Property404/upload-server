const node_constants = require('constants');
const PUBLIC_FOLDER = "./public/"
module.exports = {
	CONFIGURATION_FILE: "config.json",
	PUBLIC_FOLDER: PUBLIC_FOLDER,
	TORRENTS_FOLDER: PUBLIC_FOLDER+"dtorrents/",
	UPLOADS_FOLDER: PUBLIC_FOLDER+"uploads/",

	// Use TLS 1.2 and 1.3 only
	TLS_OPTIONS :
		node_constants.SSL_OP_NO_TLSv1 |
		node_constants.SSL_OP_NO_TLSv1_0|
		node_constants.SSL_OP_NO_TLSv1_1
};
