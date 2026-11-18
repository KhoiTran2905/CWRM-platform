import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const frontendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const account = { id: "user-1", email: "test@example.com", displayName: "Người kiểm tra", isActive: true };
const workspaces = [];
const json = (res, status, body) => { res.writeHead(status, { "Content-Type": "application/json" }); res.end(JSON.stringify(body)); };
const backend = createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString()) : {};
  if (url.pathname === "/api/v1/auth/register" && req.method === "POST") return json(res, 201, account);
  if (url.pathname === "/api/v1/auth/login" && req.method === "POST") return json(res, 200, { accessToken: "test-token", tokenType: "Bearer", expiresIn: 3600, account });
  if (req.headers.authorization !== "Bearer test-token") return json(res, 401, { error: { code: "UNAUTHENTICATED", message: "Phiên hết hạn" } });
  if (url.pathname === "/api/v1/auth/me") return json(res, 200, account);
  if (url.pathname === "/api/v1/auth/logout") { res.writeHead(204); return res.end(); }
  if (url.pathname === "/api/v1/workspaces" && req.method === "GET") return json(res, 200, { page: 1, pageSize: 12, total: workspaces.length, items: workspaces });
  if (url.pathname === "/api/v1/workspaces" && req.method === "POST") {
    const workspace = { id: `workspace-${workspaces.length + 1}`, name: body.name, createdByUserId: account.id, createdAt: new Date().toISOString() };
    workspaces.push(workspace);
    return json(res, 201, workspace);
  }
  const workspace = workspaces.find((item) => url.pathname === `/api/v1/workspaces/${item.id}`);
  if (workspace) return json(res, 200, workspace);
  return json(res, 404, { error: { code: "NOT_FOUND", message: "Không tìm thấy" } });
});

await new Promise((resolve) => backend.listen(0, "127.0.0.1", resolve));
const backendPort = backend.address().port;
const probe = createServer();
await new Promise((resolve) => probe.listen(0, "127.0.0.1", resolve));
const frontendPort = probe.address().port;
await new Promise((resolve) => probe.close(resolve));
const origin = `http://127.0.0.1:${frontendPort}`;
const frontend = spawn(process.execPath, [path.join(frontendDir, "node_modules/next/dist/bin/next"), "start", "-p", String(frontendPort)], {
  cwd: frontendDir,
  env: { ...process.env, CWRM_API_BASE_URL: `http://127.0.0.1:${backendPort}/api/v1` },
  stdio: "ignore",
});

try {
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    if (frontend.exitCode !== null) throw new Error(`Frontend exited: ${frontend.exitCode}`);
    try { const response = await fetch(`${origin}/login`); if (response.ok) { ready = true; break; } } catch { /* waiting for server */ }
    await delay(500);
  }
  assert.ok(ready, "Frontend did not start");
  let response = await fetch(`${origin}/workspaces`, { redirect: "manual" });
  if (response.status === 307) assert.match(response.headers.get("location"), /\/login/);
  else {
    const page = await response.text();
    assert.match(page, /login\?expired=1/);
    assert.doesNotMatch(page, /Workspace của bạn/);
  }

  response = await fetch(`${origin}/api/auth/register`, { method: "POST", headers: { Origin: origin, "Content-Type": "application/json" }, body: JSON.stringify({ email: account.email, password: "password123", displayName: account.displayName }) });
  assert.equal(response.status, 201);
  response = await fetch(`${origin}/api/auth/login`, { method: "POST", headers: { Origin: origin, "Content-Type": "application/json" }, body: JSON.stringify({ email: account.email, password: "password123" }) });
  assert.equal(response.status, 200);
  assert.equal(JSON.stringify(await response.json()).includes("test-token"), false);
  assert.match(response.headers.get("set-cookie"), /HttpOnly/);
  const authCookie = response.headers.get("set-cookie").split(";")[0];

  response = await fetch(`${origin}/api/workspaces`, { headers: { Cookie: authCookie } });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).total, 0);
  response = await fetch(`${origin}/api/workspaces`, { method: "POST", headers: { Origin: origin, Cookie: authCookie, "Content-Type": "application/json" }, body: JSON.stringify({ name: "Workspace thật" }) });
  assert.equal(response.status, 201);
  const workspace = await response.json();
  response = await fetch(`${origin}/api/workspaces/select`, { method: "POST", headers: { Origin: origin, Cookie: authCookie, "Content-Type": "application/json" }, body: JSON.stringify({ workspaceId: workspace.id }) });
  assert.equal(response.status, 200);
  const selectedCookie = response.headers.get("set-cookie").split(";")[0];
  response = await fetch(`${origin}/workspace`, { headers: { Cookie: `${authCookie}; ${selectedCookie}` } });
  assert.equal(response.status, 200);
  assert.match(await response.text(), /Workspace thật/);
  response = await fetch(`${origin}/api/auth/logout`, { method: "POST", headers: { Origin: origin, Cookie: authCookie } });
  assert.equal(response.status, 204);
  assert.match(response.headers.get("set-cookie"), /Max-Age=0|Expires=/);
  console.log("CWRM-27 smoke passed: protection, register, login, list, create, select, workspace, logout");
} finally {
  frontend.kill();
  await new Promise((resolve) => backend.close(resolve));
}
