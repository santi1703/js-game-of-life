let canvas = document.getElementById("canvas");
let context = canvas.getContext("2d");
let mouseActive = false;
let currentCell = null;
let settingStatus = null;
let runningSpeed = 80;

class Field {
	canvas = canvas;
	context = context;
	height = this.canvas.clientHeight;
	width = this.canvas.clientWidth;
	cellSize = 8;
	cellColor = '#FF0066';
	running = false;

	constructor() {
		this.cellsWidth = Math.floor(this.width / this.cellSize);
		this.cellsHeight = Math.floor(this.height / this.cellSize);
		this.startCells();
	}

	startCells() {
		this.cells = {};
		for(let i = 0; i < this.cellsWidth; i++) {
			this.cells[i] = {};
			for(let j = 0; j < this.cellsHeight; j++) {
				this.cells[i][j] = new Cell(i, j, this);
			}
		}
		this.clean();
		this.draw();
	}

	clean() {
		context.fillStyle = '#FFFFFF';
		context.fillRect(0, 0, this.width, this.height);
	}

	draw() {
		context.fillStyle = this.cellColor;
		
		for(let i = 0; i < this.cellsWidth; i++) {
			for(let j = 0; j < this.cellsHeight; j++) {
				if(this.cells[i][j].active) {
					context.fillRect(i * this.cellSize, j * this.cellSize, this.cellSize, this.cellSize);
				}
			}
		}

		for(let i = 0; i <= this.cellsWidth; i++) {
			context.beginPath();
			context.moveTo(0, i * this.cellSize);
			context.lineTo(this.width, i * this.cellSize);
			context.stroke();
		}

		for(let i = 0; i <= this.cellsHeight; i++) {
			context.beginPath();
			context.moveTo(i * this.cellSize, 0);
			context.lineTo(i * this.cellSize, this.height);
			context.stroke();
		}
	}

	loadCells(cellsString) {
		for(let i = 0; i < cellsString.length; i += this.cellsWidth) {
			let rowString = cellsString.substr(i, this.cellsWidth);
			
			for(let j = 0; j < rowString.length; j++) {
				let cellActive = rowString[j];
				
				this.setCell(i/this.cellsWidth, j, cellActive == true);
			}
		}

		this.clean();
		this.draw();
		this.stop();
	}

	getCellsString() {
		let string = '';

		for(const rowNumber in this.cells) {
			for(const columnNumber in this.cells[rowNumber]) {
				string += this.cells[rowNumber][columnNumber].active?'1':'0';
			}
		}

		return string;
	}

	saveCells() {
		let fileName = 'cells.sav';

		let saveString = this.getCellsString();

		let saveValues = {width: canvas.width, height: canvas.height, cellSize: field.cellSize, data: saveString};

		let json = JSON.stringify(saveValues);

		let blob = new Blob([json], {type: 'text/json'});
		let file = new File([blob], fileName);
		let url = window.URL.createObjectURL(file);

		var a = document.createElement("a");
		document.body.appendChild(a);
		a.style = "display: none";
		a.href = url;
		a.download = fileName;
		a.click();
		window.URL.revokeObjectURL(file);
	}

	step() {
		let cellsToChange = [];

		for(let i = 0; i < this.cellsWidth; i++) {
			for(let j = 0; j < this.cellsHeight; j++) {
				let cell = this.cells[i][j];
				
				if( cell.shouldDie() || cell.shouldBirth()) {
					cellsToChange.push(cell);
				}
			}
		}

		cellsToChange.forEach(cell => cell.active = !cell.active);

		this.clean();
		this.draw();
	}

	setCell(x, y, status = null) {
		let cell = this.getCell(x, y);
		
		cell.active = status;
	}

	getCell(x, y) {
		return this.cells[x][y];
	}

	run() {
		this.running = true;
	}

	stop() {
		this.running = false;
	}
}

class Cell {
	constructor(x, y, field) {
		this.field = field;
		this.x = x;
		this.y = y;
		this.cellSize = this.field.cellSize;
		this.active = false;
	}

	getSurroundingCellsCount() {
		let count = 0;

		if(this.x > 0) {
			if(this.y > 0) {
				count += this.field.cells[this.x-1][this.y-1].active;
			}

			count += this.field.cells[this.x-1][this.y].active;

			if(this.y < this.field.cellsHeight - 1) {
				count += this.field.cells[this.x-1][this.y+1].active;
			}
		}

		if(this.x < this.field.cellsWidth - 1) {
			if(this.y > 0) {
				count += this.field.cells[this.x+1][this.y-1].active;
			}

			count += this.field.cells[this.x+1][this.y].active;

			if(this.y < this.field.cellsHeight - 1) {
				count += this.field.cells[this.x+1][this.y+1].active;
			}
		}

		if(this.y > 0) {
			count += this.field.cells[this.x][this.y-1].active;
		}

		if(this.y < this.field.cellsHeight - 1) {
			count += this.field.cells[this.x][this.y+1].active;
		}

		return count;	
	}

	shouldDie() {
		let neighbors = this.getSurroundingCellsCount();
		return this.active && (neighbors < 2 || neighbors > 3);
	}

	shouldBirth() {
		let neighbors = this.getSurroundingCellsCount();
		return !this.active && (neighbors == 3);
	}
}

let field = new Field();

let running = null;


/****************************************************************************************************/

let speedRange = document.getElementById('speedRange');
speedRange.value = speedRange.max - runningSpeed;

function loop() {
	if(field.running) {
		field.step();
	}
	setTimeout(loop, runningSpeed);
}

loop();

speedRange.addEventListener('change', function() {
	runningSpeed = this.max - this.value;
});

speedRange.dispatchEvent(new Event('change'));

/****************************************************************************************************/

let saveFile = document.getElementById('saveFile');

saveFile.addEventListener('change', function(evt){
	let file = evt.target.files[0];

	let reader = new FileReader();
	reader.readAsText(file, "UTF-8");

	reader.onload = function (evt) {
		let values = JSON.parse(evt.target.result);

		canvas.width = values.width;
		canvas.height = values.height;
		field.cellSize = values.cellSize;

		field.loadCells(values.data);
    }

    evt.target.value = '';
});

/****************************************************************************************************/

canvas.addEventListener('mousemove', function(event) {
	let clientRect = event.target.getBoundingClientRect();
	let xPos = event.clientX - clientRect.x;
	let yPos = event.clientY - clientRect.y;
	let xCell = Math.floor(xPos/field.cellSize);
	let yCell = Math.floor(yPos/field.cellSize);
	let cell = field.getCell(xCell, yCell);

	if(mouseActive && currentCell != cell) {
		field.clean();
		field.setCell(xCell, yCell, settingStatus);
		currentCell = cell;
		field.draw();
	}
});

canvas.addEventListener('mousedown', function(event) {
	mouseActive = true;
	let clientRect = event.target.getBoundingClientRect();
	let xPos = event.clientX - clientRect.x;
	let yPos = event.clientY - clientRect.y;
	let xCell = Math.floor(xPos/field.cellSize);
	let yCell = Math.floor(yPos/field.cellSize);
	let cell = field.getCell(xCell, yCell);
	
	field.clean();
	if(settingStatus === null) {
		settingStatus = !cell.active;
	}
	field.setCell(xCell, yCell, settingStatus);
	currentCell = cell;
	field.draw();
});

canvas.addEventListener('mouseup', function(event) {
	mouseActive = false;
	settingStatus = null;
});