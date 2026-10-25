import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { cpSync, existsSync } from 'node:fs';

function copyRootStaticDirs() {
  return {
    name: 'copy-root-static-dirs',
    closeBundle() {
      const staticDirs = [
        'public',
        'leaders/img',
        'students/img',
        'teachers/img',
        'institutes/img',
        'researches/img',
        'softwares/img',
        'communities/img',
        'profile',
        'profiles',
      ];
      for (const dir of staticDirs) {
        const src = resolve(__dirname, dir);
        const dest = resolve(__dirname, 'dist', dir);
        if (existsSync(src)) {
          cpSync(src, dest, { recursive: true });
        }
      }
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  publicDir: false,
  plugins: [copyRootStaticDirs()],
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        login: resolve(__dirname, 'login.html'),
        leaders: resolve(__dirname, 'leaders/index.html'),
        researches: resolve(__dirname, 'researches/index.html'),
        students: resolve(__dirname, 'students/index.html'),
        teachers: resolve(__dirname, 'teachers/index.html'),
        institutes: resolve(__dirname, 'institutes/index.html'),
        softwares: resolve(__dirname, 'softwares/index.html'),
        communities: resolve(__dirname, 'communities/index.html'),
      },
    },
  },
});
