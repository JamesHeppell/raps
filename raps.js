var NUMBER_OF_COLS = 4,
	NUMBER_OF_ROWS = 4,
	BLOCK_SIZE = 100;

//TODO enable a n by n board n >= 3

var IN_PLAY = 0,
	TAKEN = 1,
	pieces = null,
	canvas = null,
	BLACK_TEAM = 0,
	WHITE_TEAM = 1,
	selectedPiece = null;

var WINNING_PLAYER = "White";

var FORCED_SELECTION = [];
var POSSIBLE_MOVES = [];

var GAMETYPE = null;
var computerLevel = null;

//Load other classes
var myGame = new Game(4);
var myDisplay = new DisplayCanvas(4);
var myMoveListDisplay = new DisplayMoveList();

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
	var team = (myGame.currentTurn === BLACK_TEAM ? myGame.json.white : myGame.json.black);

	return getPieceAtBlockForTeam(team, clickedBlock);
}


function blockOccupied(clickedBlock) {
	var pieceAtBlock = getPieceAtBlockForTeam(myGame.json.black, clickedBlock);

	if (pieceAtBlock === null) {
		pieceAtBlock = getPieceAtBlockForTeam(myGame.json.white, clickedBlock);
	}

	return (pieceAtBlock !== null);
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
    var teamOfPieces = myGame.json.black;
    if (myGame.currentTurn === WHITE_TEAM){
        teamOfPieces = myGame.json.white;
    }
        
    for (var iPieceCounter = 0; iPieceCounter < teamOfPieces.length; iPieceCounter++) {
        var curPiece = teamOfPieces[iPieceCounter];
        if (curPiece.status === IN_PLAY){
            checkJumpingEnemy(curPiece, true);
        } 
    }  
    
    return FORCED_SELECTION.length > 0;
}


function canSelectedMoveToBlock(selectedPiece, clickedBlock) {
	var bCanMove = false;

    bCanMove = myGame.canPawnMoveToBlock(selectedPiece, clickedBlock);

	return bCanMove;
}

function getPieceAtBlock(clickedBlock) {

	var team = (myGame.currentTurn === BLACK_TEAM ? myGame.json.black : myGame.json.white);

	return getPieceAtBlockForTeam(team, clickedBlock);
}

function removeSelection(selectedPiece) {
    var movesValues = myGame.getPossibleMovesForPiece(selectedPiece);
    var possible_moves = movesValues.moves;
    myDisplay.unHighlightPossibleMoves(possible_moves);
	myDisplay.drawBlock(selectedPiece.col, selectedPiece.row);
	myDisplay.drawPiece(selectedPiece, (myGame.currentTurn === BLACK_TEAM), pieces);
}


function selectPiece(pieceAtBlock) {
	// Draw outline
	myDisplay.drawOutline(myDisplay.highlightColor, pieceAtBlock)
    
	selectedPiece = pieceAtBlock;
    
    var movesValues = myGame.getPossibleMovesForPiece(selectedPiece);
    var possible_moves = movesValues.moves;
    myDisplay.highlightPossibleMoves(possible_moves);
    
    setPossibleMoves(pieceAtBlock);
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
	myDisplay.drawBlock(selectedPiece.col, selectedPiece.row);
    
    var movesValues = myGame.getPossibleMovesForPiece(selectedPiece);
    var possible_moves = movesValues.moves;
    myDisplay.unHighlightPossibleMoves(possible_moves);
    
    
    var move = {"from":{"row":selectedPiece.row, "col":selectedPiece.col} ,                                  "to":{"row":clickedBlock.row, "col":clickedBlock.col}, "taken": enemyPiece};
    myGame.addMoveToList(move);
    
    console.log("Number of moves in myGame record: " + myGame.moveList.length);
    
    var moveText = "(" + selectedPiece.row + ", " + selectedPiece.col + ")" +
                   "  to  (" + clickedBlock.row + ", " + clickedBlock.col + ")";
    
    myMoveListDisplay.writeNextMove(move);
    

	var team = (myGame.currentTurn === WHITE_TEAM ? myGame.json.white : myGame.json.black),
		opposite = (myGame.currentTurn !== WHITE_TEAM ? myGame.json.white : myGame.json.black);
    
	team[selectedPiece.position].col = clickedBlock.col;
	team[selectedPiece.position].row = clickedBlock.row;

	if (enemyPiece !== null) {
		// Clear the piece your about to take
		myDisplay.drawBlock(enemyPiece.col, enemyPiece.row);
		opposite[enemyPiece.position].status = TAKEN;
	}

	// Draw the piece in the new position
	myDisplay.drawPiece(selectedPiece, (myGame.currentTurn === BLACK_TEAM), pieces);
    
    // Draw outline
	myDisplay.drawBoardOutline();
    
    // check win condition before changing turn
    var isGameOver = myGame.hasGameEnded(clickedBlock);
    if (isGameOver){
        if (myGame.currentTurn === WHITE_TEAM){
            WINNING_PLAYER = "White";
        }else{
            WINNING_PLAYER = "Black"
        }
        myGame.isGameFinished = true;
        draw();
    }
    
    
	myGame.currentTurn = (myGame.currentTurn === WHITE_TEAM ? BLACK_TEAM : WHITE_TEAM);

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
        var team = (myGame.currentTurn === WHITE_TEAM ? myGame.json.white : myGame.json.black);
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
    scoreBoard(myGame.json, NUMBER_OF_ROWS);
    
    var newGame = new Game(NUMBER_OF_ROWS);
    newGame.setPositions(myGame.json);
    
    var possible_moves = newGame.getPossibleMovesForPlayer();
    
    console.log("num pieces to move are: " + possible_moves.length.toString());
    var moveCount = newGame.getMoveCountForPlayer();
    console.log("Total moves: " + moveCount.toString());
    if (possible_moves.length > 0){
        console.log("First piece at (row, col) (" + possible_moves[0].piece.row.toString() + ", " + possible_moves[0].piece.col.toString() + ") can move to (" + possible_moves[0].moves[0].row.toString() + "," + possible_moves[0].moves[0].col.toString() + ")");
    }
    
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
        if (GAMETYPE == "OnePlayer" && myGame.isGameFinished != true){
            //remove event listener to allow animation time...
            myDisplay.canvas.removeEventListener('click',board_click);
            processComputerMove();
            myDisplay.canvas.addEventListener('click',board_click);
        }
    
	}
}


function undoOneMove(){
    //TODO
    if (GAMETYPE = "OnePlayer"){
        
    }else if (GAMETYPE == "TwoPlayer"){
        
        
    }else{
        alert("Game type not implemented...")
    }
    
    myMoveListDisplay.removeLastMove();
    
}


function board_click(ev) {
    var canvasClientRect = myDisplay.canvas.getBoundingClientRect();
	
    var x = ev.clientX - canvasClientRect.left,
		y = ev.clientY - canvasClientRect.top,
		clickedBlock = screenToBlock(x, y);
    
    if (myGame.isGameFinished){
        myGame.isGameFinished = false;
        myDisplay.drawMenuScreen();
        return; 
    }
    
	if (selectedPiece === null) {
		checkIfPieceClicked(clickedBlock);
	} else {
		processMove(clickedBlock);
	}
}

function isInsideButton(pos, button){
    button.x;
    pos.x;
    return pos.x > button.x && pos.x < button.x+button.width && pos.y < button.y+button.height && pos.y > button.y;
}

function menu_click(ev) {
    var canvasClientRect = myDisplay.canvas.getBoundingClientRect();
	
    var x = ev.clientX - canvasClientRect.left,
		y = ev.clientY - canvasClientRect.top,
		mousePos = {"x":x, "y":y};
    
    
    if(isInsideButton(mousePos, myDisplay.OnePlayerButton)){
        console.log("You clicked One Player button!");
        GAMETYPE = "OnePlayer";
        draw();
    }else if (isInsideButton(mousePos, myDisplay.TwoPlayerButton)){
        console.log("You clicked Two Player button!");
        GAMETYPE = "TwoPlayer";
        draw();
    }
    
}

function resetGlobals(){
    myGame.isGameFinished = false;
    myGame.currentTurn = WHITE_TEAM;
    computerLevel = "EASY";
}


function startGame(){
    // Main entry point from the HTML5
    canvas = document.getElementById('raps');
    // Canvas supported?
	if (canvas.getContext) {
        
        myDisplay.setCanvasandContext(canvas);
        
        myMoveListDisplay.resetMoveList();
        myDisplay.drawMenuScreen();
        resetGlobals();
        
    } else {
		alert("Canvas not supported!");
	}
}

function draw() {
	// Main entry point got the HTML5 chess board example
    myDisplay.canvas.removeEventListener('click', menu_click, false);
    
    //set constants for reseting game
    myGame.currentTurn = WHITE_TEAM;
    myMoveListDisplay.resetMoveList();
    
    // Calculate the precise block size
    BLOCK_SIZE = myDisplay.canvas.height / NUMBER_OF_ROWS;

    if (myGame.isGameFinished){
        myDisplay.drawWinScreen();
        return;
    }

    // Draw the background
    myDisplay.drawBoard();
    
    myGame.resetMoveList();
    myGame.setDefaultPositions();

    // Draw pieces
    pieces = new Image();
    pieces.src = 'pieces.png';
    pieces.onload = myDisplay.drawPieces(myGame.json.black, myGame.json.white, pieces);
    
    myDisplay.canvas.addEventListener('click', board_click, false);

}