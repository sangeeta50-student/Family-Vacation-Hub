import type { Flight } from "../types/Flight";

export function parseFlights(text: string): Flight[] {
  const flights: Flight[] = [];

  const flightMatches =
    text.match(/\b[A-Z]{2,3}\s?\d{1,4}\b/g) || [];

  const airportMatches =
    text.match(/\b[A-Z]{3}\b/g) || [];

  const timeMatches =
    text.match(/\d{1,2}:\d{2}\s?[AP]M/gi) || [];

  const durationMatches =
    text.match(/\d+h\s+\d+m/g) || [];

  for (let i = 0; i < flightMatches.length; i++) {
    flights.push({
      flightNumber: flightMatches[i],

      from: airportMatches[i * 2] || "",

      to: airportMatches[i * 2 + 1] || "",

      departureTime:
        timeMatches[i * 2] || "",

      arrivalTime:
        timeMatches[i * 2 + 1] || "",

      duration:
        durationMatches[i] || "",
    });
  }

  return flights;
}