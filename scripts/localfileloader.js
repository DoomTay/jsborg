function localFileLoader(manager)
{
	this.manager = (manager !== undefined) ? manager : THREE.DefaultLoadingManager;
}

localFileLoader.prototype =
{
	constructor: localFileLoader,

	load: function(url, onLoad, onProgress, onError)
	{
		var file = files.find(file => file.webkitRelativePath.includes(url));
		
		if(file)
		{		
			var path = file.webkitRelativePath.substring(file.webkitRelativePath.indexOf("/") + 1).toLowerCase();
			
			var pathURL = URL.createObjectURL(file);
			
			if(path.endsWith(".emb") || path.endsWith(".nav") || path.endsWith(".html"))
			{
				onLoad(URL.createObjectURL(file));
			}
			else if(path.endsWith(".flr") || path.endsWith(".cei") || path.endsWith(".wal") || path.endsWith(".bck"))
			{
				new THREE.TextureLoader().load(
					pathURL,
					function(texture)
					{
						texture.magFilter = THREE.NearestFilter;
						texture.minFilter = THREE.NearestFilter;
						onLoad(texture);
					},onProgress, onError);
			}
			else if(path.endsWith(".sprite"))
			{
				var fileLoader = new CWSpriteLoader(this.manager);
				fileLoader.load(pathURL,onLoad, onProgress, onError);
			}
			else if(path.endsWith(".wav"))
			{
				var audioLoader = new THREE.AudioLoader(this.manager);
				audioLoader.load(pathURL,onLoad, onProgress, onError);
			}
			else if(path.endsWith(".ctrl"))
			{
				var fileLoader = new CWCTRLLoader(this.manager);
				fileLoader.load(pathURL,onLoad, onProgress, onError);
			}
			else if(path.endsWith(".url"))
			{
				var fileLoader = new THREE.FileLoader(this.manager);
				fileLoader.load(pathURL,function(data)
				{
					var path = data.match(/URL=(\S+)/)[1];
					path = path.substring(path.indexOf("../") + 3);
					
					var newFile = files.find(file => file.webkitRelativePath.includes(path));
					
					if(newFile) onLoad(URL.createObjectURL(newFile));
					else if(onError) onError(path + " not found");
				}, onProgress, onError);
			}
			else
			{
				console.warn("Unknown file type with",path);
			}
		}
		else if(onError) onError("File not found");
	},

	setCrossOrigin: function(value)
	{
		this.crossOrigin = value;
		return this;
	},

	setWithCredentials: function(value) {
		this.withCredentials = value;
		return this;
	},

	setPath: function(value) {
		this.path = value;
		return this;
	}
};