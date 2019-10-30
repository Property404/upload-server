"use strict";
const HTTP_STATUS_OK = 200;

// Parse GET parameters in URL
// Returns a dict
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

// Send GET request to url
export function httpGetRequest(url, callback)
{
	const xmlhttp = new XMLHttpRequest();
	xmlhttp.open("GET", url, true);
	xmlhttp.onreadystatechange = function()
	{
		if (xmlhttp.readyState == 4)
		{
			 if(xmlhttp.status == HTTP_STATUS_OK)
				callback(null, xmlhttp.responseText);
			else
				callback(Error("Status "+xmlhttp.status));
		}
	}
	xmlhttp.send();
}

// Send POST request to url with specified parameters(as a dict)
export function httpPostRequest(url, parameters, callback)
{
	const xmlhttp = new XMLHttpRequest();
	xmlhttp.open("POST", url, true);
	xmlhttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
	xmlhttp.onreadystatechange = function()
	{
		if (xmlhttp.readyState == 4)
		{
			 if(xmlhttp.status == HTTP_STATUS_OK)
				callback(null, xmlhttp.responseText);
			else
				callback(Error("Status "+xmlhttp.status));
		}
	}
	xmlhttp.send(parameters);
}
