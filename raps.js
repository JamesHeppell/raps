var NUMBER_OF_COLS = 4,
	NUMBER_OF_ROWS = 4,
	BLOCK_SIZE = 100;

//TODO enable a n by n board n >= 3

var BLOCK_COLOUR_1 = '#9f7119',
	BLOCK_COLOUR_2 = '#debf83',
	HIGHLIGHT_COLOUR = '#fb0006',
    POSSIBLE_MOVE_COLOUR = 'blue';

var piecePositions = null;

var PIECE_PAWN = 0,
	IN_PLAY = 0,
	TAKEN = 1,
	pieces = null,
	ctx = null,
	json = null,
	canvas = null,
	BLACK_TEAM = 0,
	WHITE_TEAM = 1,
	SELECT_LINE_WIDTH = 5,
	currentTurn = WHITE_TEAM,
	selectedPiece = null;

var GAME_FINISHED = false;
var WINNING_PLAYER = "White";

var FORCED_SELECTION = [];
var POSSIBLE_MOVES = [];

var GAME_RECORD = {"size":NUMBER_OF_COLS,
                   "moveList":[]};

var OnePlayerButton = null;
var TwoPlayerButton = null;
var GAMETYPE = null;
var computerLevel = null;

function screenToBlock(x, y) {
	var block =  {
		"row": Math.floor(y / BLOCK_SIZE),
		"col": Math.floor(x / BLOCK_SIZE)
	};

	return block;
}

function getPieceAtBlockForTeam(teamOfPieces, clickedBlock) {

	var curPiece = null,
		iPieceCounter = 0,
		pieceAtBlock = null;

	for (iPieceCounter = 0; iPieceCounter < teamOfPieces.length; iPieceCounter++) {

		curPiece = teamOfPieces[iPieceCounter];

		if (curPiece.status === IN_PLAY &&
				curPiece.col === clickedBlock.col &&
				curPiece.row === clickedBlock.row) {
			curPiece.position = iPieceCounter;

			pieceAtBlock = curPiece;
			iPieceCounter = teamOfPieces.length;
		}
	}

	return pieceAtBlock;
}

function blockOccupiedByEnemy(clickedBlock) {
	var team = (currentTurn === BLACK_TEAM ? json.white : json.black);

	return getPieceAtBlockForTeam(team, clickedBlock);
}


function blockOccupied(clickedBlock) {
	var pieceAtBlock = getPieceAtBlockForTeam(json.black, clickedBlock);

	if (pieceAtBlock === null) {
		pieceAtBlock = getPieceAtBlockForTeam(json.white, clickedBlock);
	}

	return (pieceAtBlock !== null);
}

function canPawnMoveToBlock(selectedPiece, clickedBlock) {
    for (var i=0; i<POSSIBLE_MOVES.length; i++){
        if(clickedBlock.col == POSSIBLE_MOVES[i].col &&
           clickedBlock.row == POSSIBLE_MOVES[i].row){
            return true;
        }
    }
	return false;
}

function setPossibleMoves(pieceAtBlock){
    //assume selected peice has been set!
    POSSIBLE_MOVES = [];
    
    //check jumping enemy piece first, if you can you must!
    checkJumpingEnemy(pieceAtBlock, false)
    
    if (POSSIBLE_MOVES.length > 0){
        return;
    }
    
    //check single moves 3 by 3 grid
    checkSingleMove(pieceAtBlock)

    //check jumping non enemy pieces (done by extension as would already return)
    checkJumping(pieceAtBlock)
}


function checkSingleMove(pieceAtBlock){
    for (var row = -1; row<2; row++){
        for (var col = -1; col<2; col++){
            var rowToConsider = pieceAtBlock.row + row;
            var colToConsider = pieceAtBlock.col + col;
            if (rowToConsider < 0 || 
                rowToConsider >= NUMBER_OF_ROWS || 
                colToConsider < 0 || 
                colToConsider >= NUMBER_OF_COLS ||
                (row == 0 && col == 0)){
                // not a valid block to consider
            } else{
                //check if block is empty, if yes add to moves
                var blockPos = {"row":rowToConsider, "col":colToConsider};
                if (!blockOccupied(blockPos)){
                    POSSIBLE_MOVES.push(blockPos);
                }
            }
        }
    }
}


function checkJumping(pieceAtBlock){
    for (var jrow = -2; jrow<4; jrow+=2){
        for (var jcol = -2; jcol<4; jcol+=2){
            var rowToConsider = pieceAtBlock.row + jrow;
            var colToConsider = pieceAtBlock.col + jcol;
            if (rowToConsider < 0 || 
                rowToConsider >= NUMBER_OF_ROWS || 
                colToConsider < 0 || 
                colToConsider >= NUMBER_OF_COLS ||
                (jrow == 0 && jcol == 0)){
                // not a valid block to consider
            } else{
                //check if block is empty, and inbetween is occupied
                var blockPos = {"row":rowToConsider, "col":colToConsider};
                var midRow = (rowToConsider + pieceAtBlock.row)/2;
                var midCol = (colToConsider + pieceAtBlock.col)/2;
                var midPos = {"row":midRow, "col":midCol};
                if (!blockOccupied(blockPos) && blockOccupied(midPos)){
                    POSSIBLE_MOVES.push(blockPos);
                }
            }
        }
    }  
}

function checkJumpingEnemy(pieceAtBlock, isCheckingForced){
    for (var jrow = -2; jrow<4; jrow+=2){
        for (var jcol = -2; jcol<4; jcol+=2){
            var rowToConsider = pieceAtBlock.row + jrow;
            var colToConsider = pieceAtBlock.col + jcol;
            if (rowToConsider < 0 || 
                rowToConsider >= NUMBER_OF_ROWS || 
                colToConsider < 0 || 
                colToConsider >= NUMBER_OF_COLS ||
                (jrow == 0 && jcol == 0)){
                // not a valid block to consider
            } else{
                //check if block is empty, and inbetween is occupied
                var blockPos = {"row":rowToConsider, "col":colToConsider};
                var midRow = (rowToConsider + pieceAtBlock.row)/2;
                var midCol = (colToConsider + pieceAtBlock.col)/2;
                var midPos = {"row":midRow, "col":midCol};
                if (!blockOccupied(blockPos) && blockOccupiedByEnemy(midPos)){
                    if(isCheckingForced){
                        FORCED_SELECTION.push(pieceAtBlock);
                    } else {
                        POSSIBLE_MOVES.push(blockPos);
                    }
                }
            }
        }
    }  
}


function isForceCapture(){
    //reset forced selection global
    FORCED_SELECTION=[];
    var teamOfPieces = json.black;
    if (currentTurn === WHITE_TEAM){
        teamOfPieces = json.white;
    }
        
    for (var iPieceCounter = 0; iPieceCounter < teamOfPieces.length; iPieceCounter++) {
        var curPiece = teamOfPieces[iPieceCounter];
        if (curPiece.status === IN_PLAY){
            checkJumpingEnemy(curPiece, true);
        } 
    }  
    
    return FORCED_SELECTION.length > 0;
}


function highlightPossibleMoves(pieceAtBlock){
    //assume selected peice has been set!
    setPossibleMoves(pieceAtBlock);
    for (var i=0; i<POSSIBLE_MOVES.length; i++){
        drawOutline(POSSIBLE_MOVE_COLOUR, ctx, POSSIBLE_MOVES[i]);
    }
}

function unHighlightPossibleMoves(){
    for (var i=0; i<POSSIBLE_MOVES.length; i++){
        drawBlock(POSSIBLE_MOVES[i].col, POSSIBLE_MOVES[i].row);
    }
}

function canSelectedMoveToBlock(selectedPiece, clickedBlock) {
	var bCanMove = false;

    bCanMove = canPawnMoveToBlock(selectedPiece, clickedBlock);

	return bCanMove;
}

function getPieceAtBlock(clickedBlock) {

	var team = (currentTurn === BLACK_TEAM ? json.black : json.white);

	return getPieceAtBlockForTeam(team, clickedBlock);
}

function getBlockColour(iRowCounter, iBlockCounter) {
	var cStartColour;

	// Alternate the block colour
	if (iRowCounter % 2) {
		cStartColour = (iBlockCounter % 2 ? BLOCK_COLOUR_1 : BLOCK_COLOUR_2);
	} else {
		cStartColour = (iBlockCounter % 2 ? BLOCK_COLOUR_2 : BLOCK_COLOUR_1);
	}

	return cStartColour;
}

function drawBlock(iRowCounter, iBlockCounter) {
	// Set the background
	ctx.fillStyle = getBlockColour(iRowCounter, iBlockCounter);

	// Draw rectangle for the background
	ctx.fillRect(iRowCounter * BLOCK_SIZE, iBlockCounter * BLOCK_SIZE,
		BLOCK_SIZE, BLOCK_SIZE);

	ctx.stroke();
}

function getImageCoords(pieceCode, bBlackTeam, imageBlockSize) {
	var imageCoords =  {
		"x": pieceCode * imageBlockSize,
		"y": (bBlackTeam ? 0 : imageBlockSize)
	};

	return imageCoords;
}

function drawPiece(curPiece, bBlackTeam) {
    if (curPiece.status == TAKEN){
        console.log("trying to draw taken piece...");
        return;
    }
    var imageBlockSize = 100;
	var imageCoords = getImageCoords(curPiece.piece, bBlackTeam, imageBlockSize);

	// Draw the piece onto the canvas
	ctx.drawImage(pieces,
		imageCoords.x, imageCoords.y,
		imageBlockSize, imageBlockSize,
		curPiece.col * BLOCK_SIZE, curPiece.row * BLOCK_SIZE,
		BLOCK_SIZE, BLOCK_SIZE);
}

function removeSelection(selectedPiece) {
    unHighlightPossibleMoves();
	drawBlock(selectedPiece.col, selectedPiece.row);
	drawPiece(selectedPiece, (currentTurn === BLACK_TEAM));
}

function drawTeamOfPieces(teamOfPieces, bBlackTeam) {
	var iPieceCounter;

	// Loop through each piece and draw it on the canvas	
	for (iPieceCounter = 0; iPieceCounter < teamOfPieces.length; iPieceCounter++) {
		drawPiece(teamOfPieces[iPieceCounter], bBlackTeam);
	}
}

function drawPieces() {
	drawTeamOfPieces(json.black, true);
	drawTeamOfPieces(json.white, false);
}

function drawRow(iRowCounter) {
	var iBlockCounter;

	// Draw 8 block left to right
	for (iBlockCounter = 0; iBlockCounter < NUMBER_OF_ROWS; iBlockCounter++) {
		drawBlock(iRowCounter, iBlockCounter);
	}
}

function drawBoard() {
	var iRowCounter;

	for (iRowCounter = 0; iRowCounter < NUMBER_OF_ROWS; iRowCounter++) {
		drawRow(iRowCounter);
	}

	// Draw outline
	ctx.lineWidth = 3;
	ctx.strokeRect(0, 0,
		NUMBER_OF_ROWS * BLOCK_SIZE,
		NUMBER_OF_COLS * BLOCK_SIZE);
}

function defaultPositions() {
	json = {
		"white":
			[
				{
					"piece": PIECE_PAWN,
					"row": 0,
					"col": 0,
					"status": IN_PLAY
				},
				{
					"piece": PIECE_PAWN,
					"row": 0,
					"col": 1,
					"status": IN_PLAY
				},
				{
					"piece": PIECE_PAWN,
					"row": 0,
					"col": 2,
					"status": IN_PLAY
				},
				{
					"piece": PIECE_PAWN,
					"row": 0,
					"col": 3,
					"status": (NUMBER_OF_COLS >= 4 ? IN_PLAY : TAKEN)
				},
                {
                    "piece": PIECE_PAWN,
					"row": 0,
					"col": 4,
                    "status": (NUMBER_OF_COLS >= 5 ? IN_PLAY : TAKEN)
                }
			],
		"black":
			[
				{
					"piece": PIECE_PAWN,
					"row": NUMBER_OF_ROWS - 1,
					"col": 0,
					"status": IN_PLAY
				},
				{
					"piece": PIECE_PAWN,
					"row": NUMBER_OF_ROWS - 1,
					"col": 1,
					"status": IN_PLAY
				},
				{
					"piece": PIECE_PAWN,
					"row": NUMBER_OF_ROWS - 1,
					"col": 2,
					"status": IN_PLAY
				},
				{
					"piece": PIECE_PAWN,
					"row": NUMBER_OF_ROWS - 1,
					"col": 3,
					"status": (NUMBER_OF_COLS >= 4 ? IN_PLAY : TAKEN)
				},
                {
                    "piece": PIECE_PAWN,
					"row": NUMBER_OF_ROWS - 1,
					"col": 4,
                    "status": (NUMBER_OF_COLS >= 5 ? IN_PLAY : TAKEN)
                }
			]
	};
}

function drawOutline(colourToHighlight, ctx, pieceAtBlock){
    ctx.lineWidth = SELECT_LINE_WIDTH;
	ctx.strokeStyle = colourToHighlight;
	ctx.strokeRect((pieceAtBlock.col * BLOCK_SIZE) + SELECT_LINE_WIDTH,
		(pieceAtBlock.row * BLOCK_SIZE) + SELECT_LINE_WIDTH,
		BLOCK_SIZE - (SELECT_LINE_WIDTH * 2),
		BLOCK_SIZE - (SELECT_LINE_WIDTH * 2));
}

function selectPiece(pieceAtBlock) {
	// Draw outline
	drawOutline(HIGHLIGHT_COLOUR, ctx, pieceAtBlock)
    
	selectedPiece = pieceAtBlock;
    highlightPossibleMoves(pieceAtBlock);
}

function checkIfPieceClicked(clickedBlock) {
	var pieceAtBlock = getPieceAtBlock(clickedBlock);
    
    var isSelectionLegal = true;
    if (isForceCapture()){
        isSelectionLegal = false;
        for(var i=0; i<FORCED_SELECTION.length; i++){
            if (clickedBlock.col == FORCED_SELECTION[i].col &&
                clickedBlock.row == FORCED_SELECTION[i].row){
                isSelectionLegal = true;
            }
        }
    }
    //consol logs
    console.log("Selected block (col,row) (" + clickedBlock.col + ", " + clickedBlock.row + ")");
    console.log("isSelectionLegal " + isSelectionLegal);
    console.log("forced options: " + FORCED_SELECTION.length);
    if (FORCED_SELECTION.length > 0){
        console.log("first forced options is at (col, row) (" + FORCED_SELECTION[0].col + ", " + FORCED_SELECTION[0].row + ")");
    }
    
	if (pieceAtBlock !== null && isSelectionLegal){
        selectPiece(pieceAtBlock);
    }     	
}

function movePiece(clickedBlock, enemyPiece) {
	// Clear the block in the original position
	drawBlock(selectedPiece.col, selectedPiece.row);
    unHighlightPossibleMoves();
    
    //record the game after a move has been played (undo button??)
    GAME_RECORD.moveList.push({"from":{"row":selectedPiece.row, "col":selectedPiece.col} ,                                  "to":{"row":clickedBlock.row, "col":clickedBlock.col}, "taken": enemyPiece
                              });
    console.log("Number of moves in record: " + GAME_RECORD.moveList.length);
    
    var moveText = "(" + selectedPiece.row + ", " + selectedPiece.col + ")" +
                   "  to  (" + clickedBlock.row + ", " + clickedBlock.col + ")";
    
    writeToScoreCard(moveText);
    

	var team = (currentTurn === WHITE_TEAM ? json.white : json.black),
		opposite = (currentTurn !== WHITE_TEAM ? json.white : json.black);
    
	team[selectedPiece.position].col = clickedBlock.col;
	team[selectedPiece.position].row = clickedBlock.row;

	if (enemyPiece !== null) {
		// Clear the piece your about to take
		drawBlock(enemyPiece.col, enemyPiece.row);
		opposite[enemyPiece.position].status = TAKEN;
	}

	// Draw the piece in the new position
	drawPiece(selectedPiece, (currentTurn === BLACK_TEAM));
    
    // check win condition before changing turn
    checkWinCondition(clickedBlock);
    
	currentTurn = (currentTurn === WHITE_TEAM ? BLACK_TEAM : WHITE_TEAM);

	selectedPiece = null;
    
    console.log("==============================");
}

function processComputerMove(){
    if (computerLevel=="EASY"){
        //easy - random selection
        
        //keep selecting pieces unitl one has some possible moves and
        //then randomly pick one of them.
        var choosingPiece = true;
        var clickedBlock;
        var team = (currentTurn === WHITE_TEAM ? json.white : json.black);
        var randPiece;
        var randidx;
        var piecePos;
        while (choosingPiece){
            //TODO fix the force take issue...
            randidx = Math.floor(Math.random()*team.length);
            randPiece = team[randidx];
            console.log("Computer considers a piece");
            if (randPiece.status == IN_PLAY){
                console.log("Piece considered was in play");
                piecePos={"row":randPiece.row, "col":randPiece.col};
                
                checkIfPieceClicked(piecePos);
                console.log("Is selected piece null: " + (selectedPiece==null).toString());
                
                if (POSSIBLE_MOVES.length > 0 && selectedPiece != null){
                    clickedBlock =POSSIBLE_MOVES[Math.floor(Math.random()*POSSIBLE_MOVES.length)];
                    selectedPiece.position = randidx;
                    choosingPiece = false;
                }
            }
        }
        
        //getPieceAtBlockForTeam(teamOfPieces, clickedBlock)
        
        var enemyPiece = getPositionOfPossibleEnemyPiece(clickedBlock);
        //assumes selected piece
        movePiece(clickedBlock, enemyPiece)
        
    } else if (computerLevel=="HARD"){
        //hard - lookahead x moves for best option...
        //TODO
        //put all functions in HardComputer.js e.g.
        
        
    }
    
    console.log("test output from importing another function...");
    scoreBoard(json, NUMBER_OF_ROWS);
    
}

function getPositionOfPossibleEnemyPiece(clickedBlock){
    //get position of possible enemy piece
    var midRow = (clickedBlock.row + selectedPiece.row)/2;
    var midCol = (clickedBlock.col + selectedPiece.col)/2;
    var midPos = {"row":midRow, "col":midCol};
    var enemyPiece = blockOccupiedByEnemy(midPos);
    
    return enemyPiece;
}

function processMove(clickedBlock) {
	var pieceAtBlock = getPieceAtBlock(clickedBlock)

	if (pieceAtBlock !== null) {
		removeSelection(selectedPiece);
		checkIfPieceClicked(clickedBlock);
	} else if (canSelectedMoveToBlock(selectedPiece, clickedBlock)) {
        //get position of possible enemy piece
        var enemyPiece = getPositionOfPossibleEnemyPiece(clickedBlock);
		movePiece(clickedBlock, enemyPiece);
        
        //player successfully moved peice - now consider computer move
        if (GAMETYPE == "OnePlayer" && GAME_FINISHED != true){
            //remove event listener to allow animation time...
            canvas.removeEventListener('click',board_click);
            processComputerMove();
            canvas.addEventListener('click',board_click);
        }
    
	}
}

function colorRect(leftX,topY, width,height, drawColor, ctx) {
	ctx.fillStyle = drawColor;
	ctx.fillRect(leftX,topY, width,height);
}

function checkWinCondition(clickedBlock){
    console.log("current turn is " + currentTurn);
    console.log("moved to row " + clickedBlock.row);
    console.log("moved to col " + clickedBlock.col);
    console.log("No Black pieces remaining: " + checkNoPiecesLeft(json.black));
    console.log("No White pieces remaining: " + checkNoPiecesLeft(json.white));
    
    if (currentTurn == WHITE_TEAM && clickedBlock.row == (NUMBER_OF_ROWS - 1)){
        WINNING_PLAYER = "White";
        GAME_FINISHED = true;
        draw();
    } else if (currentTurn == BLACK_TEAM && clickedBlock.row == 0){
        WINNING_PLAYER = "Black";
        GAME_FINISHED = true;
        draw();
    } else if (checkNoPiecesLeft(json.black)){
        WINNING_PLAYER = "White";
        GAME_FINISHED = true;
        draw();
    } else if (checkNoPiecesLeft(json.white)){
        WINNING_PLAYER = "Black";
        GAME_FINISHED = true;
        draw();
    }
    
}


function checkNoPiecesLeft(teamOfPieces){
    for (var iPieceCounter = 0; iPieceCounter < teamOfPieces.length; iPieceCounter++) {
		var curPiece = teamOfPieces[iPieceCounter];
		if (curPiece.status === IN_PLAY){
			return false;
		} 
	}
    return true
}    

function undoOneMove(){
    //TODO
    if (GAMETYPE = "OnePlayer"){
        
    }else if (GAMETYPE == "TwoPlayer"){
        
        
    }else{
        alert("Game type not implemented...")
    }
    
    
    
    //json - current positions
    //moveList (from document) - current move list to remove 
    //GAME_RECORD - current dict of moves
    var allMoves = GAME_RECORD.moveList;
    
    
    
    removeLastMoveFromScoreCard();
    
}

function removeLastMoveFromScoreCard(){
    var move = null;
    var list = document.getElementById('moveList')
    var notation = list.lastChild.innerHTML;
    console.log("Removing move from score card: " + notation);
    list.removeChild(list.lastChild);
}


function resetScoreCard(){
    var list = document.getElementById('moveList');
    while(list.firstChild){
        list.removeChild(list.firstChild)
    }
}

function writeToScoreCard(moveText){
    var list = document.getElementById('moveList');
    var node = document.createElement("LI");
    var textnode = document.createTextNode(moveText);
    node.appendChild(textnode);
    list.appendChild(node);
}


function board_click(ev) {
    var canvasClientRect = canvas.getBoundingClientRect();
	
    var x = ev.clientX - canvasClientRect.left,
		y = ev.clientY - canvasClientRect.top,
		clickedBlock = screenToBlock(x, y);
    
    if (GAME_FINISHED){
        GAME_FINISHED = false;
        drawMenuScreen();
        return; 
    }
    
	if (selectedPiece === null) {
		checkIfPieceClicked(clickedBlock);
	} else {
		processMove(clickedBlock);
	}
}

function drawWinScreen(canvas, ctx){
    colorRect(0,0,canvas.width,canvas.height,'black', ctx);
    ctx.font="30px Arial";
    ctx.fillStyle = 'white';
    ctx.textBasline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText(WINNING_PLAYER + " wins!", canvas.width/2, canvas.height/4);
    ctx.fillText("Click to play again...", canvas.width/2, 3*canvas.height/4);
}


function drawMenuScreen(){
    canvas.removeEventListener('click', board_click);
    colorRect(0,0,canvas.width,canvas.height,'black', ctx);
    ctx.font="30px Arial";
    ctx.textBasline = 'middle';
    ctx.textAlign = 'center';
    
    OnePlayerButton = {"x":canvas.width/8,
                       "y":canvas.height/8,
                       "width":3*canvas.width/4,
                       "height":1.5*canvas.height/8};
    
    TwoPlayerButton = {"x":canvas.width/8,
                       "y":5*canvas.height/8,
                       "width":3*canvas.width/4,
                       "height":1.5*canvas.height/8};
    
	ctx.fillStyle = '#debf83';
	ctx.fillRect(OnePlayerButton.x, OnePlayerButton.y,
		OnePlayerButton.width, OnePlayerButton.height);
	ctx.stroke();
    ctx.fillRect(TwoPlayerButton.x, TwoPlayerButton.y,
		TwoPlayerButton.width, TwoPlayerButton.height);
	ctx.stroke();
    
    ctx.fillStyle = 'white';
    ctx.fillText("One player Game", canvas.width/2, canvas.height/4);
    ctx.fillText("Two player Game", canvas.width/2, 3*canvas.height/4);
    
    canvas.addEventListener('click', menu_click, false);
}

function isInsideButton(pos, button){
    button.x;
    pos.x;
    return pos.x > button.x && pos.x < button.x+button.width && pos.y < button.y+button.height && pos.y > button.y;
}

function menu_click(ev) {
    var canvasClientRect = canvas.getBoundingClientRect();
	
    var x = ev.clientX - canvasClientRect.left,
		y = ev.clientY - canvasClientRect.top,
		mousePos = {"x":x, "y":y};
    
    if(isInsideButton(mousePos, OnePlayerButton)){
        console.log("You clicked One Player button!");
        GAMETYPE = "OnePlayer";
        draw();
    }else if (isInsideButton(mousePos, TwoPlayerButton)){
        console.log("You clicked Two Player button!");
        GAMETYPE = "TwoPlayer";
        draw();
    }
    
}

function resetGlobals(){
    GAME_FINISHED = false;
    currentTurn = WHITE_TEAM;
    computerLevel = "EASY";
}

function startGame(){
    // Main entry point from the HTML5
    canvas = document.getElementById('raps');
    // Canvas supported?
	if (canvas.getContext) {
		ctx = canvas.getContext('2d');
        
        resetScoreCard();
        drawMenuScreen();
        resetGlobals();
        
    } else {
		alert("Canvas not supported!");
	}
}

function draw() {
	// Main entry point got the HTML5 chess board example
    canvas.removeEventListener('click', menu_click, false);
    
    //set constants for reseting game
    currentTurn = WHITE_TEAM;
    resetScoreCard();
    
    // Calculdate the precise block size
    BLOCK_SIZE = canvas.height / NUMBER_OF_ROWS;

    if (GAME_FINISHED){
        drawWinScreen(canvas, ctx);
        return;
    }

    // Draw the background
    drawBoard();

    defaultPositions();

    // Draw pieces
    pieces = new Image();
    pieces.src = 'pieces.png';
    pieces.onload = drawPieces;

    canvas.addEventListener('click', board_click, false);

}