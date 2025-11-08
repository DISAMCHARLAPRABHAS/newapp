// Project-local PostCSS config to avoid picking up a global config that requires Tailwind
// This file uses ESM export because package.json contains "type": "module".
// If you prefer CommonJS, remove this .js file and keep postcss.config.cjs instead.

export default {
  plugins: {}
};
