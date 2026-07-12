#!/usr/bin/env node

const assert = require("node:assert/strict");
const http = require("node:http");
const serialize = require("serialize-javascript");
const tmp = require("tmp");
const { v4: uuidV4 } = require("uuid");
const { HttpProvider } = require("hardhat/internal/core/providers/http");
const verifyHttp = require("@nomicfoundation/hardhat-verify/internal/undici");

function listen(server) {
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      server.off("error", reject);
      resolve(server.address());
    });
  });
}

async function close(server) {
  server.closeAllConnections?.();
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

async function readBody(request) {
  let body = "";
  for await (const chunk of request) {
    body += chunk;
  }
  return body;
}

async function checkHttpCompatibility() {
  const server = http.createServer(async (request, response) => {
    const body = await readBody(request);

    if (request.url === "/redirect") {
      response.writeHead(307, { location: "/rpc" });
      response.end();
      return;
    }
    if (request.url === "/slow") {
      setTimeout(() => {
        if (response.destroyed) return;
        response.setHeader("content-type", "application/json");
        response.end(JSON.stringify({ jsonrpc: "2.0", id: 1, result: "late" }));
      }, 1500);
      return;
    }
    if (request.url === "/verify-get") {
      response.end("verify-get-ok");
      return;
    }
    if (request.url === "/verify-post") {
      response.end(body);
      return;
    }

    const rpc = JSON.parse(body);
    response.setHeader("content-type", "application/json");
    if (rpc.method === "fail") {
      response.end(JSON.stringify({
        jsonrpc: "2.0",
        id: rpc.id,
        error: { code: -32001, message: "expected mock error", data: { source: "mock" } },
      }));
      return;
    }
    response.end(JSON.stringify({ jsonrpc: "2.0", id: rpc.id, result: rpc.params[0] }));
  });

  const address = await listen(server);
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    const provider = new HttpProvider(`${baseUrl}/rpc`, "dependency-compat", {}, 1000);
    assert.equal(await provider.request({ method: "echo", params: ["rpc-ok"] }), "rpc-ok");
    await assert.rejects(
      provider.request({ method: "fail", params: [] }),
      (error) => error.code === -32001 && error.data?.source === "mock",
    );

    const redirectProvider = new HttpProvider(`${baseUrl}/redirect`, "dependency-compat", {}, 1000);
    assert.equal(
      await redirectProvider.request({ method: "echo", params: ["redirect-ok"] }),
      "redirect-ok",
    );

    const getResponse = await verifyHttp.sendGetRequest(`${baseUrl}/verify-get`);
    assert.equal(await getResponse.body.text(), "verify-get-ok");
    const postResponse = await verifyHttp.sendPostRequest(
      `${baseUrl}/verify-post`,
      "verify-post-ok",
      { "content-type": "text/plain" },
    );
    assert.equal(await postResponse.body.text(), "verify-post-ok");

    const timeoutProvider = new HttpProvider(`${baseUrl}/slow`, "dependency-compat", {}, 50);
    await assert.rejects(
      timeoutProvider.request({ method: "echo", params: ["late"] }),
      (error) => error.code === "UND_ERR_HEADERS_TIMEOUT",
    );
  } finally {
    await close(server);
  }
}

function checkOtherOverrides() {
  const serialized = serialize({ value: "</script>", nested: [1, 2, 3] });
  assert.equal(typeof serialized, "string");
  assert.ok(!serialized.includes("</script>"));

  const temporaryFile = tmp.fileSync();
  assert.ok(temporaryFile.name);
  temporaryFile.removeCallback();

  assert.match(
    uuidV4(),
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  );
}

async function main() {
  checkOtherOverrides();
  await checkHttpCompatibility();
  console.log("Dependency compatibility check passed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
