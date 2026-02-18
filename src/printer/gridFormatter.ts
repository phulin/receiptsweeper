import { GRID_DIMENSION } from "../game/minesweeper";
import type { CellState, PrintedGrid } from "../types";

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

export interface FormattedReceipt {
	boardLines: string[];
	footerLines: string[];
}

export const formatPrintedGrid = (print: PrintedGrid): FormattedReceipt => {
	const topAxis = `   ${Array.from({ length: GRID_DIMENSION }, (_, i) => i).join(" ")}`;
	const boardLines = [topAxis];
	for (let y = 0; y < GRID_DIMENSION; y += 1) {
		const row = print.boardLines[y];
		const label = String.fromCharCode(65 + y); // A-J
		boardLines.push(` ${label} ${row}`);
	}
	const footerLines = [
		`ACTION: ${print.action.toUpperCase()} @ ${String.fromCharCode(65 + print.coordinate.y)}${print.coordinate.x}`,
		`STATUS: ${print.statusLine}`,
		`TIME: ${print.timestamp}`,
	];
	return { boardLines, footerLines };
};

export const boardToReceiptRows = (board: CellState[][]): string[] =>
	board.map((row) => row.map((cell) => cellToken(cell)).join(" "));
