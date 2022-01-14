// deno-lint-ignore-file no-explicit-any
import { Application, Status } from "oak/mod.ts";
import { Context, State } from "src/server/types.ts";
import { Envs } from "src/server/Envs.ts";
import { ErrorToJson } from "src/server/ErrorToJson.ts";
import { NotFound } from "src/server/NotFound.ts";
import { Route } from "src/server/Route.ts";
import { Router } from "src/server/Router.ts";
import { AllowedMethodsRoutes } from "src/server/AllowedMethodsRoutes.ts";
import { Chemin, CheminParam as P } from "chemin";
import { Static, STATIC_PATH } from "src/server/Static.ts";
import { projectPath } from "src/server/Utils.ts";
import { Path, ServerApp } from "./entx/server/ServerApp.tsx";
import { notNil } from "./logic/Utils.ts";
import { relative } from "std/path/mod.ts";
import "raf/polyfill";

const PATH = Chemin.create(P.multiple(P.string("path")));

function extractPath(ctx: Context): Path {
  const routeParams = notNil(ctx.state.router).getOrFail(PATH);
  const { search, hash } = ctx.request.url;
  const pathname = "/" + routeParams.path.join("/");
  const path: Path = { pathname, search, hash };
  return path;
}

const entxApp = new ServerApp<typeof import("./ssr.ts")>({
  mode: Envs.MODE,
  port: Envs.PORT,
});

const oakApp = new Application<State>({
  state: { router: null },
  contextState: "prototype",
});

const routes = AllowedMethodsRoutes([
  Route.GET(
    Chemin.create("_entx", PATH),
    async (ctx, next) => {
      const res = await entxApp.entxRoute(extractPath(ctx));
      if (res.kind === "json") {
        ctx.response.body = res.data as any;
        return;
      }
      if (res.kind === "file") {
        await ctx.send({
          root: Deno.cwd(),
          path: "/" + relative(Deno.cwd(), res.path),
          hidden: true,
        });
        return;
      }
      if (res.kind === "notFound") {
        return next();
      }
      throw new Error("Unexpected response kind");
    },
    NotFound
  ),
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
    Static({ root: projectPath(".entx/client/assets") })
  ),
  Route.GET(PATH, async (ctx) => {
    const res = await entxApp.render(extractPath(ctx));
    if (res.kind === "redirect") {
      ctx.response.redirect(res.redirect.destination);
      return;
    }
    if (res.isNotFound) {
      ctx.response.status = Status.NotFound;
    }
    ctx.response.body = res.htmlContent;
    return;
  }),
]);

oakApp.use(Router(routes));

oakApp.addEventListener("listen", () => {
  console.info(`Server is listening on http://localhost:${Envs.PORT}`);
});

await oakApp.listen({ port: Envs.PORT });
