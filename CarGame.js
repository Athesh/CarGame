var context = null;
//Numerical representation of map blocks
var playArea = [	//Current map contains a 5x5 play area
	0, 0, 0, 0, 0, 0, 0,
	0, 1, 1, 1, 1, 1, 0,
	0, 1, 1, 1, 1, 1, 0,
	0, 1, 1, 1, 1, 1, 0,
	0, 1, 1, 1, 1, 1, 0,
	0, 1, 1, 1, 1, 1, 0,
	0, 0, 0, 0, 0, 0, 0
];
//When creating a new map, corretly update the following values
var areaWidth = 7, areaHeight = 7;	
var blockWidth = 40, blockHeight = 40;

//Frames Per Second counter
var presentSecond = 0;
var frameCounter = 0;
var framesPreviousSecond = 0;
var previousFrameTime = 0;

//Tileset options - change the file to load different textures
var tileset = null;
var texturesLoaded = false;
var texturesFile = "textures.png";

//Define different floor types - wall/road/???
var floorTypes = new Object();
floorTypes.wall = 0;
floorTypes.road = 1;

//Assign properties to floor types
var blockTypes = new Object();
blockTypes[0] = {
	floor:floorTypes.wall, texture:[{x:0,y:0,w:40,h:40}]
};
blockTypes[1] = {
	floor:floorTypes.road, texture:[{x:40,y:0,w:40,h:40}]
};

//Directions defined clock-wise
var controls = new Object();
controls.up = 0;
controls.right = 1;
controls.down = 2;
controls.left = 3;

//Keycodes for keyboard arrows
var keysDown = new Object();
keysDown[37] = false; 	//left arrow
keysDown[38] = false;	//up arrow
keysDown[39] = false;	//right arrow
keysDown[40] = false; 	//down arrow
//Alternative controls
keysDown[87] = false; 	//keycode for W
keysDown[68] = false;	//keycode for D
keysDown[83] = false;	//keycode for S
keysDown[65] = false; 	//keycode for A


var car = new Car();

//Definition of the car attributes on start
function Car(){
	this.fromPosition = [1,1];
	this.toPosition	= [2,3];
	
	this.carDimensions	= [30,30]; //texture size of the car in pixels
	this.actualPosition = [45,45]; //fine-tuned car positioning on a tile - inclusing horizontal and vertical difference
	this.movementDelay = 300; //car speed in miliseconds, less means faster

	this.direction	= controls.right;	//starting direction -> facing right
	this.textures = {};
	this.timeWhenMoved = 0; //in miliseconds

	//Car textures in certain directions
	this.textures[controls.up] = [{x:0,y:120,w:30,h:30}]; 	//Defines how car texture looks while moving UP
	this.textures[controls.right] = [{x:0,y:150,w:30,h:30}];	//Defines how car texture looks while moving RIGHT
	this.textures[controls.down] = [{x:0,y:180,w:30,h:30}];	//Defines how car texture looks while moving DOWN
	this.textures[controls.left] = [{x:0,y:210,w:30,h:30}];	//Defines how car texture looks while moving LEFT
}

//Using two arguments we specify where to send the car
Car.prototype.driveTo = function(x, y){
	this.fromPosition = [x,y];
	this.toPosition = [x,y];
	this.actualPosition	= [((blockWidth*x)+((blockWidth-this.carDimensions[0])/2)),
		((blockHeight*y)+((blockHeight-this.carDimensions[1])/2))];
};

//Each frame we calculate the correct position
Car.prototype.movementLogic = function(t){
	//Car is not moving and is able to recieve a new command
	if(this.fromPosition[0]==this.toPosition[0] && this.fromPosition[1]==this.toPosition[1]){
		return false;
	}

	if((t-this.timeWhenMoved)>=this.movementDelay){
		this.driveTo(this.toPosition[0], this.toPosition[1]);
	}
	else
	{
		this.actualPosition[0] = (this.fromPosition[0] * blockWidth) + ((blockWidth-this.carDimensions[0])/2);
		this.actualPosition[1] = (this.fromPosition[1] * blockHeight) + ((blockHeight-this.carDimensions[1])/2);

		if(this.toPosition[0] != this.fromPosition[0])
		{
			var difference = (blockWidth / this.movementDelay) * (t-this.timeWhenMoved);
			this.actualPosition[0]+= (this.toPosition[0]<this.fromPosition[0] ? 0 - difference : difference);
		}
		if(this.toPosition[1] != this.fromPosition[1])
		{
			var difference = (blockHeight / this.movementDelay) * (t-this.timeWhenMoved);
			this.actualPosition[1]+= (this.toPosition[1]<this.fromPosition[1] ? 0 - difference : difference);
		}

		this.actualPosition[0] = Math.round(this.actualPosition[0]);
		this.actualPosition[1] = Math.round(this.actualPosition[1]);
	}
	return true;
}

function createIndex(x, y){
	return((y * areaWidth) + x);
}

Car.prototype.ableToDriveTo = function(x, y)
{
	if(x < 0 || x >= areaWidth || y < 0 || y >= areaHeight) { return false; }
	if(blockTypes[playArea[createIndex(x,y)]].floor!=floorTypes.road) { return false; }
	return true;
};

Car.prototype.ableToDriveUp	= function(){
	return this.ableToDriveTo(this.fromPosition[0], this.fromPosition[1]-1); };
Car.prototype.ableToDriveDown = function(){
	return this.ableToDriveTo(this.fromPosition[0], this.fromPosition[1]+1); };
Car.prototype.ableToDriveLeft = function(){
	return this.ableToDriveTo(this.fromPosition[0]-1, this.fromPosition[1]); };
Car.prototype.ableToDriveRight = function(){
	return this.ableToDriveTo(this.fromPosition[0]+1, this.fromPosition[1]); };

Car.prototype.driveLeft = function(t){
	this.toPosition[0]-=1; this.timeWhenMoved = t; this.direction = controls.left; };
Car.prototype.driveRight = function(t){
	this.toPosition[0]+=1; this.timeWhenMoved = t; this.direction = controls.right; };
Car.prototype.driveUp = function(t){
	this.toPosition[1]-=1; this.timeWhenMoved = t; this.direction = controls.up; };
Car.prototype.driveDown	= function(t){
	this.toPosition[1]+=1; this.timeWhenMoved = t; this.direction = controls.down; };


window.onload = function(){
	context = document.getElementById('carGame').getContext("2d");
	requestAnimationFrame(createCanvas);
	context.font = "9pt consolas";

	//Event listener that listens to keydown and keyup on keycodes: 37,38,39,40,87,83,68,65 (Arrows and WASD)
	window.addEventListener("keyup", function(e) {
		if((e.keyCode>=37 && e.keyCode<=40) || (e.keyCode == 87 || e.keyCode == 83 || e.keyCode == 68 || e.keyCode == 65)){
			keysDown[e.keyCode] = false;
		}
	});
	window.addEventListener("keydown", function(e) {
		if((e.keyCode>=37 && e.keyCode<=40) || (e.keyCode == 87 || e.keyCode == 83 || e.keyCode == 68 || e.keyCode == 65)){
			keysDown[e.keyCode] = true; 
		}
	});

	//Texture pack processing, generates an error if game did not load properly (eg. missing texture file)
	tileset = new Image();
	tileset.onerror = function()
	{
		context = null;
		alert("Unable to load textures. Please, provide a texture file in form of 'textures.png' file. It must be located within the main folder.");
	};
	tileset.onload = function(){
		texturesLoaded = true;
	};
	tileset.src = texturesFile;
};

function createCanvas(){
	//Creating a timestamp in seconds (not miliseconds, thus /1000)
	var presentFrameTime = Date.now();
	var sec = Math.floor(Date.now()/1000);

	if(context==null){
		return;
	}

	if(!texturesLoaded){
		requestAnimationFrame(createCanvas);
		return;
	}

	if(sec!=presentSecond){
		presentSecond = sec;
		framesPreviousSecond = frameCounter;
		frameCounter = 1;
	}
	else {
		frameCounter++;
	}

	//Combining key press events and bool ableToDrive to process car movement abilites
	if(!car.movementLogic(presentFrameTime)){
		if((keysDown[87] || keysDown[38]) && car.ableToDriveUp()){
			car.driveUp(presentFrameTime);
		}
		else if((keysDown[83] || keysDown[40]) && car.ableToDriveDown()){
			car.driveDown(presentFrameTime);
		}
		else if((keysDown[65] || keysDown[37]) && car.ableToDriveLeft()){
			car.driveLeft(presentFrameTime);
		}
		else if((keysDown[68] || keysDown[39]) && car.ableToDriveRight()){
			car.driveRight(presentFrameTime);
		}
	}

	for(var y = 0; y < areaHeight; y++)
	{
		for(var x = 0; x < areaWidth; x++)
		{
			var block = blockTypes[playArea[createIndex(x,y)]];
			context.drawImage(tileset, block.texture[0].x, block.texture[0].y,
				block.texture[0].w, block.texture[0].h,(x*blockWidth), (y*blockHeight), blockWidth, blockHeight);
		}
	}

	var carTexture = car.textures[car.direction];
	context.drawImage(tileset,carTexture[0].x, carTexture[0].y, carTexture[0].w, carTexture[0].h,
		car.actualPosition[0], car.actualPosition[1], car.carDimensions[0], car.carDimensions[1]);

	context.fillStyle = "#ffffff";
	context.fillText("FPS Counter: " + framesPreviousSecond + " frames", 8, 270);

	previousFrameTime = presentFrameTime;
	requestAnimationFrame(createCanvas);
}