import { Application, ContextSendOptions, Status } from "oak/mod.ts";
import { Middleware, State } from "src/server/types.ts";
import { Envs } from "src/server/Envs.ts";
import { ErrorToJson } from "src/server/ErrorToJson.ts";
import { NotFound } from "src/server/NotFound.ts";
import { Route } from "src/server/Route.ts";
import { Router } from "src/server/Router.ts";
import { AllowedMethodsRoutes } from "src/server/AllowedMethodsRoutes.ts";
import { Chemin, CheminParam as P } from "chemin";
import { notNil } from "./logic/Utils.ts";
import { Render } from "src/server/Render.ts";
import { invalidateGeneratedData } from "src/server/GeneratedDataManager.ts";
import { projectPath } from "src/server/Utils.ts";

const app = new Application<State>({
  state: {
    router: null,
  },
  contextState: "prototype",
});

// const apiRouter = new Router();

const STATIC_PATH = Chemin.create(P.multiple(P.string("path")));
const APP_PATH = Chemin.create(P.multiple(P.string("path")));

function Static(options: ContextSendOptions): Middleware {
  return async (ctx) => {
    const router = notNil(ctx.state.router);
    const { path } = router.getOrFail(STATIC_PATH);
    await ctx.send({
      path: path.join("/"),
      ...options,
    });
    if (ctx.response.status === Status.NotFound) {
      return router.didNotMatch();
    }
    return;
  };
}

const routes = AllowedMethodsRoutes([
  ...Route.namespace(
    "api",
    Route.group(ErrorToJson(), [
      Route.GET(null, (ctx) => {
        ctx.response.body = { ok: true };
      }),
      Route.fallback(NotFound),
    ])
  ),
  ...(Envs.MODE === "development"
    ? Route.namespace("dev", [
        Route.GET(
          Chemin.create("generated", STATIC_PATH),
          Static({ root: projectPath("src/generated") })
        ),
        Route.GET("invalidate", (ctx) => {
          invalidateGeneratedData();
          ctx.response.body = { ok: true };
        }),
      ])
    : []),
  Route.GET(
    Chemin.create("assets", STATIC_PATH),
    Static({ root: projectPath("src/generated/assets") })
  ),
  Route.GET(APP_PATH, Render()),
]);

// console.log(
//   routes.map(({ exact, pattern, isFallback, method }) => {
//     return { pattern: pattern?.stringify(), exact, method, isFallback };
//   })
// );

app.use(Router(routes));

app.addEventListener("listen", () => {
  console.info(`Server is listening on http://localhost:${Envs.PORT}`);
});
await app.listen({ port: Envs.PORT });
