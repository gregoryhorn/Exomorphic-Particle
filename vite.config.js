import {defineConfig} from 'vite';
export default defineConfig({base:'./',build:{outDir:'dist',emptyOutDir:true,rollupOptions:{input:{page:'index.html',mini:'mini.html'}}}});
