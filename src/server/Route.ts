// deno-lint-ignore-file no-explicit-any
import { composeMiddleware, HTTPMethods } from "oak/mod.ts";
import { Middleware } from "src/server/types.ts";
import { Chemin, splitPathname } from "chemin";

export const ROUTE_TOKEN = Symbol.for("__TUMAU_ROUTE_TOKEN__");

export interface Route {
  [ROUTE_TOKEN]: true;
  pattern: Chemin | null;
  // ignored if pattern is null
  exact: boolean;
  method: HTTPMethods | null;
  middleware: Middleware;
  // if true route should not be considered as a defined route
  // (AllowedMethod will ignore it)
  isFallback: boolean;
}

export type Routes = Array<Route>;

export const Route = {
  find,
  groupByPattern,
  create: createRoute,
  GET: withMethod("GET"),
  POST: withMethod("POST"),
  PUT: withMethod("PUT"),
  DELETE: withMethod("DELETE"),
  PATCH: withMethod("PATCH"),
  namespace,
  group,
  fallback,
};

export type RouteConfig = {
  pattern: Chemin | string | null;
  exact?: boolean;
  methods?: HTTPMethods | Array<HTTPMethods>;
};

function namespace(pattern: Chemin | string, routes: Routes): Routes {
  return routes.map(
    (route): Route => ({
      ...route,
      pattern:
        route.pattern === null
          ? Chemin.create(pattern)
          : Chemin.create(pattern, route.pattern),
    })
  );
}

function group(
  middlewares: Middleware | Array<Middleware>,
  routes: Routes
): Routes {
  const middleware = resolveMiddleware(middlewares);
  return routes.map(
    (route): Route => ({
      ...route,
      middleware: composeMiddleware([middleware, route.middleware]),
    })
  );
}

function fallback(...middlewares: Array<Middleware>): Route {
  return createRoute({ exact: false, isFallback: true }, middlewares);
}

function withMethod(method: HTTPMethods) {
  return (pattern: Chemin | string | null, ...middlewares: Array<Middleware>) =>
    createRoute({ pattern, exact: true, method: method }, middlewares);
}

function createRoute(
  {
    isFallback = false,
    method = null,
    pattern = null,
    exact = true,
  }: {
    isFallback?: boolean;
    pattern?: Chemin | string | null;
    method?: HTTPMethods | null;
    exact?: boolean;
  },
  middleware: Middleware | Array<Middleware>
): Route {
  const patternResolved =
    typeof pattern === "string" ? Chemin.parse(pattern) : pattern;
  return {
    [ROUTE_TOKEN]: true,
    pattern: patternResolved,
    middleware: resolveMiddleware(middleware),
    method,
    exact,
    isFallback,
  };
}

function resolveMiddleware(
  middleware: Middleware | Array<Middleware>
): Middleware {
  if (Array.isArray(middleware)) {
    return composeMiddleware(middleware);
  }
  return middleware;
}

export interface FindResult {
  route: Route;
  index: number;
  params: { [key: string]: any };
}

// fins all routes matching the pattern (ignoring methods & upgrade)
function find(
  routes: Array<Route>,
  pathname: string,
  method: HTTPMethods | null
): Array<FindResult> {
  const parts = splitPathname(pathname);
  return routes
    .map((route, index): FindResult | false => {
      if (route.pattern === null) {
        return {
          route,
          index,
          params: {},
        };
      }
      const pathMatch = route.pattern.match(parts);
      if (pathMatch === false) {
        return false;
      }
      if (route.exact && pathMatch.rest.length > 0) {
        return false;
      }
      const methodIsMatching =
        method === null || route.method === null || route.method === method;
      if (methodIsMatching === false) {
        return false;
      }
      return {
        index,
        route: route,
        params: pathMatch.params,
      };
    })
    .filter((result: FindResult | false): result is FindResult => {
      return result !== false;
    });
}

type GroupResult = {
  pattern: Chemin | null;
  routes: Routes;
};

function groupByPattern(routes: Array<Route>): Array<GroupResult> {
  const result: Array<GroupResult> = [];
  routes.forEach((route) => {
    const pattern = route.pattern;
    const exist =
      pattern === null
        ? result.find((item) => item.pattern === null)
        : result.find(
            (item) => item.pattern !== null && item.pattern.equal(pattern)
          );
    if (exist) {
      exist.routes.push(route);
    } else {
      result.push({ pattern, routes: [route] });
    }
  });
  return result;
}

export function debugRoutes(routes: Routes) {
  console.log(
    routes.map(({ exact, pattern, isFallback, method }) => {
      return { pattern: pattern?.stringify(), exact, method, isFallback };
    })
  );
}
