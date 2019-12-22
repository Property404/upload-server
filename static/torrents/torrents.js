"use strict";
import {httpGetRequestAsync, httpPostRequestAsync} from '/js/common.mjs'

const TORRENT_PROGRESS_POLL_PERIOD = 100; // in milliseconds
const KIBIBYTE = 1024;
const MEBIBYTE = KIBIBYTE**2;

function addTorrent(url)
{
	return httpPostRequestAsync("/api/torrent/add", {url: url});
}

function updateTorrent(torrent)
{
	if(torrent == null || torrent.infoHash == null)
		return;

	let row = document.getElementById(torrent.infoHash);

	// Set torrent attributes that *don't change* 
	// At least, not after they're ready
	let updateStaticProperties = function(){
		const dirpath = "/"+torrent.path+"/"+torrent.name;
		row.querySelector("#name").innerHTML = torrent.name.replace(/\.|_/g," ");
		row.querySelector("#link").setAttribute("href", dirpath);
	}

	// Dynamic properties of the torrent
	let updateDynamicProperties = function(){
		const progress_percentage = Math.floor(torrent.progress*1000)/10
		let progress_element = row.querySelector("#progress");
		progress_element.innerHTML = progress_percentage+"%";
		progress_element.setAttribute("area-valuenow", progress_percentage);
		progress_element.setAttribute("style", "width: "+progress_percentage+"%;");
		row.querySelector("#downloaded").innerHTML = Math.round(torrent.downloaded/MEBIBYTE);
		row.querySelector("#uploaded").innerHTML = Math.round(torrent.uploaded/MEBIBYTE);
	}

	// If doesn't exist, create by cloning template
	if(row == null)
	{
		// Create torrent entry
		row = document.getElementById("row_template").cloneNode(true);
		row.setAttribute("id", torrent.infoHash);

		// Set properties
		updateStaticProperties();

		// Delete torrent when "X" is clicked
		row.querySelector("#delete_torrent").onclick = function(e){
			const node = e.target.parentNode;
			// Hide to make it seem like it was remove immediately
			node.setAttribute("hidden", true);
			// Then actually delete it (asynchronous)
			deleteTorrent(node.id)
				.then((result)=>{console.log("Deleted torrent");})
				// If something bad happens, restore visibility
				.catch(()=>{node.removeAttribute("hidden");});
		}

		// Show extra information when "i" is clicked
		row.querySelector("#show_torrent_info").onclick = function(e){
			console.log(e);
			let element = e.target.parentNode.querySelector("#torrent_info");
			if(element.hasAttribute("hidden")){
				element.removeAttribute("hidden");
			}else{
				element.setAttribute("hidden", true);
			}
		}
		
		// Append to main div
		row.removeAttribute("hidden");
		document.getElementById("rows").appendChild(row);

		console.log("Adding!")
		console.log(row);
	}

	// If torrent isn't ready, continuously update static properties, because
	// they may not be set yet. Once the torrent is ready, we can stop this
	// nonsense
	if(!(row.ready))
		updateStaticProperties();

	updateDynamicProperties();

}

// Update list of torrents on screen every TORRENT_PROGRESS_POLL_PERIOD milliseconds
async function updateAllTorrents()
{
	const raw_torrent_data = await httpGetRequestAsync("/api/torrent/progress");
	const torrents = JSON.parse(raw_torrent_data);


	for(const torrent of torrents)
	{
		updateTorrent(torrent);
	}

	setTimeout(updateAllTorrents, TORRENT_PROGRESS_POLL_PERIOD);
}

async function deleteTorrent(hash)
{
	const raw_torrent_data = await httpGetRequestAsync("/api/torrent/progress");
	const torrents = JSON.parse(raw_torrent_data);

	for (const torrent of torrents)
	{
		if(torrent.infoHash == hash)
		{
			const result = await httpPostRequestAsync("/api/torrent/delete", {url:torrent.magnetURI, delete_files:true});
			document.getElementById("rows").removeChild(document.getElementById(hash));
			return result;
		}
	}

	throw Error("Can't find torrent with hash "+hash);
}

updateAllTorrents();


// Submit link to be added to torrent list on server
document.getElementById("add_torrent_button").onclick = function(){
	console.log("Adding torrent");
	addTorrent(document.getElementById("magnet_link").value)
		.then((result)=>console.log)
		.catch((err)=>console.log);
};


// Autofocus input in modal
// "Due to how HTML5 defines its semantics, the autofocus HTML attribute has no
// effect in Bootstrap modals" - Bootstrap documentation
$('#add_torrent_modal').on("shown.bs.modal", function(){
	$('#magnet_link').trigger("focus");
});
