import assert from "node:assert/strict";
import test from "node:test";
import { dateSortValue } from "../src/lib/dateSort.ts";

test("sorts the same date chronologically across AM/PM and 24-hour time formats", () => {
  const times = ["3pm", "09:15", "12:00 AM", "12 pm", "9:00am", "08:30", "11:45 p.m."];
  assert.deepEqual(times.sort((a, b) => dateSortValue("Dec 24, 2026", a) - dateSortValue("Dec 24, 2026", b)),
    ["12:00 AM", "08:30", "9:00am", "09:15", "12 pm", "3pm", "11:45 p.m."]);
});

test("equivalent calendar dates sort by time regardless of date format", () => {
  assert.equal(dateSortValue("2026-12-24", "8:00 AM"), dateSortValue("Thursday, December 24, 2026", "08:00"));
  assert.equal(dateSortValue("12/24/2026", "8:00 AM"), dateSortValue("Dec 24, 2026", "8:00am"));
});

test("date takes priority over time, including midnight and noon", () => {
  const entries = [
    { id: "next-day", date: "2026-12-25", time: "12am" },
    { id: "afternoon", date: "2026-12-24", time: "1pm" },
    { id: "noon", date: "2026-12-24", time: "12pm" },
    { id: "midnight", date: "2026-12-24", time: "12am" },
  ];
  entries.sort((a, b) => dateSortValue(a.date, a.time) - dateSortValue(b.date, b.time));
  assert.deepEqual(entries.map(entry => entry.id), ["midnight", "noon", "afternoon", "next-day"]);
});

test("blank and invalid times follow timed entries on that day but precede the next day", () => {
  const missing = dateSortValue("2026-12-24");
  assert.ok(missing > dateSortValue("2026-12-24", "23:59:59"));
  assert.ok(missing < dateSortValue("2026-12-25", "00:00"));
  for (const time of ["25:00", "12:99pm", "0am", "not a time"]) {
    assert.equal(dateSortValue("2026-12-24", time), missing);
  }
  assert.equal(dateSortValue("not a date", "9am"), Infinity);
  assert.equal(dateSortValue("2026-02-30", "9am"), Infinity);
  assert.equal(dateSortValue("", "9am"), Infinity);
});

test("accepts copied email whitespace and dates without a year", () => {
  assert.equal(dateSortValue("Tue, Dec 24", "9:30\u202fAM"), dateSortValue(`Dec 24, ${new Date().getFullYear()}`, "09:30"));
});
