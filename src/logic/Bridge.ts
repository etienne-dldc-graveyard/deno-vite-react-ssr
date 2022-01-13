// deno-lint-ignore-file no-explicit-any
import { sanitize, restore } from "zenjson";
import { Router } from "./Router.ts";

export type BridgeData = {
  props: Record<string, unknown>;
  route: string;
  params: Record<string, unknown>;
};

export const BRIDGE_DATA_ID = "__BRIDGE_DATA__";

export function createBridgeData(data: BridgeData): string {
  return JSON.stringify(sanitize(data));
}

export function getBridgeData(): BridgeData {
  return restore(
    JSON.parse(document.getElementById(BRIDGE_DATA_ID)!.textContent ?? "{}")
  ) as any;
}

export type Render = (
  router: Router,
  Component: React.ComponentType<any>,
  props: any
) => JSX.Element;
