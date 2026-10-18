import assert from "node:assert/strict";
import test from "node:test";
import { withRequestTimeout } from "../src/lib/requestTimeout.ts";

test("returns successful requests without aborting their signal", async () => {
  let signal;
  assert.equal(await withRequestTimeout(async (requestSignal) => {
    signal = requestSignal;
    return "saved";
  }, 20), "saved");
  await new Promise(resolve => setTimeout(resolve, 30));
  assert.equal(signal.aborted, false);
});

test("aborts a stalled request and allows a fresh retry", async () => {
  let signal;
  await assert.rejects(withRequestTimeout((requestSignal) => {
    signal = requestSignal;
    return new Promise(() => {});
  }, 10), /The connection timed out. Try Sync Now again./);
  assert.equal(signal.aborted, true);
  assert.equal(await withRequestTimeout(async () => "retry saved"), "retry saved");
});

test("preserves server errors and cancels the timeout on failure", async () => {
  const expected = new Error("Database unavailable");
  let signal;
  await assert.rejects(withRequestTimeout(async (requestSignal) => {
    signal = requestSignal;
    throw expected;
  }, 20), error => error === expected);
  await new Promise(resolve => setTimeout(resolve, 30));
  assert.equal(signal.aborted, false);
});
