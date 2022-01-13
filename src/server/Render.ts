// deno-lint-ignore-file no-explicit-any
import { Middleware } from "src/server/types.ts";
import { matchRoute, RouteMatch } from "src/logic/Route.ts";
import { Chemin, CheminParam as P } from "chemin";
import {
  Redirect,
  GetServerSideProps,
  GetServerSidePropsContext,
} from "~pages";
import { isHttpError, Status } from "oak/mod.ts";
import { BRIDGE_DATA_ID, createBridgeData } from "src/logic/Bridge.ts";
import { getGeneratedData } from "src/server/GeneratedDataManager.ts";
import { ServerRouter } from "./ServerRouter.ts";
import { renderToString } from "react-dom/server";
import { notNil } from "src/logic/Utils.ts";

export const RENDER_PATH = Chemin.create(P.multiple(P.string("path")));

export function Render(): Middleware {
  return async (ctx, next) => {
    const router = new ServerRouter(ctx.request.url);
    const { path } = notNil(ctx.state.router).getOrFail(RENDER_PATH);
    const { indexHtml, routes, render, notFoundRoute } =
      await getGeneratedData();
    const pathname = path.join("/");
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
    const { default: Component, getServerSideProps } = await route.module();
    const context: GetServerSidePropsContext<any> = {
      query: params,
    };
    const propsResult = await resolveProps(getServerSideProps, context);
    const props = (propsResult as any)?.props ?? {};
    // TODO: Handle error / redirect...
    const content = renderToString(render(router, Component, props));
    const assets = route.assets
      .map((asset) => {
        return `<script src="${asset}"></script>`;
      })
      .join("\n");
    const page = indexHtml
      .replace(`<!--app-html-->`, content)
      .replace(
        `<!--app-scripts-->`,
        `<script id="${BRIDGE_DATA_ID}" type="application/json">${createBridgeData(
          {
            route: route.id,
            props: props,
            params: params,
          }
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
  | { kind: "props"; props: Record<string, unknown> };

async function resolveProps(
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
