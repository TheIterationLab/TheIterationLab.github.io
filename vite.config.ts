import { defineConfig } from 'vite';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cpSync, existsSync, mkdirSync, copyFileSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

function copyRootStaticDirs() {
  return {
    name: 'copy-root-static-dirs',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const rawUrl = req.url || '';
        const pathname = rawUrl.split('?')[0];
        if (/^\/profiles?\/edit\/?$/i.test(pathname)) {
          const search = rawUrl.includes('?') ? rawUrl.slice(rawUrl.indexOf('?')) : '';
          req.url = `/profile/edit/index.html${search}`;
        } else if (
          /^\/profiles?(\/.*)?$/i.test(pathname) &&
          !/^\/profiles?\/edit(\/|$)/i.test(pathname) &&
          !/\.[a-z0-9]+$/i.test(pathname)
        ) {
          const search = rawUrl.includes('?') ? rawUrl.slice(rawUrl.indexOf('?')) : '';
          req.url = `/profile/index.html${search}`;
        } else if (
          /^\/researches\/[^/]+\/?$/i.test(pathname) &&
          !/^\/researches\/(index\.html|img)(\/|$)/i.test(pathname) &&
          !/\.[a-z0-9]+$/i.test(pathname)
        ) {
          const search = rawUrl.includes('?') ? rawUrl.slice(rawUrl.indexOf('?')) : '';
          req.url = `/researches/index.html${search}`;
        } else if (
          /^\/softwares\/[^/]+\/?$/i.test(pathname) &&
          !/^\/softwares\/(index\.html|img)(\/|$)/i.test(pathname) &&
          !/\.[a-z0-9]+$/i.test(pathname)
        ) {
          const search = rawUrl.includes('?') ? rawUrl.slice(rawUrl.indexOf('?')) : '';
          req.url = `/softwares/index.html${search}`;
        } else if (/^\/teams\/?$/i.test(pathname)) {
          const search = rawUrl.includes('?') ? rawUrl.slice(rawUrl.indexOf('?')) : '';
          req.url = `/teams/index.html${search}`;
        }
        next();
      });
    },
    closeBundle() {
      const staticDirs = [
        'public',
        'src/assets/images',
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

      const builtResearchesHtml = resolve(__dirname, 'dist/researches/index.html');
      if (existsSync(builtResearchesHtml)) {
        const sampleResDir = resolve(__dirname, 'dist/researches/ILR0001');
        mkdirSync(sampleResDir, { recursive: true });
        copyFileSync(builtResearchesHtml, resolve(sampleResDir, 'index.html'));
      }

      const builtSoftwaresHtml = resolve(__dirname, 'dist/softwares/index.html');
      if (existsSync(builtSoftwaresHtml)) {
        const sampleSwDir = resolve(__dirname, 'dist/softwares/ILS0001');
        mkdirSync(sampleSwDir, { recursive: true });
        copyFileSync(builtSoftwaresHtml, resolve(sampleSwDir, 'index.html'));
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
        profileEdit: resolve(__dirname, 'profile/edit/index.html'),
        leaders: resolve(__dirname, 'leaders/index.html'),
        researches: resolve(__dirname, 'researches/index.html'),
        students: resolve(__dirname, 'students/index.html'),
        teachers: resolve(__dirname, 'teachers/index.html'),
        institutes: resolve(__dirname, 'institutes/index.html'),
        softwares: resolve(__dirname, 'softwares/index.html'),
        communities: resolve(__dirname, 'communities/index.html'),
        teams: resolve(__dirname, 'teams/index.html'),
      },
    },
  },
});
