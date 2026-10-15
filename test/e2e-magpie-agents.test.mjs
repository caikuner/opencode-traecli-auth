import test from "node:test"
import assert from "node:assert/strict"
import { execFile } from "node:child_process"
import { promisify } from "node:util"

const exec = promisify(execFile)
const MODEL = process.env.TRAECLI_E2E_MODEL || "traecli/GPT-5.6-Luna"
const MAGPIE_MODEL = MODEL.startsWith("magpie/") ? MODEL : `magpie/${MODEL}`
const PROMPT = "只回复 pong，不要解释。"
const TIMEOUT = Number(process.env.TRAECLI_E2E_TIMEOUT_MS || 180_000)
const RUN = process.env.TRAECLI_RUN_E2E === "1"

async function run(cmd, args, options = {}) {
  try {
    const { stdout, stderr } = await exec(cmd, args, {
      timeout: options.timeout || TIMEOUT,
      maxBuffer: 1024 * 1024 * 10,
      env: { ...process.env, ...(options.env || {}) },
    })
    return { ok: true, stdout, stderr, text: `${stdout}\n${stderr}` }
  } catch (error) {
    return {
      ok: false,
      code: error.code,
      stdout: error.stdout || "",
      stderr: error.stderr || "",
      text: `${error.stdout || ""}\n${error.stderr || ""}`,
      error,
    }
  }
}

async function magpie(args) {
  const result = await run("magpie", args)
  assert.equal(result.ok, true, `magpie ${args.join(" ")} failed:\n${result.text}`)
  return result
}

function hasPong(result) {
  assert.match(result.text, /\bpong\b/i, `expected pong in output:\n${result.text}`)
}

test("magpie agents can chat through traecli-auth", { skip: !RUN, timeout: TIMEOUT * 5 }, async (t) => {
  const before = {}
  for (const agent of ["codex", "claude", "pi", "dsh"]) {
    before[agent] = (await magpie([agent])).stdout.trim()
  }

  await magpie(["codex", MODEL])
  await magpie(["claude", MODEL])
  await magpie(["pi", MODEL])
  await magpie(["dsh", MODEL])

  hasPong(await run("codex", ["exec", "--skip-git-repo-check", "--ephemeral", "--ignore-rules", "--sandbox", "read-only", "--model", MODEL, PROMPT]))
  hasPong(await run("claude", ["--print", "--no-session-persistence", "--model", MODEL, PROMPT]))
  hasPong(await run("pi", ["--print", "--no-session", "--no-tools", "--model", MODEL, "--", PROMPT]))
  hasPong(await run("pi", ["--print", "--no-session", "--no-tools", "--model", MAGPIE_MODEL, "--", PROMPT]))
  hasPong(await run("dsh", ["headless", PROMPT]))

  assert.match(before.codex, /Codex/)
  assert.match(before.claude, /Claude Code/)
  assert.match(before.pi, /Pi/)
  assert.match(before.dsh, /DeepSeek Harness/)
})
