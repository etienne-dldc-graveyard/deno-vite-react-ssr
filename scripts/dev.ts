import type { RollupWatcherEvent } from "rollup";
import fse from "fs-extra";
import { debounce } from "throttle-debounce";
import chokidar from "chokidar";
import {
  projectPath,
  buildClient,
  buildServer,
  notifyChanges,
  createPagesFile,
} from "./internal/tools";

main().catch(console.error);
async function main() {
  console.info(`=> Cleanup`);
  await fse.emptyDir(projectPath("dist"));

  console.info(`=> Generate pages file`);
  await createPagesFile();

  console.info("=> Building Client");
  const client = await buildClient("development");

  console.info(`=> Building Server`);
  const server = await buildServer("development");

  console.info(`=> Waiting for changes`);
  const debouncedNotifyChanges = debounce(500, notifyChanges);
  const debouncedCreatePagesFile = debounce(500, createPagesFile);

  const onEvent = (event: RollupWatcherEvent) => {
    if (event.code === "BUNDLE_END") {
      debouncedNotifyChanges();
    }
  };

  chokidar
    .watch(projectPath("src/pages"))
    .on("add", debouncedCreatePagesFile)
    .on("unlink", debouncedCreatePagesFile);

  client.on("event", onEvent);
  server.on("event", onEvent);
}
