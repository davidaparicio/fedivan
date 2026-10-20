import { Router } from "express";
import { loginBluesky, disconnectBluesky } from "../platforms/bluesky.js";
import {
  startMastodonOAuth,
  completeMastodonOAuth,
  disconnectMastodon,
} from "../platforms/mastodon.js";
import { getAccount, upsertAccount, deleteAccount } from "../db.js";

const router = Router();

router.post("/bluesky", async (req, res) => {
  const { identifier, appPassword } = req.body;
  if (!identifier || !appPassword) {
    res.status(400).json({ error: "identifier and appPassword required" });
    return;
  }
  try {
    const result = await loginBluesky(identifier, appPassword);
    res.json({ ok: true, ...result });
  } catch (e: any) {
    res.status(401).json({ error: e.message || "Login failed" });
  }
});

router.delete("/bluesky", (_req, res) => {
  disconnectBluesky();
  deleteAccount("bluesky");
  res.json({ ok: true });
});

router.post("/mastodon/start", async (req, res) => {
  const { instanceUrl } = req.body;
  if (!instanceUrl) {
    res.status(400).json({ error: "instanceUrl required" });
    return;
  }
  try {
    const backendBase =
      process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3001}`;
    const callbackUrl = `${backendBase}/api/auth/mastodon/callback`;
    const authorizeUrl = await startMastodonOAuth(instanceUrl, callbackUrl);
    res.json({ ok: true, authorizeUrl });
  } catch (e: any) {
    res.status(500).json({ error: e.message || "OAuth start failed" });
  }
});

router.get("/mastodon/callback", async (req, res) => {
  const code = req.query.code as string;
  if (!code) {
    res.status(400).send("Missing code parameter");
    return;
  }
  try {
    await completeMastodonOAuth(code);
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    res.redirect(`${frontendUrl}?mastodon=connected`);
  } catch (e: any) {
    res.status(500).send(`OAuth callback failed: ${e.message}`);
  }
});

router.delete("/mastodon", (_req, res) => {
  disconnectMastodon();
  deleteAccount("mastodon");
  res.json({ ok: true });
});

router.post("/x", (req, res) => {
  const { listUrl } = req.body;
  if (!listUrl) {
    res.status(400).json({ error: "listUrl required" });
    return;
  }
  upsertAccount("x", { listUrl });
  res.json({ ok: true });
});

router.delete("/x", (_req, res) => {
  deleteAccount("x");
  res.json({ ok: true });
});

export default router;
