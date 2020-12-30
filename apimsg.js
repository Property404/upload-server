function apimsg(data)
{
	const obj = {};
	if(data != null)
	{
		if(typeof data == "string")
			obj.message = data;
		else if(typeof data == "object")
			Object.assign(obj, data);
		else
			obj.data = data;
	}
	return obj;
}
module.exports = apimsg;
