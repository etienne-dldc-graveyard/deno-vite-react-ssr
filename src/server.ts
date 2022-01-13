import { Application } from "oak/mod.ts";
import { State } from "src/server/types.ts";
import { Envs } from "src/server/Envs.ts";
import { ErrorToJson } from "src/server/ErrorToJson.ts";
import { NotFound } from "src/server/NotFound.ts";
import { Route, Routes } from "src/server/Route.ts";
import { Router } from "src/server/Router.ts";
import { AllowedMethodsRoutes } from "src/server/AllowedMethodsRoutes.ts";
import { Chemin } from "chemin";
import { Static, STATIC_PATH } from "src/server/Static.ts";
import { Render, RENDER_PATH } from "src/server/Render.tsx";
import { invalidateBuildOutput } from "src/server/BuildOutputManager.ts";
import { projectPath } from "src/server/Utils.ts";
import { PropsApi } from "./server/PropsApi.ts";

const app = new Application<State>({
  state: { router: null },
  contextState: "prototype",
});

const routes = AllowedMethodsRoutes([
  ...Route.namespace("_entx", [
    ...getDevRoutes(),
    Route.GET(Chemin.create("props", RENDER_PATH), PropsApi()),
  ]),
  ...Route.namespace(
    "api",
    Route.group(ErrorToJson(), [
      Route.GET(null, (ctx) => {
        ctx.response.body = { ok: true };
      }),
      Route.fallback(NotFound),
    ])
  ),
  Route.GET(
    Chemin.create("assets", STATIC_PATH),
    Static({ root: projectPath("dist/client/assets") })
  ),
  Route.GET(RENDER_PATH, Render()),
]);

app.use(Router(routes));

app.addEventListener("listen", () => {
  console.info(`Server is listening on http://localhost:${Envs.PORT}`);
});

await app.listen({ port: Envs.PORT });

function getDevRoutes(): Routes {
  if (Envs.MODE === "production") {
    return [];
  }
  return Route.namespace("dev", [
    Route.GET(
      Chemin.create("dist", STATIC_PATH),
      Static({ root: projectPath("dist") })
    ),
    Route.GET("invalidate", (ctx) => {
      invalidateBuildOutput();
      ctx.response.body = { ok: true };
    }),
  ]);
}
