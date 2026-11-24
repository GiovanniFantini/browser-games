import tseslint from "typescript-eslint";
import hooks from "eslint-plugin-react-hooks";

export default [
  { ignores: ["dist/**", "artifacts/**"] },
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.tsx", "src/ui/**/*.ts"],
    plugins: { "react-hooks": hooks },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error",
    },
  },
  {
    files: ["src/engine/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            "react",
            "react/*",
            "react-dom",
            "react-dom/*",
            "zustand",
            "zustand/*",
            "pixi.js",
            "pixi.js/*",
            "@ui",
            "@ui/*",
            "@worker",
            "@worker/*",
            "@map/*",
            "**/ui",
            "**/ui/**",
            "**/worker",
            "**/worker/**",
            "**/map",
            "**/map/**",
          ],
        },
      ],
      "no-restricted-properties": [
        "error",
        { object: "Math", property: "random" },
        { object: "Date", property: "now" },
        { object: "performance", property: "now" },
      ],
      "no-restricted-syntax": [
        "error",
        "NewExpression[callee.name='Date']",
        "CallExpression[callee.name='Date']",
      ],
    },
  },
];
