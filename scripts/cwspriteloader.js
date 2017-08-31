function CWSpriteLoader(manager) {
	this.manager = (manager !== undefined) ? manager : THREE.DefaultLoadingManager;
}

CWSpriteLoader.prototype =
{
	constructor: CWSpriteLoader,

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
		if(url.endsWith(".sprite"))
		{
			fileLoader.setResponseType('arraybuffer');
			fileLoader.load(
			url,
			function(data)
			{
				var dataView = new DataView(data);
				
				var fileType = "";
				
				if(dataView.buffer.byteLength < 3) return createBlankCanvas();
				
				var signature = getBytes(dataView.buffer,0,4);
				if(signature[0] == 0x89 && signature[1] == 0x50 && signature[2] == 0x4e && signature[3] == 0x47) fileType = "png";
				
				else if(signature[0] == 0xff && signature[1] == 0xd8) fileType = "jpeg";
				
				if(fileType == "png")
				{
					var offset = 8;
					while(offset < dataView.byteLength)
					{
						var byteCount = dataView.getUint32(offset);
						offset += 4;
						var chunkCode = bytesToString(getBytes(dataView.buffer,offset,4));
						offset += 4;
						if(chunkCode == "cxBX")
						{
							var startingPoint = offset;
							var marker = bytesToString(getBytes(dataView.buffer,offset,4));
							offset += 4;
							additionalData = Object.assign(additionalData,parseCWSData(dataView.buffer.slice(offset,offset + byteCount),marker.marker));
							offset += byteCount - 4;
						}
						else offset += byteCount;
						offset += 4;
					}
					
					var transparentSprite = document.createElement('canvas');
					transparentSprite.width = additionalData.cellWidth || additionalData.worldWidth;
					transparentSprite.height = additionalData.cellHeight * additionalData.cellCount || additionalData.worldHeight;
					var ctx = transparentSprite.getContext('2d');
					
					var blob = new Blob([ dataView.buffer ], { type: "image/png" });
					
					var imageTag = new Image();
					imageTag.src = window.URL.createObjectURL(blob);
					imageTag.onload = function() {
						ctx.drawImage(imageTag,0,0);
						var transparentColor = ctx.getImageData(0, 0, 1, 1).data;
						
						var imgData = ctx.getImageData(0,0,transparentSprite.width,transparentSprite.height);
						var data = imgData.data;
						
						for(var i = 0; i < data.length; i += 4)
						{
							if(data[i] == transparentColor[0] && data[i + 1] == transparentColor[1] && data[i + 2] == transparentColor[2]) data[i + 3] = 0;
						}
						
						newTextureFromData(data);
					};
				}
				else if(fileType == "jpeg")
				{
					offset = 2;
					while(offset < dataView.byteLength)
					{
						var byteID = dataView.getUint8(offset);
						offset++;
						var segmentType = dataView.getUint8(offset);
						if(segmentType == 0xd9) break;
						offset++;
						var byteCount = dataView.getUint16(offset);
						offset += 2;
						var segmentID = "";
						if(segmentType >= 0xe0 && segmentType <= 0xef) segmentID = "APP" + (segmentType - 0xe0);
						else segmentID = "0x" + segmentType.toString(16);
						//The SOS marker needs to be minded, or parsing tends to get messed up. However, it's irrelevant to the data we're after, so we're skipping over it
						if(segmentID == "0xda")
						{
							var componentCount = dataView.getUint8(offset++);
							offset += 2 * componentCount;
							
							while(!(dataView.getUint8(offset) == 0xff && dataView.getUint8(offset + 1) != 0x00))
							{
								offset++;
							}
						}
						else if(segmentID.includes("APP"))
						{							
							var newSegment = {};
							var subOffset = 0;
							
							newSegment.IDMark = bytesToString(getBytes(dataView.buffer,offset + subOffset,5));
							subOffset += 5;
							
							if(newSegment.IDMark.includes("CWS2") || newSegment.IDMark.includes("CWS3"))
							{
								subOffset -= 5;
								newSegment.IDMark = bytesToString(getBytes(dataView.buffer,offset + subOffset,4));
								subOffset += 4;
								additionalData = Object.assign(additionalData,parseCWSData(dataView.buffer.slice(offset + subOffset,offset + subOffset + byteCount - 2),newSegment.IDMark));
								subOffset += byteCount - 2 - 4;
							}
							else if(newSegment.IDMark.includes("CWMAH"))
							{
								subOffset -= 5;
								newSegment.IDMark = bytesToString(getBytes(dataView.buffer,offset + subOffset,8));
								subOffset += 8;
							}
							
							newSegment.remainder = getBytes(dataView.buffer,offset + subOffset,byteCount - 2 - subOffset);
							offset += subOffset + newSegment.remainder.length;
						}
						else offset += byteCount - 2;
					}
					
					var blob = new Blob([ dataView.buffer ], { type: "image/jpeg" });
					
					var transparentSprite = document.createElement('canvas');
					transparentSprite.width = additionalData.cellWidth || additionalData.worldWidth;
					transparentSprite.height = additionalData.cellHeight * additionalData.cellCount || additionalData.worldHeight;
					var ctx = transparentSprite.getContext('2d');
					
					var imageTag = new Image();
					imageTag.src = window.URL.createObjectURL(blob);
					imageTag.onload = function() {
						ctx.drawImage(imageTag,0,0);
						var transparentColor = ctx.getImageData(0, 0, 1, 1).data;
						
						var imgData = ctx.getImageData(0,0,transparentSprite.width,transparentSprite.height);
						var data = imgData.data;
						
						//Modify pixel data so that instances of the "transparent color" will actually be transparent. Since this is a JPEG, the result will be less than perfect; the real reference for transparency in JPEG sprites is stored in a different chunk elsewhere in the image. Unfornately, I have no idea how to read said chunk.
						for(var i = 0; i < data.length; i += 4)
						{
							if(data[i] == transparentColor[0] && data[i + 1] == transparentColor[1] && data[i + 2] == transparentColor[2]) data[i + 3] = 0;
						}
						
						newTextureFromData(data);
					};
				}
				else createBlankCanvas();
				
				function parseCWSData(chunk,marker)
				{
					var dataView = new DataView(chunk,0);
					
					var newSegment = {};
					var offset = 0;
					
					newSegment.unknownThings = [];
					newSegment.cellCount = dataView.getUint32(offset,true);
					offset += 4;
					newSegment.cellWidth = dataView.getUint32(offset,true);
					offset += 4;
					newSegment.cellHeight = dataView.getUint32(offset,true);
					offset += 4;
					newSegment.worldPositionZ = dataView.getUint32(offset,true);
					offset += 4;
					newSegment.worldPositionY = dataView.getUint32(offset,true);
					offset += 4;
					newSegment.worldPositionX = dataView.getUint32(offset,true);
					offset += 4;
					var otherSettings = dataView.getUint32(offset,true);
					newSegment.unknownThings.push((otherSettings >> 3) & 1);
					newSegment.multiSided = ((otherSettings >> 2) & 1) == 1;
					//Yes, 0 means it's enabled
					newSegment.enableMenuItem = ((otherSettings >> 1) & 1) == 0;
					newSegment.unknownThings.push((otherSettings >> 0) & 1);
					offset += 4;
					newSegment.animateOnLoading = dataView.getUint32(offset,true) == 1;
					offset += 4;
					newSegment.sides = dataView.getUint32(offset,true);
					offset += 4;
					newSegment.worldWidth = dataView.getUint32(offset,true);
					offset += 4;
					newSegment.worldHeight = dataView.getUint32(offset,true);
					offset += 4;
					newSegment.repeatCount = dataView.getUint32(offset,true);
					offset += 4;
					newSegment.frameCount = dataView.getUint32(offset,true);
					offset += 4;
					newSegment.defaultDuration = dataView.getUint32(offset,true);
					offset += 4;
					var visibility = dataView.getUint32(offset,true);
					newSegment.visibilityOnNorth = ((visibility >> 3) & 1) == 1;
					newSegment.visibilityOnSouth = ((visibility >> 2) & 1) == 1;
					newSegment.visibilityOnWest = ((visibility >> 1) & 1) == 1;
					newSegment.visibilityOnEast = ((visibility >> 0) & 1) == 1;
					offset += 4;
					newSegment.unknownThings.push(dataView.getUint32(offset,true));
					offset += 4;
					newSegment.frameDurations = [];
					for(var f = 0; f < newSegment.frameCount; f++)
					{
						newSegment.frameDurations[f] = dataView.getUint32(offset,true);
						offset += 4;
					}
					if(marker == "CWS3")
					{
						newSegment.distance = dataView.getUint32(offset += 4,true);
						newSegment.unknownThings.push(dataView.getUint32(offset,true));
						offset += 4;
						newSegment.unknownThings.push(dataView.getUint32(offset,true));
						offset += 4;
						newSegment.unknownThings.push(dataView.getUint32(offset,true));
						offset += 4;
						newSegment.unknownThings.push(dataView.getUint32(offset,true));
						offset += 4;
						newSegment.generalFrames = {}
						newSegment.generalFrames.from = dataView.getUint32(offset,true);
						offset += 4;
						newSegment.generalFrames.to = dataView.getUint32(offset,true);
						offset += 4;
						newSegment.generalFrames.repeat = dataView.getUint32(offset,true);
						offset += 4;
						newSegment.generalFrames.end = dataView.getInt32(offset,true);
						offset += 4;
						newSegment.unknownThings.push(dataView.getUint32(offset,true));
						offset += 4;
						newSegment.mouseOver = {}
						newSegment.mouseOver.enabled = dataView.getUint32(offset,true) == 1;
						offset += 4;
						newSegment.mouseOver.from = dataView.getUint32(offset,true);
						offset += 4;
						newSegment.mouseOver.to = dataView.getUint32(offset,true);
						offset += 4;
						newSegment.mouseOver.repeat = dataView.getUint32(offset,true);
						offset += 4;
						newSegment.mouseOver.end = dataView.getInt32(offset,true);
						offset += 4;
						var revertOptions = dataView.getUint32(offset,true);
						newSegment.mouseOver.revertOnStop = ((revertOptions >> 1) & 1) == 1;
						newSegment.mouseOver.revertOnExit = ((revertOptions >> 0) & 1) == 1;
						offset += 4;
						newSegment.mouseClick = {}
						newSegment.mouseClick.enabled = dataView.getUint32(offset,true) == 1;
						offset += 4;
						newSegment.mouseClick.from = dataView.getUint32(offset,true);
						offset += 4;
						newSegment.mouseClick.to = dataView.getUint32(offset,true);
						offset += 4;
						newSegment.mouseClick.repeat = dataView.getUint32(offset,true);
						offset += 4;
						newSegment.mouseClick.end = dataView.getInt32(offset,true);
						offset += 4;
						var revertOptions = dataView.getUint32(offset,true);
						newSegment.mouseClick.revertOnStop = ((revertOptions >> 1) & 1) == 1;
						newSegment.mouseClick.revertOnExit = ((revertOptions >> 0) & 1) == 1;
						offset += 4;
						newSegment.proximity = {};
						newSegment.proximity.enabled = dataView.getUint32(offset,true) == 1;
						offset += 4;
						newSegment.proximity.from = dataView.getUint32(offset,true);
						offset += 4;
						newSegment.proximity.to = dataView.getUint32(offset,true);
						offset += 4;
						newSegment.proximity.repeat = dataView.getUint32(offset,true);
						offset += 4;
						newSegment.proximity.end = dataView.getInt32(offset,true);
						offset += 4;
						var revertOptions = dataView.getUint32(offset,true);
						newSegment.proximity.revertOnStop = ((revertOptions >> 1) & 1) == 1;
						newSegment.proximity.revertOnExit = ((revertOptions >> 0) & 1) == 1;
						offset += 4;
					}
					return newSegment;
				}
				
				function getBytes(buffer,offset,length)
				{
					var bytes = new Uint8Array(buffer,offset,length);
					return bytes;
				}
				
				function createBlankCanvas()
				{
					var whitePixels = new Array(additionalData.cellWidth * additionalData.cellHeight * additionalData.cellCount * 4);
					
					whitePixels.fill(255);
															
					newTextureFromData(whitePixels);
				}
			}, onProgress, onError);
		}
		else if(url.endsWith(".ctrl"))
		{
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
		}
		else
		{
			console.warn("Unknown file type:",url);
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