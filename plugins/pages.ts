import { Plugin } from "vite";
import path from "path";
import glob from "glob";
import removeExports from "vite-plugin-remove-exports";

type MatchFunction = (
  filepath: string,
  ssr?: boolean
) => string[] | undefined | null | void;

const removeExportsTyped: (options: { match: MatchFunction }) => Plugin =
  removeExports as any;

const EXTENSION_REG = /\.tsx?$/;
const PAGE_MODULE_ID = "~pages";

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
    extractPagesPlugin(optionResolved),
  ];
}

function extractPagesPlugin(options: ResolvedOptions): Plugin {
  let ctx: PageContext;

  return {
    name: "vite-plugin-pages",
    enforce: "pre",
    configResolved() {
      ctx = new PageContext(options);
      ctx.init();
    },
    resolveId(source) {
      if (source === PAGE_MODULE_ID) {
        return PAGE_MODULE_ID;
      }
      return null;
    },
    load(id) {
      if (id === PAGE_MODULE_ID) {
        return ctx.getPagesModuleContent();
      }
      return null;
    },
  };
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

class PageContext {
  private readonly options: ResolvedOptions;
  private files: string[] = [];

  constructor(options: ResolvedOptions) {
    this.options = options;
  }

  init() {
    const files = glob.sync("**/*", {
      cwd: this.options.pageDir,
      nodir: true,
    });

    this.files = files.filter((file) => {
      if (!EXTENSION_REG.test(file)) {
        return false;
      }
      return true;
    });
  }

  getPagesModuleContent(): string {
    const items = this.files.map((page) => {
      return `{ path: "${page}", module: () => import("./src/pages/${page}") }`;
    });

    return [`export default [${items.join(",")}];`].join("\n");
  }
}
