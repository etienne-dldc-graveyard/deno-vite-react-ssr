// deno-lint-ignore-file no-explicit-any
import type { Pages } from "~pages";
import type { PropsApiResult } from "src/server/PropsApi.ts";
import { To, Location, Update } from "history";
import { ActiveRoute, Router } from "src/logic/Router.ts";
import { createBrowserHistory } from "history";
import {
  matchRoute,
  pagesToRoutes,
  Route,
  RouteMatch,
} from "src/logic/Route.ts";
import { notNil } from "src/logic/Utils.ts";
import { Chemin } from "chemin";
import { Subscription } from "suub";
import { restore } from "zenjson";
import { nanoid } from "nanoid";

export type OnServerSideProps = (location: Location, props: any) => void;

export type ClientRouterOptions = {
  onServerSideProps?: OnServerSideProps;
  pages: Pages;
};

/**
 * NextJS does fetch then navigate.
 * We do the opposite: navagate (while diplsaying the prev page) then fetch.
 */
export class ClientRouter implements Router {
  private readonly history = createBrowserHistory();
  private readonly onServerSideProps: OnServerSideProps;
  private readonly routes: Array<Route>;
  private readonly notFoundRouteMatch: RouteMatch;
  private readonly subscription = Subscription<ActiveRoute>();

  private activeRoute: ActiveRoute | null = null;
  private requestId = "";

  constructor({ onServerSideProps, pages }: ClientRouterOptions) {
    this.routes = pagesToRoutes(pages);
    const notFoundRoute = notNil(
      this.routes.find((route) => route.chemin.equal(Chemin.create("404")))
    );
    this.notFoundRouteMatch = {
      route: notFoundRoute,
      params: {},
      isNotFound: true,
    };
    this.onServerSideProps = onServerSideProps ?? (() => {});
    this.history.listen(this.onLocationChange.bind(this));
  }

  private onLocationChange({ location }: Update) {
    const nextRoute: RouteMatch =
      matchRoute(this.routes, location.pathname) ?? this.notFoundRouteMatch;
    const requestId = nanoid(12);
    this.requestId = requestId;
    this.resolveRouteMatch(nextRoute, location).then(({ props, Component }) => {
      if (requestId !== this.requestId) {
        // canceled by another navigation
        return;
      }
      if (props.kind === "redirect") {
        this.replace(props.redirect.destination);
        return;
      }
      this.activeRoute = {
        location,
        Component,
        props: props.props,
      };
      this.subscription.emit(this.activeRoute);
    });
  }

  public readonly subscribe = this.subscription.subscribe;

  get location(): Location {
    return this.activeRoute?.location ?? this.history.location;
  }

  async initialize(
    routeId: string,
    serverLocation: string,
    isNotFound: boolean,
    params: Record<string, unknown>,
    prefetchedProps: Record<string, unknown>
  ): Promise<void> {
    // make sure server location match browser location
    if (serverLocation !== this.createHref(this.history.location)) {
      throw new Error(`Server location does not match browser location`);
    }
    const location = this.history.location;
    const route = notNil(this.routes.find((r) => r.id === routeId));
    const nextRoute: RouteMatch = { route, params, isNotFound };
    const { props, Component } = await this.resolveRouteMatch(
      nextRoute,
      location,
      prefetchedProps
    );
    this.onServerSideProps(location, props);
    if (props.kind === "redirect") {
      throw new Error("Unexpected redirect on in itialize");
    }
    this.activeRoute = {
      location,
      Component,
      props: props.props,
    };
  }

  private async resolveRouteMatch(
    nextRoute: RouteMatch,
    location: Location,
    prefetchedProps?: any
  ): Promise<{ Component: React.ComponentType; props: PropsApiResult }> {
    const [mod, props] = await Promise.all([
      nextRoute.route.module(),
      prefetchedProps
        ? Promise.resolve<PropsApiResult>({
            kind: "props",
            props: prefetchedProps,
            notFound: nextRoute.isNotFound,
          })
        : this.fetchProps(location),
    ]);
    return {
      Component: mod.default,
      props,
    };
  }

  private async fetchProps(location: Location): Promise<PropsApiResult> {
    const req = `/_entx/props${this.createHref(location)}`;
    const res = await fetch(req);
    const d = await res.json();
    return restore(d) as PropsApiResult;
  }

  get route(): ActiveRoute {
    if (!this.activeRoute) {
      throw new Error("Router not initialized");
    }
    return this.activeRoute;
  }

  createHref(to: To): string {
    return this.history.createHref(to);
  }

  push(to: To): void {
    return this.history.push(to);
  }

  replace(to: To): void {
    return this.history.replace(to);
  }

  go(delta: number): void {
    return this.history.go(delta);
  }

  back(): void {
    return this.history.back();
  }

  forward(): void {
    return this.history.forward();
  }
}
