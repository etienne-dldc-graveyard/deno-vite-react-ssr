// deno-lint-ignore-file no-explicit-any
import type { Page, PageModule } from "~pages";
import { Chemin, CheminParamAny, CheminParam } from "chemin";

export type Route = {
  id: string; // file path
  chemin: Chemin;
  module: () => Promise<PageModule>;
  assets: Array<string>;
};

export type SsrManifest = Record<string, Array<string>>;

export function pagesToRoutes(
  pages: Array<Page>,
  ssrManifest?: SsrManifest
): Array<Route> {
  const EXTENSION_REGEX = /\.(js|ts|tsx|jsx)$/;
  const BASIC_ROUTE_REGEX = /^([\w-]+)$/;
  const PARAM_ROUTE_REGEX = /^\[([\w-]+)\]$/;
  const CATCH_ALL_ROUTE_REGEX = /^\[\.\.\.([\w-]+)\]$/;
  const OPTIONAL_CATCH_ALL_ROUTE_REGEX = /^\[\[\.\.\.([\w-]+)\]\]$/;

  return (
    pages
      .map((page) => {
        // remove extension
        const path = page.path.replace(EXTENSION_REGEX, "");
        const parts = path.split("/");
        if (parts[parts.length - 1] === "index") {
          parts.pop();
        }
        const chemin = Chemin.create(
          ...parts.map((part): CheminParamAny => {
            const optionalCatchAll = part.match(OPTIONAL_CATCH_ALL_ROUTE_REGEX);
            if (optionalCatchAll) {
              const name = optionalCatchAll[1];
              return CheminParam.optional(
                CheminParam.multiple(CheminParam.string(name), false)
              );
            }
            const catchAll = part.match(CATCH_ALL_ROUTE_REGEX);
            if (catchAll) {
              const name = catchAll[1];
              return CheminParam.multiple(CheminParam.string(name), true);
            }
            const param = part.match(PARAM_ROUTE_REGEX);
            if (param) {
              return CheminParam.string(param[1]);
            }
            const basic = part.match(BASIC_ROUTE_REGEX);
            if (basic) {
              return CheminParam.constant(basic[1]);
            }
            throw new Error(`Invalid route part: ${page.path}`);
          })
        );
        const assets = ssrManifest ? (ssrManifest as any)[page.path] ?? [] : [];
        return {
          id: page.path,
          chemin,
          module: page.module,
          assets,
        };
      })
      // since dynamic params are first we reverse to get predifined params first
      .reverse()
  );
}

export type RouteMatch = {
  route: Route;
  params: Record<string, unknown>;
  isNotFound?: boolean;
};

export function matchRoute(
  routes: Array<Route>,
  pathname: string
): RouteMatch | null {
  for (const route of routes) {
    const match = route.chemin.matchExact(pathname);
    if (match) {
      return { route, params: match };
    }
  }
  return null;
}
