# ReceiptSweeper Design Doc (Initial)

## 1. Goals

- Provide a browser experience that feels like a receipt printer outputting Minesweeper updates.
- Keep the game loop simple: user enters an action (`test` or `flag`) and coordinates, then a new printed snapshot is appended.
- Define a printer API boundary now so a real thermal printer can be integrated later without rewriting game logic.

## 2. Non-goals (for this phase)

- No account system, persistence, or multiplayer.
- No production backend yet.
- No direct hardware printer control from the browser.

## 3. Product behavior

- Page layout:
  - Command bar at the top with coordinate inputs and action selectors.
  - Virtual receipt printer immediately below.
- Grid:
  - Fixed `10x10` board.
  - Side/top coordinates included in printed output.
- Move flow:
  1. User enters X/Y and action.
  2. Game engine applies action.
  3. Status text updates.
  4. Board snapshot is sent through printer API.
  5. Virtual receipt paper appends a new strip and scrolls downward.

## 4. Architecture

### 4.1 Modules

- `src/game/minesweeper.ts`
  - Pure game logic and board state transitions.
- `src/printer/gridFormatter.ts`
  - Converts board state into receipt-printable text rows.
- `src/printer/printerApi.ts`
  - API boundary for printing operations.
  - Contains both virtual and HTTP implementations.
- `src/main.ts`
  - UI wiring, form handling, state transitions, and virtual printer feed rendering.

### 4.2 Data model

- `CellState`
  - `hasMine`, `adjacentMines`, `display`.
- `PrintedGrid`
  - `action`, `coordinate`, `boardLines`, `statusLine`, `timestamp`.

## 5. Printer API boundary

### 5.1 Interface

```ts
interface ReceiptPrinterApi {
  printGrid(snapshot: PrintedGrid): Promise<void>;
}
```

### 5.2 Virtual implementation

- `VirtualReceiptPrinterApi` writes snapshot to an in-memory UI feed.
- Used during development and browser demo mode.

### 5.3 Future hardware implementation

- `HttpReceiptPrinterApi` posts snapshot to backend endpoint:
  - `POST /api/printer/print`
  - Body: `PrintedGrid` JSON
- Backend responsibilities (future):
  - Validate payload.
  - Transform receipt lines to printer command language (ESC/POS or vendor SDK).
  - Queue/retry print jobs.
  - Return job id / status.

## 6. Suggested backend contract (future)

### 6.1 Request

```json
{
  "action": "test",
  "coordinate": { "x": 3, "y": 7 },
  "boardLines": ["F . . . . . . . . .", "..."],
  "statusLine": "Cell tested.",
  "timestamp": "10:22:15 AM"
}
```

### 6.2 Response

```json
{
  "jobId": "print_01J...",
  "status": "queued"
}
```

## 7. Technical decisions

- Vite + TypeScript:
  - Fast local development, minimal ceremony.
- Frontend-only scaffold:
  - Lets gameplay and print format evolve before locking backend/hardware details.
- Text-based printed rows:
  - Maps directly to real receipt printers, which are line-oriented devices.

## 8. Risks and mitigations

- Risk: Print format may not fit physical receipt width.
  - Mitigation: Keep monospace output and maintain centralized formatter.
- Risk: Browser and hardware rendering mismatch.
  - Mitigation: Keep `PrintedGrid` as canonical payload and add backend snapshot tests later.
- Risk: Real printer errors (paper out, disconnected, queue backlog).
  - Mitigation: Add backend job queue with retry and surfaced status states.

## 9. Next steps

1. Add backend service with `/api/printer/print`.
2. Define physical printer width and charset constraints.
3. Add deterministic game seed option for repeatable testing.
4. Add automated tests for game transitions and formatted output lines.
