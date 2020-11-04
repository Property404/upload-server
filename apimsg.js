function mergeObjects(obj, extra_data)
{
	if(extra_data != null)
	{
		if(typeof extra_data == "string")
			obj.message = extra_data;
		else if(typeof extra_data == "object")
			Object.assign(obj, extra_data);
		else
			obj.extra_data = extra_data;
	}
	//return JSON.stringify(obj);
	return obj;
}
function success(extra_data)
{
	return mergeObjects({ok:true}, extra_data);
}
function failure(extra_data)
{
	console.log("API_FAILURE: ", extra_data);
	return mergeObjects({error:true}, extra_data);
}

module.exports = {
	success,
	failure
}
