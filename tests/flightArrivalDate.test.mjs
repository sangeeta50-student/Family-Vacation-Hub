import assert from "node:assert/strict";
import test from "node:test";
import { mergeTripListsByTimestamp } from "../src/lib/syncMetadata.ts";

const flight = {
  id: "overnight-flight",
  flightNumber: "UA 100",
  from: "SFO",
  to: "DEL",
  date: "Dec 24, 2026",
  departureTime: "10:00 PM",
  arrivalTime: "6:00 AM",
  updatedAt: "2026-10-18T10:00:00Z",
};

const tripWith = (flight) => ({
  id: "test-trip",
  name: "Overnight trip",
  flights: [flight],
  hotels: [],
  cars: [],
  activities: [],
});

test("arrival date edits survive JSON storage and sync from either device", () => {
  const editedFlight = {
    ...flight,
    arrivalDate: "Dec 26, 2026",
    updatedAt: "2026-10-18T11:00:00Z",
  };
  const savedTrip = JSON.parse(JSON.stringify(tripWith(editedFlight)));
  const oldTrip = tripWith(flight);

  for (const [cloud, local] of [[savedTrip, oldTrip], [oldTrip, savedTrip]]) {
    const merged = mergeTripListsByTimestamp([cloud], [local]);
    assert.equal(merged[0].flights.length, 1);
    assert.deepEqual(merged[0].flights[0], editedFlight);
  }
});

test("clearing an arrival date wins over an older device copy", () => {
  const previous = { ...flight, arrivalDate: "Dec 26, 2026" };
  const cleared = {
    ...previous,
    arrivalDate: "",
    updatedAt: "2026-10-18T12:00:00Z",
  };
  const merged = mergeTripListsByTimestamp([tripWith(previous)], [tripWith(cleared)]);
  assert.equal(merged[0].flights[0].arrivalDate, "");
  assert.equal(merged[0].flights[0].date, "Dec 24, 2026");
});

test("existing flights do not acquire an assumed arrival date", () => {
  const merged = mergeTripListsByTimestamp([tripWith(flight)], [tripWith(flight)]);
  assert.equal(merged[0].flights[0].arrivalDate, undefined);
  assert.equal(merged[0].flights[0].date, flight.date);
});
