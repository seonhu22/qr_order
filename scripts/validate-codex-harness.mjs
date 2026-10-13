import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import process from 'node:process';

const root = process.cwd();
const errors = [];

const requiredFiles = [
  'AGENTS.md',
  'frontend/AGENTS.md',
  'qrorder/AGENTS.md',
  '.codex/config.toml',
  '.codex/agents/qrorder-explorer.toml',
  '.codex/agents/qrorder-reviewer.toml',
  'docs/architecture/README.md',
  'docs/decisions/README.md',
  'docs/verification/README.md',
  'docs/verification/contracts.json',
  'docs/harness/README.md',
];

for (const path of requiredFiles) {
  if (!existsSync(resolve(root, path))) errors.push(`Missing required harness file: ${path}`);
}

const configPath = resolve(root, '.codex/config.toml');
if (existsSync(configPath)) {
  const config = readFileSync(configPath, 'utf8');
  const userOwnedSettings = ['model =', 'service_tier =', 'approval_policy =', 'sandbox_mode =', 'default_permissions ='];
  for (const setting of userOwnedSettings) {
    if (config.includes(setting)) errors.push(`Project config must not choose user-owned setting: ${setting}`);
  }
}

const instructionPaths = ['AGENTS.md', 'frontend/AGENTS.md', 'qrorder/AGENTS.md'];
const instructionBytes = instructionPaths.reduce((sum, path) => {
  const absolute = resolve(root, path);
  return sum + (existsSync(absolute) ? Buffer.byteLength(readFileSync(absolute, 'utf8')) : 0);
}, 0);
if (instructionBytes > 32 * 1024) errors.push(`Combined AGENTS.md size exceeds 32 KiB: ${instructionBytes} bytes`);

const contractPath = resolve(root, 'docs/verification/contracts.json');
if (existsSync(contractPath)) {
  try {
    const document = JSON.parse(readFileSync(contractPath, 'utf8'));
    if (document.version !== 1 || !Array.isArray(document.contracts)) throw new Error('Expected version 1 and contracts array');
    const ids = new Set();
    for (const contract of document.contracts) {
      if (!contract.id || ids.has(contract.id)) errors.push(`Missing or duplicate contract id: ${contract.id ?? '<empty>'}`);
      ids.add(contract.id);
      if (!contract.applies_when?.paths?.length) errors.push(`${contract.id}: applies_when.paths is required`);
      if (!contract.required_context?.length) errors.push(`${contract.id}: required_context is required`);
      if (!contract.invariants?.length) errors.push(`${contract.id}: invariants is required`);
      if (!contract.checks?.length) errors.push(`${contract.id}: checks is required`);
      if (!contract.required_evidence?.length) errors.push(`${contract.id}: required_evidence is required`);
      if (!contract.pass_condition) errors.push(`${contract.id}: pass_condition is required`);
      for (const contextPath of contract.required_context ?? []) {
        if (!existsSync(resolve(root, contextPath))) errors.push(`${contract.id}: missing required context ${contextPath}`);
      }
    }
  } catch (error) {
    errors.push(`Invalid verification contract: ${error.message}`);
  }
}

const markdownPaths = [
  'docs/architecture/README.md',
  'docs/decisions/README.md',
  'docs/verification/README.md',
  'docs/harness/README.md',
];
for (const markdownPath of markdownPaths) {
  const absolute = resolve(root, markdownPath);
  if (!existsSync(absolute)) continue;
  const markdown = readFileSync(absolute, 'utf8');
  for (const match of markdown.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
    const target = match[1];
    if (/^(https?:|#)/.test(target)) continue;
    const withoutAnchor = target.split('#')[0];
    if (!existsSync(resolve(dirname(absolute), withoutAnchor))) {
      errors.push(`${markdownPath}: broken local link ${target}`);
    }
  }
}

try {
  const ignored = execFileSync('git', ['check-ignore', 'AGENTS.md', 'frontend/AGENTS.md', 'qrorder/AGENTS.md'], {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();
  if (ignored) errors.push(`Shared instruction files are ignored by Git: ${ignored.replaceAll('\n', ', ')}`);
} catch {
  // git check-ignore exits 1 when none of the files are ignored, which is the desired state.
}

if (errors.length > 0) {
  console.error('Codex harness validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Codex harness validation passed (${requiredFiles.length} required files, ${instructionBytes} instruction bytes).`);
