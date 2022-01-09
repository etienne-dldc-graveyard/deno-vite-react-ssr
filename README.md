# React SSR running on Deno (powered by Vite)

## What is it ?

You can think of this as an alternative to Next that runs in Deno instead of Node (maybe I should call this `entx` 🙃).

## How does it work ?

We use Vite to bundle the App twice:

- For the browser as usual
- For `Deno` with the `--ssr` option

We only use Yarn and `node_modules` to install vite and its plugins, everything else uses native ESM imports (like in Deno). This is acheived using a custom plugin in Vite that interact with Deno's cache.

## Project status

This is a very early experiment but right now
