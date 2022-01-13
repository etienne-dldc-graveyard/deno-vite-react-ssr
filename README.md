# React SSR running on Deno (powered by Vite)

## ⚠️ Experimental ⚠️

## What is this project

You can think of this as an alternative to [Next](https://nextjs.org/) that runs in [Deno](https://deno.land/) instead of Node (maybe I should call this `entx` 🙃).

## How does it work

We use Vite to bundle the App twice:

- For the browser we remove `getServerSideProps` exports (and the dependencies used inside)
- For `Deno` with the `--ssr` option

We only use Yarn and `node_modules` to install vite and its plugins, the app itself uses native ESM imports and `import_map.json` (like in Deno). This is acheived using a custom plugin in Vite that interact with Deno's cache.

## Project status

This is a very early experiment but right now a very basic version `getServerSideProps` is working. The page is correctly rendered on the server then hydrated by the client. Client side navigation also work (props are fetch from the server with `getServerSideProps`).

The next steps are:

- Handle Errors
- Integrate [react-helmet-async](https://github.com/staylor/react-helmet-async)
- Handle `revalidate` to cache

## How to run the project

You need Deno, Node and [Yarn](https://classic.yarnpkg.com/lang/en/) installed for developement.
Once deployed the app only needs Deno.

- Install Node's deps with `yarn install`

### Dev mode

- Start the build with `yarn run dev`
- Start the server by runing the VSCode task `Run server` (you need to have [Denon](https://github.com/denosaurs/denon) installed)

**Note**: Hot reloading is not working yet but you don't have to restart the server, just manually refresh the page to see your changes.

### Prod

- Build the app with `yarn run build`
- Then deploy the app and run `src/server.ts` with Deno
