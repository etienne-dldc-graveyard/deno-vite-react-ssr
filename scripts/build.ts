import fse from "fs-extra";
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
  const client = await buildClient("production");
  client.close();

  console.log(`=> Building Server`);
  const server = await buildServer("production");
  server.close();

  console.log(`=> Copying files`);
  await copyFiles(false);
}
