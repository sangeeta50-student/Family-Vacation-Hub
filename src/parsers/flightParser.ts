import type { Flight } from "../types/Flight";

export function parseFlights(text: string): Flight[] {
  const flights: Flight[] = [];

  const sections =
    text.split(/Flight to /i).slice(1);

  for (const section of sections) {
    const flightMatch =
  section.match(
    /\b(UA|AI|DL|AA|AS|WN|HA|BA|LH|AF|KL|EK|QR|SQ)\s?\d{1,4}\b/
  );

    if (!flightMatch) continue;

    const airports =
      section.match(/\b[A-Z]{3}\b/g) || [];

    const times =
      section.match(
        /\d{1,2}:\d{2}\s?[AP]M/gi
      ) || [];
    
    const duration =
      section.match(/\d+h\s+\d+m/);
    const aircraftMatch =
  section.match(
    /(Boeing[^\n]+|Airbus[^\n]+)/i
  );
  const dateMatch =
  section.match(
    /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},\s+\d{4}/
  );

const cabinMatch =
  section.match(
    /(Economy|Business|First|Economy Basic|Premium Economy)/i
  );
    flights.push({
      flightNumber: flightMatch[0],

      from: airports[0] || "",

      to: airports[1] || "",

      departureTime:
        times[0] || "",

      arrivalTime:
        times[1] || "",

      duration:
        duration?.[0] || "",

      date:
        dateMatch?.[0] || "",

      aircraft:
        aircraftMatch?.[0] || "",

      cabin:
         cabinMatch?.[0] || "",
    });
  }

  return flights;
}
export function parseDestinationCity(
  text: string
): string {
  const match =
    text.match(/Flight to ([^\n]+)/i);

  return match?.[1]?.trim() || "";
}