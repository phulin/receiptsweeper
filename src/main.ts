import "./styles.css";
import { GRID_DIMENSION, MinesweeperGame } from "./game/minesweeper";
import { boardToReceiptRows, formatPrintedGrid } from "./printer/gridFormatter";
import { VirtualReceiptPrinterApi } from "./printer/printerApi";
import { createSlug, getSlugFromHash, loadState, saveState } from "./storage";
import type { CellState, Coordinate, PlayerAction, PrintedGrid } from "./types";

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) {
  throw new Error("App container not found.");
}

interface SavedData {
  board: CellState[][];
  gameOver: boolean;
  feed: PrintedGrid[];
  status: string;
}

let slug = getSlugFromHash();
const game = new MinesweeperGame();
const feed: PrintedGrid[] = [];

const state = {
  status: "Enter a coordinate and action to start.",
  gameOver: false,
};

// Restore from localStorage if available
const saved = slug ? loadState<SavedData>(slug) : null;
if (saved) {
  game.restoreState(saved.board, saved.gameOver);
  feed.push(...saved.feed);
  state.status = saved.status;
  state.gameOver = saved.gameOver;
}

const persistState = (): void => {
  if (!slug) {
    slug = createSlug();
  }
  const data: SavedData = {
    board: game.getBoard(),
    gameOver: game.getIsGameOver(),
    feed: [...feed],
    status: state.status,
  };
  saveState(slug, data);
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

const renderReceiptHtml = (entry: PrintedGrid, idx: number): string => {
  const { boardLines, footerLines } = formatPrintedGrid(entry);
  const boardHtml = boardLines.map((line) => `<div>${line}</div>`).join("");
  const footerHtml = footerLines.map((line) => `<div class="receipt-footer-line">${line}</div>`).join("");
  return `<article class="receipt-strip"><header>#${idx + 1}</header><div class="receipt-board">${boardHtml}</div><div class="receipt-footer">${footerHtml}</div></article>`;
};

const appendReceipt = (snapshot: PrintedGrid): void => {
  const paper = document.querySelector<HTMLElement>(".printer-paper");
  if (!paper) return;

  const idx = feed.length - 1;
  const article = document.createElement("div");
  article.innerHTML = renderReceiptHtml(snapshot, idx);
  const newEl = article.firstElementChild as HTMLElement;

  // Prepend (newest on top)
  paper.insertBefore(newEl, paper.firstChild);

  // Measure the new element's height
  const height = newEl.offsetHeight;

  // Translate paper up to hide the new entry, then animate down
  paper.style.transform = `translateY(-${height}px)`;
  const duration = 2000;
  const startTime = performance.now();
  const step = (now: number) => {
    const elapsed = now - startTime;
    const t = Math.min(elapsed / duration, 1);
    const ease = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
    paper.style.transform = `translateY(-${height * (1 - ease)}px)`;
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
};

const printer = new VirtualReceiptPrinterApi((snapshot) => {
  feed.push(snapshot);
  // If paper already exists, append without full re-render
  const paper = document.querySelector<HTMLElement>(".printer-paper");
  if (paper) {
    appendReceipt(snapshot);
  } else {
    render();
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
  persistState();
};

const onNewGame = async (): Promise<void> => {
  const result = game.reset();
  state.status = result.message;
  state.gameOver = false;
  feed.length = 0;
  slug = null;
  history.replaceState(null, "", window.location.pathname);
  await printBoard("test", { x: 0, y: 0 });
};

const renderFeed = (): string =>
  [...feed]
    .map((entry, idx) => {
      const { boardLines, footerLines } = formatPrintedGrid(entry);
      const boardHtml = boardLines.map((line) => `<div>${line}</div>`).join("");
      const footerHtml = footerLines.map((line) => `<div class="receipt-footer-line">${line}</div>`).join("");
      return { idx, html: `<article class="receipt-strip"><header>#${idx + 1}</header><div class="receipt-board">${boardHtml}</div><div class="receipt-footer">${footerHtml}</div></article>` };
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
        <div class="printer-paper-clip"><div class="printer-paper">${renderFeed()}</div></div>
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
if (!saved) {
  void onNewGame();
}
