// deno-lint-ignore-file no-explicit-any
import ssrManifest from "dist/client/ssr-manifest.json" assert { type: "json" };
import { pages, render } from "dist/server/entry-server.js";
import { Middleware } from "../types.ts";
import { resolve } from "std/path/mod.ts";
import { matchRoute, pagesToRoutes, RouteMatch } from "../logic/router.ts";
import { sanitize } from "zenjson";
import { Context, Redirect, SSROptions } from "~pages";
import { isHttpError, Status } from "oak/mod.ts";
import { Chemin } from "chemin";
import { notNil } from "../logic/utils.ts";
import { BridgeData, BRIDGE_DATA_ID } from "../logic/bridge.ts";

const routes = pagesToRoutes(pages, ssrManifest);

const notFoundRoute = notNil(
  routes.find((route) => route.route.equal(Chemin.create("404")))
);

const indexHtml = Deno.readTextFileSync(
  resolve(Deno.cwd(), "dist/client/index.html")
);

export function Render(): Middleware {
  return async (ctx, next) => {
    const pathname = ctx.request.url.pathname;
    const match = await (async (): Promise<RouteMatch | null> => {
      const match = matchRoute(routes, pathname);
      if (match) {
        return match;
      }
      try {
        await next();
        return null;
      } catch (error) {
        if (isHttpError(error) && error.status === Status.NotFound) {
          return { route: notFoundRoute, params: {}, isNotFound: true };
        }
        throw error;
      }
    })();
    if (!match) {
      return;
    }
    const { route, params } = match;
    const { default: Component, ssr } = await route.module();
    const context: Context<any> = {
      query: params,
    };
    const propsResult = await resolveProps(ssr, context);
    const props = (propsResult as any)?.props ?? {};
    // TODO: Handle error / redirect...
    const content = render(Component, props);
    const data: BridgeData = {
      route: route.id,
      props: sanitize(props) as any,
      params: sanitize(params) as any,
    };
    const assets = route.assets
      .map((asset) => {
        return `<script src="${asset}"></script>`;
      })
      .join("\n");
    const page = indexHtml
      .replace(`<!--app-html-->`, content)
      .replace(
        `<!--app-scripts-->`,
        `<script id="${BRIDGE_DATA_ID}" type="application/json">${JSON.stringify(
          data
        )}</script>`
      )
      .replace(`<!--app-assets-->`, assets);
    if (match.isNotFound) {
      ctx.response.status = Status.NotFound;
    }
    ctx.response.body = page;
    return;
  };
}

type PropsResultResolved =
  | { kind: "noProps" }
  | { kind: "notFound" }
  | { kind: "redirect"; redirect: Redirect }
  | {
      kind: "props";
      props: Record<string, unknown>;
      revalidate?: number | boolean;
    };

async function resolveProps(
  ssr: SSROptions | undefined,
  context: Context<any>
): Promise<PropsResultResolved> {
  if (!ssr || !ssr.props) {
    return { kind: "noProps" };
  }
  const result = await ssr.props(context);
  if ("notFound" in result) {
    return { kind: "notFound" };
  }
  if ("redirect" in result) {
    return { kind: "redirect", redirect: result.redirect };
  }
  return { kind: "props", props: result.props, revalidate: result.revalidate };
}
