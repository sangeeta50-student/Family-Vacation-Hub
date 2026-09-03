import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { familyId, supabase } from "../lib/supabase";
import {
  fetchTrips,
  saveTrips,
} from "../lib/tripStore";
import type { Trip } from "../types/Trip";

type CloudStatus =
  | "offline"
  | "loading"
  | "cached"
  | "synced"
  | "saving"
  | "error";

const readLocalTrips = () => {
  const savedTrips =
    localStorage.getItem("trips");

  if (!savedTrips) {
    return [];
  }

  try {
    return JSON.parse(savedTrips) as Trip[];
  } catch {
    return [];
  }
};

const serializeTrips = (trips: Trip[]) =>
  JSON.stringify(trips);

const tripMatchKey = (trip: Trip) =>
  [
    trip.name.trim().toLowerCase(),
    (trip.destinationCity || "")
      .trim()
      .toLowerCase(),
  ].join("|");

const normalizeForCompare = (
  value: unknown
): unknown => {
  if (Array.isArray(value)) {
    return value.map(normalizeForCompare);
  }

  if (
    value &&
    typeof value === "object"
  ) {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([first], [second]) =>
          first.localeCompare(second)
        )
        .map(([key, entry]) => [
          key,
          normalizeForCompare(entry),
        ])
    );
  }

  return value;
};

const stableStringify = (
  value: unknown
) =>
  JSON.stringify(
    normalizeForCompare(value)
  );

const mergeTripItems = <T,>(
  cloudItems: T[] = [],
  localItems: T[] = []
) => {
  const mergedItems = [...cloudItems];
  const mergedItemKeys = new Set(
    mergedItems.map((item) =>
      stableStringify(item)
    )
  );

  localItems.forEach((item) => {
    const itemKey =
      stableStringify(item);

    if (
      !mergedItemKeys.has(itemKey)
    ) {
      mergedItemKeys.add(itemKey);
      mergedItems.push(item);
    }
  });

  return mergedItems;
};

const chooseTripItems = <T,>(
  cloudItems: T[] = [],
  localItems: T[] = [],
  preferLocalDetails = false
) => {
  if (preferLocalDetails) {
    return mergeTripItems(
      cloudItems,
      localItems
    );
  }

  return localItems.length > cloudItems.length
    ? localItems
    : cloudItems;
};

const mergeLocalTripDetails = (
  cloudTrip: Trip,
  localTrip: Trip,
  preferLocalDetails = false
): Trip => ({
  ...cloudTrip,
  destinationCity:
    (preferLocalDetails &&
      localTrip.destinationCity) ||
    cloudTrip.destinationCity ||
    localTrip.destinationCity,
  flights: chooseTripItems(
    cloudTrip.flights,
    localTrip.flights,
    preferLocalDetails
  ),
  hotels: chooseTripItems(
    cloudTrip.hotels,
    localTrip.hotels,
    preferLocalDetails
  ),
  cars: chooseTripItems(
    cloudTrip.cars,
    localTrip.cars,
    preferLocalDetails
  ),
  activities: chooseTripItems(
    cloudTrip.activities,
    localTrip.activities,
    preferLocalDetails
  ),
});

const mergeLocalAndCloudTrips = (
  cloudTrips: Trip[],
  localTrips: Trip[],
  preferLocalDetails = false
) => {
  const localById = new Map(
    localTrips
      .filter((trip) => trip.id)
      .map((trip) => [
        trip.id,
        trip,
      ])
  );
  const localByName = new Map(
    localTrips.map((trip) => [
      tripMatchKey(trip),
      trip,
    ])
  );
  const mergedTrips = cloudTrips.map(
    (cloudTrip) => {
      const localTrip =
        (cloudTrip.id &&
          localById.get(cloudTrip.id)) ||
        localByName.get(
          tripMatchKey(cloudTrip)
        );

      return localTrip
        ? mergeLocalTripDetails(
            cloudTrip,
            localTrip,
            preferLocalDetails
          )
        : cloudTrip;
    }
  );
  const cloudIds = new Set(
    cloudTrips
      .map((trip) => trip.id)
      .filter(Boolean)
  );
  const cloudNames = new Set(
    cloudTrips.map(tripMatchKey)
  );
  const localOnlyTrips =
    localTrips.filter(
      (trip) =>
        !(
          trip.id &&
          cloudIds.has(trip.id)
        ) &&
        !cloudNames.has(
          tripMatchKey(trip)
        )
    );

  return [
    ...mergedTrips,
    ...localOnlyTrips,
  ];
};

const replaceCloudDetailsWithLocal = (
  cloudTrips: Trip[],
  localTrips: Trip[]
) => {
  const localById = new Map(
    localTrips
      .filter((trip) => trip.id)
      .map((trip) => [
        trip.id,
        trip,
      ])
  );
  const localByName = new Map(
    localTrips.map((trip) => [
      tripMatchKey(trip),
      trip,
    ])
  );
  const mergedTrips = cloudTrips.map(
    (cloudTrip) => {
      const localTrip =
        (cloudTrip.id &&
          localById.get(cloudTrip.id)) ||
        localByName.get(
          tripMatchKey(cloudTrip)
        );

      if (!localTrip) {
        return cloudTrip;
      }

      return {
        ...cloudTrip,
        destinationCity:
          localTrip.destinationCity ||
          cloudTrip.destinationCity,
        flights:
          localTrip.flights || [],
        hotels:
          localTrip.hotels || [],
        cars: localTrip.cars || [],
        activities:
          localTrip.activities || [],
      };
    }
  );
  const cloudIds = new Set(
    cloudTrips
      .map((trip) => trip.id)
      .filter(Boolean)
  );
  const cloudNames = new Set(
    cloudTrips.map(tripMatchKey)
  );
  const localOnlyTrips =
    localTrips.filter(
      (trip) =>
        !(
          trip.id &&
          cloudIds.has(trip.id)
        ) &&
        !cloudNames.has(
          tripMatchKey(trip)
        )
    );

  return [
    ...mergedTrips,
    ...localOnlyTrips,
  ];
};

const sameDetails = (
  first: Trip,
  second: Trip
) =>
  stableStringify(first.flights || []) ===
    stableStringify(second.flights || []) &&
  stableStringify(first.hotels || []) ===
    stableStringify(second.hotels || []) &&
  stableStringify(first.cars || []) ===
    stableStringify(second.cars || []) &&
  stableStringify(
    first.activities || []
  ) ===
    stableStringify(
      second.activities || []
    );

const findSavedTrip = (
  expected: Trip,
  savedTrips: Trip[]
) =>
  (expected.id &&
    savedTrips.find(
      (trip) => trip.id === expected.id
    )) ||
  savedTrips.find(
    (trip) =>
      tripMatchKey(trip) ===
      tripMatchKey(expected)
  );

const assertTripsWereSaved = (
  expectedTrips: Trip[],
  savedTrips: Trip[]
) => {
  const missingTrip =
    expectedTrips.find((expected) => {
      const savedTrip = findSavedTrip(
        expected,
        savedTrips
      );

      return (
        !savedTrip ||
        !sameDetails(
          expected,
          savedTrip
        )
      );
    });

  if (missingTrip) {
    throw new Error(
      `Supabase did not confirm saved details for "${missingTrip.name}".`
    );
  }
};

const getErrorMessage = (
  error: unknown,
  fallback: string
) => {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return fallback;
};

export const useCloudTrips = (
  session: Session | null
) => {
  const [trips, setTrips] =
    useState<Trip[]>(readLocalTrips);
  const [status, setStatus] =
    useState<CloudStatus>("offline");
  const [errorMessage, setErrorMessage] =
    useState("");
  const [isLoading, setIsLoading] =
    useState(false);
  const hasLoadedTrips =
    useRef(false);
  const lastSavedTrips =
    useRef(serializeTrips(trips));
  const latestTrips =
    useRef(trips);
  const saveTimer =
    useRef<number | null>(null);
  const reloadTimer =
    useRef<number | null>(null);

  const loadTrips = useCallback(
    async (migrateLocalTrips = false) => {
      if (!session || !supabase) {
        return;
      }

      const hasUnsavedLocalChanges =
        hasLoadedTrips.current &&
        serializeTrips(
          latestTrips.current
        ) !== lastSavedTrips.current;

      if (
        !migrateLocalTrips &&
        hasUnsavedLocalChanges
      ) {
        return;
      }

      setIsLoading(true);
      setStatus("loading");
      setErrorMessage("");

      try {
        const cloudTrips =
          await fetchTrips();
        const localTrips =
          readLocalTrips();
        const mergedTrips =
          migrateLocalTrips &&
          localTrips.length > 0
            ? mergeLocalAndCloudTrips(
                cloudTrips,
                localTrips,
                true
              )
            : cloudTrips;
        const shouldSaveMergedTrips =
          migrateLocalTrips &&
          localTrips.length > 0 &&
          serializeTrips(mergedTrips) !==
            serializeTrips(cloudTrips);
        const nextTrips =
          shouldSaveMergedTrips
            ? await saveTrips(mergedTrips)
            : mergedTrips;

        if (shouldSaveMergedTrips) {
          assertTripsWereSaved(
            mergedTrips,
            nextTrips
          );
        }

        setTrips(nextTrips);
        localStorage.setItem(
          "trips",
          serializeTrips(nextTrips)
        );
        lastSavedTrips.current =
          serializeTrips(nextTrips);
        hasLoadedTrips.current = true;
        setStatus("synced");
      } catch (error) {
        const localTrips =
          readLocalTrips();

        if (localTrips.length > 0) {
          setTrips(localTrips);
          lastSavedTrips.current =
            serializeTrips(localTrips);
          hasLoadedTrips.current = true;
          setStatus("cached");
          setErrorMessage("");
          return;
        }

        setStatus("error");
        setErrorMessage(
          getErrorMessage(
            error,
            "Could not load trips."
          )
        );
      } finally {
        setIsLoading(false);
      }
    },
    [session]
  );

  const syncTripsNow = useCallback(
    async () => {
      if (!session || !supabase) {
        return;
      }

      setStatus("saving");
      setErrorMessage("");

      try {
        const cloudTrips =
          await fetchTrips();
        const localTrips =
          readLocalTrips();
        const currentWithLocal =
          mergeLocalAndCloudTrips(
            latestTrips.current,
            localTrips,
            true
          );
        const tripsToSave =
          replaceCloudDetailsWithLocal(
            cloudTrips,
            currentWithLocal
          );
        const savedTrips =
          await saveTrips(tripsToSave);

        assertTripsWereSaved(
          tripsToSave,
          savedTrips
        );

        const savedTripsJson =
          serializeTrips(savedTrips);

        lastSavedTrips.current =
          savedTripsJson;
        latestTrips.current = savedTrips;
        setTrips(savedTrips);
        localStorage.setItem(
          "trips",
          savedTripsJson
        );
        setStatus("synced");
      } catch (error) {
        setStatus("error");
        setErrorMessage(
          getErrorMessage(
            error,
            "Could not save trips."
          )
        );
      }
    },
    [session]
  );

  useEffect(() => {
    latestTrips.current = trips;

    localStorage.setItem(
      "trips",
      serializeTrips(trips)
    );
  }, [trips]);

  useEffect(() => {
    hasLoadedTrips.current = false;

    if (session) {
      const timer = window.setTimeout(
        () => {
          void loadTrips(true);
        },
        0
      );

      return () => {
        window.clearTimeout(timer);
      };
    }
  }, [loadTrips, session]);

  useEffect(() => {
    if (!session || !supabase) {
      return;
    }

    const client = supabase;

    if (!client) {
      return;
    }

    const channel = client
      .channel("family-trips")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "family_trips",
          filter: `family_id=eq.${familyId}`,
        },
        () => {
          if (reloadTimer.current) {
            window.clearTimeout(
              reloadTimer.current
            );
          }

          reloadTimer.current =
            window.setTimeout(() => {
              void loadTrips(false);
            }, 400);
        }
      )
      .subscribe();

    return () => {
      if (reloadTimer.current) {
        window.clearTimeout(
          reloadTimer.current
        );
      }

      void client.removeChannel(channel);
    };
  }, [loadTrips, session]);

  useEffect(() => {
    if (
      !session ||
      !hasLoadedTrips.current
    ) {
      return;
    }

    const serializedTrips =
      serializeTrips(trips);

    if (
      serializedTrips ===
      lastSavedTrips.current
    ) {
      return;
    }

    if (saveTimer.current) {
      window.clearTimeout(
        saveTimer.current
      );
    }

    setStatus("saving");

    saveTimer.current =
      window.setTimeout(async () => {
        saveTimer.current = null;

        try {
          const cloudTrips =
            await fetchTrips();
          const tripsToSave =
            replaceCloudDetailsWithLocal(
              cloudTrips,
              trips
            );
          const savedTrips =
            await saveTrips(
              tripsToSave
            );
          assertTripsWereSaved(
            tripsToSave,
            savedTrips
          );

          const savedTripsJson =
            serializeTrips(savedTrips);
          const latestTripsJson =
            serializeTrips(
              latestTrips.current
            );

          if (
            latestTripsJson !==
            serializedTrips
          ) {
            setTrips([
              ...latestTrips.current,
            ]);
            return;
          }

          lastSavedTrips.current =
            savedTripsJson;
          localStorage.setItem(
            "trips",
            savedTripsJson
          );
          setTrips(savedTrips);
          setStatus("synced");
          setErrorMessage("");
        } catch (error) {
          setStatus("error");
          setErrorMessage(
            getErrorMessage(
              error,
              "Could not save trips."
            )
          );
        }
      }, 500);

    return () => {
      if (saveTimer.current) {
        window.clearTimeout(
          saveTimer.current
        );
      }
    };
  }, [session, trips]);

  return {
    trips,
    setTrips,
    status,
    errorMessage,
    isLoading,
    reloadTrips: loadTrips,
    syncTripsNow,
  };
};
