import { familyId, supabase } from "./supabase";
import type { Trip } from "../types/Trip";

type TripRow = {
  id: string;
  family_id: string;
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
  name: row.name,
  destinationCity:
    row.destination_city || "",
  flights: row.flights || [],
  hotels: row.hotels || [],
  cars: row.cars || [],
  activities: row.activities || [],
});

const tripToPayload = (trip: Trip) => ({
  ...(trip.id ? { id: trip.id } : {}),
  family_id: familyId,
  name: trip.name,
  destination_city:
    trip.destinationCity || null,
  flights: trip.flights || [],
  hotels: trip.hotels || [],
  cars: trip.cars || [],
  activities: trip.activities || [],
});

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

  return (data || []).map((row) =>
    rowToTrip(row as TripRow)
  );
};

export const saveTrips = async (
  trips: Trip[]
) => {
  const client = requireSupabase();

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
    trips
      .map((trip) => trip.id)
      .filter(
        (id): id is string =>
          Boolean(id)
      )
  );

  const savedTrips: Trip[] = [];

  for (const trip of trips) {
    if (
      trip.id &&
      existingIds.has(trip.id)
    ) {
      const { data, error: updateError } =
        await client
          .from(tableName)
          .update(tripToPayload(trip))
          .eq("id", trip.id)
          .eq("family_id", familyId)
          .select("*")
          .single();

      if (updateError) {
        throw updateError;
      }

      savedTrips.push(
        rowToTrip(data as TripRow)
      );
    } else {
      const { data, error: insertError } =
        await client
          .from(tableName)
          .insert(tripToPayload(trip))
          .select("*")
          .single();

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
