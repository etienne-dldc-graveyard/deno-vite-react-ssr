// deno-lint-ignore-file no-explicit-any
import React from "react";
import {
  GetServerSideProps,
  GetServerSidePropsContext,
  Pages,
  Redirect,
} from "../shared/Pages.ts";
import { Path } from "history";
import {
  matchRoute,
  pagesToRoutes,
  Route,
  RouteMatch,
} from "../shared/Route.ts";
import { getBuildOutput, invalidateBuildOutput } from "./BuildOutputManager.ts";
import { sanitize } from "zenjson";
import { ServerRouter } from "./ServerRouter.ts";
import { renderToString } from "react-dom/server";
import { BRIDGE_DATA_ID, createBridgeData } from "../shared/Bridge.ts";
import { Root } from "../shared/Root.tsx";
import { resolve } from "std/path/mod.ts";
import { notNil } from "../shared/Utils.ts";
import { Chemin } from "chemin";

export type { Path };

export type PropsApiResult =
  | { kind: "props"; props: Record<string, unknown>; notFound?: boolean }
  | { kind: "redirect"; redirect: Redirect };

export type ServerAppOptions = {
  mode: "development" | "production";
  port: number;
};

export type PageResolved =
  | {
      kind: "render";
      props: Record<string, any>;
      noProps: boolean;
      Component: React.ComponentType<any>;
      isNotFound: boolean;
      route: Route;
      params: Record<string, unknown>;
    }
  | { kind: "redirect"; redirect: Redirect };

export type PropsResultResolved =
  | { kind: "noProps" }
  | { kind: "notFound" }
  | { kind: "redirect"; redirect: Redirect }
  | { kind: "props"; props: Record<string, unknown> };

export type RenderResult =
  | { kind: "redirect"; redirect: Redirect }
  | { kind: "render"; htmlContent: string; isNotFound: boolean };

export type EntxRouteResult =
  | { kind: "json"; data: unknown }
  | { kind: "file"; path: string }
  | { kind: "notFound" };

export class ServerApp {
  private port: number;
  private mode: "development" | "production";

  constructor({ mode, port }: ServerAppOptions) {
    this.port = port;
    this.mode = mode;
  }

  public async render(path: Path): Promise<RenderResult> {
    const resolved = await this.resolvePage(path);
    if (resolved.kind === "redirect") {
      return { kind: "redirect", redirect: resolved.redirect };
    }
    const { indexHtml } = await getBuildOutput({
      mode: this.mode,
      port: this.port,
    });
    const router = new ServerRouter(path, resolved.Component, resolved.props);
    const content = this.renderToString(router);
    const assets = resolved.route.assets
      .map((asset) => `<script src="${asset}"></script>`)
      .join("\n");
    const bridge = createBridgeData({
      routeId: resolved.route.id,
      props: resolved.props,
      params: resolved.params,
      isNotFound: resolved.isNotFound,
      location: router.getStringLocation(),
    });
    const page = indexHtml
      .replace(`<!--app-html-->`, content)
      .replace(
        `<!--app-scripts-->`,
        `<script id="${BRIDGE_DATA_ID}" type="application/json">${bridge}</script>`
      )
      .replace(`<!--app-assets-->`, assets);
    return {
      kind: "render",
      htmlContent: page,
      isNotFound: resolved.isNotFound,
    };
  }

  /** */
  public async entxRoute(path: Path): Promise<EntxRouteResult> {
    if (path.pathname.startsWith("/props")) {
      const body = await this.getProps({
        ...path,
        pathname: path.pathname.slice("/props".length),
      });
      return { kind: "json", data: body };
    }
    if (this.mode === "development") {
      if (path.pathname.startsWith("/dev/dist-ssr/")) {
        const filePath = path.pathname.slice("/dev/dist-ssr".length);
        return {
          kind: "file",
          path: resolve(Deno.cwd(), "dist-ssr" + filePath),
        };
      }
      if (path.pathname.startsWith("/dev/dist/")) {
        const filePath = path.pathname.slice("/dev/dist".length);
        return { kind: "file", path: resolve(Deno.cwd(), "dist" + filePath) };
      }
      if (path.pathname === "/dev/invalidate") {
        invalidateBuildOutput();
        return { kind: "json", data: { ok: true } };
      }
    }
    return { kind: "notFound" };
  }

  private renderToString(router: ServerRouter): string {
    try {
      return renderToString(<Root router={router} />);
    } catch (error) {
      return "";
    }
  }

  private async getProps(path: Path): Promise<PropsApiResult> {
    const resolved = await this.resolvePage(path);
    const body = sanitize(
      this.resolvePropsApiResult(resolved)
    ) as PropsApiResult;
    return body;
  }

  private resolvePropsApiResult(resolved: PageResolved): PropsApiResult {
    if (resolved.kind === "redirect") {
      return { kind: "redirect", redirect: resolved.redirect };
    }
    return {
      kind: "props",
      props: resolved.props,
      notFound: resolved.isNotFound,
    };
  }

  private async resolvePage(path: Path): Promise<PageResolved> {
    const build = await getBuildOutput({
      mode: this.mode,
      port: this.port,
    });
    const routes = pagesToRoutes(build.ssr.pages, build.ssrManifest);
    const notFoundRouteMatch: RouteMatch = {
      route: notNil(
        routes.find((route) => route.chemin.equal(Chemin.create("404")))
      ),
      params: {},
      isNotFound: true,
    };
    if (path.hash || path.search) {
      throw new Error("Hash and search params are not supported yet");
    }
    const match = matchRoute(routes, path.pathname) ?? notFoundRouteMatch;
    return this.resolveRouteMatch(match, notFoundRouteMatch);
  }

  private async resolveRouteMatch(
    routeMatch: RouteMatch,
    notFoundRouteMatch: RouteMatch
  ): Promise<PageResolved> {
    const { route, params } = routeMatch;
    const { getServerSideProps, default: Component } = await route.module();
    const context: GetServerSidePropsContext<any> = {
      query: params,
    };
    const propsResult = await this.resolveProps(getServerSideProps, context);
    if (propsResult.kind === "notFound") {
      return this.resolveRouteMatch(notFoundRouteMatch, notFoundRouteMatch);
    }
    if (propsResult.kind === "redirect") {
      return { kind: "redirect", redirect: propsResult.redirect };
    }
    const props = propsResult.kind === "noProps" ? {} : propsResult.props;
    return {
      kind: "render",
      props,
      noProps: propsResult.kind === "noProps",
      Component,
      isNotFound: routeMatch.isNotFound ?? false,
      route,
      params,
    };
  }

  private async resolveProps(
    getServerSideProps: GetServerSideProps | undefined,
    context: GetServerSidePropsContext<any>
  ): Promise<PropsResultResolved> {
    if (!getServerSideProps) {
      return { kind: "noProps" };
    }
    const result = await getServerSideProps(context);
    if ("notFound" in result) {
      return { kind: "notFound" };
    }
    if ("redirect" in result) {
      return { kind: "redirect", redirect: result.redirect };
    }
    return { kind: "props", props: result.props };
  }
}
