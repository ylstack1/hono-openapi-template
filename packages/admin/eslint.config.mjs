import rootConfig from "../../eslint.config.mjs";

export default [
  ...rootConfig,
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "unicorn/filename-case": [
        "error",
        {
          cases: {
            kebabCase: true,
            pascalCase: true,
            camelCase: true,
          },
          ignore: [/^use[A-Z].+\.tsx?$/],
        },
      ],
    },
  },
];
