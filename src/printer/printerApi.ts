import type { PrintedGrid } from "../types";

export interface ReceiptPrinterApi {
	printGrid(snapshot: PrintedGrid): Promise<void>;
}

export class VirtualReceiptPrinterApi implements ReceiptPrinterApi {
	private readonly sink: (snapshot: PrintedGrid) => void;

	constructor(sink: (snapshot: PrintedGrid) => void) {
		this.sink = sink;
	}

	async printGrid(snapshot: PrintedGrid): Promise<void> {
		this.sink(snapshot);
	}
}

export class HttpReceiptPrinterApi implements ReceiptPrinterApi {
	private readonly endpoint: string;

	constructor(endpoint = "/api/printer/print") {
		this.endpoint = endpoint;
	}

	async printGrid(snapshot: PrintedGrid): Promise<void> {
		const response = await fetch(this.endpoint, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify(snapshot),
		});
		if (!response.ok) {
			throw new Error(`Printer API failed: ${response.status}`);
		}
	}
}
