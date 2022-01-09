# React SSR running on Deno (powered by Vite)

## What is this project

You can think of this as an alternative to [Next](https://nextjs.org/) that runs in [Deno](https://deno.land/) instead of Node (maybe I should call this `entx` 🙃).

## How does it work

We use Vite to bundle the App twice:

- For the browser as usual but we remove `getServerSideProps` exports
- For `Deno` with the `--ssr` option

We only use Yarn and `node_modules` to install vite and its plugins, everything else uses native ESM imports (like in Deno). This is acheived using a custom plugin in Vite that interact with Deno's cache.

## Project status

This is a very early experiment but right now a very basic version `getServerSideProps` is working. The page is correctly rendered on the server then hydrated by the client.

The big missing piece right now is client side routing.

## How to run the project

You need Deno, Node and [Yarn](https://classic.yarnpkg.com/lang/en/) installed for developement.
Once deployed the app only needs Deno.

- Install Node's deps with `yarn install`
- Run the build with `yarn run build`
- Start the server by runing the VSCode task `Run server`

**Note**: For now you have to run `yarn run build` again when you change the code to update the app.
