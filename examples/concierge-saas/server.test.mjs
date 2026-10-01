import {after, test} from "node:test";
import assert from "node:assert/strict";
import {createServer} from "node:http";
import {createApp, identityToken, sign, validSignature} from "./server.mjs";

const secret = "example-secret";
const deploymentId = "00000000-0000-4000-8000-000000000001";
const callbacks = [];
const callbackServer = createServer(async (req, res) => {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = Buffer.concat(chunks);
  callbacks.push({url: req.url, valid: validSignature(body, req.headers["x-conversimple-signature"], secret), data: JSON.parse(body)});
  res.writeHead(200, {"content-type": "application/json"});
  res.end('{"status":"accepted"}');
});
await new Promise(resolve => callbackServer.listen(0, "127.0.0.1", resolve));
const callbackUrl = `http://127.0.0.1:${callbackServer.address().port}`;
const appServer = createApp({deploymentId, secret, platformUrl: callbackUrl, delayMs: 15, answer: "The blue lantern is working."}).listen(0, "127.0.0.1");
await new Promise(resolve => appServer.once("listening", resolve));
const appUrl = `http://127.0.0.1:${appServer.address().port}`;
after(() => { appServer.close(); callbackServer.close(); });

test("identity token binds user and deployment for two minutes", () => {
  const token = identityToken(deploymentId, "demo-user", secret, 1000);
  const [header, claims, digest] = token.split(".");
  assert.deepEqual(JSON.parse(Buffer.from(claims, "base64url")), {iss: deploymentId, aud: "conversimple-voice", sub: "demo-user", iat: 1000, exp: 1120});
  assert.equal(createHmacDigest(`${header}.${claims}`), digest);
});

function createHmacDigest(input) {
  return Buffer.from(sign(input, secret).slice(7), "hex").toString("base64url");
}

test("signed transcript is acknowledged and signed answer is posted", async () => {
  const body = Buffer.from(JSON.stringify({conversation_id: "c", turn_id: "t", transcript: "Hello"}));
  const bad = await fetch(`${appUrl}/conversimple/reply`, {method: "POST", headers: {"content-type": "application/json"}, body});
  assert.equal(bad.status, 401);
  const response = await fetch(`${appUrl}/conversimple/reply`, {method: "POST", headers: {"content-type": "application/json", "x-conversimple-signature": sign(body, secret)}, body});
  assert.deepEqual(await response.json(), {conversation_id: "c", turn_id: "t", status: "accepted"});
  await new Promise(resolve => setTimeout(resolve, 100));
  assert.equal(callbacks.length, 1);
  assert.equal(callbacks[0].valid, true);
  assert.equal(callbacks[0].url, `/embed/concierge/${deploymentId}/replies`);
  assert.deepEqual(callbacks[0].data, {conversation_id: "c", turn_id: "t", reply_text: "The blue lantern is working."});
});
