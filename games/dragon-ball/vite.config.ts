import { defineConfig } from 'vite';

// Desktop browsers with ES2022 load the two local GLBs before scene creation.
export default defineConfig({ build: { target: 'es2022' } });
