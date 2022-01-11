import { build, InlineConfig } from "vite";
import type { RollupWatcher, RollupWatcherEvent } from "rollup";
import fse from "fs-extra";
import path from "path";
import glob from "glob";
import prettier from "prettier";

export function projectPath(...parts: Array<string>): string {
  return path.resolve(process.cwd(), ...parts);
}

function createConfig(
  mode: "development" | "production",
  config: InlineConfig
): InlineConfig {
  const baseConfig: InlineConfig = {
    mode: mode,
    root: process.cwd(),
    logLevel: mode === "development" ? "silent" : "info",
    clearScreen: false,
    build: {
      watch: { exclude: ["src/generated/**"] },
      emptyOutDir: mode === "development" ? false : true,
    },
  };
  return {
    ...baseConfig,
    ...config,
    build: {
      ...baseConfig.build,
      ...config.build,
    },
  };
}

export function buildClient(mode: "development" | "production") {
  return createBuild(
    createConfig(mode, {
      build: {
        outDir: "./dist/client",
        ssrManifest: true,
      },
    })
  );
}

export function buildServer(mode: "development" | "production") {
  return createBuild(
    createConfig(mode, {
      build: {
        outDir: "./dist/server",
        ssr: "src/render.tsx",
      },
    })
  );
}

export async function copyFiles(notify: boolean): Promise<void> {
  console.log("=> Copy Files");
  await fse.emptyDir(projectPath("src/generated/assets"));
  await fse.copy(
    projectPath("dist/client/assets"),
    projectPath("src/generated/assets")
  );
  await fse.copy(
    projectPath("dist/client/index.html"),
    projectPath("src/generated/index.html")
  );
  await fse.copy(
    projectPath("dist/server/render.js"),
    projectPath("src/generated/render.js")
  );
  await fse.copy(
    projectPath("dist/client/ssr-manifest.json"),
    projectPath("src/generated/ssr-manifest.json")
  );
  if (notify) {
    const fetch = (await import("node-fetch")).default;
    try {
      await fetch("http://localhost:3001/dev/invalidate");
    } catch (error) {
      console.warn(`=> Dev server offline ?`);
    }
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

export async function createPagesFile(): Promise<void> {
  const pagesFile = projectPath("src/generated/pages.ts");
  const files = glob.sync("**/*", {
    cwd: projectPath("src/pages"),
    nodir: true,
  });
  const EXTENSION_REG = /\.tsx?$/;
  const pages = files.filter((file) => EXTENSION_REG.test(file));

  const items = pages.map((page) => {
    const importPath = path.relative(
      path.dirname(pagesFile),
      projectPath("src/pages", page)
    );
    return `{ path: "${page}", module: () => import("${importPath}") }`;
  });

  const content = [
    `import { Pages } from '../logic/pages.ts';`,
    ``,
    `export * from '../logic/pages.ts';`,
    ``,
    `const pages: Pages = [${items.join(",")}];`,
    ``,
    `export default pages;`,
  ].join("\n");
  const contentFormatted = prettier.format(content, { filepath: pagesFile });
  await fse.writeFile(pagesFile, contentFormatted);
}
