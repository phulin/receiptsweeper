# ReceiptSweeper

Browser-based Minesweeper where each move is "printed" to a virtual receipt roll.

## Run

```bash
yarn install
yarn dev
```

Then open the local Vite URL.

## Included in this scaffold

- 10x10 Minesweeper game engine
- Control bar for `test` and `flag` commands with X/Y coordinates
- Virtual receipt printer UI near the top of the page
- Incremental printed strips that auto-scroll after each move
- Printer API abstraction with:
  - `VirtualReceiptPrinterApi` for in-browser simulation
  - `HttpReceiptPrinterApi` stub for eventual hardware printing backend

## Next integration

Implement an HTTP endpoint at `/api/printer/print` that accepts the `PrintedGrid` payload defined in `src/types.ts`.
