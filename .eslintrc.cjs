module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'prettier'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended'
  ],
  overrides: [
    {
      files: ['*.svelte'],
      processor: 'svelte3/svelte3',
      rules: {}
    }
  ],
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  ignorePatterns: ['node_modules/', 'build/', '.svelte-kit/', 'static/'],
}; 