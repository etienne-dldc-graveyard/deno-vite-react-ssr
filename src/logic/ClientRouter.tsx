import { To, Location } from "history";
import { Router } from "./Router.ts";
import { createBrowserHistory } from "history";
import pages from "~pages";
import { pagesToRoutes } from "./Route.ts";
import { getBridgeData } from "./Bridge.ts";

export class ClientRouter implements Router {
  private readonly history = createBrowserHistory();
  private readonly bridge = getBridgeData();
  private readonly routes = pagesToRoutes(pages);

  get location(): Location {
    throw new Error("Method not implemented.");
  }

  createHref(to: To): string {
    return this.history.createHref(to);
  }

  push(to: To): void {
    throw new Error("Method not implemented.");
  }

  replace(to: To): void {
    throw new Error("Method not implemented.");
  }

  go(delta: number): void {
    throw new Error("Method not implemented.");
  }

  back(): void {
    throw new Error("Method not implemented.");
  }

  forward(): void {
    throw new Error("Method not implemented.");
  }
}
