import "./styles.css";
import { GRID_DIMENSION, MinesweeperGame } from "./game/minesweeper";
import { boardToReceiptRows, formatPrintedGrid } from "./printer/gridFormatter";
import { VirtualReceiptPrinterApi } from "./printer/printerApi";
import type { Coordinate, PlayerAction, PrintedGrid } from "./types";

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) {
  throw new Error("App container not found.");
}

const game = new MinesweeperGame();
const feed: PrintedGrid[] = [];

const state = {
  status: "Enter a coordinate and action to start.",
  gameOver: false,
};

const nowStamp = (): string => new Date().toLocaleTimeString();

const getCoordinate = (): Coordinate | null => {
  const input = document.querySelector<HTMLInputElement>("#coord-input");
  if (!input) return null;
  const raw = input.value.trim().toUpperCase();
  // Accept formats like "A3" (row-col) or "3A" (col-row)
  const match = raw.match(/^([A-J])(\d)$/) ?? raw.match(/^(\d)([A-J])$/);
  if (!match) return null;
  const letter = match[1].match(/[A-J]/) ? match[1] : match[2];
  const digit = match[1].match(/\d/) ? match[1] : match[2];
  const y = letter.charCodeAt(0) - 65;
  const x = Number.parseInt(digit, 10);
  if (x < 0 || x >= GRID_DIMENSION || y < 0 || y >= GRID_DIMENSION) return null;
  return { x, y };
};

const getAction = (): PlayerAction => {
  const selected = document.querySelector<HTMLInputElement>(
    "input[name='action']:checked",
  );
  return selected?.value === "flag" ? "flag" : "test";
};

const printer = new VirtualReceiptPrinterApi((snapshot) => {
  feed.push(snapshot);
  render();
  const paper = document.querySelector<HTMLElement>(".printer-paper");
  if (paper) {
    paper.scrollTop = 0;
  }
});

const printBoard = async (action: PlayerAction, coordinate: Coordinate): Promise<void> => {
  const snapshot: PrintedGrid = {
    action,
    coordinate,
    boardLines: boardToReceiptRows(game.getBoard()),
    statusLine: state.status,
    timestamp: nowStamp(),
  };
  await printer.printGrid(snapshot);
};

const onSubmitAction = async (event: SubmitEvent): Promise<void> => {
  event.preventDefault();
  const coordinate = getCoordinate();
  const action = getAction();

  if (!coordinate) {
    state.status = "Enter a cell like A3 or 5B.";
    render();
    return;
  }

  const result = game.applyAction(action, coordinate);
  state.status = result.message;
  state.gameOver = result.isGameOver;
  await printBoard(action, coordinate);
};

const onNewGame = async (): Promise<void> => {
  const result = game.reset();
  state.status = result.message;
  state.gameOver = false;
  feed.length = 0;
  await printBoard("test", { x: 0, y: 0 });
};

const renderFeed = (): string =>
  [...feed]
    .map((entry, idx) => {
      const lines = formatPrintedGrid(entry);
      const lineHtml = lines.map((line) => `<div>${line}</div>`).join("");
      return { idx, html: `<article class="receipt-strip"><header>#${idx + 1}</header>${lineHtml}</article>` };
    })
    .reverse()
    .map((e) => e.html)
    .join("");

const render = (): void => {
  app.innerHTML = `
    <main class="layout">
      <form id="action-form" class="command-bar">
        <div class="input-group">
          <input id="coord-input" type="text" placeholder="A3" maxlength="3" required autocomplete="off" />
          <div class="action-toggle">
            <input type="radio" name="action" value="test" id="act-test" checked />
            <label for="act-test">Test</label>
            <input type="radio" name="action" value="flag" id="act-flag" />
            <label for="act-flag">Flag</label>
          </div>
          <button type="submit" ${state.gameOver ? "disabled" : ""}>Print</button>
        </div>
        <button type="button" id="new-game" class="btn-new">New Game</button>
        ${state.status ? `<p class="status">${state.status}</p>` : ""}
      </form>

      <section class="printer-shell">
        <div class="printer-body">
          <svg class="printer-svg" viewBox="0 0 400 120" xmlns="http://www.w3.org/2000/svg">
            <!-- Main body -->
            <rect x="0" y="20" width="400" height="100" rx="10" fill="#2a2a2a" />
            <!-- Top ridge -->
            <rect x="10" y="14" width="380" height="16" rx="4" fill="#333" />
            <!-- Paper slot -->
            <rect x="40" y="20" width="320" height="6" rx="2" fill="#111" />
            <!-- Status light -->
            <circle cx="50" cy="60" r="5" fill="#4a4">
              <animate attributeName="opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite" />
            </circle>
            <!-- (label removed) -->
            <!-- Decorative vents -->
            <rect x="300" y="50" width="60" height="2" rx="1" fill="#222" />
            <rect x="300" y="56" width="60" height="2" rx="1" fill="#222" />
            <rect x="300" y="62" width="60" height="2" rx="1" fill="#222" />
            <rect x="300" y="68" width="60" height="2" rx="1" fill="#222" />
            <!-- Bottom feet -->
            <rect x="30" y="116" width="40" height="4" rx="2" fill="#1a1a1a" />
            <rect x="330" y="116" width="40" height="4" rx="2" fill="#1a1a1a" />
          </svg>
        </div>
        <div class="printer-paper">${renderFeed()}</div>
      </section>
    </main>
  `;

  const form = document.querySelector<HTMLFormElement>("#action-form");
  form?.addEventListener("submit", (event) => {
    void onSubmitAction(event as SubmitEvent);
  });

  const newGame = document.querySelector<HTMLButtonElement>("#new-game");
  newGame?.addEventListener("click", () => {
    void onNewGame();
  });
};

render();
void onNewGame();
