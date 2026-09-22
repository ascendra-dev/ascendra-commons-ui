#!/usr/bin/env node
/**
 * Ascendra Commons UI — vendored ascendra-ui update.
 *
 * Usage:
 *   node ascendra.js update       Pull the latest ascendra-ui/ folder from the public repo,
 *                                 into BOTH copies this project keeps
 *
 * This is a one-off project, already set up — there is no `setup` command here (see
 * ascendra-ui/ascendra.js in the sibling ascendra-ui repo for that; it's for turning a fresh
 * clone into a new consumer project, which this repo already is).
 *
 * Unlike a normal consumer project, this repo vendors ascendra-ui in TWO places: `ascendra-ui/`
 * at the root (what the commons packages under `packages/` and `reference/` build against) and
 * `testbed/ascendra-ui/` (the standalone Next.js app under `testbed/` that exercises those
 * packages end to end, and needs its own copy since it has its own `@/ascendra-ui` alias and
 * build). Both must stay in sync with each other and with the upstream source, so `update` clones
 * the source repo once and replaces both target folders from that single clone — never two
 * separate clones that could drift apart mid-run.
 *
 * update prompts for confirmation every time: it's a genuinely destructive, unguarded operation,
 * so an accidental invocation shouldn't be able to silently wipe either copy. Before prompting it
 * prints both exact paths being replaced, whether each currently exists, a nudge to review the
 * source repo's commit history (there's no CHANGELOG to check instead), and a warning if the
 * working tree has uncommitted git changes. Only on "y"/"yes" does it clone the public source repo
 * to a temp directory, replace both project folders with the ascendra-ui/ folder from that clone,
 * and delete the temp directory. There is no version to track — it always takes whatever is
 * currently on the source repo's default branch. It never touches either package.json — install
 * any new dependency yourself after reviewing the diff. Refuses to run non-interactively (no TTY),
 * since there'd be no way to confirm.
 */

const { execSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
const readline = require("readline");

const ROOT = path.resolve(__dirname);
const SOURCE_REPO = "https://github.com/ascendra-dev/ascendra-ui.git";
const TARGETS = [path.join(ROOT, "ascendra-ui"), path.join(ROOT, "testbed", "ascendra-ui")];

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

async function update() {
  const commitsUrl = SOURCE_REPO.replace(/\.git$/, "") + "/commits";

  console.log("This will DELETE AND REPLACE ascendra-ui/ at both:");
  for (const target of TARGETS) {
    const exists = fs.existsSync(target);
    console.log(`  ${target}${exists ? "" : " (does not exist yet — will be created)"}`);
  }
  console.log("\nEverything currently inside those folders is deleted first. This cannot be undone");
  console.log("unless it's tracked in git — commit first if you want an easy way back.\n");
  console.log(`Pulling the current default branch from: ${SOURCE_REPO}`);
  console.log("There's no version pinning, so this may include breaking changes. There's no");
  console.log("CHANGELOG either — review recent commits on the source repo first:");
  console.log(`  ${commitsUrl}\n`);

  try {
    const dirty = execSync("git status --porcelain", { cwd: ROOT, stdio: "pipe" }).toString().trim();
    if (dirty) {
      console.log("⚠ This repo has uncommitted git changes. Consider committing them first so");
      console.log("  this update is easy to diff or revert.\n");
    }
  } catch {
    // Not a git repo, or git unavailable — nothing to check.
  }

  if (!process.stdin.isTTY) {
    console.error("Non-interactive input — refusing to run update without a confirmation prompt. Aborting.");
    process.exit(1);
  }

  const answer = await ask("Continue? [y/N]: ");
  if (answer !== "y" && answer !== "yes") {
    console.log("Aborted — nothing was changed.");
    process.exit(0);
  }

  console.log(`\nFetching the latest ascendra-ui/ from ${SOURCE_REPO} ...`);

  const tmpDir = path.join(os.tmpdir(), `ascendra-ui-update-${Date.now()}`);
  try {
    execSync(`git clone --depth 1 "${SOURCE_REPO}" "${tmpDir}"`, { stdio: "inherit" });

    const srcLib = path.join(tmpDir, "ascendra-ui");
    if (!fs.existsSync(srcLib)) {
      console.error("Error: ascendra-ui/ not found in the cloned repo.");
      process.exit(1);
    }

    for (const target of TARGETS) {
      fs.rmSync(target, { recursive: true, force: true });
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.cpSync(srcLib, target, { recursive: true });
      console.log(`  ✓ Replaced ${path.relative(ROOT, target)}`);
    }
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  console.log("\n✓ Done.");
  console.log("  Review the diff (git diff -- ascendra-ui/ testbed/ascendra-ui/) and run npm install");
  console.log("  in both this project and testbed/ if dependencies changed.\n");
}

const [, , command] = process.argv;

if (command === "update") {
  update().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
} else {
  console.log("Usage:");
  console.log("  node ascendra.js update    (pulls the latest ascendra-ui/ into both vendored copies)");
  process.exit(1);
}
