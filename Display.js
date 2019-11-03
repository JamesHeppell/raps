class DisplayCanvas{
    
    constructor(boardsize){
        this.boardsize = boardsize;
        this.blockColor1 = '#9f7119';
        this.blockColor2 = '#debf83';
	    this.highlightColor = '#fb0006';
        this.possibleMoveColor = 'blue';
        this.selectLineWidth = 5;
        
        this.OnePlayerButton=null;
        this.TwoPlayerButton=null;
        this.canvas=null;
        this.ctx = null;
    }
    
    drawBoardOutline(){
        // Draw outline
        this.ctx.strokeStyle = "black";
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(0, 0, NUMBER_OF_ROWS * BLOCK_SIZE, NUMBER_OF_COLS * BLOCK_SIZE);
    }
    
    
    drawOutline(colourToHighlight, pieceAtBlock){
        this.ctx.lineWidth = this.selectLineWidth;
        this.ctx.strokeStyle = colourToHighlight;
        this.ctx.strokeRect((pieceAtBlock.col * BLOCK_SIZE) + this.selectLineWidth,
                      (pieceAtBlock.row * BLOCK_SIZE) + this.selectLineWidth,
                      BLOCK_SIZE - (this.selectLineWidth * 2),
                      BLOCK_SIZE - (this.selectLineWidth * 2));

        // Draw outline
        this.drawBoardOutline();
    }
    
    drawBoard() {
        var iRowCounter;

        for (iRowCounter = 0; iRowCounter < NUMBER_OF_ROWS; iRowCounter++) {
            this.drawRow(iRowCounter);
        }

        // Draw outline
        this.drawBoardOutline();
    }
    
    drawRow(iRowCounter) {
        var iBlockCounter;

        // Draw 8 block left to right
        for (iBlockCounter = 0; iBlockCounter < NUMBER_OF_ROWS; iBlockCounter++) {
            this.drawBlock(iRowCounter, iBlockCounter);
        }
    }
    
    drawBlock(iRowCounter, iBlockCounter) {
        // Set the background
        this.ctx.fillStyle = this.getBlockColour(iRowCounter, iBlockCounter);

        // Draw rectangle for the background
        this.ctx.fillRect(iRowCounter * BLOCK_SIZE, iBlockCounter * BLOCK_SIZE,
            BLOCK_SIZE, BLOCK_SIZE);

        this.ctx.stroke();

        // Draw outline
        this.drawBoardOutline();
    }
    
    getBlockColour(iRowCounter, iBlockCounter) {
        var cStartColour;

        // Alternate the block colour
        if (iRowCounter % 2) {
            cStartColour = (iBlockCounter % 2 ? this.blockColor1 : this.blockColor2);
        } else {
            cStartColour = (iBlockCounter % 2 ? this.blockColor2 : this.blockColor1);
        }

        return cStartColour;
    }
    
    drawTeamOfPieces(teamOfPieces, bBlackTeam, pieces_image) {
        var iPieceCounter;

        // Loop through each piece and draw it on the canvas	
        for (iPieceCounter = 0; iPieceCounter < teamOfPieces.length; iPieceCounter++) {
            this.drawPiece(teamOfPieces[iPieceCounter], bBlackTeam, pieces_image);
        }
    }
    
    drawPieces(teamOfPiecesBlack, teamOfPiecesWhite, pieces_image) {
        this.drawTeamOfPieces(teamOfPiecesBlack, true, pieces_image);
        this.drawTeamOfPieces(teamOfPiecesWhite, false, pieces_image);
    }
    
    drawPiece(curPiece, bBlackTeam, pieces_image) {
        if (curPiece.status == TAKEN){
            console.log("trying to draw taken piece...");
            return;
        }
        var imageBlockSize = 100;
        var imageCoords = this.getImageCoords(curPiece.piece, bBlackTeam, imageBlockSize);

        // Draw the piece onto the canvas
        this.ctx.drawImage(pieces_image,
                           imageCoords.x, imageCoords.y,
                           imageBlockSize, imageBlockSize,
                           curPiece.col * BLOCK_SIZE, curPiece.row * BLOCK_SIZE,
                           BLOCK_SIZE, BLOCK_SIZE);
    }
    
    getImageCoords(pieceCode, bBlackTeam, imageBlockSize) {
        var imageCoords =  {
            "x": pieceCode * imageBlockSize,
            "y": (bBlackTeam ? 0 : imageBlockSize)
        };

        return imageCoords;
    }
    
    
    highlightPossibleMoves(possible_moves){
        //assume selected peice has been set!
        for (var i=0; i<possible_moves.length; i++){
            this.drawOutline(this.possibleMoveColor, possible_moves[i]);
        }
    }
    
    unHighlightPossibleMoves(possible_moves){
        for (var i=0; i<possible_moves.length; i++){
            this.drawBlock(possible_moves[i].col, possible_moves[i].row);
        }
    }
    
    
    setCanvasandContext(canvas){
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }
    
    colorRect(leftX, topY, width, height, drawColor) {
        this.ctx.fillStyle = drawColor;
        this.ctx.fillRect(leftX, topY, width, height);
    }
  
    drawWinScreen(){
        this.colorRect(0,0,this.canvas.width, this.canvas.height, 'black');
        this.ctx.font="30px Arial";
        this.ctx.fillStyle = 'white';
        this.ctx.textBasline = 'middle';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(WINNING_PLAYER + " wins!", this.canvas.width/2, this.canvas.height/4);
        this.ctx.fillText("Click to play again...", this.canvas.width/2, 3*this.canvas.height/4);
    }
    
    drawMenuScreen(){
        this.canvas.removeEventListener('click', board_click);
        this.colorRect(0, 0, this.canvas.width, this.canvas.height, 'black');
        this.ctx.font="30px Arial";
        this.ctx.textBasline = 'middle';
        this.ctx.textAlign = 'center';

        this.OnePlayerButton = {"x":this.canvas.width/8,
                               "y":this.canvas.height/8,
                               "width":3*this.canvas.width/4,
                               "height":1.5*this.canvas.height/8};

        this.TwoPlayerButton = {"x":this.canvas.width/8,
                           "y":5*this.canvas.height/8,
                           "width":3*this.canvas.width/4,
                           "height":1.5*this.canvas.height/8};

        this.ctx.fillStyle = '#debf83';
        this.ctx.fillRect(this.OnePlayerButton.x, this.OnePlayerButton.y,
            this.OnePlayerButton.width, this.OnePlayerButton.height);
        this.ctx.stroke();
        this.ctx.fillRect(this.TwoPlayerButton.x, this.TwoPlayerButton.y,
            this.TwoPlayerButton.width, this.TwoPlayerButton.height);
        this.ctx.stroke();

        this.ctx.fillStyle = 'white';
        this.ctx.fillText("One player Game", this.canvas.width/2, this.canvas.height/4);
        this.ctx.fillText("Two player Game", this.canvas.width/2, 3*this.canvas.height/4);

        this.canvas.addEventListener('click', menu_click, false);
    }

}