import { pagesToRoutes, Route } from "src/logic/router.ts";
import { resolve } from "std/path/mod.ts";
import { notNil } from "./utils.ts";
import { Chemin } from "chemin";
import { nanoid } from "nanoid";
import { Envs } from "../Envs.ts";

export type GeneratedData = {
  indexHtml: string;
  render: typeof import("generated/render.js").render;
  routes: Route[];
  notFoundRoute: Route;
};

let generatedData: GeneratedData | null = null;
let version = nanoid(10);

export function invalidateGeneratedData() {
  version = nanoid(10);
  generatedData = null;
}

export async function getGeneratedData(): Promise<GeneratedData> {
  return generatedData ?? (generatedData = await fetchGeneratedData(version));
}

async function fetchGeneratedData(version: string): Promise<GeneratedData> {
  const [indexHtml, renderModule, ssrManifest] = await (Envs.MODE ===
  "production"
    ? Promise.all([
        Deno.readTextFile(resolve(Deno.cwd(), `src/generated/index.html`)),
        import(`src/generated/render.js`),
        import(`src/generated/ssr-manifest.json`, {
          assert: { type: "json" },
        }),
      ])
    : Promise.all([
        fetch(
          `http://localhost:${Envs.PORT}/dev/generated/index.html?v=${version}`
        ).then((res) => res.text()),
        import(
          `http://localhost:${Envs.PORT}/dev/generated/render.js?v=${version}`
        ),
        import(
          `http://localhost:${Envs.PORT}/dev/generated/ssr-manifest.json?v=${version}`,
          {
            assert: { type: "json" },
          }
        ),
      ]));

  const routes = pagesToRoutes(renderModule.pages, ssrManifest);

  const notFoundRoute = notNil(
    routes.find((route) => route.route.equal(Chemin.create("404")))
  );

  return {
    indexHtml,
    render: renderModule.render,
    routes,
    notFoundRoute,
  };
}
