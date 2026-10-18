import assert from "node:assert/strict";
import test from "node:test";
import { hasTripOrderChanged, mergeTripListsByTimestamp } from "../src/lib/syncMetadata.ts";

const trip = (id, sortOrder) => ({
  id,
  name: id,
  sortOrder,
  flights: [], hotels: [], cars: [], activities: [],
});
const cloud = [trip("A", 0), trip("B", 1), trip("C", 2)];
const moved = [trip("C", 0), trip("A", 1), trip("B", 2)];
const ids = (trips) => trips.map(trip => trip.id);

test("a pending arrow or drag reorder survives the merge before saving", () => {
  const merged = mergeTripListsByTimestamp(cloud, moved, true);
  assert.deepEqual(ids(merged), ["C", "A", "B"]);
  assert.deepEqual(merged.map(trip => trip.sortOrder), [0, 1, 2]);
});

test("another session with a stale cache uses the order saved in the cloud", () => {
  assert.deepEqual(ids(mergeTripListsByTimestamp(moved, cloud)), ["C", "A", "B"]);
});

test("a pending reorder retains trips added by another family member", () => {
  const merged = mergeTripListsByTimestamp([...cloud, trip("D", 3)], moved, true);
  assert.deepEqual(ids(merged), ["C", "A", "B", "D"]);
  assert.deepEqual(merged.map(trip => trip.sortOrder), [0, 1, 2, 3]);
});

test("moving trips still preserves newer remote flight edits", () => {
  const remote = structuredClone(cloud);
  const local = structuredClone(moved);
  const flight = { id: "flight-1", flightNumber: "UA 100", from: "SFO", to: "DEL", date: "Dec 24, 2026" };
  remote[0].flights = [{ ...flight, arrivalDate: "Dec 26, 2026", updatedAt: "2026-10-18T12:00:00Z" }];
  local[1].flights = [{ ...flight, arrivalDate: "Dec 25, 2026", updatedAt: "2026-10-18T11:00:00Z" }];
  const merged = mergeTripListsByTimestamp(remote, local, true);
  assert.deepEqual(ids(merged), ["C", "A", "B"]);
  assert.deepEqual(merged[1].flights, remote[0].flights);
});

test("detects reorders without treating additions, deletion, or edits as reorders", () => {
  assert.equal(hasTripOrderChanged(cloud, moved), true);
  assert.equal(hasTripOrderChanged(cloud, [...cloud, trip("D", 3)]), false);
  assert.equal(hasTripOrderChanged(cloud, [cloud[0], cloud[2]]), false);
  assert.equal(hasTripOrderChanged(cloud, cloud.map(trip => ({ ...trip, name: `${trip.name} renamed` }))), false);
  assert.equal(hasTripOrderChanged(cloud, [cloud[2], cloud[0]]), true);
});
