import babel from '@rolldown/plugin-babel';
import tailwindcss from '@tailwindcss/vite';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import JavaScriptObfuscator from 'javascript-obfuscator';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    tsconfigPaths(),
    tailwindcss(),
    react(),
    babel({
      filter: /\.[jt]sx?$/,
      babelConfig: {
        presets: [reactCompilerPreset()],
      },
    }),
    {
      name: 'obfuscate-source',
      apply: 'build',
      generateBundle(_, bundle) {
        const SKIP = /vendor|mermaid|pdf\.worker|rolldown-runtime|katex/;
        for (const [name, chunk] of Object.entries(bundle)) {
          if (chunk.type !== 'chunk' || SKIP.test(name)) continue;
          chunk.code = JavaScriptObfuscator.obfuscate(chunk.code, {
            compact: true,
            controlFlowFlattening: false,
            stringArray: true,
            stringArrayEncoding: ['rc4'],
            stringArrayThreshold: 0.5,
          }).getObfuscatedCode();
        }
      },
    },
  ],
  server: {
    port: 5173,
    open: false,
    allowedHosts: ['.trycloudflare.com'],
    proxy: {
      '/ws': {
        target: `http://localhost:${process.env.PORT ?? 3000}`,
        ws: true,
      },
      '/socket.io': {
        target: `http://localhost:${process.env.PORT ?? 3000}`,
        ws: true,
      },
    },
  },
  optimizeDeps: {
    include: ['mermaid'],
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    cssMinify: true,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'mermaid',
              test: /mermaid/,
              priority: 20,
              minSize: 0,
            },
            {
              name: 'vendor',
              test: /node_modules/,
              priority: 10,
              minSize: 0,
            },
          ],
        },
      },
    },
  },
});
