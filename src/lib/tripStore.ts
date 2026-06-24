import { familyId, supabase } from "./supabase";
import type { Trip } from "../types/Trip";

type TripRow = {
  id: string;
  family_id: string;
  sort_order?: number | null;
  name: string;
  destination_city: string | null;
  flights: Trip["flights"] | null;
  hotels: Trip["hotels"] | null;
  cars: Trip["cars"] | null;
  activities: Trip["activities"] | null;
  created_at?: string;
  updated_at?: string;
};

const tableName = "family_trips";
let supportsSortOrder = true;

const requireSupabase = () => {
  if (!supabase) {
    throw new Error(
      "Supabase is not configured yet."
    );
  }

  return supabase;
};

export const rowToTrip = (
  row: TripRow
): Trip => ({
  id: row.id,
  sortOrder:
    typeof row.sort_order === "number"
      ? row.sort_order
      : undefined,
  name: row.name,
  destinationCity:
    row.destination_city || "",
  flights: row.flights || [],
  hotels: row.hotels || [],
  cars: row.cars || [],
  activities: row.activities || [],
});

const tripToPayload = (
  trip: Trip,
  includeSortOrder = true
) => ({
  ...(trip.id ? { id: trip.id } : {}),
  ...(includeSortOrder
    ? {
        sort_order:
          trip.sortOrder ?? 0,
      }
    : {}),
  family_id: familyId,
  name: trip.name,
  destination_city:
    trip.destinationCity || null,
  flights: trip.flights || [],
  hotels: trip.hotels || [],
  cars: trip.cars || [],
  activities: trip.activities || [],
});

const isMissingSortOrderError = (
  error: unknown
) => {
  if (
    !error ||
    typeof error !== "object"
  ) {
    return false;
  }

  const details = [
    "code" in error
      ? String(error.code)
      : "",
    "message" in error
      ? String(error.message)
      : "",
    "details" in error
      ? String(error.details)
      : "",
  ].join(" ");

  return (
    details.includes("sort_order") &&
    (details.includes("PGRST204") ||
      details
        .toLowerCase()
        .includes("column"))
  );
};

const sortTrips = (trips: Trip[]) =>
  [...trips].sort(
    (first, second) =>
      (first.sortOrder ??
        Number.MAX_SAFE_INTEGER) -
      (second.sortOrder ??
        Number.MAX_SAFE_INTEGER)
  );

export const fetchTrips = async () => {
  const client = requireSupabase();

  const { data, error } = await client
    .from(tableName)
    .select("*")
    .eq("family_id", familyId)
    .order("created_at", {
      ascending: true,
    });

  if (error) {
    throw error;
  }

  return sortTrips(
    (data || []).map((row) =>
      rowToTrip(row as TripRow)
    )
  );
};

export const saveTrips = async (
  trips: Trip[]
) => {
  const client = requireSupabase();
  const tripsWithOrder = trips.map(
    (trip, index) => ({
      ...trip,
      sortOrder: index,
    })
  );

  const { data: existingRows, error } =
    await client
      .from(tableName)
      .select("id")
      .eq("family_id", familyId);

  if (error) {
    throw error;
  }

  const existingIds = new Set(
    (existingRows || []).map((row) =>
      String(row.id)
    )
  );
  const nextIds = new Set(
    tripsWithOrder
      .map((trip) => trip.id)
      .filter(
        (id): id is string =>
          Boolean(id)
      )
  );

  const savedTrips: Trip[] = [];

  for (const trip of tripsWithOrder) {
    if (
      trip.id &&
      existingIds.has(trip.id)
    ) {
      let { data, error: updateError } =
        await client
          .from(tableName)
          .update(
            tripToPayload(
              trip,
              supportsSortOrder
            )
          )
          .eq("id", trip.id)
          .eq("family_id", familyId)
          .select("*")
          .single();

      if (
        updateError &&
        supportsSortOrder &&
        isMissingSortOrderError(
          updateError
        )
      ) {
        supportsSortOrder = false;

        const retry =
          await client
            .from(tableName)
            .update(
              tripToPayload(
                trip,
                false
              )
            )
            .eq("id", trip.id)
            .eq(
              "family_id",
              familyId
            )
            .select("*")
            .single();

        data = retry.data;
        updateError =
          retry.error;
      }

      if (updateError) {
        throw updateError;
      }

      savedTrips.push(
        rowToTrip(data as TripRow)
      );
    } else {
      let { data, error: insertError } =
        await client
          .from(tableName)
          .insert(
            tripToPayload(
              trip,
              supportsSortOrder
            )
          )
          .select("*")
          .single();

      if (
        insertError &&
        supportsSortOrder &&
        isMissingSortOrderError(
          insertError
        )
      ) {
        supportsSortOrder = false;

        const retry =
          await client
            .from(tableName)
            .insert(
              tripToPayload(
                trip,
                false
              )
            )
            .select("*")
            .single();

        data = retry.data;
        insertError =
          retry.error;
      }

      if (insertError) {
        throw insertError;
      }

      savedTrips.push(
        rowToTrip(data as TripRow)
      );
    }
  }

  const deletedIds = [...existingIds].filter(
    (id) => !nextIds.has(id)
  );

  if (deletedIds.length > 0) {
    const { error: deleteError } =
      await client
        .from(tableName)
        .delete()
        .eq("family_id", familyId)
        .in("id", deletedIds);

    if (deleteError) {
      throw deleteError;
    }
  }

  return savedTrips;
};
