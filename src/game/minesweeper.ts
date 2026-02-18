import type { CellState, Coordinate, GameResult, PlayerAction } from "../types";

const GRID_SIZE = 10;
const MINE_COUNT = 15;

const inBounds = ({ x, y }: Coordinate): boolean =>
  x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE;

const forEachNeighbor = (
  coordinate: Coordinate,
  callback: (neighbor: Coordinate) => void,
): void => {
  for (let y = coordinate.y - 1; y <= coordinate.y + 1; y += 1) {
    for (let x = coordinate.x - 1; x <= coordinate.x + 1; x += 1) {
      const neighbor = { x, y };
      if ((x !== coordinate.x || y !== coordinate.y) && inBounds(neighbor)) {
        callback(neighbor);
      }
    }
  }
};

const createEmptyBoard = (): CellState[][] =>
  Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => ({
      hasMine: false,
      adjacentMines: 0,
      display: "hidden" as const,
    })),
  );

const placeMines = (board: CellState[][]): void => {
  let placed = 0;
  while (placed < MINE_COUNT) {
    const x = Math.floor(Math.random() * GRID_SIZE);
    const y = Math.floor(Math.random() * GRID_SIZE);
    const cell = board[y][x];
    if (!cell.hasMine) {
      cell.hasMine = true;
      placed += 1;
    }
  }
};

const computeAdjacency = (board: CellState[][]): void => {
  for (let y = 0; y < GRID_SIZE; y += 1) {
    for (let x = 0; x < GRID_SIZE; x += 1) {
      if (board[y][x].hasMine) {
        continue;
      }
      let count = 0;
      forEachNeighbor({ x, y }, ({ x: nx, y: ny }) => {
        if (board[ny][nx].hasMine) {
          count += 1;
        }
      });
      board[y][x].adjacentMines = count;
    }
  }
};

const floodReveal = (board: CellState[][], coordinate: Coordinate): void => {
  const queue: Coordinate[] = [coordinate];
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      continue;
    }
    const cell = board[current.y][current.x];
    if (cell.display === "revealed" || cell.display === "flagged") {
      continue;
    }
    cell.display = "revealed";
    if (cell.adjacentMines !== 0 || cell.hasMine) {
      continue;
    }
    forEachNeighbor(current, (neighbor) => {
      const neighborCell = board[neighbor.y][neighbor.x];
      if (neighborCell.display === "hidden" && !neighborCell.hasMine) {
        queue.push(neighbor);
      }
    });
  }
};

const revealAllMines = (board: CellState[][]): void => {
  for (let y = 0; y < GRID_SIZE; y += 1) {
    for (let x = 0; x < GRID_SIZE; x += 1) {
      if (board[y][x].hasMine) {
        board[y][x].display = "revealed";
      }
    }
  }
};

const isWinningState = (board: CellState[][]): boolean => {
  for (let y = 0; y < GRID_SIZE; y += 1) {
    for (let x = 0; x < GRID_SIZE; x += 1) {
      const cell = board[y][x];
      if (!cell.hasMine && cell.display !== "revealed") {
        return false;
      }
    }
  }
  return true;
};

export class MinesweeperGame {
  private board: CellState[][];

  private isGameOver: boolean;

  constructor() {
    this.board = createEmptyBoard();
    placeMines(this.board);
    computeAdjacency(this.board);
    this.isGameOver = false;
  }

  public reset(): GameResult {
    this.board = createEmptyBoard();
    placeMines(this.board);
    computeAdjacency(this.board);
    this.isGameOver = false;
    return {
      board: this.board,
      isGameOver: false,
      isWin: false,
      message: "New game started.",
    };
  }

  public getBoard(): CellState[][] {
    return this.board;
  }

  public restoreState(board: CellState[][], gameOver: boolean): void {
    this.board = board;
    this.isGameOver = gameOver;
  }

  public getIsGameOver(): boolean {
    return this.isGameOver;
  }

  public applyAction(action: PlayerAction, coordinate: Coordinate): GameResult {
    if (this.isGameOver) {
      return {
        board: this.board,
        isGameOver: true,
        isWin: false,
        message: "Game already ended. Start a new game.",
      };
    }
    if (!inBounds(coordinate)) {
      return {
        board: this.board,
        isGameOver: false,
        isWin: false,
        message: "Coordinate is outside the 10x10 grid.",
      };
    }

    const cell = this.board[coordinate.y][coordinate.x];
    if (action === "flag") {
      if (cell.display === "revealed") {
        return {
          board: this.board,
          isGameOver: false,
          isWin: false,
          message: "Cannot flag a revealed cell.",
        };
      }
      cell.display = cell.display === "flagged" ? "hidden" : "flagged";
      return {
        board: this.board,
        isGameOver: false,
        isWin: false,
        message:
          cell.display === "flagged"
            ? `Flagged (${coordinate.x}, ${coordinate.y}).`
            : `Removed flag from (${coordinate.x}, ${coordinate.y}).`,
      };
    }

    if (cell.display === "flagged") {
      return {
        board: this.board,
        isGameOver: false,
        isWin: false,
        message: "Cell is flagged. Unflag before testing.",
      };
    }
    if (cell.hasMine) {
      revealAllMines(this.board);
      this.isGameOver = true;
      return {
        board: this.board,
        isGameOver: true,
        isWin: false,
        message: `Mine hit at (${coordinate.x}, ${coordinate.y}). Game over.`,
      };
    }

    floodReveal(this.board, coordinate);
    const isWin = isWinningState(this.board);
    this.isGameOver = isWin;
    return {
      board: this.board,
      isGameOver: isWin,
      isWin,
      message: isWin ? "All safe cells revealed. You win." : "Cell tested.",
    };
  }
}

export const GRID_DIMENSION = GRID_SIZE;
