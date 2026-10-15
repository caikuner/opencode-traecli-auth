import { spawn } from "node:child_process"
import { randomBytes } from "node:crypto"
import { readFileSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"

const PROVIDER = "traecli"
const API = "http://127.0.0.1/traecli/v1"
const BIN = process.env.TRAECLI_BIN || "traecli"
const DEFAULT_MODEL = "gpt-5.6-luna"
const EXEC_TIMEOUT_MS = Number(process.env.TRAECLI_EXEC_TIMEOUT_MS || 10 * 60 * 1000)
const MODELS_TIMEOUT_MS = Number(process.env.TRAECLI_MODELS_TIMEOUT_MS || 30 * 1000)
const HIGH_LOAD_PERCENT = Number(process.env.TRAECLI_HIGH_LOAD_PERCENT || 90)
const LOGIN_TIMEOUT_MS = Number(process.env.TRAECLI_LOGIN_TIMEOUT_MS || 5 * 60 * 1000)
const ICON = "data:image/png;base64,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"

const WebResponse = globalThis.Response || class {
  constructor(body = "", init = {}) {
    this._body = body
    this.status = init.status || 200
    this.statusText = init.statusText || ""
    this.headers = init.headers || {}
    this.ok = this.status >= 200 && this.status < 300
  }
  async text() { return typeof this._body === "string" ? this._body : String(this._body ?? "") }
  async json() { return JSON.parse(await this.text()) }
  get body() { return this._body }
}

const FALLBACK_MODELS = {
  "gpt-5.6-luna": modelConfig({ name: "gpt-5.6-luna", description: "Fast and affordable agentic coding model.", context_window: 272000 }),
  "gpt-5.6-terra": modelConfig({ name: "gpt-5.6-terra", description: "Balanced agentic coding model for everyday work.", context_window: 272000 }),
  "gpt-5.6-sol": modelConfig({ name: "gpt-5.6-sol", description: "Latest frontier agentic coding model.", context_window: 272000 }),
}

function TraeCliPlugin({ client } = {}) {
  return {
    async config(cfg) {
      cfg.provider ??= {}
      const was = cfg.provider[PROVIDER] ?? {}
      cfg.provider[PROVIDER] = {
        name: "TRAE CLI",
        npm: "@ai-sdk/openai-compatible",
        api: API,
        ...was,
        models: { ...FALLBACK_MODELS, ...(was.models ?? {}) },
      }
    },

    auth: {
      provider: PROVIDER,
      icon: ICON,
      async loader(getAuth) {
        const auth = await getAuth()
        if (!isTraeCliAuth(auth)) return {}
        return {
          baseURL: API,
          apiKey: "traecli",
          fetch: async (input, init = {}) => {
            const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url
            let path
            try {
              path = new URL(url).pathname
            } catch {
              return errorResponse(400, "invalid request URL")
            }
            if (!path.endsWith("/chat/completions")) return errorResponse(404, "only chat completions are served")
            let req
            try {
              req = JSON.parse(await bodyText(input, init))
            } catch {
              return errorResponse(400, "request body must be a JSON chat completion")
            }
            if (!req || typeof req !== "object" || Array.isArray(req)) return errorResponse(400, "request body must be an object")
            return openaiFromTraeCli(req, init?.signal ?? (isRequest(input) ? input.signal : undefined))
          },
        }
      },
      methods: [
        { type: "oauth", label: "Internal Credentials Login", authorize: () => cliSignIn("credentials") },
        { type: "oauth", label: "ByteDance SSO", authorize: () => cliSignIn("sso") },
        { type: "oauth", label: "TikTok SSO", authorize: () => cliSignIn("sso-usds") },
        { type: "oauth", label: "Use current TRAE CLI sign-in", authorize: () => cliSignIn("current") },
      ],
    },

    provider: {
      id: PROVIDER,
      async models(provider, { auth } = {}) {
        const have = provider?.models ?? {}
        if (!isTraeCliAuth(auth)) return have
        try {
          const { stdout } = await runCli(["models", "--json"], { timeout: MODELS_TIMEOUT_MS })
          const list = JSON.parse(stripWarnings(stdout))
          if (!Array.isArray(list)) return have
          const load = modelLoads()
          return Object.fromEntries(list.filter((m) => m?.name).map((m) => [m.name, modelConfig(m, load[m.name])]))
        } catch {
          return have
        }
      },
    },
  }
}

function loginCommand(kind) {
  if (kind === "sso") return `${BIN} login --sso`
  if (kind === "sso-usds") return `${BIN} login --sso-usds`
  return `${BIN} login`
}

async function cliSignIn(kind = "current") {
  const command = loginCommand(kind)
  if (kind !== "current") {
    const args = kind === "sso" ? ["login", "--sso"] : kind === "sso-usds" ? ["login", "--sso-usds"] : ["login"]
    try {
      await runCli(args, { timeout: LOGIN_TIMEOUT_MS })
    } catch (e) {
      throw new Error(`TRAE CLI login failed; run \`${command}\` manually if the browser flow needs a terminal (${e.message})`)
    }
  }
  let stdout = ""
  let stderr = ""
  try {
    ;({ stdout, stderr } = await runCli(["login", "status"], { timeout: 15_000 }))
  } catch (e) {
    throw new Error(`TRAE CLI is not signed in; run \`${command}\` first (${e.message})`)
  }
  if (!/logged in/i.test(`${stdout}\n${stderr}`)) throw new Error(`TRAE CLI is not signed in; run \`${command}\` first`)
  return {
    url: "",
    instructions: kind === "current" ? "TRAE CLI is signed in. This plugin will reuse the local TRAE CLI session and will not store TRAE tokens." : `TRAE CLI login completed via \`${command}\`. This plugin will reuse the local TRAE CLI session and will not store TRAE tokens.`,
    method: "auto",
    callback: async () => {
      const accountId = traeCliAccountId() || "local-traecli"
      return { type: "success", refresh: "local-traecli", access: "", expires: 0, source: "traecli", accountId }
    },
  }
}

function isTraeCliAuth(auth) {
  return !!auth && (auth.type === "oauth" || auth.type === "success") && auth.source === "traecli"
}

function traeHome() {
  return process.env.TRAE_HOME || join(homedir(), ".trae")
}

function readJSON(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"))
  } catch {
    return null
  }
}

function traeCliAccountId() {
  const auth = readJSON(join(traeHome(), "cli", "auth.json"))
  const id = auth?.trae?.user_id || auth?.user_id || auth?.account_id
  return typeof id === "string" && id.trim() ? id.trim() : ""
}

function modelLoads() {
  const cache = readJSON(join(traeHome(), "cli", "models_cache.json"))
  const out = {}
  for (const m of Array.isArray(cache?.models) ? cache.models : []) {
    const id = String(m?.slug || "").trim()
    const load = Number(m?.business_metadata?.load?.load_percent)
    if (id && Number.isFinite(load)) out[id] = load
  }
  return out
}

function displayName(id, load) {
  if (!Number.isFinite(load) || load < HIGH_LOAD_PERCENT) return id
  return `${id} (${Math.round(load)}% busy)`
}

function modelConfig(m, load) {
  const id = String(m?.name || "").trim()
  const context = Number(m?.context_window || m?._meta?.trae?.contextWindow || 0) || 0
  const images = Array.isArray(m?.supported_mime_types) && m.supported_mime_types.some((x) => String(x).startsWith("image/"))
  return {
    id,
    providerID: PROVIDER,
    name: displayName(id, load),
    description: String(m?.description || id),
    api: { id, url: API, npm: "@ai-sdk/openai-compatible" },
    limit: { context, output: 0 },
    capabilities: {
      reasoning: true,
      attachment: images,
      toolcall: false,
      input: { text: true, ...(images ? { image: true } : {}) },
    },
  }
}

async function openaiFromTraeCli(req, signal) {
  const model = String(req.model || DEFAULT_MODEL)
  const prompt = promptFromMessages(req.messages)
  if (!prompt.trim()) return errorResponse(400, "messages must contain text content")
  const args = ["exec", "--json", "--skip-git-repo-check", "--ephemeral", "--ignore-rules", "--sandbox", "read-only", "--model", model, "-"]
  const events = parseJsonLines(runCliStream(args, { stdin: prompt, signal, timeout: EXEC_TIMEOUT_MS }))
  return openai(req, events, model)
}

function promptFromMessages(messages) {
  if (!Array.isArray(messages)) return ""
  const out = []
  for (const msg of messages) {
    const role = String(msg?.role || "user")
    const text = contentText(msg?.content)
    if (text) out.push(`<${role}>\n${text}\n</${role}>`)
    if (Array.isArray(msg?.tool_calls) && msg.tool_calls.length) out.push(`<${role}_tool_calls>\n${JSON.stringify(msg.tool_calls)}\n</${role}_tool_calls>`)
  }
  return out.join("\n\n")
}

function contentText(content) {
  if (typeof content === "string") return content
  if (!Array.isArray(content)) return ""
  return content.map((part) => {
    if (typeof part === "string") return part
    if (part?.type === "text") return String(part.text || "")
    return ""
  }).filter(Boolean).join("\n")
}

async function openai(req, events, model) {
  const id = "chatcmpl-" + randomBytes(12).toString("hex")
  const created = Math.floor(Date.now() / 1000)
  if (!req.stream) {
    let text = ""
    let usage
    for await (const ev of events) {
      if (ev.error) return errorResponse(502, ev.error)
      if (ev.text) text += ev.text
      if (ev.usage) usage = usageFromTrae(ev.usage)
    }
    const body = { id, object: "chat.completion", created, model, choices: [{ index: 0, message: { role: "assistant", content: text }, finish_reason: "stop" }] }
    if (usage) body.usage = usage
    return new WebResponse(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json", "X-Magpie-Sign-In": "kept" } })
  }

  const enc = new TextEncoder()
  const chunk = (delta, finish = null, extra = {}) => enc.encode(`data: ${JSON.stringify({ id, object: "chat.completion.chunk", created, model, choices: [{ index: 0, delta, finish_reason: finish }], ...extra })}\n\n`)
  const stream = new ReadableStream({
    async start(ctl) {
      let usage
      const put = (b) => ctl.enqueue(b)
      try {
        put(chunk({ role: "assistant", content: "" }))
        for await (const ev of events) {
          if (ev.error) {
            put(enc.encode(`data: ${JSON.stringify({ error: { message: ev.error, type: "api_error", code: null } })}\n\n`))
            put(enc.encode("data: [DONE]\n\n"))
            ctl.close()
            return
          }
          if (ev.text) put(chunk({ content: ev.text }))
          if (ev.usage) usage = usageFromTrae(ev.usage)
        }
        put(chunk({}, "stop"))
        if (usage) put(enc.encode(`data: ${JSON.stringify({ id, object: "chat.completion.chunk", created, model, choices: [], usage })}\n\n`))
        put(enc.encode("data: [DONE]\n\n"))
        ctl.close()
      } catch (e) {
        try {
          put(enc.encode(`data: ${JSON.stringify({ error: { message: String(e?.message ?? e), type: "api_error", code: null } })}\n\n`))
          put(enc.encode("data: [DONE]\n\n"))
          ctl.close()
        } catch {}
      }
    },
  })
  return new WebResponse(stream, { status: 200, headers: { "content-type": "text/event-stream", "cache-control": "no-cache", "X-Magpie-Sign-In": "kept" } })
}

function eventFromTrae(ev) {
  if (!ev || typeof ev !== "object") return null
  if (ev.type === "item.completed" && ev.item?.type === "agent_message") return { text: String(ev.item.text || "") }
  if (ev.type === "item.completed" && ev.item?.type === "error") return null
  if (ev.type === "turn.completed") return { usage: ev.usage || null }
  if (ev.type === "error") return { error: String(ev.message || ev.error || "TRAE CLI error") }
  return null
}

async function* parseJsonLines(lines) {
  for await (const line of lines) {
    const s = stripWarnings(line).trim()
    if (!s) continue
    let ev
    try {
      ev = JSON.parse(s)
    } catch {
      continue
    }
    const out = eventFromTrae(ev)
    if (out) yield out
  }
}

function usageFromTrae(u) {
  if (!u || typeof u !== "object") return undefined
  const prompt = Number(u.input_tokens || 0) || 0
  const completion = Number(u.output_tokens || 0) || 0
  const out = { prompt_tokens: prompt, completion_tokens: completion, total_tokens: prompt + completion }
  const cached = Number(u.cached_input_tokens || 0) || 0
  const cacheCreate = Number(u.cache_creation_input_tokens || 0) || 0
  if (cached || cacheCreate) out.prompt_tokens_details = { cached_tokens: cached, cache_creation_tokens: cacheCreate }
  const reasoning = Number(u.reasoning_output_tokens || 0) || 0
  if (reasoning) out.completion_tokens_details = { reasoning_tokens: reasoning }
  return out
}

function runCli(args, { timeout } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(BIN, args, { stdio: ["ignore", "pipe", "pipe"] })
    let stdout = ""
    let stderr = ""
    const timer = timeout ? setTimeout(() => child.kill("SIGTERM"), timeout) : null
    child.stdout.setEncoding("utf8").on("data", (d) => (stdout += d))
    child.stderr.setEncoding("utf8").on("data", (d) => (stderr += d))
    child.on("error", reject)
    child.on("close", (code) => {
      if (timer) clearTimeout(timer)
      if (code === 0) resolve({ stdout, stderr })
      else reject(new Error((stderr || stdout || `${BIN} exited with code ${code}`).trim()))
    })
  })
}

async function* runCliStream(args, { stdin, signal, timeout } = {}) {
  const child = spawn(BIN, args, { stdio: ["pipe", "pipe", "pipe"] })
  let stderr = ""
  let buffer = ""
  let done = false
  const timer = timeout ? setTimeout(() => child.kill("SIGTERM"), timeout) : null
  const abort = () => child.kill("SIGTERM")
  signal?.addEventListener?.("abort", abort, { once: true })
  child.stderr.setEncoding("utf8").on("data", (d) => (stderr += d))
  child.stdout.setEncoding("utf8")
  child.stdin.end(stdin)
  try {
    for await (const chunk of child.stdout) {
      buffer += chunk
      let idx
      while ((idx = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, idx)
        buffer = buffer.slice(idx + 1)
        yield line
      }
    }
    if (buffer) yield buffer
    done = true
  } finally {
    if (timer) clearTimeout(timer)
    signal?.removeEventListener?.("abort", abort)
  }
  const code = await new Promise((resolve) => child.on("close", resolve))
  if (!done || code !== 0) yield JSON.stringify({ type: "error", message: (stderr || `${BIN} exited with code ${code}`).trim() })
}

function isRequest(v) {
  return typeof Request !== "undefined" && v instanceof Request
}

async function bodyText(input, init) {
  const b = init?.body ?? (isRequest(input) ? await input.clone().text() : undefined)
  if (b === undefined || b === null) return ""
  if (typeof b === "string") return b
  if (b instanceof URLSearchParams) return b.toString()
  if (b instanceof ArrayBuffer || ArrayBuffer.isView(b)) return new TextDecoder().decode(b)
  try {
    return await new WebResponse(b).text()
  } catch {
    return ""
  }
}

function stripWarnings(text) {
  return String(text || "").split("\n").filter((line) => !/^WARNING:/.test(line)).join("\n").trim()
}

const errorResponse = (status, message) =>
  new WebResponse(JSON.stringify({ error: { message, type: "traecli_error", code: status } }), { status, headers: { "content-type": "application/json" } })

export const _internal = { promptFromMessages, contentText, eventFromTrae, usageFromTrae, stripWarnings, modelConfig, parseJsonLines, isTraeCliAuth, displayName, modelLoads, traeCliAccountId, loginCommand }
export default { id: PROVIDER, server: TraeCliPlugin }
