import assert from "node:assert/strict";
import test from "node:test";
import { mergeTripListsByTimestamp } from "../src/lib/syncMetadata.ts";

const trip = {
  id: "trip-1",
  name: "Old trip name",
  sortOrder: 0,
  destinationCity: "Delhi",
  flights: [{ id: "flight-1", flightNumber: "UA 100", from: "SFO", to: "DEL", updatedAt: "2026-10-18T10:00:00Z" }],
  hotels: [], cars: [], activities: [],
};

test("a pending rename survives the pre-save cloud merge without creating another trip", () => {
  const renamed = {
    ...trip,
    name: "India in November",
    localNameUpdatedAt: "2026-10-18T12:00:00Z",
  };
  const [merged] = mergeTripListsByTimestamp([trip], [renamed]);
  assert.equal(merged.id, trip.id);
  assert.equal(merged.name, renamed.name);
  assert.equal(merged.localNameUpdatedAt, renamed.localNameUpdatedAt);
  assert.deepEqual(merged.flights, trip.flights);
  assert.equal(mergeTripListsByTimestamp([trip], [renamed]).length, 1);
});

test("an unchanged stale device adopts the name already saved in the database", () => {
  const saved = { ...trip, name: "India in November" };
  const [merged] = mergeTripListsByTimestamp([saved], [trip]);
  assert.equal(merged.name, saved.name);
  assert.equal(merged.localNameUpdatedAt, undefined);
});

test("editing a flight on a stale device does not restore an old trip name", () => {
  const saved = { ...trip, name: "India in November" };
  const local = {
    ...trip,
    flights: [{ ...trip.flights[0], departureTime: "8:00 PM", updatedAt: "2026-10-18T14:00:00Z" }],
  };
  const [merged] = mergeTripListsByTimestamp([saved], [local]);
  assert.equal(merged.name, saved.name);
  assert.equal(merged.flights[0].departureTime, "8:00 PM");
});

test("another rename made during a save remains pending for the next save", () => {
  const firstSave = { ...trip, name: "India in November" };
  const latest = {
    ...trip,
    name: "Family trip to India",
    localNameUpdatedAt: "2026-10-18T14:00:00Z",
  };
  const [merged] = mergeTripListsByTimestamp([firstSave], [latest]);
  assert.equal(merged.name, latest.name);
  assert.equal(merged.localNameUpdatedAt, latest.localNameUpdatedAt);
});
