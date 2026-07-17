const path = require('path');

module.exports = {
  root: true,
  ignorePatterns: ['code-push.config.ts'],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "./tsconfig.json",
    ignorePatterns: ['index.js'],
  },
 "extends": [
    "eslint:recommended",
    "plugin:react/recommended",
    "airbnb",
    "airbnb/hooks",
    "prettier",
    "@react-native"
  ],
  "plugins": [
    "@typescript-eslint",
    "import",
    "react",
    "react-hooks",
    "jsx-a11y",
    "prettier",
    "react-native"
  ],
  settings: {
    react: {
      version: 'detect',
    },
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
    'import/resolver': {
      typescript: {
        project: './tsconfig.json',
      },
    },
  },
  "rules": {
    "import/prefer-default-export": "off",
    "no-continue": "off",
    "no-console": "error",
    "comma-dangle": "off",
    "prettier/prettier": "error",
    "react/state-in-constructor": ["error", "never"],
    "react/require-default-props": "off",
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        js: 'never',
        jsx: 'never',
        ts: 'never',
        tsx: 'never',
      },
    ],
    "react/jsx-filename-extension": [
      2,
      { extensions: [".ts", ".tsx"] },
    ],
  }
};
