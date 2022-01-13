import { Plugin } from "vite";
import path from "path";
// @ts-ignore
import removeExports from "vite-plugin-remove-exports";

type MatchFunction = (
  filepath: string,
  ssr?: boolean
) => string[] | undefined | null | void;

const removeExportsTyped: (options: { match: MatchFunction }) => Plugin =
  removeExports as any;

export type UserOptions = {
  pagesDir?: string;
};

export function pagesPlugin(option: UserOptions = {}): Array<Plugin> {
  const optionResolved = resolveOption(option);
  let isProd = false;
  const removeExportsPlug = removeExportsTyped({
    match(filepath, ssr) {
      // for some reasone ssr is true in dev
      if (isProd && ssr) {
        return;
      }
      // Remove getServerSideProps in "pages" in browser build
      if (filepath.startsWith(optionResolved.pageDir)) {
        return ["getServerSideProps"];
      }
    },
  });

  return [
    {
      ...removeExportsPlug,
      config(conf, env) {
        isProd = env.mode === "production";
        return conf;
      },
    },
  ];
}

export type ResolvedOptions = {
  pageDir: string;
};

function resolveOption({
  pagesDir = "src/pages",
}: UserOptions): ResolvedOptions {
  const pageDirResolved = path.resolve(pagesDir);
  return {
    pageDir: pageDirResolved,
  };
}
