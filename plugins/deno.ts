import { Plugin } from "vite";
import { resolve } from "deno-importmap";
import { readFile } from "fs/promises";

export type Options = {
  importMap: { imports: Record<string, string> };
};

export function denoPlugin({ importMap = { imports: {} } }: Options): Plugin {
  let DenoCache: typeof import("deno-cache") | null = null;
  return {
    enforce: "pre",
    name: "vite-plugin-deno",
    config: (config) => {
      return {
        ...config,
        build: {
          ...config.build,
          rollupOptions: {
            ...config.build?.rollupOptions,
            output: {
              ...config.build?.rollupOptions?.output,
              // force esm in ssr
              format: "esm",
            },
          },
        },
      };
    },
    resolveId(source, importer, { ssr }) {
      const resolvedId = resolve(source, importMap, importer);
      if (resolvedId.startsWith("http")) {
        if (ssr) {
          return { id: resolvedId, external: true };
        }
        return resolvedId;
      }
      return resolvedId;
    },
    async load(id) {
      if (id.startsWith("http")) {
        const cache = DenoCache || (DenoCache = await import("deno-cache"));
        const file = await cache.cache(id, undefined, "deps");
        return await readFile(file.path, "utf8");
      }
      return null;
    },
  };
}
