class Board {
    constructor(size = 8) {
        this.size = size;
        this.grid = Array(size).fill(null).map(() => Array(size).fill(null));
    }

    reset() {
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                this.grid[r][c] = null;
            }
        }
    }

    isValidCoord(r, c) {
        return r >= 0 && r < this.size && c >= 0 && c < this.size;
    }

    canPlace(shape, startRow, startCol) {
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c]) {
                    const targetR = startRow + r;
                    const targetC = startCol + c;
                    if (!this.isValidCoord(targetR, targetC)) {
                        return false;
                    }
                    if (this.grid[targetR][targetC] !== null) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    place(shape, startRow, startCol, color, texture) {
        let placedCount = 0;
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c]) {
                    this.grid[startRow + r][startCol + c] = { color, texture };
                    placedCount++;
                }
            }
        }
        return placedCount;
    }

    findCompletedLines() {
        const completedRows = [];
        const completedCols = [];

        // Check rows
        for (let r = 0; r < this.size; r++) {
            let full = true;
            for (let c = 0; c < this.size; c++) {
                if (!this.grid[r][c]) {
                    full = false;
                    break;
                }
            }
            if (full) completedRows.push(r);
        }

        // Check cols
        for (let c = 0; c < this.size; c++) {
            let full = true;
            for (let r = 0; r < this.size; r++) {
                if (!this.grid[r][c]) {
                    full = false;
                    break;
                }
            }
            if (full) completedCols.push(c);
        }

        return { rows: completedRows, cols: completedCols };
    }

    clearLines(completed) {
        const clearedCells = new Set();

        completed.rows.forEach(r => {
            for (let c = 0; c < this.size; c++) {
                clearedCells.add(`${r},${c}`);
            }
        });

        completed.cols.forEach(c => {
            for (let r = 0; r < this.size; r++) {
                clearedCells.add(`${r},${c}`);
            }
        });

        const clearedList = [];
        clearedCells.forEach(coord => {
            const [r, c] = coord.split(',').map(Number);
            const block = this.grid[r][c];
            clearedList.push({ r, c, block });
            this.grid[r][c] = null;
        });

        return clearedList;
    }

    canPieceFit(shape) {
        for (let r = 0; r <= this.size - shape.length; r++) {
            for (let c = 0; c <= this.size - shape[0].length; c++) {
                if (this.canPlace(shape, r, c)) {
                    return true;
                }
            }
        }
        return false;
    }

    hasAnyMove(pieces) {
        for (const p of pieces) {
            if (p && this.canPieceFit(p.shape)) {
                return true;
            }
        }
        return false;
    }
}
