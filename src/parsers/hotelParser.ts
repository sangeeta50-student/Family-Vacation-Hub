import type { Hotel } from "../types/Trip";

function escapeRegExp(value: string) {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}

function findValue(
  text: string,
  labels: string[]
) {
  for (const label of labels) {
    const match = text.match(
      new RegExp(
        `^\\s*${escapeRegExp(
          label
        )}\\s*(?::|-|–)\\s*([^\\n]+)`,
        "im"
      )
    );

    if (match?.[1]) {
      return match[1].trim();
    }
  }

  return "";
}

function splitDateTime(value: string) {
  const timeMatch = value.match(
    /\b\d{1,2}:\d{2}\s?[AP]M\b|\b\d{1,2}\s?[AP]M\b/i
  );

  const time =
    timeMatch?.[0]?.trim() || "";

  const date = time
    ? value
        .replace(timeMatch?.[0] || "", "")
        .replace(/[,-]\s*$/, "")
        .trim()
    : value.trim();

  return {
    date,
    time,
  };
}

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
    .trim();
}

function findSectionValues(
  lines: string[],
  labels: string[]
) {
  const normalizedLabels =
    labels.map(normalizeLabel);

  const index = lines.findIndex(
    (line) =>
      normalizedLabels.includes(
        normalizeLabel(line)
      )
  );

  if (index === -1) {
    return [];
  }

  return lines
    .slice(index + 1, index + 4)
    .filter(
      (line) =>
        ![
          "check in",
          "check out",
          "check in date",
          "check out date",
        ].includes(normalizeLabel(line))
    );
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

function extractDateTimeFromSection(
  explicitValue: string,
  sectionValues: string[]
) {
  const parsed =
    splitDateTime(explicitValue);

  let date = parsed.date;
  let time = parsed.time;

  for (const value of sectionValues) {
    const sectionParsed =
      splitDateTime(value);

    if (!time && isTime(value)) {
      time = value;
      continue;
    }

    if (!time && sectionParsed.time) {
      time = sectionParsed.time;
    }

    if (
      !date &&
      looksLikeDate(sectionParsed.date)
    ) {
      date = sectionParsed.date;
    }
  }

  return {
    date,
    time,
  };
}

function findAddress(lines: string[]) {
  return (
    lines.find(
      (line) =>
        /^\d+\s+/.test(line) &&
        /,/.test(line) &&
        /\b(street|st|road|rd|avenue|ave|drive|dr|boulevard|blvd|lane|ln|way|court|ct|place|pl|highway|hwy)\b/i.test(
          line
        ) &&
        !/\b(nights?|adults?|rooms?|beds?)\b/i.test(
          line
        )
    ) || ""
  );
}

export function parseHotels(
  text: string
): Hotel[] {
  const lines = getLines(text);

  const name =
    findValue(text, [
      "Hotel Name",
      "Hotel",
      "Property",
      "Lodging",
      "Accommodation",
    ]) ||
    lines[0] ||
    "";

  const address =
    findValue(text, [
      "Address",
      "Hotel Address",
      "Location",
    ]) || findAddress(lines);

  const phone =
    findValue(text, [
      "Phone",
      "Telephone",
      "Contact",
    ]) ||
    text.match(
      /\+?\d[\d\s().-]{8,}\d/
    )?.[0] ||
    "";

  const checkInValue =
    findValue(text, [
      "Check-in Date",
      "Check in Date",
      "Check-in",
      "Check in",
      "Arrival Date",
      "Arrival",
    ]);

  const checkOutValue =
    findValue(text, [
      "Check-out Date",
      "Check out Date",
      "Check-out",
      "Check out",
      "Departure Date",
      "Departure",
    ]);

  const parsedCheckIn =
    extractDateTimeFromSection(
      checkInValue,
      findSectionValues(lines, [
        "Check-in",
        "Check in",
      ])
    );

  const parsedCheckOut =
    extractDateTimeFromSection(
      checkOutValue,
      findSectionValues(lines, [
        "Check-out",
        "Check out",
      ])
    );

  const checkInTime =
    findValue(text, [
      "Check-in Time",
      "Check in Time",
      "Arrival Time",
    ]) || parsedCheckIn.time;

  const checkOutTime =
    findValue(text, [
      "Check-out Time",
      "Check out Time",
      "Departure Time",
    ]) || parsedCheckOut.time;

  const notes =
    findValue(text, ["Notes", "Note"]);

  if (!name.trim()) {
    return [];
  }

  return [
    {
      name,
      address,
      phone,
      checkInDate:
        parsedCheckIn.date,
      checkInTime,
      checkOutDate:
        parsedCheckOut.date,
      checkOutTime,
      notes,
    },
  ];
}
