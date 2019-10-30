export function parseUrlParameters(){
	const query = window.location.search.substring(1);
	const pl     = /\+/g;  // Regex for replacing addition symbol with a space
	const search = /([^&=]+)=?([^&]*)/g;

	let decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); }
	let url_params = {};
	let match;

	while (match = search.exec(query))
	{
		url_params[decode(match[1])] = decode(match[2]);
	}
	return url_params;
}
