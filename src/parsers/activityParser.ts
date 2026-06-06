import type { Activity } from "../types/Activity";

function getLines(text: string) {
  return text
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function normalizeLabel(value: string) {
  return value
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function findSectionValue(
  lines: string[],
  label: string
) {
  const index = lines.findIndex(
    (line) =>
      normalizeLabel(line).replace(
        /:$/,
        ""
      ) === normalizeLabel(label)
  );

  if (index === -1) {
    return "";
  }

  return lines[index + 1] || "";
}

function findFirstSectionValue(
  lines: string[],
  labels: string[]
) {
  for (const label of labels) {
    const value =
      findSectionValue(lines, label);

    if (value) {
      return value;
    }
  }

  return "";
}

function findDate(lines: string[]) {
  return (
    lines.find((line) =>
      /\b(mon|tue|wed|thu|fri|sat|sun)day,\s+\w+\s+\d{1,2},\s+\d{4}\b/i.test(
        line
      )
    ) || ""
  );
}

function findTitle(lines: string[]) {
  const date = findDate(lines);

  const ignored = new Set([
    "activity",
    "additional info",
    "view and print voucher",
  ]);

  return (
    lines.find((line) => {
      const normalized =
        normalizeLabel(line);

      return (
        !ignored.has(normalized) &&
        line !== date &&
        !line.startsWith("$") &&
        !/^\d+\s+adult/i.test(line) &&
        !/^time:?$/i.test(line) &&
        !/^duration:?$/i.test(line) &&
        !/^activity image/i.test(line)
      );
    }) || ""
  );
}

export function parseActivities(
  text: string
): Activity[] {
  const lines = getLines(text);
  const name = findTitle(lines);

  if (!name) {
    return [];
  }

  const time =
    findSectionValue(lines, "Time") ||
    text.match(
      /\b\d{1,2}:\d{2}\s?[AP]M\b/i
    )?.[0] ||
    "";
  const duration =
    findSectionValue(
      lines,
      "Duration"
    );
  const date = findDate(lines);
  const location =
    findFirstSectionValue(lines, [
      "Location",
      "Meeting point",
      "Meeting location",
      "Departure point",
      "Pickup location",
      "Address",
    ]);

  const additionalInfoIndex =
    lines.findIndex(
      (line) =>
        normalizeLabel(line) ===
        "additional info"
    );
  const notesParts = [
    duration &&
      `Duration: ${duration}`,
    additionalInfoIndex >= 0 &&
      lines
        .slice(additionalInfoIndex + 1)
        .join(" "),
  ].filter(Boolean);

  return [
    {
      name,
      date,
      time,
      location,
      notes: notesParts.join("\n"),
    },
  ];
}
