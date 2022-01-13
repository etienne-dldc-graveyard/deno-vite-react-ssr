import React from "react";
import { Middleware } from "src/server/types.ts";
import { Chemin, CheminParam as P } from "chemin";
import { isHttpError, Status } from "oak/mod.ts";
import { BRIDGE_DATA_ID, createBridgeData } from "src/logic/Bridge.ts";
import { getBuildOutput } from "src/server/BuildOutputManager.ts";
import { ServerRouter } from "./ServerRouter.ts";
import { renderToString } from "react-dom/server";
import { notNil } from "src/logic/Utils.ts";
import { resolvePage } from "./PageUtils.ts";
import { Path } from "history";

export const RENDER_PATH = Chemin.create(P.multiple(P.string("path")));

export function Render(): Middleware {
  return async (ctx, next) => {
    const routeParams = notNil(ctx.state.router).getOrFail(RENDER_PATH);
    const { search, hash } = ctx.request.url;
    const pathname = routeParams.path.join("/");
    const path: Path = { pathname, search, hash };
    const resolved = await resolvePage(path);
    if (resolved.kind === "redirect") {
      throw new Error("Redirects are not implemented yet");
    }
    if (resolved.isNotFound) {
      try {
        // let the request through (static files)
        await next();
        return;
      } catch (error) {
        const isNotFound =
          isHttpError(error) && error.status === Status.NotFound;
        if (!isNotFound) {
          throw error;
        }
        // otherwise, render the 404 page
      }
    }
    const { indexHtml, Root } = await getBuildOutput();
    const router = new ServerRouter(
      ctx.request.url,
      resolved.Component,
      resolved.props
    );
    const content = renderToString(<Root router={router} />);
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
    if (resolved.isNotFound) {
      ctx.response.status = Status.NotFound;
    }
    ctx.response.body = page;
    return;
  };
}
