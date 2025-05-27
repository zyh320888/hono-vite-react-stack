import { defaultOptions as buildPluginDefaultOptions } from '@hono/vite-build'
import build from '@hono/vite-build/node'
import type { NodeBuildOptions } from '@hono/vite-build/node'
import tailwindcss from '@tailwindcss/vite'
// import react from '@vitejs/plugin-react'
import type { Plugin, PluginOption } from 'vite'
import ssrHotReload from 'vite-plugin-ssr-hot-reload'
import devServer from '@hono/vite-dev-server'

interface Config {
  serverEntry?: string
  buildOutputDir?: string
  buildPluginOptions?: NodeBuildOptions
  clientEntry?: string
  cssEntry?: string
  serverDirectories?: string[],
  port?: number,
  minify?: boolean

}

const defaultConfig: Required<Config> = {
  serverEntry: 'src/server/index.tsx',
  buildOutputDir: 'dist-server',
  buildPluginOptions: buildPluginDefaultOptions,
  clientEntry: 'src/client/index.tsx',
  cssEntry: 'src/style.css',
  serverDirectories: ['src/server/*'],
  port: 3000,
  minify: true
}

export function reactStack(config: Config = {}): PluginOption[] {
  const resolvedConfig: Required<Config> = {
    ...defaultConfig,
    ...config,
  }

  const configPlugin: Plugin = {
    name: 'hono-vite-react-stack',
    config: (_, env) => {
      if (env.command === 'build' && !env.isSsrBuild) {
        return {
          esbuild: {
            exclude: ['react', 'react-dom'],
          },
          build: {
            manifest: true,
            rollupOptions: {
              input: [resolvedConfig.clientEntry, resolvedConfig.cssEntry],
            },
          },
        }
      }
    },
  }

  const ssrHotReloadPlugin = ssrHotReload({
    entry: resolvedConfig.serverDirectories,
    injectReactRefresh: true,
  })
  ssrHotReloadPlugin.apply = (_config, env) => env.command === 'serve'

  // const reactPlugins = react() as Plugin[]
  // for (const plugin of reactPlugins) {
  //   plugin.apply = (_config, env) => env.command === 'serve'
  // }

  const buildPlugin = build({
    minify: resolvedConfig.minify,
    port: resolvedConfig.port,
    entry: resolvedConfig.serverEntry,
    outputDir: resolvedConfig.buildOutputDir,
  })

  buildPlugin.apply = (_config, env) => env.command === 'build' && env.isSsrBuild === true

  return [
    configPlugin,
    devServer({
      entry: resolvedConfig.serverEntry,
    }),
    // reactPlugins,
    ssrHotReloadPlugin,
    buildPlugin,
    tailwindcss(),
  ]
}