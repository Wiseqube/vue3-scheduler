import { resolve } from 'path';
import { defineConfig } from "vite";
import eslintPlugin from "@nabla/vite-plugin-eslint";
import vue from "@vitejs/plugin-vue";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), eslintPlugin(),],
  define: {
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/lib.js'),
      name: "VueScheduler2",
      fileName: 'vue-scheduler',
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        globals: {
          vue: 'Vue',
        }
      }
    },
    sourcemap: true
  }
});
