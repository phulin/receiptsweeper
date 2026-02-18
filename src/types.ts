export type CellDisplay = "hidden" | "revealed" | "flagged";

export interface CellState {
  hasMine: boolean;
  adjacentMines: number;
  display: CellDisplay;
}

export interface Coordinate {
  x: number;
  y: number;
}

export type PlayerAction = "test" | "flag";

export interface GameResult {
  board: CellState[][];
  isGameOver: boolean;
  isWin: boolean;
  message: string;
}

export interface PrintedGrid {
  action: PlayerAction;
  coordinate: Coordinate;
  boardLines: string[];
  statusLine: string;
  timestamp: string;
}
