import assert from "node:assert/strict";
import test from "node:test";
import { parseFlights } from "../src/parsers/flightParser.ts";

test("imports the United itinerary without a Flight to heading", () => {
  const text = `7:46 AM\t12:56 PM
ORD
 \t5h 10m
 \t
 \t
LIR
Chicago, IL, US\tLiberia, CR
FLIGHT INFO
Duration: 5h 10m
UA 1120
Boeing 737 MAX 9
United Business
Meal`;

  assert.deepEqual(parseFlights(text), [{
    flightNumber: "UA 1120",
    from: "ORD",
    to: "LIR",
    departureTime: "7:46 AM",
    arrivalTime: "12:56 PM",
    duration: "5h 10m",
    date: "",
    aircraft: "Boeing 737 MAX 9",
    cabin: "Business",
  }]);
});

test("preserves parsing of multiple Flight to sections", () => {
  const flights = parseFlights(`Reservation
Flight to Liberia
UA 1120
ORD LIR
7:46 AM 12:56 PM
Dec 24, 2026
5h 10m
Boeing 737 MAX 9
Business
Flight to Chicago
UA 1121
LIR ORD
1:00 PM 6:10 PM
Dec 30, 2026
5h 10m
Boeing 737 MAX 9
Business`);

  assert.equal(flights.length, 2);
  assert.deepEqual(flights.map(({ flightNumber, from, to, date }) => ({
    flightNumber, from, to, date,
  })), [
    { flightNumber: "UA 1120", from: "ORD", to: "LIR", date: "Dec 24, 2026" },
    { flightNumber: "UA 1121", from: "LIR", to: "ORD", date: "Dec 30, 2026" },
  ]);
});

test("does not invent a flight for empty or unrelated text", () => {
  assert.deepEqual(parseFlights(""), []);
  assert.deepEqual(parseFlights("Hotel check-in at 3:00 PM"), []);
});
