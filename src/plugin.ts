import { cloudflare } from '@cloudflare/vite-plugin'
import build from '@hono/vite-build/cloudflare-workers'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import type { PluginOption } from 'vite'
import ssrHotReload from 'vite-plugin-ssr-hot-reload'

interface Config {
  serverEntry: string
  clientEntry: string
  cssEntry: string
  serverDirectories: string[]
}

const defaultConfig: Config = {
  serverEntry: 'src/server.ts',
  clientEntry: 'src/client.tsx',
  cssEntry: 'src/styles.css',
  serverDirectories: ['src/server'],
}

export function reactStack(config: Config = defaultConfig): PluginOption[] {
  const basePlugins: PluginOption[] = [...cloudflare(), ...tailwindcss()]

  return [
    {
      name: 'hono-vite-react-stack',
      config: (_config, env) => {
        const isBuild = env.command === 'build'
        const isSsrBuild = env.isSsrBuild === true
        if (isBuild && isSsrBuild) {
          basePlugins.push(build({ entry: config.serverEntry }))
        } else if (!isBuild && env.command === 'serve') {
          basePlugins.push(
            ssrHotReload({
              entry: config.serverDirectories,
              injectReactRefresh: true,
            }),
            react()
          )
        }
      },
    },
    ...basePlugins,
  ]
}
