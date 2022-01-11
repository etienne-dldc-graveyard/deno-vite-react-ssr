import { FindResult, Route, Routes } from "./Route.ts";
import { Chemin } from "chemin";
import { Middleware } from "src/server/types.ts";

export interface Params {
  [key: string]: unknown;
}

export const DID_NOT_MATCH = Symbol("DID_NOT_MATCH");

export interface RouterContext {
  params: Params;
  notFound: boolean;
  pattern: Chemin | null;
  get<P>(chemin: Chemin<P>): P | null;
  getOrFail<P>(chemin: Chemin<P>): P;
  has(chemin: Chemin): boolean;
  didNotMatch(): typeof DID_NOT_MATCH;
}

export function Router(routes: Routes): Middleware {
  return (ctx, next) => {
    if (ctx.state.router) {
      console.warn(
        [
          `Warning: Using a Router inside another Router will break 'Allow' header and CORS !`,
          `If you want to group routes together you can use Route.namespace() or the low level Route.create()`,
        ].join("\n")
      );
    }

    const parsedUrl = ctx.request.url;
    const requestMethod = ctx.request.method;
    const matchingRoutes = Route.find(
      routes,
      parsedUrl.pathname,
      requestMethod
    );

    return handleNext(0);

    async function handleNext(index: number): Promise<unknown> {
      const findResult: FindResult | null = matchingRoutes[index] || null;
      const route = findResult ? findResult.route : null;
      const pattern = route ? route.pattern : null;
      const patterns = pattern ? pattern.extract() : [];
      const params = findResult ? findResult.params : {};

      const has = (chemin: Chemin): boolean => {
        return patterns.indexOf(chemin) >= 0;
      };

      // create router context
      const routerData: RouterContext = {
        notFound: findResult === null,
        pattern,
        params,
        has,
        get: <P>(chemin: Chemin<P>) => {
          return has(chemin) ? (params as P) : null;
        },
        getOrFail: <P>(chemin: Chemin<P>) => {
          if (!has(chemin)) {
            throw new Error(`Chemin is not part of the route context !`);
          }
          return params as P;
        },
        didNotMatch: () => DID_NOT_MATCH,
      };

      if (findResult === null) {
        // no more match, run next
        ctx.state.router = null;
        return next();
      }

      if (findResult.route.middleware === null) {
        // route with no middleware, this is still a match
        // it's like if they was a middleware: (ctx, next) => next(ctx);
        ctx.state.router = routerData;
        return next();
      }

      ctx.state.router = routerData;
      // call the route with next pointing to the middleware after the router
      const res = await findResult.route.middleware(ctx, next);

      if (res === DID_NOT_MATCH) {
        // if the route returned DID_NOT_MATCH, we continue with the next route
        return handleNext(index + 1);
      }

      return res;
    }
  };
}
