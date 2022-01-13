// deno-lint-ignore-file no-explicit-any
import { Middleware } from "src/server/types.ts";
import { Redirect } from "~pages";
import { Path } from "history";
import { notNil } from "src/logic/Utils.ts";
import { RENDER_PATH } from "./Render.tsx";
import { PageResolved, resolvePage } from "./PageUtils.ts";
import { sanitize } from "zenjson";

export type PropsApiResult =
  | {
      kind: "props";
      props: Record<string, unknown>;
      notFound?: boolean;
    }
  | {
      kind: "redirect";
      redirect: Redirect;
    };

export function PropsApi(): Middleware {
  return async (ctx) => {
    const routeParams = notNil(ctx.state.router).getOrFail(RENDER_PATH);
    const { search, hash } = ctx.request.url;
    const pathname = routeParams.path.join("/");
    const path: Path = { pathname, search, hash };
    const resolved = await resolvePage(path);
    const body = sanitize(resolvePropsApiResult(resolved)) as any;
    ctx.response.body = body;
    return;
  };
}

function resolvePropsApiResult(resolved: PageResolved): PropsApiResult {
  if (resolved.kind === "redirect") {
    return { kind: "redirect", redirect: resolved.redirect };
  }
  return {
    kind: "props",
    props: resolved.props,
    notFound: resolved.isNotFound,
  };
}
