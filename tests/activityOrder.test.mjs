import assert from "node:assert/strict";
import test from "node:test";
import { mergeTripListsByTimestamp, visibleItems } from "../src/lib/syncMetadata.ts";

const activity = (id, values = {}) => ({ id, name: id, updatedAt: "2026-10-20T10:00:00Z", ...values });
const trip = (activities, values = {}) => ({
  id: "trip-1", name: "Family trip", flights: [], hotels: [], cars: [], activities, ...values,
});
const ids = trip => visibleItems(trip.activities).map(({ item }) => item.id);
const merge = (cloud, local) => mergeTripListsByTimestamp([cloud], [local])[0];
const original = trip([activity("A"), activity("B"), activity("C")]);
const reordered = trip([activity("C"), activity("A"), activity("B")], { localActivityOrderUpdatedAt: "2026-10-21T12:00:00Z" });

test("a pending activity move is preserved before saving", () => {
  const merged = merge(original, reordered);
  assert.deepEqual(ids(merged), ["C", "A", "B"]);
  assert.equal(merged.localActivityOrderUpdatedAt, reordered.localActivityOrderUpdatedAt);
  assert.equal(merged.activities[0].updatedAt, original.activities[0].updatedAt);
});

test("a stale device adopts the shared order instead of reverting it", () => {
  const saved = trip(reordered.activities);
  assert.deepEqual(ids(merge(saved, original)), ["C", "A", "B"]);
});

test("editing or renaming an activity retains the shared order and newer content", () => {
  const saved = trip(reordered.activities);
  const local = structuredClone(original);
  local.activities[0] = { ...local.activities[0], name: "A renamed", notes: "New details", updatedAt: "2026-10-21T14:00:00Z" };
  const merged = merge(saved, local);
  assert.deepEqual(ids(merged), ["C", "A", "B"]);
  assert.equal(merged.activities[1].name, "A renamed");
  assert.equal(merged.activities[1].notes, "New details");
});

test("reordering does not overwrite newer activity edits from another device", () => {
  const remote = structuredClone(original);
  remote.activities[0] = { ...remote.activities[0], notes: "Saved on another phone", updatedAt: "2026-10-21T14:00:00Z" };
  const merged = merge(remote, reordered);
  assert.deepEqual(ids(merged), ["C", "A", "B"]);
  assert.equal(merged.activities[1].notes, "Saved on another phone");
});

test("an activity added on a stale device is appended to the saved order", () => {
  const saved = trip(reordered.activities);
  const local = trip([...original.activities, activity("D")]);
  assert.deepEqual(ids(merge(saved, local)), ["C", "A", "B", "D"]);
});

test("a pending reorder preserves activities added remotely and deletion markers", () => {
  const deleted = activity("deleted", { updatedAt: "2026-10-21T12:00:00Z", deletedAt: "2026-10-21T12:00:00Z" });
  const remote = trip([...original.activities, activity("D"), deleted]);
  const merged = merge(remote, reordered);
  assert.deepEqual(ids(merged), ["C", "A", "B", "D"]);
  assert.equal(merged.activities.find(item => item.id === "deleted").deletedAt, deleted.deletedAt);
});

test("moving activities with identical titles does not combine separate bookings", () => {
  const first = activity("booking-1", { name: "Museum visit", date: "Dec 24, 2026", location: "Museum", time: "9:00 AM" });
  const second = activity("booking-2", { name: "Museum visit", date: "Dec 24, 2026", location: "Museum", time: "3:00 PM" });
  const merged = merge(trip([first, second]), trip([second, first], { localActivityOrderUpdatedAt: "2026-10-21T12:00:00Z" }));
  assert.deepEqual(ids(merged), ["booking-2", "booking-1"]);
  assert.deepEqual(merged.activities.map(item => item.time), ["3:00 PM", "9:00 AM"]);
});
