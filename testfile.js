function scoreBoard(jsonPieces, boardSize){
    //Score is positive for white team winning and negative for black team winning
    var score = 0;
    var winValue = 1000;
    
    score += 100 * scoreNumberOfPieces(jsonPieces);
    
    score += scoreMovementToOtherSide(jsonPieces, boardSize);
    
    score += scoreWinPosition(jsonPieces, boardSize, winValue);
    
    console.log("The score of the board is " + score);
    return score;
}


function scoreNumberOfPieces(jsonPieces){
    var blackPieceCount = 0;
    var whitePieceCount = 0;
    for (var i=0; i<jsonPieces.white.length; i++){
        if(jsonPieces.white[i].status == 0){//In play
            whitePieceCount++;
        } 
        if(jsonPieces.black[i].status == 0){//In play
            blackPieceCount++;
        }    
    }
    
    console.log("Number of white peices is " + whitePieceCount);
    console.log("Number of black peices is " + blackPieceCount);
    return whitePieceCount - blackPieceCount;
}

function scoreMovementToOtherSide(jsonPieces, boardSize){
    var scoreWhiteMovement = 0;
    var scoreBlackMovement = 0
    for (var i=0; i<jsonPieces.white.length; i++){
        if(jsonPieces.white[i].status == 0){//In play
            scoreWhiteMovement += jsonPieces.white[i].row;
        } 
        if(jsonPieces.black[i].status == 0){//In play
            scoreBlackMovement += (boardSize - 1 - jsonPieces.black[i].row);
        }    
    }
    return scoreWhiteMovement - scoreBlackMovement;
}


function scoreWinPosition(jsonPieces, boardSize, winValue){
    //assume white is at the top ie.e. row = 0
    var winScore = 0;
    for (var i=0; i<jsonPieces.white.length; i++){
        if(jsonPieces.white[i].status == 0 && 
           jsonPieces.white[i].row == boardSize -1){//In play and on win row
            winScore = winValue;
        } 
        if(jsonPieces.black[i].status == 0 && 
           jsonPieces.black[i].row == 0){//In play and on win row
            winScore = -winValue;
        }    
    }
    return winScore;
}


function getForcedMoves(piece){
    var forcedMovesForTeam = [];
    for (var jrow = -2; jrow<4; jrow+=2){
        for (var jcol = -2; jcol<4; jcol+=2){
            var rowToConsider = piece.row + jrow;
            var colToConsider = piece.col + jcol;
            if (rowToConsider < 0 || 
                rowToConsider >= NUMBER_OF_ROWS || 
                colToConsider < 0 || 
                colToConsider >= NUMBER_OF_COLS ||
                (jrow == 0 && jcol == 0)){
                // not a valid block to consider
            } else{
                //check if block is empty, and inbetween is occupied
                var blockPos = {"row":rowToConsider, "col":colToConsider};
                var midRow = (rowToConsider + piece.row)/2;
                var midCol = (colToConsider + piece.col)/2;
                var midPos = {"row":midRow, "col":midCol};
                if (!blockOccupied(blockPos) && blockOccupiedByEnemy(midPos)){
                    forcedMovesForTeam.push(piece);  
                }
            }
        }
    }  
    
    return forcedMovesForTeam;
}


class Board{
    constructor(size){
        this.size = size;
        this.json = null;
    }
    
    getSize(){
        return this.size;
    }
    
    setPositions(_json){
        this.json = _json;
    }
    
    getTotalMovesForPlayer(current_turn){
        var possible_moves = this.getPossibleMovesForPlayer(current_turn);
        var iPieceCounter = null,
            moveCount = 0;
        for (iPieceCounter = 0; iPieceCounter < possible_moves.length; iPieceCounter++) {
                moveCount += possible_moves[iPieceCounter].moves.length;
        }
        
        return moveCount
    }
    
    getPossibleMovesForPlayer(current_turn){
        var teamOfPieces = this.getPiecesInPlay(current_turn);
        
        var iPieceCounter = null,
        curPiece = null,
        possible_moves_for_piece=[],
        iMoveCounter=null,
        possible_moves=[],
        possible_moves_values=null,
        isForced = false,
        foundForcedMoves = false;
        
        //first iterate to find is there are forced moves and set foundForcedMoves
        for (iPieceCounter = 0; iPieceCounter < teamOfPieces.length; iPieceCounter++) {
                curPiece = teamOfPieces[iPieceCounter];
                possible_moves_values = this.getPossibleMovesForPiece(curPiece);
                isForced = possible_moves_values.isForced;
                if (isForced){
                    foundForcedMoves = true;
                    iPieceCounter = teamOfPieces.length
                }
        }
        
        //now iterate to add in moves, only forced if some exist.
        for (iPieceCounter = 0; iPieceCounter < teamOfPieces.length; iPieceCounter++) {
                curPiece = teamOfPieces[iPieceCounter];
                possible_moves_values = this.getPossibleMovesForPiece(curPiece);
                possible_moves_for_piece = possible_moves_values.moves;
                isForced = possible_moves_values.isForced;
                if (foundForcedMoves){
                    if (isForced && possible_moves_for_piece.length > 0){
                        possible_moves.push({"piece":curPiece,"moves":[]});
                        for(iMoveCounter = 0; iMoveCounter < possible_moves_for_piece.length; iMoveCounter++) {
                            possible_moves[possible_moves.length-1].moves.push(possible_moves_for_piece[iMoveCounter])
                        }  
                    }
                }else{ 
                    possible_moves.push({"piece":curPiece,"moves":[]});
                    for(iMoveCounter = 0; iMoveCounter < possible_moves_for_piece.length; iMoveCounter++) {
                        possible_moves[iPieceCounter].moves.push(possible_moves_for_piece[iMoveCounter])
                    }   
                }
        }
        
        return possible_moves;
    }
    
    getPiecesInPlay(current_turn){
        var teamPiecesInPlay = [];
        
        if (current_turn == WHITE_TEAM){
            for (var iPieceCounter = 0; iPieceCounter < this.json.white.length; iPieceCounter++) {
                var curPiece = this.json.white[iPieceCounter];
                if (curPiece.status === IN_PLAY){
                    teamPiecesInPlay.push(curPiece);
                }
            }
        }else{
            for (var iPieceCounter = 0; iPieceCounter < this.json.black.length; iPieceCounter++) {
                var curPiece = this.json.black[iPieceCounter];
                if (curPiece.status === IN_PLAY){
                    teamPiecesInPlay.push(curPiece);
                }
            }
        }
        
        return teamPiecesInPlay;
    }
    
    getPossibleMovesForPiece(piece){
        //assume selected peice has been set!
        var possible_moves = [];
        var moves=[],
            iPieceCounter=null,
            curMove=null;

        //check jumping enemy piece first, if you can you must!
        moves = this.getCaptureMoves(piece);
        for (iPieceCounter = 0; iPieceCounter < moves.length; iPieceCounter++) {
            curMove = moves[iPieceCounter];
            possible_moves.push(curMove);
        }
        
        if (possible_moves.length > 0){
            return {"moves": possible_moves,
                    "isForced": true};
        }

        //check single moves 3 by 3 grid
        moves = this.getSingleMoves(piece);
        for (iPieceCounter = 0; iPieceCounter < moves.length; iPieceCounter++) {
            curMove = moves[iPieceCounter];
            possible_moves.push(curMove);
        }
        
        //check jumping non enemy pieces (done by extension as would already return)
        moves = this.getJumpingMoves(piece);
        for (iPieceCounter = 0; iPieceCounter < moves.length; iPieceCounter++) {
            curMove = moves[iPieceCounter];
            possible_moves.push(curMove);
        }
        
        
        return {"moves": possible_moves,
                "isForced": false};
    }
    
    getJumpingMoves(piece){
        var moves=[];
        for (var jrow = -2; jrow<4; jrow+=2){
            for (var jcol = -2; jcol<4; jcol+=2){
                var rowToConsider = piece.row + jrow;
                var colToConsider = piece.col + jcol;
                if (rowToConsider < 0 || 
                    rowToConsider >= NUMBER_OF_ROWS || 
                    colToConsider < 0 || 
                    colToConsider >= NUMBER_OF_COLS ||
                    (jrow == 0 && jcol == 0)){
                    // not a valid block to consider
                } else{
                    //check if block is empty, and inbetween is occupied
                    var blockPos = {"row":rowToConsider, "col":colToConsider};
                    var midRow = (rowToConsider + piece.row)/2;
                    var midCol = (colToConsider + piece.col)/2;
                    var midPos = {"row":midRow, "col":midCol};
                    if (!this.isblockOccupied(blockPos) && this.isblockOccupied(midPos)){
                        moves.push(blockPos);
                    }
                }
            }
        }  
        return moves;
    }
    
    getSingleMoves(piece){
        var moves=[];
        for (var row = -1; row<2; row++){
            for (var col = -1; col<2; col++){
                var rowToConsider = piece.row + row;
                var colToConsider = piece.col + col;
                if (rowToConsider < 0 || 
                    rowToConsider >= NUMBER_OF_ROWS || 
                    colToConsider < 0 || 
                    colToConsider >= NUMBER_OF_COLS ||
                    (row == 0 && col == 0)){
                    // not a valid block to consider
                } else{
                    //check if block is empty, if yes add to moves
                    var blockPos = {"row":rowToConsider, "col":colToConsider};
                    if (!this.isblockOccupied(blockPos)){
                        moves.push(blockPos);
                    }
                }
            }
        }
        return moves;
    }
    
    
    getCaptureMoves(piece){
        var moves = [];
        
        for (var jrow = -2; jrow<4; jrow+=2){
            for (var jcol = -2; jcol<4; jcol+=2){
                var rowToConsider = piece.row + jrow;
                var colToConsider = piece.col + jcol;
                if (rowToConsider < 0 || 
                    rowToConsider >= NUMBER_OF_ROWS || 
                    colToConsider < 0 || 
                    colToConsider >= NUMBER_OF_COLS ||
                    (jrow == 0 && jcol == 0)){
                    // not a valid block to consider
                } else{
                    //check if block is empty, and inbetween is occupied
                    var blockPos = {"row":rowToConsider, "col":colToConsider};
                    var midRow = (rowToConsider + piece.row)/2;
                    var midCol = (colToConsider + piece.col)/2;
                    var midPos = {"row":midRow, "col":midCol};
                    if (!this.isblockOccupied(blockPos) && this.isblockOccupiedByEnemy(midPos)){
                        moves.push(blockPos);
                    }
                }
            }
        }
        
        return moves;
    }
    
    isblockOccupiedByEnemy(blockPos) {
        var team = (currentTurn === BLACK_TEAM ? this.json.white : this.json.black);

        return this.getPieceAtBlockForTeam(team, blockPos);
    }


    isblockOccupied(blockPos) {
        var pieceAtBlock = this.getPieceAtBlockForTeam(this.json.black, blockPos);

        if (pieceAtBlock === null) {
            pieceAtBlock = this.getPieceAtBlockForTeam(this.json.white, blockPos);
        }

        return (pieceAtBlock !== null);
    }  
    
    getPieceAtBlockForTeam(teamOfPieces, blockPos) {

        var curPiece = null,
            iPieceCounter = 0,
            pieceAtBlock = null;

        for (iPieceCounter = 0; iPieceCounter < teamOfPieces.length; iPieceCounter++) {

            curPiece = teamOfPieces[iPieceCounter];

            if (curPiece.status === IN_PLAY &&
                    curPiece.col === blockPos.col &&
                    curPiece.row === blockPos.row) {
                curPiece.position = iPieceCounter;

                pieceAtBlock = curPiece;
                iPieceCounter = teamOfPieces.length;
            }
        }

        return pieceAtBlock;
    }
    
    setDefaultPositions(){
        this.json = {
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
    
    
    
}



