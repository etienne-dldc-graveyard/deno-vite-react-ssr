import { HTTPMethods, composeMiddleware } from "oak/mod.ts";
import { Middleware } from "src/server/types.ts";
import { Route, Routes } from "./Route.ts";

const ALL_METHODS: Set<HTTPMethods> = new Set<HTTPMethods>([
  "HEAD",
  "OPTIONS",
  "GET",
  "PUT",
  "PATCH",
  "POST",
  "DELETE",
]);

// export class AllowedMethodsResponse extends TumauResponse {
//   public originalResponse: TumauResponse;
//   public allowedMethods: Set<HttpMethod>;

//   constructor(originalResponse: TumauResponse, allowedMethods: Set<HttpMethod>) {
//     const allowHeaderContent = Array.from(allowedMethods.values()).join(',');

//     super(
//       originalResponse.extends({
//         headers: {
//           [HttpHeaders.Allow]: allowHeaderContent,
//         },
//       })
//     );
//     this.originalResponse = originalResponse;
//     this.allowedMethods = allowedMethods;
//   }
// }

export function AllowedMethodsRoutes(routes: Routes): Routes {
  const result: Routes = [];
  const byPattern = Route.groupByPattern(routes);
  const updatedRoutes = new Map<Route, Route>();
  byPattern.forEach(({ pattern, routes }) => {
    if (pattern !== null) {
      const allowedMethods = routes.reduce<Set<HTTPMethods> | null>(
        (acc, route) => {
          if (route.isFallback) {
            return acc;
          }
          if (acc === null || route.method === null) {
            return null;
          }
          acc.add(route.method);
          return acc;
        },
        new Set<HTTPMethods>(["OPTIONS"])
      );
      const methods = allowedMethods || ALL_METHODS;
      if (methods.size === 1) {
        return;
      }
      const optionsRoute = routes.find((route) => route.method === "OPTIONS");
      if (optionsRoute) {
        const newRoute: Route = {
          ...optionsRoute,
          middleware: composeMiddleware([
            AllowedMethodsMiddleware(methods),
            optionsRoute.middleware,
          ]),
        };
        updatedRoutes.set(optionsRoute, newRoute);
      } else {
        result.push(
          Route.create(
            { pattern, exact: true, method: "OPTIONS" },
            AllowedMethodsMiddleware(methods)
          )
        );
      }
    }
  });
  routes.forEach((route) => {
    const updated = updatedRoutes.get(route);
    if (updated) {
      result.push(updated);
    } else {
      result.push(route);
    }
  });
  return result;
}

function AllowedMethodsMiddleware(methods: Set<HTTPMethods>): Middleware {
  return async (ctx, next): Promise<unknown> => {
    const res = await next();
    ctx.response.headers.set("Allow", Array.from(methods.values()).join(","));
    return res;
  };
}
