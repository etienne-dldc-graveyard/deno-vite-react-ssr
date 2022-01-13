// deno-lint-ignore-file no-explicit-any
import type {
  Redirect,
  GetServerSideProps,
  GetServerSidePropsContext,
} from "~pages";
import { Path } from "history";
import { getBuildOutput } from "./BuildOutputManager.ts";
import { matchRoute, Route, RouteMatch } from "src/logic/Route.ts";

export type PageResolved =
  | {
      kind: "render";
      props: Record<string, any>;
      noProps: boolean;
      Component: React.ComponentType<any>;
      isNotFound: boolean;
      route: Route;
      params: Record<string, unknown>;
    }
  | { kind: "redirect"; redirect: Redirect };

export async function resolvePage(path: Path): Promise<PageResolved> {
  const { routes, notFoundRoute } = await getBuildOutput();
  const notFoundRouteMatch: RouteMatch = {
    route: notFoundRoute,
    params: {},
    isNotFound: true,
  };
  if (path.hash || path.search) {
    throw new Error("Hash and search params are not supported yet");
  }
  const match = matchRoute(routes, path.pathname) ?? notFoundRouteMatch;
  return resolveRouteMatch(match, notFoundRouteMatch);
}

async function resolveRouteMatch(
  routeMatch: RouteMatch,
  notFoundRouteMatch: RouteMatch
): Promise<PageResolved> {
  const { route, params } = routeMatch;
  const { getServerSideProps, default: Component } = await route.module();
  const context: GetServerSidePropsContext<any> = {
    query: params,
  };
  const propsResult = await resolveProps(getServerSideProps, context);
  if (propsResult.kind === "notFound") {
    return resolveRouteMatch(notFoundRouteMatch, notFoundRouteMatch);
  }
  if (propsResult.kind === "redirect") {
    return { kind: "redirect", redirect: propsResult.redirect };
  }
  const props = propsResult.kind === "noProps" ? {} : propsResult.props;
  return {
    kind: "render",
    props,
    noProps: propsResult.kind === "noProps",
    Component,
    isNotFound: routeMatch.isNotFound ?? false,
    route,
    params,
  };
}

export type PropsResultResolved =
  | { kind: "noProps" }
  | { kind: "notFound" }
  | { kind: "redirect"; redirect: Redirect }
  | { kind: "props"; props: Record<string, unknown> };

async function resolveProps(
  getServerSideProps: GetServerSideProps | undefined,
  context: GetServerSidePropsContext<any>
): Promise<PropsResultResolved> {
  if (!getServerSideProps) {
    return { kind: "noProps" };
  }
  const result = await getServerSideProps(context);
  if ("notFound" in result) {
    return { kind: "notFound" };
  }
  if ("redirect" in result) {
    return { kind: "redirect", redirect: result.redirect };
  }
  return { kind: "props", props: result.props };
}
