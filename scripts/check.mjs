import plugin from "../index.mjs"

if (!plugin || plugin.id !== "traecli" || typeof plugin.server !== "function") {
  throw new Error("plugin must export default { id: 'traecli', server: function }")
}
const server = plugin.server()
for (const key of ["config", "auth", "provider"]) {
  if (!server[key]) throw new Error(`missing ${key} hook`)
}
if (server.auth.provider !== "traecli") throw new Error("auth provider must be traecli")
if (server.provider.id !== "traecli") throw new Error("provider id must be traecli")
console.log("ok")
