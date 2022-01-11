import type { RollupWatcherEvent } from "rollup";
import fse from "fs-extra";
import { debounce } from "throttle-debounce";
import chokidar from "chokidar";
import {
  projectPath,
  buildClient,
  buildServer,
  copyFiles,
  createPagesFile,
} from "./internal/tools";

main().catch(console.error);
async function main() {
  console.log(`=> Cleanup`);
  await fse.emptyDir(projectPath("dist"));

  console.log(`=> Generate pages file`);
  await createPagesFile();

  console.log("=> Building Client");
  const client = await buildClient("development");

  console.log(`=> Building Server`);
  const server = await buildServer("development");

  console.log(`=> Copying files`);
  await copyFiles(false);

  console.log(`=> Waiting for changes`);

  const debouncedCopyFiles = debounce(500, copyFiles);
  const debouncedCreatePagesFile = debounce(500, createPagesFile);

  const onEvent = (event: RollupWatcherEvent) => {
    if (event.code === "BUNDLE_END") {
      debouncedCopyFiles(true);
    }
  };

  chokidar
    .watch(projectPath("src/pages"))
    .on("add", debouncedCreatePagesFile)
    .on("unlink", debouncedCreatePagesFile);

  client.on("event", onEvent);
  server.on("event", onEvent);
}
