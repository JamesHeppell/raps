class DisplayMoveList{

    constructor(){
        this.listdiv = null;
    }
    
    
    writeNextMove(move){
        this.listdiv = document.getElementById('moveList');
        
        var moveText = "(" + move.from.row + ", " + move.from.col + ")" +
                        "  to  (" + move.to.row + ", " + move.to.col + ")";
        console.log(moveText);
        
        var node = document.createElement("LI");
        var textnode = document.createTextNode(moveText);
        node.appendChild(textnode);
        console.log(this.listdiv);
        this.listdiv.appendChild(node);

    }
    
    resetMoveList(){
        this.listdiv = document.getElementById('moveList');

        while(this.listdiv.firstChild){
            this.listdiv.removeChild(this.listdiv.firstChild)
        }
    }
    
    removeLastMove(){
        var move = null;
        this.listdiv = document.getElementById('moveList')
        var notation = this.listdiv.lastChild.innerHTML;
        console.log("Removing move from Move list display: " + notation);
        this.listdiv.removeChild(this.listdiv.lastChild);
    }
    
}