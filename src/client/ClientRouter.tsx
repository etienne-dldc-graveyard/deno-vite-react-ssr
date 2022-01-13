// deno-lint-ignore-file no-explicit-any
import pages from "~pages";
import { To, Location } from "history";
import { Router } from "src/logic/Router.ts";
import { createBrowserHistory } from "history";
import { pagesToRoutes } from "src/logic/Route.ts";
import { getBridgeData } from "src/logic/Bridge.ts";

export type OnServerSideProps = (location: Location, props: any) => void;

export type ClientRouterOptions = {
  onServerSideProps?: OnServerSideProps;
};

/**
 * NextJS does fetch then navigate.
 * We do the opposite: navagate (while diplsaying the prev page) then fetch.
 */
export class ClientRouter implements Router {
  private readonly history = createBrowserHistory();
  private readonly bridge = getBridgeData();
  private readonly onServerSideProps: OnServerSideProps;

  public readonly routes = pagesToRoutes(pages);
  private currentActiveLocation: Location;

  constructor({ onServerSideProps }: ClientRouterOptions) {
    this.currentActiveLocation = this.history.location;
    this.onServerSideProps = onServerSideProps ?? (() => {});
  }

  get nextLocation(): Location | null {
    if (this.history.location === this.currentActiveLocation) {
      return null;
    }
    return this.history.location;
  }

  get activeLocation(): Location {
    return this.currentActiveLocation;
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
