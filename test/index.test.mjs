import test from "node:test"
import assert from "node:assert/strict"
import { _internal } from "../index.mjs"

test("promptFromMessages preserves roles and text", () => {
  assert.equal(
    _internal.promptFromMessages([
      { role: "system", content: "Be brief" },
      { role: "user", content: [{ type: "text", text: "Ping" }] },
    ]),
    "<system>\nBe brief\n</system>\n\n<user>\nPing\n</user>",
  )
})

test("eventFromTrae maps agent messages and usage", () => {
  assert.deepEqual(_internal.eventFromTrae({ type: "item.completed", item: { type: "agent_message", text: "pong" } }), { text: "pong" })
  assert.deepEqual(_internal.eventFromTrae({ type: "turn.completed", usage: { input_tokens: 2, output_tokens: 1 } }), { usage: { input_tokens: 2, output_tokens: 1 } })
})

test("usageFromTrae maps token fields", () => {
  assert.deepEqual(_internal.usageFromTrae({ input_tokens: 10, output_tokens: 3, cached_input_tokens: 4, cache_creation_input_tokens: 5, reasoning_output_tokens: 2 }), {
    prompt_tokens: 10,
    completion_tokens: 3,
    total_tokens: 13,
    prompt_tokens_details: { cached_tokens: 4, cache_creation_tokens: 5 },
    completion_tokens_details: { reasoning_tokens: 2 },
  })
})

test("stripWarnings removes traecli path warning", () => {
  assert.equal(_internal.stripWarnings("WARNING: proceeding\n[{\"name\":\"m\"}]\n"), "[{\"name\":\"m\"}]")
})

test("parseJsonLines ignores non-json and maps events", async () => {
  async function* lines() {
    yield "not json"
    yield JSON.stringify({ type: "item.completed", item: { type: "agent_message", text: "ok" } })
  }
  const got = []
  for await (const ev of _internal.parseJsonLines(lines())) got.push(ev)
  assert.deepEqual(got, [{ text: "ok" }])
})
