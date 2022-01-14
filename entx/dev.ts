import type { RollupWatcherEvent } from "rollup";
import fse from "fs-extra";
import { debounce } from "throttle-debounce";
import {
  projectPath,
  buildClient,
  buildServer,
  notifyChanges,
} from "./internal/tools";

main().catch(console.error);
async function main() {
  console.info(`=> Cleanup`);
  await fse.emptyDir(projectPath("dist"));

  console.info("=> Building Client");
  const client = await buildClient("development");

  console.info(`=> Building Server`);
  const server = await buildServer("development");

  console.info(`=> Waiting for changes`);
  const debouncedNotifyChanges = debounce(500, notifyChanges);

  const onEvent = (event: RollupWatcherEvent) => {
    if (event.code === "BUNDLE_END") {
      debouncedNotifyChanges();
    }
  };

  client.on("event", onEvent);
  server.on("event", onEvent);
}
