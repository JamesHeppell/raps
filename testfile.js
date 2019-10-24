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



