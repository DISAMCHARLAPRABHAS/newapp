// Project-local PostCSS config (CommonJS) to avoid picking up a global config that requires Tailwind
// Using .cjs so module.exports works even when package.json sets "type": "module".

module.exports = {
  plugins: {}
};
