// Proves the import-boundary lint rules still fire (CLAUDE.md §4.2, §6.6, §9).
// Lints virtual files with the real eslint.config.js; type-aware rules are disabled so the
// probe files need not exist on disk.
import { ESLint } from 'eslint';
import tseslint from 'typescript-eslint';

const RULE = 'no-restricted-imports';

/** @type {{ file: string, code: string, blocked: boolean }[]} */
const cases = [
  {
    file: 'apps/web-nextjs/src/probe.ts',
    code: "import '@vp/domain-schema/rules';",
    blocked: true,
  },
  {
    file: 'apps/web-nextjs/src/probe.ts',
    code: "import type { X } from '@vp/domain-schema/rules/x';\nexport type Y = X;",
    blocked: true,
  },
  {
    file: 'apps/web-nextjs/src/probe.ts',
    code: "export * from '@vp/domain-schema/rules';",
    blocked: true,
  },
  { file: 'apps/web-nextjs/src/probe.ts', code: "import '@vp/api-nextjs';", blocked: true },
  {
    file: 'apps/web-nextjs/src/probe.ts',
    code: "import '../../../backends/api-nextjs/src/index.ts';",
    blocked: true,
  },
  {
    file: 'apps/web-nextjs/src/probe.ts',
    code: "import type { X } from '@vp/domain-schema/wire';\nexport type Y = X;",
    blocked: false,
  },
  { file: 'journeys/src/probe.ts', code: "import '@vp/domain-schema/wire';", blocked: true },
  {
    file: 'journeys/src/probe.ts',
    code: "import '../../apps/web-nextjs/src/index.ts';",
    blocked: true,
  },
  { file: 'journeys/src/probe.ts', code: "import '@playwright/test';", blocked: false },
  {
    file: 'backends/api-nextjs/src/probe.ts',
    code: "import '@vp/domain-schema/rules';",
    blocked: false,
  },
];

const eslint = new ESLint({
  overrideConfig: [{ files: ['**/*.ts'], ...tseslint.configs.disableTypeChecked }],
});

let failures = 0;
for (const { file, code, blocked } of cases) {
  const [result] = await eslint.lintText(code, { filePath: file });
  const hits = (result?.messages ?? []).filter((m) => m.ruleId === RULE);
  if (hits.length > 0 !== blocked) {
    failures++;
    console.error(
      `FAIL ${file}: expected ${blocked ? 'blocked' : 'allowed'}: ${code.split('\n')[0]}`,
    );
  }
}

if (failures > 0) {
  console.error(`lint-boundary-probe: ${failures} of ${cases.length} cases failed`);
  process.exit(1);
}
console.log(`lint-boundary-probe: ${cases.length} cases passed`);
