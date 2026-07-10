# _deprecated — código archivado (no vivo)

Código que **funciona pero ya nadie invoca**, movido aquí en la limpieza de 2026-07-10
para sacarlo del código vivo sin perderlo. Excluido de `tsc`/`next build`/`eslint`
(ver `tsconfig.json` exclude y `.eslintignore`). Si vuelve a hacer falta, restaurar con git.

- `src/lib/cascade.ts` (~1100 líneas) — motor de clasificación en cascada, solo para
  validar paridad contra el SQL del backend. Sin consumidor en la UI.
- `src/app/api/simulator-eval/route.ts` — endpoint dev que corría `runCascade`; nadie le hace fetch.
- `scripts/cascade-stdin.ts`, `scripts/validate-cascade.ts` — CLIs de QA (`npx tsx ...`), no en package.json.
