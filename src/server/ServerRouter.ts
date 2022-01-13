import { ActiveRoute, Router } from "src/logic/Router.ts";
import { createMemoryHistory, MemoryHistory, To, createPath } from "history";

export class ServerRouter implements Router {
  private readonly history: MemoryHistory;

  public readonly route: ActiveRoute;

  constructor(
    url: URL,
    Component: React.ComponentType,
    props: Record<string, unknown>
  ) {
    this.history = createMemoryHistory({
      initialEntries: [
        createPath({
          pathname: url.pathname,
          search: url.search,
          hash: url.hash,
        }),
      ],
    });
    this.route = {
      location: this.history.location,
      Component,
      props,
    };
  }

  getStringLocation(): string {
    return this.history.createHref(this.history.location);
  }

  subscribe() {
    // noop
    return () => {};
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
