import { Application, ContextSendOptions, Status } from "oak/mod.ts";
import { Middleware, State } from "./types.ts";
import { Envs } from "./Envs.ts";
import { ErrorToJson } from "./middlewares/ErrorToJson.ts";
import { NotFound } from "./middlewares/NotFound.ts";
import { resolve } from "std/path/mod.ts";
import { Route } from "./router/Route.ts";
import { Router } from "./router/Router.ts";
import { AllowedMethodsRoutes } from "./router/AllowedMethodsRoutes.ts";
import { Chemin, CheminParam as P } from "chemin";
import { notNil } from "./logic/utils.ts";
import { Render } from "./middlewares/Render.ts";
import { invalidateGeneratedData } from "./logic/GeneratedDataManager.ts";

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

console.log(
  routes.map((route) => {
    return {
      pattern: route.pattern?.stringify(),
      exact: route.exact,
      method: route.method,
      isFallback: route.isFallback,
    };
  })
);

app.use(Router(routes));

// apiRouter.get("/api", (ctx) => {
//   ctx.response.body = { ok: true };
// });

// console.log(Envs.MODE);

// if (Envs.MODE === "development") {
//   console.log("add /dev/generated");
//   app.use(
//     StaticRoute("/dev/generated", {
//       root: projectPath("src/generated"),
//     })
//   );
//   app.use(Route("/dev/invalidate", () => {}));
// }

// app.use(ErrorToJson("/api"));
// app.use(Render());
// app.use(
//   StaticRoute("/assets", {
//     root: projectPath("src/generated/assets"),
//   })
// );
// app.use(NotFound);

app.addEventListener("listen", () => {
  console.info(`Server is listening on http://localhost:${Envs.PORT}`);
});
await app.listen({ port: Envs.PORT });

function projectPath(...parts: Array<string>): string {
  return resolve(Deno.cwd(), ...parts);
}
