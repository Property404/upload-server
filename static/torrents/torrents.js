"use strict";
const TORRENT_PROGRESS_POLL_PERIOD = 100; // in milliseconds
const HTTP_STATUS_OK = 200;
const KIBIBYTE = 1024;
const MEBIBYTE = KIBIBYTE**2;

function get_request(url, callback)
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

function post_request(url, parameters, callback)
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

function add_torrent(url, callback)
{
	post_request("/api/torrent/add", "url="+url, callback);
}

function update_torrent(torrent)
{
	if(torrent == null || torrent.infoHash == null)
		return;

	let row = document.getElementById(torrent.infoHash);

	// If doesn't exist, create by cloning tempalate
	if(row == null)
	{
		const dirpath = "/"+torrent.path+"/"+torrent.name;

		// Create torrent entry
		row = document.getElementById("row_template").cloneNode(true);
		row.setAttribute("id", torrent.infoHash);
		
		// Set torrent attributes that *don't change* 
		row.querySelector("#name").innerHTML = torrent.name;
		row.querySelector("#link").setAttribute("href", dirpath);

		// Append to main div
		row.removeAttribute("hidden");
		document.getElementById("rows").appendChild(row);

		console.log("Adding!")
		console.log(row);
	}


	// Dynamic properties of the torrent
	row.querySelector("#progress").innerHTML = Math.floor(torrent.progress*1000)/10;
	row.querySelector("#downloaded").innerHTML = Math.round(torrent.downloaded/MEBIBYTE);
	row.querySelector("#uploaded").innerHTML = Math.round(torrent.uploaded/MEBIBYTE);

}

// Update list of torrents on screen every TORRENT_PROGRESS_POLL_PERIOD milliseconds
function update_all_torrents()
{
	get_request("/api/torrent/progress", function(err, result){
		if(err){
			console.log(err);
		}
		else
		{
			const torrents = JSON.parse(result);

			for(const torrent of torrents)
			{
				update_torrent(torrent);
			}
		}

		setTimeout(update_all_torrents, TORRENT_PROGRESS_POLL_PERIOD);

	});
}

update_all_torrents();

document.getElementById("add_torrent").onclick = function(){
	console.log("adding");
	add_torrent(document.getElementById("magnet_link").value, function(err, result){
		if(err)console.log(err);
		console.log(result);
	});
};
