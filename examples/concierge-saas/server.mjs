import {createHmac, timingSafeEqual} from "node:crypto";
import express from "express";
import {readFile} from "node:fs/promises";

export const sign = (body, secret) =>
  "sha256=" + createHmac("sha256", secret).update(body).digest("hex");

export function validSignature(body, supplied, secret) {
  const actual = Buffer.from(supplied || "");
  const expected = Buffer.from(sign(body, secret));
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function identityToken(deploymentId, userId, secret, now = Math.floor(Date.now() / 1000)) {
  const header = Buffer.from(JSON.stringify({alg: "HS256", typ: "JWT"})).toString("base64url");
  const claims = Buffer.from(JSON.stringify({
    iss: deploymentId, aud: "conversimple-voice", sub: userId, iat: now, exp: now + 120
  })).toString("base64url");
  const content = `${header}.${claims}`;
  const signature = createHmac("sha256", secret).update(content).digest("base64url");
  return `${content}.${signature}`;
}

export function createApp({deploymentId, secret, platformUrl = "https://app.conversimple.com", delayMs = 25_000, answer = "Your concierge answer goes here."}) {
  if (!deploymentId || !secret) throw new Error("deploymentId and secret are required");
  const app = express();
  const pending = new Map();
  const completed = new Set();

  app.get("/", async (_req, res) => {
    res.type("html").send(await readFile(new URL("./index.html", import.meta.url), "utf8"));
  });

  // DEMO ONLY: replace this route with your real signed-in user check.
  app.get("/api/voice-token", (_req, res) => {
    res.json({token: identityToken(deploymentId, "demo-user", secret)});
  });

  app.post("/conversimple/reply", express.raw({type: "application/json", limit: "20kb"}), (req, res) => {
    if (!Buffer.isBuffer(req.body) || !validSignature(req.body, req.get("x-conversimple-signature"), secret)) {
      return res.sendStatus(401);
    }
    let turn;
    try { turn = JSON.parse(req.body.toString("utf8")); }
    catch { return res.sendStatus(400); }
    if (!turn.turn_id || !turn.conversation_id) return res.sendStatus(400);

    if (turn.type === "conversation_disconnected") {
      clearTimeout(pending.get(turn.turn_id));
      pending.delete(turn.turn_id);
      return res.sendStatus(204);
    }
    if (typeof turn.transcript !== "string") return res.sendStatus(400);

    // Acknowledge first. Replace the timer with your job queue or concierge call.
    res.json({conversation_id: turn.conversation_id, turn_id: turn.turn_id, status: "accepted"});
    if (pending.has(turn.turn_id) || completed.has(turn.turn_id)) return;
    const timer = setTimeout(async () => {
      pending.delete(turn.turn_id);
      completed.add(turn.turn_id);
      const body = Buffer.from(JSON.stringify({
        conversation_id: turn.conversation_id, turn_id: turn.turn_id, reply_text: answer
      }));
      try {
        const response = await fetch(`${platformUrl}/embed/concierge/${deploymentId}/replies`, {
          method: "POST",
          headers: {"content-type": "application/json", "x-conversimple-signature": sign(body, secret)},
          body
        });
        console.log("Deferred reply:", response.status, await response.text());
      } catch (error) {
        console.error("Deferred reply failed:", error);
      }
    }, delayMs);
    pending.set(turn.turn_id, timer);
  });

  return app;
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const app = createApp({
    deploymentId: process.env.CONVERSIMPLE_DEPLOYMENT_ID,
    secret: process.env.CONVERSIMPLE_VOICE_SECRET,
    platformUrl: process.env.CONVERSIMPLE_PLATFORM_URL,
    delayMs: Number(process.env.CONCIERGE_DELAY_MS || 25_000)
  });
  app.listen(Number(process.env.PORT || 3000), () => console.log("Demo listening"));
}
