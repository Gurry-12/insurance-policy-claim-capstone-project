import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// The dev server proxies /api to the backend. The backend origin is read from
// the gitignored .env (VITE_API_PROXY_TARGET) so no backend URL is ever
// committed; it is required when starting the dev server.
export default defineConfig(({ mode, command }) => {
  // eslint-disable-next-line no-undef
  const env = loadEnv(mode, process.cwd(), '')
  const apiProxyTarget = env.VITE_API_PROXY_TARGET
  if (command === 'serve' && !apiProxyTarget) {
    throw new Error('VITE_API_PROXY_TARGET is not set. Add it to the gitignored .env file.')
  }
  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  }
})
