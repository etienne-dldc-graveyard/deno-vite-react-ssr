import { Router } from "src/logic/Router.ts";
import { createMemoryHistory, Location, MemoryHistory, To } from "history";

export class ServerRouter implements Router {
  private readonly history: MemoryHistory;

  constructor(url: URL) {
    this.history = createMemoryHistory({
      initialEntries: [url.pathname + url.search + url.hash],
    });
  }

  get nextLocation(): Location | null {
    return null;
  }

  get activeLocation(): Location {
    return this.history.location;
  }

  createHref(to: To): string {
    return this.history.createHref(to);
  }

  push(): void {
    throw new Error("Cannot navigate on server.");
  }

  replace(): void {
    throw new Error("Cannot navigate on server.");
  }

  go(): void {
    throw new Error("Cannot navigate on server.");
  }

  back(): void {
    throw new Error("Cannot navigate on server.");
  }

  forward(): void {
    throw new Error("Cannot navigate on server.");
  }
}
