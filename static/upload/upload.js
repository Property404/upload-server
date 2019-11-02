"use strict";
import {parseUrlParameters} from '/js/common.mjs'

const url_params = parseUrlParameters();

// Remove params in URL so when we refresh we don't get the message
window.history.replaceState({}, document.title, location.pathname);

if (url_params["success"])
{
	const note = document.getElementById("note");

	// Add message
	note.querySelector("#note-message").innerHTML = url_params["message"]

	// Change class depending on if successful or not
	let alert_class = note.getAttribute("class");
	if (url_params["success"] == "true")
	{
		alert_class += "alert-success";
		note.querySelector("#note-submessage").innerHTML =
			`Access your file <a href=${url_params["url"]}>here</a>`;
	}
	else
		alert_class += "alert-danger";
	note.setAttribute("class", alert_class);

	// Display
	note.removeAttribute("hidden");
}
