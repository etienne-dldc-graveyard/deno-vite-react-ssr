import { resolve } from "std/path/mod.ts";
import { SsrManifest } from "../shared/Route.ts";
import { nanoid } from "nanoid";

export type BuildOutputConfig = {
  mode: "development" | "production";
  port: number;
};

export type SsrModule = typeof import("src/ssr.ts");

export type BuildOutput = {
  indexHtml: string;
  ssr: SsrModule;
  ssrManifest: SsrManifest;
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
  const devUrlBase = `http://localhost:${config.port}/_entx/dev`;

  const indexHtmlProm =
    config.mode === "production"
      ? Deno.readTextFile(resolve(Deno.cwd(), `dist/index.html`))
      : fetch(`${devUrlBase}/dist/index.html?v=${version}`).then((r) =>
          r.text()
        );

  const ssrModuleProm: Promise<typeof import("src/ssr.ts")> =
    config.mode === "production"
      ? import(`dist-ssr/ssr.js`)
      : import(`${devUrlBase}/dist-ssr/ssr.js?v=${version}`);

  const ssrManifestProm: Promise<SsrManifest> =
    config.mode === "production"
      ? import(`dist/ssr-manifest.json`, { assert: { type: "json" } })
      : import(`${devUrlBase}/dist/ssr-manifest.json?v=${version}`, {
          assert: { type: "json" },
        }).then((r) => r.default);

  const [indexHtml, ssrModule, ssrManifest] = await Promise.all([
    indexHtmlProm,
    ssrModuleProm,
    ssrManifestProm,
  ]);

  return {
    indexHtml,
    ssr: ssrModule,
    ssrManifest,
  };
}
