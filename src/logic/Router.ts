import { To, Location } from "history";

export interface Router {
  readonly location: Location;
  createHref(to: To): string;
  push(to: To): void;
  replace(to: To): void;
  go(delta: number): void;
  back(): void;
  forward(): void;
}
