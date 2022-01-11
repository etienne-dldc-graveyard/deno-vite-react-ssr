// deno-lint-ignore-file no-explicit-any
export type BridgeData = {
  props: Record<string, unknown>;
  route: string;
  params: Record<string, unknown>;
};

export const BRIDGE_DATA_ID = "__BRIDGE_DATA__";

export function getBridgeData(): BridgeData {
  return JSON.parse(
    document.getElementById(BRIDGE_DATA_ID)!.textContent ?? "{}"
  ) as any;
}
