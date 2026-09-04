import { defineConfig } from 'vite';

export default defineConfig({
  base: '/portfolio-template/',
  plugins: [{
    name: 'portfolio-prefetch-manifest',
    generateBundle(_options, bundle) {
      const assets = Object.values(bundle)
        .filter(asset => (asset.type === 'chunk' && asset.isEntry) || asset.fileName.endsWith('.css'))
        .map(asset => `/portfolio-template/${asset.fileName}`);
      this.emitFile({ type: 'asset', fileName: 'entry.json', source: JSON.stringify(assets) });
    },
  }],
  build: {
    outDir: '../../public/portfolio-template',
    emptyOutDir: true,
  },
});
