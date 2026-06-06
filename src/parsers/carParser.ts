import type { CarRental } from "../types/Trip";

function getLines(text: string) {
  return text
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function normalizeLabel(value: string) {
  return value
    .toLowerCase()
    .replace(/[‐‑‒–—-]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/:$/, "")
    .trim();
}

function findSectionIndex(
  lines: string[],
  labels: string[]
) {
  const normalizedLabels =
    labels.map(normalizeLabel);

  return lines.findIndex((line) =>
    normalizedLabels.includes(
      normalizeLabel(line)
    )
  );
}

function getSectionLines(
  lines: string[],
  startLabels: string[],
  stopLabels: string[]
) {
  const startIndex = findSectionIndex(
    lines,
    startLabels
  );

  if (startIndex === -1) {
    return [];
  }

  const stopIndex = lines.findIndex(
    (line, index) =>
      index > startIndex &&
      stopLabels
        .map(normalizeLabel)
        .includes(
          normalizeLabel(line)
        )
  );

  return lines.slice(
    startIndex + 1,
    stopIndex === -1
      ? undefined
      : stopIndex
  );
}

function findValue(
  text: string,
  labels: string[]
) {
  for (const label of labels) {
    const match = text.match(
      new RegExp(
        `^\\s*${label}\\s*(?::|-|–)\\s*([^\\n]+)`,
        "im"
      )
    );

    if (match?.[1]) {
      return match[1].trim();
    }
  }

  return "";
}

function isTime(value: string) {
  return /^\d{1,2}(?::\d{2})?\s?[AP]M$/i.test(
    value.trim()
  );
}

function looksLikeDate(value: string) {
  return /\b(mon|tue|wed|thu|fri|sat|sun|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b|\d{1,2}\/\d{1,2}|\d{4}/i.test(
    value
  );
}

function parseStop(
  lines: string[]
) {
  const time =
    lines.find(isTime) || "";
  const date =
    lines.find(looksLikeDate) || "";
  const location =
    lines.find(
      (line) =>
        line !== time &&
        line !== date &&
        !/^open hours:/i.test(line)
    ) || "";
  const openHours =
    lines.find((line) =>
      /^open hours:/i.test(line)
    ) || "";

  return {
    time,
    date,
    location,
    openHours,
  };
}

function findVehicleDetails(
  lines: string[]
) {
  const bookingIndex =
    findSectionIndex(lines, [
      "Booking details",
    ]);
  const pickupIndex =
    findSectionIndex(lines, [
      "Pick-up",
      "Pickup",
    ]);

  const detailLines =
    bookingIndex === -1
      ? lines.slice(
          0,
          pickupIndex === -1
            ? undefined
            : pickupIndex
        )
      : lines.slice(
          bookingIndex + 1,
          pickupIndex === -1
            ? undefined
            : pickupIndex
        );

  return detailLines.filter(
    (line) =>
      !/booking details/i.test(line)
  );
}

export function parseCars(
  text: string
): CarRental[] {
  const lines = getLines(text);
  const vehicleDetails =
    findVehicleDetails(lines);
  const pickup = parseStop(
    getSectionLines(
      lines,
      ["Pick-up", "Pickup"],
      ["Drop-off", "Dropoff"]
    )
  );
  const dropoff = parseStop(
    getSectionLines(
      lines,
      ["Drop-off", "Dropoff"],
      []
    )
  );

  const company =
    findValue(text, [
      "Company",
      "Rental Company",
      "Car Rental Company",
      "Supplier",
      "Provider",
    ]);
  const vehicleType =
    findValue(text, [
      "Vehicle Type",
      "Car Type",
      "Class",
    ]) ||
    vehicleDetails[0] ||
    "";
  const vehicle =
    findValue(text, [
      "Vehicle",
      "Car",
      "Model",
    ]) ||
    vehicleDetails[1] ||
    "";
  const confirmationNumber =
    findValue(text, [
      "Confirmation Number",
      "Confirmation",
      "Reservation Number",
      "Booking Number",
    ]);

  if (
    !company &&
    !vehicleType &&
    !vehicle &&
    !pickup.location &&
    !dropoff.location
  ) {
    return [];
  }

  const detailNotes =
    vehicleDetails
      .slice(2)
      .filter(Boolean);
  const notes = [
    ...detailNotes,
    pickup.openHours &&
      `Pick-up ${pickup.openHours}`,
    dropoff.openHours &&
      `Drop-off ${dropoff.openHours}`,
  ].filter(Boolean);

  return [
    {
      company,
      vehicleType,
      vehicle,
      pickupLocation:
        pickup.location,
      pickupDate: pickup.date,
      pickupTime: pickup.time,
      returnLocation:
        dropoff.location,
      returnDate: dropoff.date,
      returnTime: dropoff.time,
      confirmationNumber,
      notes: notes.join("\n"),
    },
  ];
}
