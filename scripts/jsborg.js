var loader = new THREE.TextureLoader();
var fileLoader = new localFileLoader();
var audioLoader = new THREE.AudioLoader();
var SCALE = 256;
var triggers = [];
var walls = [];

function parseBorg(code)
{
	var newBorg = {};
	newBorg.height = parseInt(code.getElementsByTagName("gen")[0].getAttribute("HT"),16);
	newBorg.initialSpeed = parseInt(code.getElementsByTagName("gen")[0].getAttribute("SP"),16);
	newBorg.MFG = parseInt(code.getElementsByTagName("gen")[0].getAttribute("MFG"),16);
	
	var wallGrid = parseCoords(code.getElementsByTagName("map")[0].getElementsByTagName("wal")[0].textContent);
	var heightGrid = parseCoords(code.getElementsByTagName("map")[0].getElementsByTagName("hgt")[0].textContent);
	var floorGrid = parseCoords(code.getElementsByTagName("map")[0].getElementsByTagName("flr")[0].textContent);
	var ceilingGrid = parseCoords(code.getElementsByTagName("map")[0].getElementsByTagName("cei")[0].textContent);
	var objectGrid = parseCoords(code.getElementsByTagName("map")[0].getElementsByTagName("obj")[0].textContent);
	var gtwGrid = parseCoords(code.getElementsByTagName("map")[0].getElementsByTagName("gtw")[0].textContent);
	var gtw2Grid = parseCoords(code.getElementsByTagName("map")[0].getElementsByTagName("gtw2")[0].textContent);
	var soundGrid = parseCoords(code.getElementsByTagName("map")[0].getElementsByTagName("wav")[0].textContent);
	var midiGrid = parseCoords(code.getElementsByTagName("map")[0].getElementsByTagName("mid")[0].textContent);
	
	newBorg.spriteRefs = code.getElementsByTagName("ext")[0].getElementsByTagName("spr")[0] ? Array.from(code.getElementsByTagName("ext")[0].getElementsByTagName("spr")[0].getElementsByTagName("file"),sprite => sprite.getAttribute("HREF")) : [];
	newBorg.nav = code.getElementsByTagName("ext")[0].getElementsByTagName("nav")[0].getElementsByTagName("file")[0].getAttribute("HREF");
	newBorg.emb = code.getElementsByTagName("ext")[0].getElementsByTagName("emb")[0].getElementsByTagName("file")[0].getAttribute("HREF");
	
	newBorg.defaultPage = code.getElementsByTagName("ext")[0].getElementsByTagName("gtw3")[0] ? code.getElementsByTagName("ext")[0].getElementsByTagName("gtw3")[0].getElementsByTagName("file")[0].getAttribute("HREF") : null;
	newBorg.gtw = code.getElementsByTagName("ext")[0].getElementsByTagName("gtw")[0] ? Array.from(code.getElementsByTagName("ext")[0].getElementsByTagName("gtw")[0].getElementsByTagName("file"),sprite => sprite.getAttribute("HREF")) : null;
	newBorg.gtw2 = code.getElementsByTagName("ext")[0].getElementsByTagName("gtw2")[0] ? Array.from(code.getElementsByTagName("ext")[0].getElementsByTagName("gtw2")[0].getElementsByTagName("file"),sprite => sprite.getAttribute("HREF")) : null;
	
	var wallNode = code.getElementsByTagName("ext")[0].getElementsByTagName("wal")[0] ? code.getElementsByTagName("ext")[0].getElementsByTagName("wal")[0].getElementsByTagName("cfil")[0] : null;
	newBorg.wall = wallNode ? {graphic: wallNode.getAttribute("HREF"), offsets: wallNode.textContent.trim().split(" ").map(num => parseInt(num,16))} : null;
	
	var floorNode = code.getElementsByTagName("ext")[0].getElementsByTagName("flr")[0] ? code.getElementsByTagName("ext")[0].getElementsByTagName("flr")[0].getElementsByTagName("cfil")[0] : null;
	newBorg.floor = floorNode ? {graphic: floorNode.getAttribute("HREF"), length: floorNode.textContent.trim().split(" ").length} : null;
	
	var ceilingNode = code.getElementsByTagName("ext")[0].getElementsByTagName("cei")[0] ? code.getElementsByTagName("ext")[0].getElementsByTagName("cei")[0].getElementsByTagName("cfil")[0] : null;
	newBorg.ceiling = ceilingNode ? {graphic: ceilingNode.getAttribute("HREF"), length: ceilingNode.textContent.trim().split(" ").length} : null;
	
	newBorg.soundRefs = code.getElementsByTagName("ext")[0].getElementsByTagName("wav")[0] ? Array.from(code.getElementsByTagName("ext")[0].getElementsByTagName("wav")[0].getElementsByTagName("file"),sound => sound.getAttribute("HREF")) : [];
	
	newBorg.tour = code.getElementsByTagName("ext")[0].getElementsByTagName("tur")[0] ? code.getElementsByTagName("ext")[0].getElementsByTagName("tur")[0].getElementsByTagName("file")[0].getAttribute("HREF") : null;
	
	newBorg.musicRefs = code.getElementsByTagName("ext")[0].getElementsByTagName("mid")[0] ? Array.from(code.getElementsByTagName("ext")[0].getElementsByTagName("mid")[0].getElementsByTagName("file"),music => music.getAttribute("HREF")) : [];
	
	newBorg.grid = [];
	
	for(var y = 0; y < 16; y++)
	{
		newBorg.grid[y] = [];
		for(var x = 0; x < 16; x++)
		{
			newBorg.grid[y][x] = {};
			//Floor coordinates seem to be arranged such that if it were mapped as it was, the result would be backwards and sideways.
			newBorg.grid[y][x]["FLOOR"] = floorGrid[15 - x][15 - y];
			//Ditto for ceilings
			newBorg.grid[y][x]["CEILING"] = ceilingGrid[15 - x][15 - y];
			newBorg.grid[y][x]["SPRITE"] = objectGrid[y][x];
			newBorg.grid[y][x]["NOWALK"] = wallGrid[y][x];
			newBorg.grid[y][x]["WALL"] = heightGrid[y][x];
			newBorg.grid[y][x]["GTW"] = gtwGrid[y][x];
			newBorg.grid[y][x]["GTW2"] = gtw2Grid[y][x];
			newBorg.grid[y][x]["SOUND"] = soundGrid[y][x];
			newBorg.grid[y][x]["MIDI"] = midiGrid[y][x];
		}
	}
	
	var bdp = code.getElementsByTagName("bdp")[0];
	newBorg.bgColor = bdp.getAttribute("BC");
	newBorg.bgGraphic = bdp.getElementsByTagName("file")[0] ? bdp.getElementsByTagName("file")[0].getAttribute("HREF") : null;
	newBorg.bgHeight = -(~~parseInt(bdp.getAttribute("POS"),16));
	
	console.log(newBorg);
	
	return newBorg;
}

function parseCoords(set)
{
	var array = set.trim().split(" ");
	
	var coordset = [];
	
	var i = 0;
	
	var y = 15
	coordset[y] = [];
	var x = 0;
	
	
	for(var i = 0; i < array.length; i++)
	{
		var numRef = parseInt(array[i].substring(array[i].length - 2),16);
		var repeat = parseInt(array[i].substring(0,array[i].length - 2),16);
		
		for(var o = 0; o < repeat; o++)
		{
			coordset[y][x] = numRef;
			x++;
			while(x > 15)
			{
				x -= 16;
				y--;
				coordset[y] = [];
			}
		}
	}
	
	return coordset;
}

function loadTexture(tex)
{
	return new Promise(function(resolve,reject)
	{
		fileLoader.load(
			tex,
			function(texture)
			{
				texture.magFilter = THREE.NearestFilter;
				texture.minFilter = THREE.NearestFilter;
				resolve(texture);
			},
			function(xhr)
			{
				console.log((xhr.loaded / xhr.total * 100) + '% loaded');
			},
			function(xhr)
			{
				reject(tex + " could not be loaded");
			}
		);
	});
}

function bytesToString(stringBytes)
{
	var string = "";
	for (var i = 0; i < stringBytes.length; i++)
	{
		string += String.fromCharCode(stringBytes[i]);
	}
	return string;
}

function makeSpriteMaterial(spritePath)
{
	return new Promise(function(resolve,reject)
	{
		//Digging the sprite graphic for important things like size and frame count
		fileLoader.load(spritePath,
		resolve,
		function(xhr)
		{
			console.log(spritePath,(xhr.loaded / xhr.total * 100) + '% loaded');
		},
		function(xhr)
		{
			console.warn(spritePath,"cannot be loaded");
			
			var additionalData = {};
			additionalData.worldPositionX = 128;
			additionalData.worldPositionY = 128;
			additionalData.worldPositionZ = 10;
			additionalData.cellWidth = 32;
			additionalData.cellHeight = 32;
			additionalData.worldWidth = 32;
			additionalData.worldHeight = 32;
			additionalData.frames = 1;
			additionalData.sides = 1;
			additionalData.defaultDuration = 66;
			additionalData.frameDurations = [66];
			
			var material = new THREE.SpriteMaterial({ color:"#FFFFFF" });
			material.CWSData = additionalData;
			resolve(material);
		})
	});
}

function FloorTile(material)
{
	this.geometry = new THREE.PlaneGeometry(SCALE, SCALE);
	this.material = material;
	
	THREE.Mesh.call(this, this.geometry, this.material);
	this.type = "FloorTile";
	this.rotateX(-Math.PI / 2);
}

FloorTile.prototype = Object.create(THREE.Mesh.prototype);
FloorTile.prototype.constructor = FloorTile;

function WallBlock(material,height)
{
	var wallPlane = new THREE.PlaneGeometry(height, SCALE);
	THREE.Group.call(this);
	this.type = "WallBlock";
	
	var newMaterial = material.clone();
	this.material = newMaterial;
	if(newMaterial.map)
	{
		newMaterial.map = material.map.clone();
		newMaterial.map.needsUpdate = true;
		
		newMaterial.map.repeat.x = height/1024;
	}
		
	var nMesh = new THREE.Mesh(wallPlane, newMaterial);
	nMesh.position.z = SCALE * -0.5;
	nMesh.position.y = height / 2;
	nMesh.rotateZ(-Math.PI / 2);
	nMesh.rotateY(Math.PI);
	this.add(nMesh);
	
	var wMesh = new THREE.Mesh(wallPlane, newMaterial);
	wMesh.position.x = SCALE * -0.5;
	wMesh.position.y = height / 2;
	wMesh.rotateX(-Math.PI / 2);
	wMesh.rotateY(Math.PI * -0.5);
	this.add(wMesh);
	
	var eMesh = new THREE.Mesh(wallPlane, newMaterial);
	eMesh.position.x = SCALE * 0.5;
	eMesh.position.y = height / 2;
	eMesh.rotateX(Math.PI / 2);
	eMesh.rotateY(Math.PI * 0.5);
	this.add(eMesh);
	
	var sMesh = new THREE.Mesh(wallPlane, newMaterial);
	sMesh.position.z = SCALE * 0.5;
	sMesh.position.y = height / 2;
	sMesh.rotateZ(Math.PI / 2);
	this.add(sMesh);
}

WallBlock.prototype = Object.create(THREE.Group.prototype);
WallBlock.prototype.constructor = WallBlock;

function PlayerTrigger(triggerClass,onEnter,onLeave)
{
	this.geometry = new THREE.PlaneGeometry(SCALE, SCALE);
	
	THREE.Mesh.call(this, this.geometry, new THREE.MeshBasicMaterial({visible:false}));
	this.type = "PlayerTrigger";
	this.rotateX(-Math.PI / 2);
	triggers.push(this);
	this.triggered = false;
	this.triggerClass = triggerClass;
	
	var entireCluster = getAdjacentTriggers(this);
	
	this.updateAdjacencies = function()
	{
		//Triggers of matching class and touching each other will behave as a unit. If the player steps on one tile in the cluster, all of the others will be considered active as well, and the trigger's onLeave and onEnter functions will only fire once so long as the player remains in the cluster. Otherwise, the triggers' onEnter and onLeave functions will fire every time the player moves to a different tile.
		entireCluster = function(baseTrigger)
		{
			var adjacentTriggers = [];
			
			function getAllTouchingTriggers(original)
			{				
				var neighbors = getAdjacentTriggers(original);
				for(var n = 0; n < neighbors.length; n++)
				{
					if(adjacentTriggers.includes(neighbors[n])) continue;
					if(neighbors[n] == baseTrigger) continue;
					adjacentTriggers.push(neighbors[n]);
					getAllTouchingTriggers(neighbors[n])
					
				}
			}
			
			getAllTouchingTriggers(baseTrigger);
						
			return adjacentTriggers;
		}(this);
	}
	
	function setTriggeredForAll(baseTrigger,set)
	{
		baseTrigger.triggered = set;
		getAdjacentTriggers(baseTrigger).filter(trigger => trigger.triggered != set).map(trigger => setTriggeredForAll(trigger,set));
	}
	
	this.onEnter = function(collider)
	{
		if(!this.triggered)
		{
			onEnter.call(this,collider);
			this.triggered = true;
			setTriggeredForAll(this,true);
		}
	}
	
	this.checkCluster = function(callback)
	{
		callback(entireCluster);
	}
	
	
	this.onLeave = function(collider)
	{
		if(this.triggered)
		{
			if(onLeave) onLeave.call(this,collider);
			this.triggered = false;
			setTriggeredForAll(this,false);
		}
	};
	
	function getAdjacentTriggers(originalTrigger)
	{
		
		var originalTriggerX = originalTrigger.position.x;
		var originalTriggerY = originalTrigger.position.z;
		
		var adjacentTriggers = [];
		adjacentTriggers.push(triggers.find(trigger => trigger.position.x == originalTriggerX + SCALE && trigger.position.z == originalTriggerY && trigger.triggerClass == originalTrigger.triggerClass));
		adjacentTriggers.push(triggers.find(trigger => trigger.position.x == originalTriggerX - SCALE && trigger.position.z == originalTriggerY && trigger.triggerClass == originalTrigger.triggerClass));
		adjacentTriggers.push(triggers.find(trigger => trigger.position.z == originalTriggerY + SCALE && trigger.position.x == originalTriggerX && trigger.triggerClass == originalTrigger.triggerClass));
		adjacentTriggers.push(triggers.find(trigger => trigger.position.z == originalTriggerY - SCALE && trigger.position.x == originalTriggerX && trigger.triggerClass == originalTrigger.triggerClass));
		
		return adjacentTriggers.filter(trigger => trigger != undefined);
	}
}

PlayerTrigger.prototype = Object.create(THREE.Mesh.prototype);
PlayerTrigger.prototype.constructor = PlayerTrigger;

function generateMap(scene,borgData,textureData)
{
	var planeGeom = new THREE.PlaneGeometry(SCALE, SCALE);
	var wallGeom = new THREE.BoxGeometry(SCALE, borgData.height * 4, SCALE);
	var invisibleMaterial = new THREE.MeshBasicMaterial({visible:false});
	
	for(var y = -1; y < 17; y++)
	{
		for(var x = -1; x < 17; x++)
		{
			if((y == -1 || y == 16) || ((y > -1 && y < 16) && (x == -1 || x == 16)))
			{
				var wall = new THREE.Mesh(wallGeom, invisibleMaterial);
				wall.position.x = (SCALE * x);
				wall.position.z = (SCALE * y);
				wall.position.y = ((borgData.height * 4) / 2);
				scene.add(wall);
				walls.push(wall);
			}
		}
	}
	
	for(var y = 0; y < 16; y++)
	{
		for(var x = 0; x < 16; x++)
		{
			if(textureData.floors && borgData.grid[y][x]["FLOOR"] != 255)
			{
				var floorMaterial = textureData.floors[borgData.grid[y][x]["FLOOR"]];
				var plane = new FloorTile(floorMaterial);
				plane.position.x = SCALE * x;
				plane.position.z = SCALE * y;
				scene.add(plane);
			}
			if(textureData.ceilings && borgData.grid[y][x]["CEILING"] != 255)
			{
				ceilingMaterial = textureData.ceilings[borgData.grid[y][x]["CEILING"]];
				var plane = new THREE.Mesh(planeGeom, ceilingMaterial);
				plane.position.x = SCALE * x;
				plane.position.z = SCALE * y;
				plane.position.y = borg.height * 4;
				plane.rotateX(Math.PI / 2);
				plane.rotateZ(Math.PI);
				scene.add(plane);
			}
			if(borgData.grid[y][x]["SPRITE"])
			{
				var spriteMaterial = newMaterial(textureData.sprites[borgData.grid[y][x]["SPRITE"] - 1]);
				
				if(borgData.grid[y][x]["WALL"] == 0)
				{
					//There isn't a wall here, so this is just a regular old sprite
					var sprite = new THREE.Sprite(spriteMaterial);
					//By default, sprites will be placed in the middle of the tile, but sometimes a sprite will be configured to be offset
					sprite.position.x = (SCALE * x) - 128 + spriteMaterial.CWSData.worldPositionX;
					sprite.position.z = (SCALE * y) + 128 - spriteMaterial.CWSData.worldPositionY;
					sprite.scale.set(spriteMaterial.CWSData.worldWidth,spriteMaterial.CWSData.worldHeight,1);
					sprite.position.y += (sprite.scale.y / 2) + (spriteMaterial.CWSData.worldPositionZ);
				}
				
				else
				{
					//There's a wall here, so the "sprite" will be set up very differently. Here the sprite will be "projected" onto the wall. To make things easier, this will be its own group of meshes with its own material.
					var sprite = new THREE.Object3D();
					sprite.type = "SpriteOnWall";
					sprite.position.x = (SCALE * x);
					sprite.position.z = (SCALE * y);
					var spritePlane = new THREE.PlaneGeometry(SCALE, spriteMaterial.CWSData.cellHeight);
					
					var expandedTexture = document.createElement('canvas');
					expandedTexture.width = SCALE;
					expandedTexture.height = spriteMaterial.CWSData.cellHeight * spriteMaterial.CWSData.cellCount;
					var ctx = expandedTexture.getContext('2d');
					
					var leftOffset = Math.max((expandedTexture.width - spriteMaterial.CWSData.cellWidth) / 2,0);
					
					if(spriteMaterial.map.image)
					{
						if(spriteMaterial.map.image.data)
						{
							var imageData = ctx.createImageData(spriteMaterial.map.image.width, spriteMaterial.map.image.height);
							imageData.data.set(spriteMaterial.map.image.data);
							ctx.putImageData(imageData,leftOffset,0);
						}
						else ctx.drawImage(spriteMaterial.map.image,leftOffset,0);
					}
					else
					{
						ctx.fillStyle = "rgb(255,0,0)";
						ctx.fillRect(0, 0,expandedTexture.width,expandedTexture.height);
					}
					
					//console.log(borgData.spriteRefs[borgData.grid[y][x]["SPRITE"] - 1],spriteMaterial.map.image);
					
					//Using polygon offset in order to deal with Z-fighting
					var spritePlaneMaterial = new THREE.MeshBasicMaterial({
						map:loader.load(expandedTexture.toDataURL()),
						transparent:true,
						polygonOffset:true,
						polygonOffsetFactor:-2,
						polygonOffsetUnits:0.1
					});
					
					spritePlaneMaterial.CWSData = spriteMaterial.CWSData;
					spritePlaneMaterial.CWSData.multiSided = false;
					sprite.material = spritePlaneMaterial;
					
					if(spritePlaneMaterial.map)
					{
						spritePlaneMaterial.map.magFilter = THREE.NearestFilter;
						spritePlaneMaterial.map.minFilter = THREE.NearestFilter;
						spritePlaneMaterial.map.repeat.y = spriteMaterial.map.repeat.y;
					}
					
					if(spritePlaneMaterial.CWSData.visibilityOnNorth)
					{
						var nMesh = new THREE.Mesh(spritePlane, spritePlaneMaterial);
						nMesh.position.z = (SCALE * -0.5);
						nMesh.position.y = spritePlaneMaterial.CWSData.cellHeight / 2;
						nMesh.position.y += spritePlaneMaterial.CWSData.worldPositionZ - 1;
						nMesh.rotateY(Math.PI);
						sprite.add(nMesh);
					}
					
					if(spritePlaneMaterial.CWSData.visibilityOnWest)
					{
						var wMesh = new THREE.Mesh(spritePlane, spritePlaneMaterial);
						wMesh.position.x = SCALE * -0.5;
						wMesh.position.y = spritePlaneMaterial.CWSData.cellHeight / 2;
						wMesh.position.y += spritePlaneMaterial.CWSData.worldPositionZ - 1;
						wMesh.rotateY(Math.PI * -0.5);
						sprite.add(wMesh);
					}
					
					if(spritePlaneMaterial.CWSData.visibilityOnEast)
					{
						var eMesh = new THREE.Mesh(spritePlane, spritePlaneMaterial);
						eMesh.position.x = SCALE * 0.5;
						eMesh.position.y = spritePlaneMaterial.CWSData.cellHeight / 2;
						eMesh.position.y += spritePlaneMaterial.CWSData.worldPositionZ - 1;
						eMesh.rotateY(Math.PI * 0.5);
						sprite.add(eMesh);
					}
					
					if(spritePlaneMaterial.CWSData.visibilityOnSouth)
					{
						var sMesh = new THREE.Mesh(spritePlane, spritePlaneMaterial);
						sMesh.position.z = SCALE * 0.5;
						sMesh.position.y = spritePlaneMaterial.CWSData.cellHeight / 2;
						sMesh.position.y += spritePlaneMaterial.CWSData.worldPositionZ - 1;
						sprite.add(sMesh);
					}
				}
				
				if(sprite.material.map) sprite.material.map.offset.y = ((sprite.material.CWSData.cellCount - 1) / sprite.material.CWSData.cellCount);
				
				sprite.material.currentDisplayTime = 0;
				sprite.material.currentTile = 0;
								
				sprite.material.update = function(milliSec,direction)
				{
					if(this.CWSData.animateOnLoading)
					{
						this.currentDisplayTime += milliSec;
						while (this.currentDisplayTime > this.CWSData.frameDurations[this.currentTile])
						{
							this.currentDisplayTime -= this.CWSData.frameDurations[this.currentTile];
							this.currentTile++;
							if (this.currentTile == this.CWSData.frameCount)
								this.currentTile = 0;
							if(this.map) this.map.offset.y = (this.CWSData.frameCount - 1 - this.currentTile) / this.CWSData.frameCount;
						}
					}
					else if(this.CWSData.multiSided)
					{												
						var angleToIndex = Math.round((direction / 360) * this.CWSData.sides) % this.CWSData.sides;
												
						if(this.map) this.map.offset.y = (this.CWSData.sides - 1 - angleToIndex) / this.CWSData.sides;
					}
				};
				
				scene.add(sprite);
			}
			if(borgData.grid[y][x]["NOWALK"] > 0)
			{
				var wall = new THREE.Mesh(wallGeom, invisibleMaterial);
				wall.position.x = (SCALE * x);
				wall.position.z = (SCALE * y);
				wall.position.y = ((borgData.height * 4) / 2);
				scene.add(wall);
				walls.push(wall);
			}
			if(textureData.walls && borgData.grid[y][x]["WALL"] > 0)
			{
				var newBlock = new WallBlock(textureData.walls[borgData.grid[y][x]["NOWALK"] - 1],borgData.grid[y][x]["WALL"] * 4);
				newBlock.position.x = (SCALE * x);
				newBlock.position.z = (SCALE * y);
				scene.add(newBlock);
			}
			if(borgData.grid[y][x]["GTW"])
			{	
				var page = borgData.gtw[borgData.grid[y][x]["GTW"] - 1];
				
				var triggerBox = new PlayerTrigger(page,function() {changeGTW(this.page)});
				triggerBox.position.x = (SCALE * x);
				triggerBox.position.z = (SCALE * y);
				triggerBox.page = page;
				scene.add(triggerBox);
			}
			if(borgData.grid[y][x]["GTW2"])
			{
				var page = borgData.gtw2[borgData.grid[y][x]["GTW2"] - 1];
				var triggerBox = new PlayerTrigger(page,function() {changeGTW2(this.page2)},function() {changeGTW2(borgData.defaultPage)});
				triggerBox.position.x = (SCALE * x);
				triggerBox.position.z = (SCALE * y);
				triggerBox.page2 = page;
				scene.add(triggerBox);
			}
			if(textureData.sounds && borgData.grid[y][x]["SOUND"])
			{
				function getSoundChild(source)
				{
					return source.children.find(child => child.type == "Audio");
				}
				
				var soundRef = borgData.soundRefs[borgData.grid[y][x]["SOUND"] - 1];
				
				console.log(textureData.sounds);
				
				var triggerBox = new PlayerTrigger(soundRef,function()
				{
					getSoundChild(this).switchToAmbient();
				},function(collider)
				{
					var currentAudio = getSoundChild(this);
					currentAudio.switchToPositional();
					var currentTime = currentAudio.getTimecode();
					currentAudio.startTime = currentTime;
											
					this.checkCluster(cluster =>
					{
						cluster.map(otherTrigger =>
						{
							var otherSound = scene.children.find(child => child.position.x == otherTrigger.position.x && child.position.z == otherTrigger.position.z && child.children.some(grandchild => grandchild.type == "Audio"));
							if(otherSound)
							{
								getSoundChild(otherSound).startTime = currentTime;
								getSoundChild(otherSound).switchToPositional()
							}
						});
					});
				});
				triggerBox.soundRef = soundRef;
				triggerBox.position.x = SCALE * x;
				triggerBox.position.z = SCALE * y;
				scene.add(triggerBox);
				
				var soundObject = new THREE.PositionalAudio(listener);
								
				soundObject.setBuffer(textureData.sounds[borgData.grid[y][x]["SOUND"] - 1]);
				soundObject.setRefDistance(1);
				soundObject.setMaxDistance(SCALE * 1.5);
				soundObject.setLoop(true);
				soundObject.setRolloffFactor(0.6);
				soundObject.setDistanceModel("linear");
				soundObject.isAmbient = false;
				triggerBox.add(soundObject);
				
				soundObject.playSound = function()
				{
					this.play();
					this.beginningTime = this.context.currentTime - this.startTime;
				}
				
				soundObject.getTimecode = function()
				{
					if(this.beginningTime && this.source.buffer)
					{
						var endTime = this.context.currentTime;
						var elapsed = endTime - this.beginningTime;
						
						var duration = this.source.buffer.duration;
						
						while(elapsed > duration) elapsed -= duration;
						
						return elapsed;
					}
					else return 0;
				}
				
				soundObject.switchToAmbient = function()
				{
					this.disconnect();
					this.source.connect(this.source.context.destination);
					this.isAmbient = true;
				}
				
				soundObject.switchToPositional = function()
				{
					if(this.source != undefined && this.isAmbient)
					{
						this.source.disconnect(this.source.context.destination);
						this.connect();
					}
					this.isAmbient = false;
				}
				
			}
			if(borgData.grid[y][x]["MIDI"])
			{
				(function(music)
				{
					var triggerBox = new PlayerTrigger(music,function() {changeMusic(music)},function() {changeMusic(null)});
					triggerBox.position.x = (SCALE * x);
					triggerBox.position.z = (SCALE * y);
					scene.add(triggerBox);
				})(borgData.musicRefs[borgData.grid[y][x]["MIDI"] - 1]);
			}
			
			var possibleTrigger = scene.children.find(tile => tile.position.x == (SCALE * x) && tile.position.z == (SCALE * y) && (tile.page || tile.page2 || tile.soundRef));
			
			if(possibleTrigger)
			{
				var onClick;
				
				if(possibleTrigger.soundRef)
				{
					(function(selected)
					{
						var selectedSound = selected.children.find(child => child.type == "Audio");
						onClick = function()
						{
							playOmni(selectedSound.buffer);
						}
					})(possibleTrigger);
				}
				
				else if(possibleTrigger.page)
				{
					(function(selected)
					{
						onClick = function()
						{
							changeGTW(selected.page);
						}
					})(possibleTrigger);
				}
				
				else if(possibleTrigger.page2)
				{
					(function(selected)
					{
						onClick = function()
						{
							changeGTW2(selected.page2);
						}
					})(possibleTrigger);
				}
				
				
				var plane = new THREE.Mesh(planeGeom, invisibleMaterial);
				plane.position.x = SCALE * x;
				plane.position.z = SCALE * y;
				plane.rotateX(-Math.PI / 2);
				scene.add(plane);
				mouseTriggers.push(plane);
				plane.onClick = onClick;
				
				var possibleSprite = scene.children.find(tile => tile.position.x > (SCALE * (x - 0.5)) && tile.position.x < (SCALE * (x + 0.5)) && tile.position.z > (SCALE * (y - 0.5)) && tile.position.z < (SCALE * (y + 0.5)) && (tile.type == "Sprite" || tile.type == "SpriteOnWall"));
				var possibleWall = scene.children.find(tile => tile.position.x == (SCALE * x) && tile.position.z == (SCALE * y) && tile.type == "WallBlock");
								
				if(possibleSprite)
				{
					mouseTriggers.push(possibleSprite);
					possibleSprite.onClick = onClick;
				}
				if(possibleWall)
				{
					mouseTriggers.push(possibleWall);
					possibleWall.onClick = onClick;
				}
			}
		}
	}
	
	//Backup plan if the floor textures cannot be loaded
	if(!textureData.floors && borgData.floor != null && borgData.grid.some(gridY => gridY.some(gridX => gridX["FLOOR"] != 255)))
	{
		console.log(borgData.nav);
		var floorBackup = new THREE.Mesh(new THREE.PlaneGeometry(SCALE * 16, SCALE * 16), new THREE.MeshBasicMaterial({map:fileLoader.load("domains/" + borgData.nav)}));
		floorBackup.rotateX(-Math.PI / 2);
		floorBackup.position.x = SCALE * 8 - (SCALE / 2);
		floorBackup.position.z = SCALE * 8 - (SCALE / 2);
		floorBackup.material.map.magFilter = THREE.NearestFilter;
		scene.add(floorBackup);
	}
	
	//Now that sound sources are laid out, we can map out how the surrounding triggers will be laid out based on adjacent sound sources
	var i = 0;
	scene.children.filter(child => child.soundRef).map(function(sound)
	{
		var x = sound.position.x / SCALE;
		var y = sound.position.z / SCALE;
		
		var newClass = (function()
		{
			var string = "";
			for(var i = 0; i < 5; i++)
			{
				string += String.fromCharCode(Math.random() * 26 + 97);
			}
			return string;
		})()
		
		i++;
		var randomColor = Math.random() * 0xffffff;
				
		for(var a = -1; a < 2; a++)
		{
			for(var b = -1; b < 2; b++)
			{
				if(a == 0 && b == 0) continue;
				if(scene.children.some(child => child.soundRef && child.position.x == (SCALE * (x + a)) && child.position.z == (SCALE * y) && child != sound && child.soundRef == sound.soundRef)) continue;
				if(scene.children.some(child => child.soundRef && child.position.x == (SCALE * x) && child.position.z == (SCALE * (y + b)) && child != sound && child.soundRef == sound.soundRef)) continue;
				
				var soundObject = sound.children.find(child => child.type == "Audio");
				var triggerBox = new PlayerTrigger(newClass,function(collider) {if(!soundObject.isPlaying) soundObject.playSound();},function(collider)
				{						
					var distance = heightlessDistance(this.soundBox.position,collider.position);
					
					var closeSounds = (function(original)
					{
						return scene.children.filter(function(otherSound)
						{
							var soundDistance = heightlessDistance(otherSound.position,collider.position);
																
							return (soundDistance <= ((SCALE * 1.5) * Math.sqrt(2)) && distance <= (SCALE * 1) * Math.sqrt(2) && otherSound.soundRef == original.soundBox.soundRef && otherSound != this.soundBox);
						});
					})(this);
					
					var timecode = soundObject.getTimecode();
					
					closeSounds.map(getSoundChild).map(closeSound =>
					{
						closeSound.startTime = timecode;
					});
											
					if(distance > (SCALE * 0.5) * Math.sqrt(2))
					{
						soundObject.stop();
						var similarAudio = scene.children.filter(child => child.soundRef && child.soundRef == this.soundBox.soundRef && child != this.soundBox).map(getSoundChild);
						similarAudio.map(similar => {
							if(similar.isPlaying) similar.stop();
							else soundstartTime = 0;
						});
					}
					
					function getSoundChild(source)
					{
						return source.children.find(child => child.type == "Audio");
					}
					
					
				});
				triggerBox.position.x = (SCALE * (x + a));
				triggerBox.position.z = (SCALE * (y + b));
				triggerBox.soundBox = sound;
				scene.add(triggerBox);
			}
		}
		
		console.log(sound.children);
	})
	
	//All of the triggers are laid, so we're going to check for any adjacent triggers
	triggers.map(trigger => trigger.updateAdjacencies());
	
	function newMaterial(template)
	{
		var createdMaterial = template.clone();
		/*createdMaterial.map = template.map.clone();
		createdMaterial.map.needsUpdate = true;*/
		
		createdMaterial.CWSData = template.CWSData;
				
		return createdMaterial;
	}
}

function markLine(position,color)
{
	var material = new THREE.LineBasicMaterial({
		color: color
	});
	var geometry = new THREE.Geometry();
	geometry.vertices.push(
		new THREE.Vector3(0, 0, 0),
		new THREE.Vector3(0, 30, 0)
	);
	
	var line = new THREE.Line(geometry, material);
	line.position.x = position.x;
	line.position.z = position.z;
	scene.add(line);	
}

function loadAssets(borgData)
{
	var spriteMaterials = Array.from(borgData.spriteRefs, sprite => makeSpriteMaterial("objects/" + sprite));
		
	return Promise.all([new Promise(function(resolve,reject)
	{
		if(borgData.floor)
		{
			resolve(loadTexture("domains/" + borgData.floor.graphic).then(textureData => {
				textureData.repeat.y = 1/borgData.floor.length;
		
				var floorMaterials = [];
				for(var i = 0; i < borgData.floor.length; i++)
				{
					var tileTex = textureData.clone();
					tileTex.needsUpdate = true; 
					tileTex.offset.y = i/borgData.floor.length;
					var material = new THREE.MeshBasicMaterial({map: tileTex});
					floorMaterials.push(material);
				}
				
				var skyCanvas = document.createElement("canvas");
				skyCanvas.width = 256;
				skyCanvas.height = 256;
				skyCanvas.getContext('2d').drawImage(textureData.image, 0, 0);
				var pixelData = skyCanvas.getContext('2d').getImageData(0, 0, 1, 1).data;
				
				if(borgData.bgGraphic != null) borgData.skyColor = new THREE.Color(pixelData[0]/255,pixelData[1]/255,pixelData[2]/255);
				
				return {floors: floorMaterials}
			}, failure => 
			{
				console.error(failure);
				return {floors: null};
			}))
		}
		else resolve({floors: null});
	}),
	new Promise(function(resolve,reject)
	{
		if(borgData.ceiling)
		{
			resolve(loadTexture("domains/" + borgData.ceiling.graphic).then(textureData => {
				textureData.repeat.y = 1/borgData.ceiling.length;
				
				var ceilingMaterials = [];
				for(var i = 0; i < borgData.ceiling.length; i++)
				{
					var tileTex = textureData.clone();
					tileTex.needsUpdate = true; 
					tileTex.offset.y = i/borgData.ceiling.length;
					tileTex.wrapS = THREE.RepeatWrapping;
					tileTex.repeat.x = -1;
					var material = new THREE.MeshBasicMaterial({map: tileTex});
					ceilingMaterials.push(material);
				}
				return {ceilings: ceilingMaterials}
			}))
		}
		else resolve({ceilings: null});
	}),
	new Promise(function(resolve,reject)
	{
		if(borgData.wall)
		{
			resolve(loadTexture("domains/" + borgData.wall.graphic).then(textureData => {
				textureData.repeat.y = 1/(textureData.image.naturalHeight / 256);
								
				var wallMaterials = [];
				for(var i = 0; i < borgData.wall.offsets.length; i++)
				{
					var tileTex = textureData.clone();
					tileTex.needsUpdate = true; 
					
					var imgWidth = 1024;
					
					var startingPoint = borgData.wall.offsets[i];
										
					tileTex.offset.x = (startingPoint % imgWidth) / imgWidth;
					tileTex.offset.y = (Math.floor(startingPoint / imgWidth)) / textureData.image.naturalHeight;
										
					var material = new THREE.MeshBasicMaterial({map: tileTex});
					wallMaterials.push(material);
				}
				return {walls: wallMaterials}
			}, failure => 
			{
				console.error(failure);
				var wallMaterials = [];
				for(var i = 0; i < borgData.wall.offsets.length; i++)
				{
					var material = new THREE.MeshBasicMaterial({color:"red", wireframe:true});
					wallMaterials.push(material);
				}
				return {walls: wallMaterials};
			}));
		}
		else resolve({walls: null});
	}),
	new Promise(function(resolve,reject)
	{
		if(borgData.soundRefs)
		{
			Promise.all(Array.from(borgData.soundRefs,sound => new Promise(function(resolve)
			{
				fileLoader.load("media/" + sound, 
				function(data)
				{
					console.log(data);
					resolve(data);
				},
				function() { },
				function()
				{
					console.log("No sound");
					resolve(null);
				});
			}))).then(loadedSounds => resolve({sounds: loadedSounds}));
		}
		else resolve({sounds: null});
	}),
	Promise.all(spriteMaterials).then(loadedSprites => {
		borgData.spriteMaterials = loadedSprites;
		return {sprites: loadedSprites}
	},error => console.warn)]
	).then(dataObjects => {
		
		var consolidatedData = dataObjects.reduce(function(acc, x)
		{
			for (var key in x) acc[key] = x[key];
			return acc;
		}, {});
		
		return consolidatedData;
	})
}

function Vector3OnGround(vector)
{
	return new THREE.Vector3(vector.x,0,vector.z);
}

function heightlessDistance(vector1,vector2)
{
	return Vector3OnGround(vector1).distanceTo(Vector3OnGround(vector2));
}

function renderBorg(scene,borgData,bg)
{
	if(borgData.bgColor)
	{
		var colorRef = borgData.bgColor;
		while(colorRef.length < 6) colorRef = "0" + colorRef;
		var parsedColor = colorRef.match(/.{1,2}/g);
		
		borgData.skyColor = new THREE.Color(parseInt(parsedColor[2],16)/255,parseInt(parsedColor[1],16)/255,parseInt(parsedColor[0],16)/255);
	}
	triggers = [];
	mouseTriggers = [];
	walls = [];
	
	loadAssets(borgData).then(textureData =>
	{
		if(borgData.skyColor) bg.background = borgData.skyColor;
		generateMap(scene,borgData,textureData);
	});
}