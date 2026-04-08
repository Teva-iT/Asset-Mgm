import nextVitals from "eslint-config-next/core-web-vitals";

const withoutReactRules = nextVitals.map((entry) => {
  if (!entry.rules) return entry;

  const rules = Object.fromEntries(
    Object.entries(entry.rules).filter(([ruleName]) => !ruleName.startsWith("react/"))
  );

  return {
    ...entry,
    rules,
  };
});

const config = [
  ...withoutReactRules,
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "supabase/**",
      "*.sql",
      "*.js",
    ],
  },
];

export default config;
