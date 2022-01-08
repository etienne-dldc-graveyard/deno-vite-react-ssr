import { Application, Router } from "oak/mod.ts";
import { State } from "./types.ts";
import { Envs } from "./Envs.ts";
import { ErrorToJson } from "./middlewares/ErrorToJson.ts";
import { NotFound } from "./middlewares/NotFound.ts";
import { Static } from "./middlewares/Static.ts";
import { Render } from "./middlewares/Render.ts";
import { resolve } from "std/path/mod.ts";

const app = new Application<State>({
  state: {},
  contextState: "prototype",
});

const apiRouter = new Router().get("/api", (ctx) => {
  ctx.response.body = { ok: true };
});

const clientRoot = resolve(Deno.cwd(), "dist/client");

app.use(ErrorToJson("/api"));
app.use(apiRouter.routes(), apiRouter.allowedMethods());
app.use(Render());
app.use(Static({ root: clientRoot, index: "index.html" }));
app.use(NotFound);

app.addEventListener("listen", () => {
  console.info(`Server is listening on http://localhost:${Envs.PORT}`);
});
await app.listen({ port: Envs.PORT });
