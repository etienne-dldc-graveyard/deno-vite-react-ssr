import { resolve } from "std/path/mod.ts";
import { pagesToRoutes, Route, SsrManifest } from "../shared/Route.ts";
import { notNil } from "../shared/Utils.ts";
import { Chemin } from "chemin";
import { nanoid } from "nanoid";

export type BuildOutputConfig = {
  mode: "development" | "production";
  port: number;
};

export type BuildOutput = {
  indexHtml: string;
  routes: Route[];
  notFoundRoute: Route;
};

let buildOutput: BuildOutput | null = null;
let version = nanoid(10);

export function invalidateBuildOutput() {
  version = nanoid(10);
  buildOutput = null;
}

export async function getBuildOutput(
  config: BuildOutputConfig
): Promise<BuildOutput> {
  return buildOutput ?? (buildOutput = await fetchBuildOutput(config, version));
}

async function fetchBuildOutput(
  config: BuildOutputConfig,
  version: string
): Promise<BuildOutput> {
  const devUrlBase = `http://localhost:${config.port}/_entx/dev/dist`;

  const indexHtmlProm =
    config.mode === "production"
      ? Deno.readTextFile(resolve(Deno.cwd(), `dist/client/index.html`))
      : fetch(`${devUrlBase}/client/index.html?v=${version}`).then((r) =>
          r.text()
        );

  const pagesModuleProm: Promise<typeof import("src/pages.ts")> =
    config.mode === "production"
      ? import(`dist/server/pages.js`)
      : import(`${devUrlBase}/server/pages.js?v=${version}`);

  const ssrManifestProm: Promise<SsrManifest> =
    config.mode === "production"
      ? import(`dist/client/ssr-manifest.json`, { assert: { type: "json" } })
      : import(`${devUrlBase}/client/ssr-manifest.json?v=${version}`, {
          assert: { type: "json" },
        });

  const [indexHtml, rootModule, ssrManifest] = await Promise.all([
    indexHtmlProm,
    pagesModuleProm,
    ssrManifestProm,
  ]);

  const routes = pagesToRoutes(rootModule.default, ssrManifest);

  const notFoundRoute = notNil(
    routes.find((route) => route.chemin.equal(Chemin.create("404")))
  );

  return {
    indexHtml,
    routes,
    notFoundRoute,
  };
}
