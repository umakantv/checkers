const BLACK = 'BLACK';
const WHITE = 'WHITE';

/**
 * MOVE TYPES
 */
const KILL = 'KILL';
const MOVE = 'MOVE';

const size = 8;

let puckIdCounter = 1;

class Puck {

    constructor(type, i, j) {
  
      /**
       * type BLACK/WHITE
       *     
       * White - walks down
       * Black - walks up
       */
      this.type = type;
      this.id = puckIdCounter;
      puckIdCounter++;
  
      this.alive = true;
  
      this.row = i;
      this.col = j;
  
      this.hasUpgraded = false;
      this.killPossible = false;
      this.possibleMoves = [];
    }
  
    /**
     * 
     * return 0 if not possible - due to out of bounds  
     * returns 1 if move possible  
     * return 2 if kill possible  
     * 
     * @param {number} i 
     * @param {number} j 
     * @returns {number}
     */
    checkMove(i, j) {
  
          if(checkBounds(i, j) == false) {
  
              return 0;
          } if(game.pucks[i][j] == null) {
  
              return 1;
          } else if(game.pucks[i][j].type != this.type) {
  
              // if different puck 
              var diffx = i - this.row, diffy = j - this.col;
              var p = i + diffx, q = j + diffy;
              if(checkBounds(p, q) && game.pucks[p][q] == null) {
                  this.killPossible = true;
                  return 2;
              }
          }
          return 0;
    }
  
    updatePossibleMoves() {
      this.possibleMoves = [];
      this.killPossible = false;
  
      let t = [];
  
      if(this.hasUpgraded) {
          t = [
              [Number(this.row) - 1, Number(this.col) - 1], 
              [Number(this.row) - 1, Number(this.col) + 1], 
              [Number(this.row) + 1, Number(this.col) - 1], 
              [Number(this.row) + 1, Number(this.col) + 1]
          ];
      } else if (this.type === WHITE) {
          t = [
              [Number(this.row) + 1, Number(this.col) - 1], 
              [Number(this.row) + 1, Number(this.col) + 1]
          ];
      } else {
          t = [
              [Number(this.row) - 1, Number(this.col) - 1], 
              [Number(this.row) - 1, Number(this.col) + 1]
          ];
      }
  
      t.forEach(pos => {
  
        var flag = this.checkMove(pos[0], pos[1]);
  
        if(flag == 1) {
  
          this.possibleMoves.push({
              row: pos[0],
              col: pos[1],
              type: MOVE,
          });
  
        } else if(flag == 2) {
  
          // We jump over the opponent
          var  i = pos[0], j = pos[1];
          var diffx = i - this.row, diffy = j - this.col;
          var p = i + diffx, q = j + diffy;
          this.possibleMoves.push({
              row: p,
              col: q,
              type: KILL,
          });
  
          this.killPossible = true;
        }
      });
      
    }
  
    isKillPossible() {
  
      return this.killPossible;
    }
}

class Player {
    constructor(type) {
        this.type = type;
        this.pucks = [];
        this.killPossible = false;
    }

    evaluatePucks() {

        this.killPossible = false;

        this.pucks.forEach((puck) => {
            if (puck.alive) {
                puck.updatePossibleMoves();
                if (puck.killPossible) {
                    this.killPossible = true;
                }
            } else {
                puck.killPossible = false;
            }
        });
    }
}

class Game {
    constructor() {
        this.ended = false;
        this.cells = [];

        /* contains the Puck class object */
        this.activeCell = null;

        this.players = [new Player(BLACK), new Player(WHITE)];

        /* Contains the id of the active player */
        this.activePlayer = WHITE;

        /* restriction on  */
        this.killPossible = false;

        /**
         * Contains object of class Puck
         */
        this.pucks = [];

        this.init();

    }

    updatePossibleMoves() {

        this.players[0].evaluatePucks();
        this.players[1].evaluatePucks();

        const activePlayer = this.activePlayer === BLACK ? this.players[0] : this.players[1];

        this.killPossible = activePlayer.killPossible;
    }

    init() {

        /**
         * Prepare initial cell states
         */
        for(let i = 0; i < size; ++i) {

            const cellRows = new Array(8);

            for(let j = 0; j < size; ++j) {
                cellRows[j] = {
                    row: i,
                    col: j,
                    puck: null,
                    killPossible: false,
                    selected: false,
                    highlighted: false,
                };
            }

            this.cells.push(cellRows);

            const pucks = new Array(8).fill(null);
            this.pucks.push(pucks);
        }

        /**
         * Add initial positions for Player 1
         */
        for(var i = 0; i < 3; ++i) {
            for(var j = 0; j < size; ++j) {
                if((i+j)%2 == 0) {

                    const puck = new Puck(WHITE, i, j);

                    this.cells[i][j].puck = puck;

                    this.pucks[i][j] = puck;

                    this.players[1].pucks.push(puck);
                }
            }
        }

        /**
         * Add initial positions for Player 2
         */
        for(var i = 5; i < size; ++i) {
            for(var j = 0; j < size; ++j) {
                if((i+j)%2 == 0) {

                    const puck = new Puck(BLACK, i, j);

                    this.cells[i][j].puck = puck;

                    this.pucks[i][j] = puck;

                    this.players[0].pucks.push(puck);
                }
            }
        }

        this.renderGrid();
    }

    renderGrid() {

        const grid = document.createElement('div');
        grid.classList.add('grid');
    
        for(let i = 0; i < size; ++i) {

            const row = document.createElement('div');
            row.classList.add('row');
            
            for(let j = 0; j < size; ++j) {
                const cell = this.cells[i][j];
                const button = this.createCellElement(i, j, cell);

                row.appendChild(button);
            }
            grid.appendChild(row);
        }

        document.querySelector('#grid-container').innerHTML = '';
        document.querySelector('#grid-container').appendChild(grid);
    }

    /**
     * 
     * Handles click on each cell.
     * 
     * We 
     */
    handleClick = (e) => {

        if(this.ended) return;

        let pos = e.target.getAttribute('data-target').split(' ');
        let i = Number(pos[0]), j = Number(pos[1]);
        let cell = this.cells[i][j];

        console.log(`Clicked ${i} ${j}`, cell);

        const puck = cell.puck;

        /**
         * If cell has puck, then we are selecting a puck to move
         * 
         * Otherwise we are selecting a position to move
         */
        if (puck) {

            console.log(`Clicked cell has puck`, puck);

            /**
             * Active player can select only those puck that belongs to them
             */
            if (puck.type !== this.activePlayer) {

                console.log(`Puck belongs to opponent`);

                return;
            }

            // puck.updatePossibleMoves();

            /**
             * TBD
             * If there is a kill possible by some puck, only those pucks can be selected
             */
            if (this.killPossible)
            {
                if (!puck.isKillPossible()) {
                    console.log('Select a puck that has a possible kill')
                    return;
                }
            }

            this.toggleSelectCell(i, j);

        } else if (cell.highlighted) {
            console.log('Moving puck', cell);

            this.movePuck(this.activeCell, cell);
        }
    }

    killPuck(cell) {
        let {row, col, puck} = cell;

        this.pucks[row][col] = null;

        // Remove the puck from the player
        let player = puck.type === BLACK ? this.players[0] : this.players[1];

        let position = player.pucks.findIndex(currentPuck => (currentPuck.id === puck.id));

        player.pucks.splice(position, 1);

        cell.puck = null;
    }

    movePuck(fromCell, toCell) {

        const {row: fromRow, col: fromCol, puck} = fromCell;
        const {row: toRow, col: toCol} = toCell;

        let valid = false;

        puck.possibleMoves.forEach(move => {
            if (move.row === toRow && move.col === toCol) {
                valid = true;
            }
        })

        if (!valid) {
            console.log('Invalid move')
            return;
        }

        // console.log(puck)

        toCell.puck = puck;
        fromCell.puck = null;

        puck.row = toRow;
        puck.col = toCol;

        // console.log(fromCell, toCell);
        // console.log(game.cells[fromRow][fromCol], game.cells[toRow][toCol]);

        this.pucks[fromRow][fromCol] = null;
        this.pucks[toRow][toCol] = puck;

        if (puck.type === WHITE && toRow === size - 1) {
            puck.hasUpgraded = true;
        } else if (puck.type === BLACK && toRow === 0) {
            puck.hasUpgraded = true;
        }

        let killPossible = puck.killPossible;

        if (puck.killPossible) {

            var killRow = (fromRow + toRow) / 2;
            let killCol = (fromCol + toCol) / 2;

            console.log(fromRow, toRow, killRow)
            console.log(fromCol, toCol, killCol)

            console.log('Killing puck at cell', killRow, killCol);

            this.killPuck(this.cells[killRow][killCol]);
        }

        
        if (killPossible) {

            const activePlayer = this.activePlayer === BLACK ? this.players[0] : this.players[1];

            // Evaluate the kill possible for current player
            activePlayer.evaluatePucks();

            // If the kill is possible with the same puck
            if (!puck.isKillPossible()) {
                this.activePlayer = this.activePlayer === BLACK ? WHITE : BLACK;
            }
        } else {

            this.activePlayer = this.activePlayer === BLACK ? WHITE : BLACK;
        }

        this.updatePossibleMoves();

        this.activeCell = null;

        this.removeHighlight();
        this.renderGrid();

        let winner = this.checkWin()

        if (winner) {
            console.log('Winner', winner);

            alert(winner.toLocaleUpperCase() + ' wins.')

        }
    }

    checkWin() {

        let count = [this.players[0].pucks.length, this.players[1].pucks.length];

        if(count[0] && count[1]) return false;

        else if(count[0]) return BLACK;

        else return WHITE;
    }

    removeHighlight() {

        /**
         * Remove all previous highlights
         */
        this.cells.forEach(row => {
            row.forEach(cell => {
                cell.highlighted = false;
            })
        })
    }

    toggleSelectCell(i, j) {

        this.removeHighlight();

        const cell = this.cells[i][j];

        this.activeCell = cell;

        const {puck} = cell;

        console.log(puck)

        let { possibleMoves } =  puck;

        if (puck.isKillPossible()) {
            possibleMoves = possibleMoves.filter(move => move.type === KILL);
        }

        if (possibleMoves) {
            possibleMoves.forEach(possibleMove => {
                const {row, col} = possibleMove;
                this.cells[row][col].highlighted = true;
            })
        }

        this.renderGrid();
    }

    createCellElement(i, j, cell) {
        const button = document.createElement('button');
        button.classList.add('cell');

        /**
         * White cells are not selectable
         * Make only dark cells clickable
         */
        if((i+j) % 2 == 0) {
            const span = document.createElement('span');
            span.classList.add('puck');
            span.setAttribute('data-target', `${i} ${j}`);

            /**
             * We need to allow click on these cells
             */
            button.addEventListener('click', this.handleClick);

            button.appendChild(span);
        }

        if (cell.puck) {
            const puck = cell.puck;

            button.classList.add('has-puck');

            if (puck.type === WHITE) {
                button.classList.add('white');
            } else {
                button.classList.add('black');
            }
            if (puck.hasUpgraded) {
                button.classList.add('king');
            } 
            if(puck.type == this.activePlayer && puck.killPossible) {
                button.classList.add('killPossible');
            }

        } else {
            if (cell.highlighted) {
                button.classList.add('highlight')
            }
        }

        return button;
    }
}

function checkBounds(i, j) {
    if(i < 0 || i > size - 1 || j < 0 || j > size - 1) {
      return false;
    }
    return true;
}

let game;

function startGame() {
    game = new Game();
    game.updatePossibleMoves();
}

startGame();

document.getElementById('restart').addEventListener('click', startGame)
