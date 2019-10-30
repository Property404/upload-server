"use strict";
import {httpGetRequest, httpPostRequest} from '/js/common.js'

const TORRENT_PROGRESS_POLL_PERIOD = 100; // in milliseconds
const KIBIBYTE = 1024;
const MEBIBYTE = KIBIBYTE**2;

function addTorrent(url, callback)
{
	httpPostRequest("/api/torrent/add", "url="+url, callback);
}

function updateTorrent(torrent)
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
function updateAllTorrents()
{
	httpGetRequest("/api/torrent/progress", function(err, result){
		if(err){
			console.log(err);
		}
		else
		{
			const torrents = JSON.parse(result);

			for(const torrent of torrents)
			{
				updateTorrent(torrent);
			}
		}

		setTimeout(updateAllTorrents, TORRENT_PROGRESS_POLL_PERIOD);

	});
}

updateAllTorrents();

// Submit link to be added to torrent list on server
document.getElementById("add_torrent_button").onclick = function(){
	console.log("adding");
	addTorrent(document.getElementById("magnet_link").value, function(err, result){
		if(err)console.log(err);
		console.log(result);
	});
};

// Autofocus input in modal
// "Due to how HTML5 defines its semantics, the autofocus HTML attribute has no
// effect in Bootstrap modals" - Bootstrap documentation
$('#add_torrent_modal').on("shown.bs.modal", function(){
	$('#magnet_link').trigger("focus");
});
