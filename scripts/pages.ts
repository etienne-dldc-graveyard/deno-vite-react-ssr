import { resolve, relative, dirname } from "std/path/mod.ts";
import { expandGlobSync } from "std/fs/mod.ts";

const pagesFile = projectPath("src/pages.ts");
const files = Array.from(
  expandGlobSync("**/*", { includeDirs: false, root: projectPath("src/pages") })
);
const EXTENSION_REG = /\.tsx?$/;
const pages = files.filter((file) => EXTENSION_REG.test(file.name));

const items = pages.map((page) => {
  const importPath = relative(
    dirname(pagesFile),
    projectPath("src/pages", page.path)
  );
  const filePath = relative(projectPath("src/pages"), page.path);
  return `{ path: "${filePath}", module: () => import("./${importPath}") }`;
});

const content = [
  `import { Pages } from 'entx';`,
  ``,
  `const pages: Pages = [${items.join(",")}];`,
  ``,
  `export default pages;`,
].join("\n");

await Deno.writeFile(pagesFile, new TextEncoder().encode(content));
await Deno.run({ cmd: ["deno", "fmt", pagesFile] }).status();

export function projectPath(...parts: Array<string>): string {
  return resolve(Deno.cwd(), ...parts);
}
