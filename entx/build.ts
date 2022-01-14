import fse from "fs-extra";
import { projectPath, buildClient, buildServer } from "./internal/tools";

main().catch(console.error);
async function main() {
  console.info(`=> Cleanup`);
  await fse.emptyDir(projectPath("dist"));

  console.info("=> Building Client");
  const client = await buildClient("production");
  client.close();

  console.info(`=> Building Server`);
  const server = await buildServer("production");
  server.close();
}
