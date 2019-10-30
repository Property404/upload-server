"use strict";
import {parseUrlParameters} from '/js/common.js'

const url_params = parseUrlParameters();

if (url_params["success"])
{
	const note = document.getElementById("note");

	// Change class depending on if successful or not
	let alert_class = note.getAttribute("class");
	if (url_params["success"] == "true")
		alert_class += "alert-success";
	else
		alert_class += "alert-danger";
	note.setAttribute("class", alert_class);

	// And show message
	note.querySelector("#note-message").innerHTML = url_params["message"]
	note.removeAttribute("hidden");

}
