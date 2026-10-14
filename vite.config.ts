/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

const resolvePath = (relative: string) => fileURLToPath(new URL(relative, import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolvePath('./src'),
      '@features': resolvePath('./src/features'),
      '@shared': resolvePath('./src/shared'),
      '@app': resolvePath('./src/app'),
      '@test': resolvePath('./src/test'),
    },
  },
  server: {
    port: 5173,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Chunks manuales: evita un bundle monolítico y mejora el cacheo en produccion.
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          'vendor-charts': ['recharts'],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    include: ['src/**/*.{test,spec}.{ts,tsx}', 'api/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}', 'api/**/*.ts'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'api/**/*.test.{ts,tsx}',
        'src/test/**',
        'src/**/index.ts',
        'src/main.tsx',
        'src/vite-env.d.ts',
        'src/**/types.ts',
      ],
      thresholds: {
        statements: 55,
        branches: 60,
        functions: 55,
        lines: 55,
      },
    },
  },
});
