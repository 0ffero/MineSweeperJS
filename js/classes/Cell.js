"use strict"
let Cell = class {
    constructor(_col, _row, _width) {

        this.col = _col;
        this.row = _row;
        this.w = _width;
        this.x = this.col * this.w;
        this.y = this.row * this.w;

        this.init();
    }

    init() {
        this.neighbourCount = 0;
    
        this.mine = !1;
        this.revealed = !1;
    }

    countMines() {
        if (this.mine) { this.neighbourCount = -1; return; }

        let grid = vars.game.grid;

        let total = 0;
        let cols = vars.boardSize.width;
        let rows = vars.boardSize.height;

        for (let xoff = -1; xoff <= 1; xoff++) {
            let col = this.col + xoff;
            if (col < 0 || col >= cols) continue;
    
            for (let yoff = -1; yoff <= 1; yoff++) {
                let row = this.row + yoff;
                if (row < 0 || row >= rows) continue;
    
                var neighbor = grid[col][row];
                neighbor.mine ? total++ : null;
            };
        };
        this.neighbourCount = total;
    }

    floodFill() {
        let cols = vars.boardSize.width;
        let rows = vars.boardSize.height;
        let grid = vars.game.grid;

        for (let xoff = -1; xoff <= 1; xoff++) {
            let col = this.col + xoff;
            if (col < 0 || col >= cols) continue;
      
            for (let yoff = -1; yoff <= 1; yoff++) {
                let row = this.row + yoff;
                if (row < 0 || row >= rows) continue;
      
                var neighbor = grid[col][row];
                !neighbor.revealed ? neighbor.reveal() : null;
            };
        };
    }

    reveal() {
        this.revealed = !0;

        // show the actual tile above this
        let c = vars.containers.unclicked;
        let rV = vars.reveal;
        let positionPiece = c.getByName(`boardPosition_${this.col}_${this.row}`);
        if (positionPiece.alpha===1) { // the alpha is still 1, fade it out
            rV.count++;
            rV.revealing.push(positionPiece);
        };
        if (this.mine) return 'dead'; // if this is a mine ignore the flood fill below, as we do it externally for every tile

        vars.game.visibleCount.update();

        !this.neighbourCount ? this.floodFill() : null;
    }
};