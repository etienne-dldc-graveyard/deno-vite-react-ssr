import { build, InlineConfig } from "vite";
import type { RollupWatcher, RollupWatcherEvent } from "rollup";
import fse from "fs-extra";
import path from "path";
import glob from "glob";
import prettier from "prettier";
import react from "@vitejs/plugin-react";
import { denoPlugin } from "../plugins/deno";
import { pagesPlugin } from "../plugins/pages";

export function projectPath(...parts: Array<string>): string {
  return path.resolve(process.cwd(), ...parts);
}

function createConfig(
  mode: "development" | "production",
  config: InlineConfig
): InlineConfig {
  const importMap = fse.readJsonSync(projectPath("importmap.json"));

  const baseConfig: InlineConfig = {
    root: "./src",
    configFile: false,
    mode: mode,
    logLevel: mode === "development" ? "silent" : "info",
    clearScreen: false,
    build: {
      watch: {},
    },
    plugins: [
      react({ jsxRuntime: "classic" }),
      ...pagesPlugin(),
      denoPlugin({ importMap }),
    ],
  };
  return {
    ...baseConfig,
    ...config,
    build: {
      ...baseConfig.build,
      ...config.build,
    },
    plugins: [...(baseConfig.plugins ?? []), ...(config.plugins ?? [])],
  };
}

export function buildClient(mode: "development" | "production") {
  return createBuild(
    createConfig(mode, {
      build: {
        outDir: projectPath("dist/client"),
        ssrManifest: true,
      },
    })
  );
}

export function buildServer(mode: "development" | "production") {
  return createBuild(
    createConfig(mode, {
      build: {
        outDir: projectPath("dist/server"),
        ssr: "./pages.ts",
        rollupOptions: {
          output: {
            format: "esm",
          },
        },
      },
    })
  );
}

export async function notifyChanges(): Promise<void> {
  const fetch = (await import("node-fetch")).default;
  try {
    await fetch("http://localhost:3001/_entx/dev/invalidate");
  } catch (error) {
    console.warn(`=> Dev server offline ?`);
  }
}

// create build and wait for first emit
async function createBuild(config: InlineConfig): Promise<RollupWatcher> {
  const watcher: RollupWatcher = (await build(config)) as any;
  return new Promise((resolve, reject) => {
    const onEvent = (event: RollupWatcherEvent) => {
      if (event.code === "BUNDLE_END") {
        watcher.off("event", onEvent);
        resolve(watcher);
        return;
      }
      if (event.code === "ERROR") {
        watcher.off("event", onEvent);
        reject(event.error);
        return;
      }
    };
    watcher.on("event", onEvent);
  });
}
