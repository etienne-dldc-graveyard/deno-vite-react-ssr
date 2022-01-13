import { pagesToRoutes, Route, SsrManifest } from "src/logic/Route.ts";
import { resolve } from "std/path/mod.ts";
import { notNil } from "src/logic/Utils.ts";
import { Chemin } from "chemin";
import { nanoid } from "nanoid";
import { Envs } from "src/server/Envs.ts";
import { Router } from "src/logic/Router.ts";

export type BuildOutput = {
  indexHtml: string;
  Root: React.ComponentType<{ router: Router }>;
  routes: Route[];
  notFoundRoute: Route;
};

let buildOutput: BuildOutput | null = null;
let version = nanoid(10);

export function invalidateBuildOutput() {
  version = nanoid(10);
  buildOutput = null;
}

export async function getBuildOutput(): Promise<BuildOutput> {
  return buildOutput ?? (buildOutput = await fetchBuildOutput(version));
}

async function fetchBuildOutput(version: string): Promise<BuildOutput> {
  const devUrlBase = `http://localhost:${Envs.PORT}/_entx/dev/dist`;

  const indexHtmlProm =
    Envs.MODE === "production"
      ? Deno.readTextFile(resolve(Deno.cwd(), `dist/client/index.html`))
      : fetch(`${devUrlBase}/client/index.html?v=${version}`).then((r) =>
          r.text()
        );

  const rootModuleProm: Promise<typeof import("src/views/Root.tsx")> =
    Envs.MODE === "production"
      ? import(`dist/server/Root.js`)
      : import(`${devUrlBase}/server/Root.js?v=${version}`);

  const ssrManifestProm: Promise<SsrManifest> =
    Envs.MODE === "production"
      ? import(`dist/client/ssr-manifest.json`, { assert: { type: "json" } })
      : import(`${devUrlBase}/client/ssr-manifest.json?v=${version}`, {
          assert: { type: "json" },
        });

  const [indexHtml, rootModule, ssrManifest] = await Promise.all([
    indexHtmlProm,
    rootModuleProm,
    ssrManifestProm,
  ]);

  const routes = pagesToRoutes(rootModule.pages, ssrManifest);

  const notFoundRoute = notNil(
    routes.find((route) => route.chemin.equal(Chemin.create("404")))
  );

  return {
    indexHtml,
    Root: rootModule.Root,
    routes,
    notFoundRoute,
  };
}
