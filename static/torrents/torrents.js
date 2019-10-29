"use strict";
function get_request(url, callback)
{
	const xmlhttp=new XMLHttpRequest();
	xmlhttp.open("GET", url, true);
	xmlhttp.onreadystatechange = function()
	{
		if (xmlhttp.readyState == 4)
		{
			 if(xmlhttp.status == 200)
				callback(null, xmlhttp.responseText);
			else
				callback(Error("Status "+xmlhttp.status));
		}
	}
	xmlhttp.send();
}

function post_request(url, parameters, callback)
{
	const xmlhttp=new XMLHttpRequest();
	xmlhttp.open("POST", url, true);
	xmlhttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
	xmlhttp.onreadystatechange = function()
	{
		if (xmlhttp.readyState == 4)
		{
			 if(xmlhttp.status == 200)
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
	let row = document.getElementById(torrent.infoHash);
	if(torrent == null || torrent.infoHash == null)
		return;
	// If doesn't exist, create by cloning tempalate
	if(row == null)
	{
		row = document.getElementById("row_template").cloneNode(true);
		row.setAttribute("id", torrent.infoHash);
		row.removeAttribute("hidden");
		document.getElementById("rows").appendChild(row);
		console.log("Adding!")
		console.log(row);
	}

	const dirpath = "https://"+window.location.hostname+"/"+torrent.path+"/"+torrent.name;

	row.querySelector("#name").innerHTML = torrent.name;
	row.querySelector("#progress").innerHTML = Math.floor(torrent.progress*100);
	row.querySelector("#downloaded").innerHTML = Math.round(torrent.downloaded/(1024**2));
	row.querySelector("#uploaded").innerHTML = Math.round(torrent.uploaded/(1024**2));
	row.querySelector("#link").setAttribute("href", dirpath);

}

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

		setTimeout(update_all_torrents, 100);

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
