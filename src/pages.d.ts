// deno-lint-ignore-file no-explicit-any ban-types

declare module "~pages" {
  import React from "react";

  export type Redirect = { destination: string; permanent: boolean };

  export type Path<Params> = { params: Params };

  export type GetServerSidePropsResult<Props> =
    | { notFound: true }
    | { redirect: Redirect }
    | { props: Props };

  export type GetServerSidePropsContext<Params> = {
    query: Params;
  };

  export type GetServerSideProps<Props = {}, Params = {}> = (
    context: GetServerSidePropsContext<Params>
  ) =>
    | Promise<GetServerSidePropsResult<Props>>
    | GetServerSidePropsResult<Props>;

  export type PageModule = {
    getServerSideProps?: GetServerSideProps<any, any>;
    default: React.ComponentType<any>;
  };

  export type Page = {
    path: string;
    module: () => Promise<PageModule>;
  };

  const pages: Array<Page>;

  export default pages;
}
