import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import VueDevTools from 'vite-plugin-vue-devtools'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/gitLogin',
  plugins: [
    vue(),
    VueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 6788,
    proxy: {
      '/api': { //这里的test可以理解为后端接口里面的前缀，就是所有的地址前面都是http://aaa.com/test/xxx/xxx
        target: 'http://localhost:7001',//这个不多说，请求的目标地址
        changeOrigin: true,//是否允许跨域
        rewrite: path => path.replace(/^\/api/, '')
      }
    }
  }

})
