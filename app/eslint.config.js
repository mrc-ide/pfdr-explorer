import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import { importX } from 'eslint-plugin-import-x';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  globalIgnores(['dist', 'coverage']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: { globals: globals.browser },
    plugins: { 'import-x': importX },
    rules: {
      'import-x/no-restricted-paths': ['error', {
        zones: [
          {
            target: './src/lib',
            from: './src',
            except: ['./lib'],
            message: 'Code in src/lib must not import app code: pass app specifics in as props or configuration.',
          },
          {
            target: './src/lib/core',
            from: './src/lib',
            except: ['./core'],
            message: 'Code in src/lib/core must not depend on the React layer or on CHARM.',
          },
          {
            target: './src/lib/charm',
            from: './src/lib',
            except: ['./core', './charm'],
            message: 'CHARM is framework-agnostic: it may use src/lib/core, never the React components.',
          },
        ],
      }],
    },
  },
  {
    files: ['src/lib/core/**', 'src/lib/charm/**'],
    rules: {
      'no-restricted-imports': ['error', {
        paths: [
          { name: 'react', message: 'src/lib/core and src/lib/charm are framework-agnostic: no React here.' },
          { name: 'react-dom', message: 'src/lib/core and src/lib/charm are framework-agnostic: no React here.' },
        ],
      }],
    },
  },
]);
