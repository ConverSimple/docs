# Existing Concierge Voice sample

This is a small **development example**, not a production authentication service. It issues a token for a fixed demo user, accepts a signed final transcript, acknowledges it immediately, and sends a signed answer 25 seconds later. It uses in-memory timers; replace them with durable, idempotent jobs for a real application.

1. Configure an active widget deployment for Existing Concierge Voice. Set its reply hook to `https://YOUR_TEST_ORIGIN/conversimple/reply` and its allowed origin to exactly `https://YOUR_TEST_ORIGIN`. Copy the one-time shared secret.
2. At this directory run `npm install` and `CONVERSIMPLE_DEPLOYMENT_ID=... CONVERSIMPLE_VOICE_SECRET=... npm start`.
3. Serve the app behind HTTPS at the configured test origin. Open `https://YOUR_TEST_ORIGIN/?deployment_id=YOUR_DEPLOYMENT_ID`, click **Start voice**, and speak. Do not expose this demo-token endpoint to untrusted users.
4. Replace the fixed `demo-user` with your signed-in app user, the timer with your concierge job, and the fixed answer with its result. Verify the output in the conversation timeline.

Run `npm test` for local signature, token, hook, and deferred callback contract checks. The test uses a local fake callback and does not start a ConverSimple voice session.
