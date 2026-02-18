import type { CellState, PrintedGrid } from "../types";
import { GRID_DIMENSION } from "../game/minesweeper";

const cellToken = (cell: CellState): string => {
  if (cell.display === "flagged") {
    return "F";
  }
  if (cell.display === "hidden") {
    return ".";
  }
  if (cell.hasMine) {
    return "*";
  }
  return cell.adjacentMines === 0 ? " " : `${cell.adjacentMines}`;
};

export const formatPrintedGrid = (print: PrintedGrid): string[] => {
  const topAxis = `   ${Array.from({ length: GRID_DIMENSION }, (_, i) => i).join(" ")}`;
  const lines = [topAxis];
  for (let y = 0; y < GRID_DIMENSION; y += 1) {
    const row = print.boardLines[y];
    const label = String.fromCharCode(65 + y); // A-J
    lines.push(` ${label} ${row}`);
  }
  lines.push(`ACTION: ${print.action.toUpperCase()} @ (${print.coordinate.x},${print.coordinate.y})`);
  lines.push(`STATUS: ${print.statusLine}`);
  lines.push(`TIME: ${print.timestamp}`);
  return lines;
};

export const boardToReceiptRows = (board: CellState[][]): string[] =>
  board.map((row) => row.map((cell) => cellToken(cell)).join(" "));
