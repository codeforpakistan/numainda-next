import { defineConfig, globalIgnores } from "eslint/config"
import nextVitals from "eslint-config-next/core-web-vitals"
import prettier from "eslint-config-prettier"

const eslintConfig = defineConfig([
  ...nextVitals,
  prettier,
  {
    rules: {
      "@next/next/no-html-link-for-pages": "off",
      "react/jsx-key": "off",
      // Next 16's hooks plugin flags existing effects that set state from
      // storage, theme mount, and chat URL params. Those effects stay as they are.
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/immutability": "off",
    },
  },
  globalIgnores([
    "dist/**",
    ".cache/**",
    "public/**",
    "node_modules/**",
    "**/*.esm.js",
    "scripts/**",
    ".next/**",
  ]),
])

export default eslintConfig
