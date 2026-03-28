import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginVue from "eslint-plugin-vue";
import css from "@eslint/css";
import { fileURLToPath } from "node:url";
import { includeIgnoreFile } from "@eslint/compat";
import { tailwind4 } from "tailwind-csstree";
import {
  defineConfigWithVueTs,
  vueTsConfigs,
} from '@vue/eslint-config-typescript'
const gitignorePath = fileURLToPath(new URL(".gitignore", import.meta.url));

export default defineConfigWithVueTs(
  includeIgnoreFile(gitignorePath, "Imported .gitignore patterns"),
  {
    files: ["**/*.{js,vue}"], extends: [...pluginVue.configs["flat/essential"], ...pluginVue.configs["flat/recommended"]],
    rules: {
      "vue/multi-word-component-names": "off",
      "vue/no-reserved-component-names": [
        "error",
        {
          disallowVueBuiltInComponents: false,
          disallowVue3BuiltInComponents: false,
        },
      ],
    }
  },
  vueTsConfigs.recommended,
  { files: ["**/*.{js,mjs,cjs,ts,mts,cts}"], extends: [js.configs.recommended, tseslint.configs.recommended], languageOptions: { globals: globals.browser } },
  {
    files: ["**/*.css"], language: "css/css", extends: [css.configs.recommended], languageOptions: {
      customSyntax: tailwind4
    },
    rules: {
      "css/no-empty-blocks": "error",
    },
  },

)


