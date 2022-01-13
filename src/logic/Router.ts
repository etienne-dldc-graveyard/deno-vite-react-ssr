import { To, Location } from "history";
import { SubscribeMethod } from "suub";

export type ActiveRoute = {
  location: Location;
  Component: React.ComponentType;
  props: Record<string, unknown>;
};

export interface Router {
  readonly route: ActiveRoute;
  subscribe: SubscribeMethod<ActiveRoute>;
  createHref(to: To): string;
  push(to: To): void;
  replace(to: To): void;
  go(delta: number): void;
  back(): void;
  forward(): void;
}
