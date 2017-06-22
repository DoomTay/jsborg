function localFileLoader(manager)
{
	this.manager = (manager !== undefined) ? manager : THREE.DefaultLoadingManager;
}

localFileLoader.prototype =
{
	constructor: localFileLoader,

	load: function(url, onLoad, onProgress, onError)
	{
		var reader  = new FileReader();
		var file = files.find(file => file.webkitRelativePath.includes(url));
		
		if(file)
		{		
			var path = file.webkitRelativePath.substring(file.webkitRelativePath.indexOf("/") + 1).toLowerCase();
							
			reader.addEventListener("load", function(e)
			{
				if(path.endsWith(".flr") || path.endsWith(".cei") || path.endsWith(".wal") || path.endsWith(".bck"))
				{
					new THREE.TextureLoader().load(
						reader.result,
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
					fileLoader.load(reader.result,onLoad, onProgress, onError);
				}
				else if(path.endsWith(".wav"))
				{
					console.log(path);
					var audioLoader = new THREE.AudioLoader(this.manager);
					audioLoader.load(reader.result,onLoad, onProgress, onError);
				}
				else if(path.endsWith(".ctrl"))
				{
					var fileLoader = new CWCTRLLoader(this.manager);
					fileLoader.load(reader.result,onLoad, onProgress, onError);
				}
				else if(path.endsWith(".emb") || path.endsWith(".nav"))
				{
					onLoad(reader.result);
				}
				else if(path.endsWith(".url"))
				{
					var fileLoader = new THREE.FileLoader(this.manager);
					fileLoader.load(reader.result,function(data)
					{
						console.log(data);
						
						var path = data.match(/URL=(.+)/)[1];
						if(path.startsWith("file:")) path = path.substring(8);
						else path = path.substring(7);
						
						console.log(path);
						
						path = new URL(path,"C:/fakepath/domains/");
					}, onProgress, onError);
				}
				else
				{
					console.warn("Unknown file type with",path);
				}
			})
			
			reader.addEventListener("error", function(e)
			{
				console.warn("Could not load",path);
			});
			
			reader.addEventListener("progress", onProgress);
			
			reader.readAsDataURL(file);
		}
		else onError("File not found");
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