import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/main.ts'],
  format: ['esm'],
  target: 'node22',
  outDir: 'dist',
  clean: false,
  splitting: false,
  minify: true,
  fixedExtension: false,
  dts: false,
  deps: {
    alwaysBundle: [/.*/],
  },
});
