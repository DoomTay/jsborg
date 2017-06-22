function CWCTRLLoader(manager) {
	this.manager = (manager !== undefined) ? manager : THREE.DefaultLoadingManager;
}

CWCTRLLoader.prototype =
{
	constructor: CWCTRLLoader,

	load: function(url, onLoad, onProgress, onError)
	{
		var additionalData = {};
		additionalData.worldPositionX = 128;
		additionalData.worldPositionY = 128;
		additionalData.worldPositionZ = 10;
		additionalData.worldWidth = 256;
		additionalData.worldHeight = 256;
		additionalData.cellCount = 1;
		additionalData.cellWidth = 32;
		additionalData.cellHeight = 32;
		additionalData.frames = 1;
		additionalData.sides = 1;
		additionalData.defaultDuration = 66;
		additionalData.frameDurations = [66];
		
		
		var fileLoader = new THREE.FileLoader(this.manager);
		fileLoader.load(
		url,
		function(data) {				
			var dataBits = data.split("\r\n");
							
			var dataObject = {};
							
			if(dataBits[0] !== undefined && dataBits[0] !== "")
			{
				for(var i = 0; i < dataBits.length; i++)
				{
					if(dataBits[i] == "") continue;
					var lineParts = dataBits[i].split("\t");
					
					//For some reason, some .ctrl files will separate some data with spaces instead of tabs
					if(!lineParts[1])
					{
						lineParts = dataBits[i].split(" ");
						lineParts = [lineParts[0],lineParts[1],lineParts.slice(2,lineParts.length).join(" ")];
					}
					
					if(lineParts[1] == "VT_BOOL") dataObject[lineParts[0]] = lineParts[2] == "TRUE";
					else if(lineParts[1] == "VT_UI4" || lineParts[1] == "VT_I4" || lineParts[1] == "VT_R8") dataObject[lineParts[0]] = parseInt(lineParts[2]);
					else if(lineParts[1] == "VT_BSTR") dataObject[lineParts[0]] = lineParts[2];
					else console.warn("Unknown data type",lineParts[1],"in",url,"part of",lineParts);
				}
				
				additionalData.cellWidth = dataObject.CW_WIDTH || additionalData.cellWidth;
				additionalData.cellHeight = dataObject.CW_HEIGHT || additionalData.cellHeight;
				additionalData.worldWidth = dataObject.CW_WORLDWIDTH || dataObject.CW_WIDTH || additionalData.worldWidth;
				additionalData.worldHeight = dataObject.CW_WORLDHEIGHT || dataObject.CW_HEIGHT || additionalData.worldHeight;
				additionalData.worldPositionX = 128 + dataObject.CW_XPOSINTILE;
				additionalData.worldPositionY = 128 + dataObject.CW_YPOSINTILE;
				additionalData.worldPositionZ = dataObject.CW_HEIGHTABOVEGROUND;
				additionalData.animateOnLoading = dataObject.CW_HEIGHTABOVEGROUND;
				additionalData.visibilityOnNorth = dataObject.CW_NORTHWALL;
				additionalData.visibilityOnSouth = dataObject.CW_SOUTHWALL;
				additionalData.visibilityOnWest = dataObject.CW_WESTWALL;
				additionalData.visibilityOnEast = dataObject.CW_EASTWALL;
				
			}
			
			console.log(url,additionalData.cellWidth, additionalData.cellHeight);
			
			var whitePixels = new Array(additionalData.cellWidth * additionalData.cellHeight * 4);
				
			whitePixels.fill(255);
													
			newTextureFromData(whitePixels);
		}, onProgress, onError);
		
		function createMaterial(newURL)
		{
			var spriteTex = new THREE.Texture();
			
			var image = new Image();
			image.onload = function()
			{
				spriteTex.image = image;
				spriteTex.needsUpdate = true;
				
				var material = new THREE.SpriteMaterial({map: spriteTex, alphaTest: 0.5});
				
				material.CWSData = additionalData;
				
				material.map.magFilter = THREE.NearestFilter;
				material.map.minFilter = THREE.NearestFilter;
				
				material.map.repeat.y = 1/additionalData.frameCount;
				material.map.offset.y = 0;
				
				if (onLoad !== undefined) onLoad(material);
			};
			image.src = newURL;
		}
		
		function newTextureFromData(data)
		{
			var dataTex = new THREE.DataTexture(Uint8Array.from(data),additionalData.cellWidth,additionalData.cellHeight * additionalData.cellCount,THREE.RGBAFormat, THREE.UnsignedByteType,THREE.UVMapping);
			dataTex.needsUpdate = true;
						
			var material = new THREE.SpriteMaterial({ map: dataTex, alphaTest: 0.5 });
				
			material.CWSData = additionalData;
			
			material.map.magFilter = THREE.NearestFilter;
			material.map.minFilter = THREE.NearestFilter;
			
			material.map.repeat.y = 1/additionalData.frameCount;
			material.map.offset.y = 0;
			
			if (onLoad !== undefined) onLoad(material);
		}
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