// deno-lint-ignore-file no-explicit-any ban-types

declare module "~pages" {
  import React from "react";

  export type Redirect = { destination: string; permanent: boolean };

  export type Path<Params> = { params: Params };

  export type PropsResult<Props> =
    | { notFound: true }
    | { redirect: Redirect }
    | {
        props: Props;
        /**
         * This does not work like NextJS because we never SSG
         * so `true` is default (ssr)
         * and `false` is ssr once then kee in cache
         */
        revalidate?: number | boolean;
      };

  export type Context<Params> = {
    query: Params;
  };

  export type SSROptions<Props = {}, Params = {}> = {
    props?(
      context: Context<Params>
    ): PropsResult<Props> | Promise<PropsResult<Props>>;
    paths?(
      context: Context<Params>
    ): Array<Path<Params>> | Promise<Array<Path<Params>>>;
  };

  export type PageModule = {
    ssr?: SSROptions<any, any>;
    default: React.ComponentType<any>;
  };

  export type Page = {
    path: string;
    module: () => Promise<PageModule>;
  };

  const pages: Array<Page>;

  export default pages;
}
