import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // 외부 벤더 워커·서비스 워커·에이전트 패키지 복사본 — lint 대상 아님
    "public/**",
  ]),
  {
    // /tools/* 유틸리티 페이지는 외부 기여·실험 범위 — 엄격 규칙 완화.
    // 본체 (chat/dashboard/settings/...) 는 기존 기준 유지.
    files: ["src/app/tools/**/*.{ts,tsx}"],
    rules: {
      "react-hooks/rules-of-hooks": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/set-state-in-render": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
]);

export default eslintConfig;
