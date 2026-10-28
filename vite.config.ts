import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { cpSync, existsSync, mkdirSync, copyFileSync } from 'node:fs';

function copyRootStaticDirs() {
  return {
    name: 'copy-root-static-dirs',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const rawUrl = req.url || '';
        const pathname = rawUrl.split('?')[0];
        if (
          /^\/profiles?(\/.*)?$/i.test(pathname) &&
          !/\.[a-z0-9]+$/i.test(pathname)
        ) {
          const search = rawUrl.includes('?') ? rawUrl.slice(rawUrl.indexOf('?')) : '';
          req.url = `/profile/index.html${search}`;
        }
        next();
      });
    },
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
        'profile/img',
      ];
      for (const dir of staticDirs) {
        const src = resolve(__dirname, dir);
        const dest = resolve(__dirname, 'dist', dir);
        if (existsSync(src)) {
          cpSync(src, dest, { recursive: true });
        }
      }

      const cnameSrc = resolve(__dirname, 'CNAME');
      if (existsSync(cnameSrc)) {
        copyFileSync(cnameSrc, resolve(__dirname, 'dist/CNAME'));
      }

      // Mirror compiled profile/index.html to clean static aliases for GitHub Pages
      const builtProfileHtml = resolve(__dirname, 'dist/profile/index.html');
      if (existsSync(builtProfileHtml)) {
        const aliasDirs = [
          'dist/profiles',
          'dist/profile/S/ikramulhoquearik',
          'dist/profiles/S/ikramulhoquearik',
          'dist/profile/S/ikramul-hoque',
          'dist/profiles/S/ikramul-hoque',
        ];
        for (const alias of aliasDirs) {
          const targetDir = resolve(__dirname, alias);
          mkdirSync(targetDir, { recursive: true });
          copyFileSync(builtProfileHtml, resolve(targetDir, 'index.html'));
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
    strictPort: true,
    allowedHosts: true,
    hmr: process.env.DISABLE_HMR !== 'true',
  },
  preview: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: true,
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        notfound: resolve(__dirname, '404.html'),
        login: resolve(__dirname, 'login.html'),
        profile: resolve(__dirname, 'profile/index.html'),
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
