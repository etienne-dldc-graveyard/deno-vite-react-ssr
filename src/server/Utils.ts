import { resolve } from "std/path/mod.ts";

export function projectPath(...parts: Array<string>): string {
  return resolve(Deno.cwd(), ...parts);
}
