import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

test("CLI sends only after apply, and routes send separately from recovery", async () => {
  const requests: { method?: string; body: unknown }[] = [];
  const server = createServer(async (req, res) => {
    let body = "";
    for await (const chunk of req) body += chunk;
    requests.push({ method: req.method, body: JSON.parse(body) });
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const id = "b41d5dd2-ff7a-45a6-935a-d08b03f9d525";
  const run = (command: string, applied = false) => promisify(execFile)(
    process.execPath,
    ["--import", "tsx", "scripts/tuition.ts", command, id, ...(applied ? ["--apply"] : [])],
    {
      env: {
        NODE_ENV: "test",
        PATH: process.env.PATH,
        TUITION_API_URL: `http://127.0.0.1:${address.port}`,
        TUITION_ADMIN_KEY: "synthetic-local-test-only",
      },
      timeout: 15000,
    },
  );
  try {
    await run("send");
    assert.equal(requests.length, 0);
    await run("send", true);
    await run("sync", true);
    assert.deepEqual(requests, [
      { method: "POST", body: { action: "send", id } },
      { method: "POST", body: { action: "sync", id } },
    ]);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((err) => err ? reject(err) : resolve()));
  }
});
