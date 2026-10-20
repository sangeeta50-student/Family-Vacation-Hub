import assert from "node:assert/strict";
import test from "node:test";
import { getSessionVerificationKey } from "../src/lib/authSession.ts";

const session = (claims = {}, userId = "user-A") => ({
  user: { id: userId },
  access_token: `${Buffer.from('{"alg":"HS256"}').toString("base64url")}.${Buffer.from(JSON.stringify({
    sub: "user-A", session_id: "session-A", aal: "aal2", exp: 1000, ...claims,
  })).toString("base64url")}.signature`,
});

test("renewing a token for the same verified session keeps its verification key", () => {
  assert.equal(getSessionVerificationKey(session()), getSessionVerificationKey(session({ exp: 2000, iat: 1000 })));
});

test("different users, different sessions, and assurance downgrades require a new check", () => {
  const key = getSessionVerificationKey(session());
  assert.notEqual(getSessionVerificationKey(session({ sub: "user-B" }, "user-B")), key);
  assert.notEqual(getSessionVerificationKey(session({ session_id: "session-B" })), key);
  assert.notEqual(getSessionVerificationKey(session({ aal: "aal1" })), key);
});

test("missing, malformed, or inconsistent session claims cannot preserve verification", () => {
  assert.equal(getSessionVerificationKey(null), null);
  assert.equal(getSessionVerificationKey({ user: { id: "user-A" }, access_token: "broken" }), null);
  assert.equal(getSessionVerificationKey(session({ session_id: null })), null);
  assert.equal(getSessionVerificationKey(session({ sub: "wrong-user" })), null);
  assert.equal(getSessionVerificationKey(session({ aal: "unknown" })), null);
});
