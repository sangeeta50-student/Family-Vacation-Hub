import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import type {
  Dispatch,
  SetStateAction,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { familyId, supabase } from "../lib/supabase";
import {
  fetchTrips,
  saveTrips,
} from "../lib/tripStore";
import {
  hasTripOrderChanged,
  mergeTripListsByTimestamp,
  normalizeTripForSync,
} from "../lib/syncMetadata";
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

type DeletedTrip = {
  id?: string;
  key: string;
  deletedAt: string;
};

const deletedTripsStorageKey =
  "deletedTrips";

const knownCloudTripIdsStorageKey =
  "knownCloudTripIds";

const pendingTripOrderStorageKey =
  `pendingTripOrder:${familyId}`;

const confirmTripOrder = (revision: string | null) => {
  if (
    revision &&
    localStorage.getItem(pendingTripOrderStorageKey) === revision
  ) {
    localStorage.removeItem(pendingTripOrderStorageKey);
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

const readKnownCloudTripIds = () => {
  const savedIds = localStorage.getItem(
    knownCloudTripIdsStorageKey
  );

  if (!savedIds) {
    return new Set<string>();
  }

  try {
    const parsedIds = JSON.parse(
      savedIds
    ) as string[];

    return new Set(parsedIds);
  } catch {
    return new Set<string>();
  }
};

const rememberCloudTrips = (
  trips: Trip[]
) => {
  const knownIds =
    readKnownCloudTripIds();

  trips.forEach((trip) => {
    if (trip.id) {
      knownIds.add(trip.id);
    }
  });

  localStorage.setItem(
    knownCloudTripIdsStorageKey,
    JSON.stringify(
      Array.from(knownIds)
    )
  );
};

const filterTripsDeletedFromCloud = (
  localTrips: Trip[],
  cloudTrips: Trip[],
  includeUnknownCloudDeletions = false
) => {
  const knownCloudTripIds =
    readKnownCloudTripIds();
  const currentCloudTripIds = new Set(
    cloudTrips
      .map((trip) => trip.id)
      .filter(
        (id): id is string =>
          Boolean(id)
      )
  );

  return localTrips.filter(
    (trip) => {
      if (
        !trip.id ||
        currentCloudTripIds.has(trip.id)
      ) {
        return true;
      }

      if (trip.localCreatedAt) {
        return true;
      }

      return !(
        includeUnknownCloudDeletions ||
        knownCloudTripIds.has(trip.id)
      );
    }
  );
};

const readDeletedTrips = () => {
  const savedDeletedTrips =
    localStorage.getItem(
      deletedTripsStorageKey
    );

  if (!savedDeletedTrips) {
    return [];
  }

  try {
    return JSON.parse(
      savedDeletedTrips
    ) as DeletedTrip[];
  } catch {
    return [];
  }
};

const writeDeletedTrips = (
  deletedTrips: DeletedTrip[]
) => {
  if (deletedTrips.length === 0) {
    localStorage.removeItem(
      deletedTripsStorageKey
    );
    return;
  }

  localStorage.setItem(
    deletedTripsStorageKey,
    JSON.stringify(deletedTrips)
  );
};

const deletedTripFromTrip = (
  trip: Trip,
  deletedAt = new Date().toISOString()
): DeletedTrip => ({
  ...(trip.id ? { id: trip.id } : {}),
  key: tripMatchKey(trip),
  deletedAt,
});

const recordDeletedTrip = (
  trip: Trip
) => {
  const existingDeletedTrips =
    readDeletedTrips();
  const deletedByKey = new Map(
    existingDeletedTrips.map(
      (deletedTrip) => [
        deletedTrip.key,
        deletedTrip,
      ]
    )
  );

  deletedByKey.set(
    tripMatchKey(trip),
    deletedTripFromTrip(trip)
  );

  writeDeletedTrips(
    Array.from(deletedByKey.values())
  );
};

const isDeletedTrip = (
  trip: Trip,
  deletedTrips: DeletedTrip[]
) =>
  deletedTrips.some(
    (deletedTrip) =>
      (trip.id &&
        deletedTrip.id === trip.id) ||
      deletedTrip.key ===
        tripMatchKey(trip)
  );

const filterDeletedTrips = (
  trips: Trip[],
  deletedTrips: DeletedTrip[]
) =>
  deletedTrips.length > 0
    ? trips.filter(
        (trip) =>
          !isDeletedTrip(
            trip,
            deletedTrips
          )
      )
    : trips;

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

const sameDetails = (
  first: Trip,
  second: Trip
) =>
  first.name === second.name &&
  (first.destinationCity || "") === (second.destinationCity || "") &&
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

const recordDeletedTrips = (
  previousTrips: Trip[],
  nextTrips: Trip[]
) => {
  const nextIds = new Set(
    nextTrips
      .map((trip) => trip.id)
      .filter(
        (id): id is string =>
          Boolean(id)
      )
  );
  const nextKeys = new Set(
    nextTrips.map(tripMatchKey)
  );
  const existingDeletedTrips =
    readDeletedTrips();
  const deletedByKey = new Map(
    existingDeletedTrips.map(
      (deletedTrip) => [
        deletedTrip.key,
        deletedTrip,
      ]
    )
  );
  const timestamp =
    new Date().toISOString();

  previousTrips.forEach((trip) => {
    const tripKey = tripMatchKey(trip);
    const stillExists =
      (trip.id &&
        nextIds.has(trip.id)) ||
      nextKeys.has(tripKey);

    if (stillExists) {
      return;
    }

    deletedByKey.set(tripKey, {
      ...(trip.id ? { id: trip.id } : {}),
      key: tripKey,
      deletedAt: timestamp,
    });
  });

  writeDeletedTrips(
    Array.from(deletedByKey.values())
  );
};

const clearConfirmedDeletedTrips = (
  savedTrips: Trip[]
) => {
  const deletedTrips =
    readDeletedTrips();

  if (deletedTrips.length === 0) {
    return;
  }

  const stillDeletedTrips =
    deletedTrips.filter(
      (deletedTrip) =>
        savedTrips.some(
          (trip) =>
            (trip.id &&
              deletedTrip.id ===
                trip.id) ||
            deletedTrip.key ===
              tripMatchKey(trip)
        )
    );

  writeDeletedTrips(
    stillDeletedTrips
  );
};

export const useCloudTrips = (
  session: Session | null
) => {
  const sessionUserId = session?.user.id ?? null;
  const [trips, setTripsState] =
    useState<Trip[]>(readLocalTrips);
  const [status, setStatus] =
    useState<CloudStatus>("offline");
  const [errorMessage, setErrorMessage] =
    useState("");
  const [isLoading, setIsLoading] =
    useState(false);
  const [isSyncingNow, setIsSyncingNow] =
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
  const syncInFlight =
    useRef<Promise<void> | null>(null);

  const setTrips: Dispatch<
    SetStateAction<Trip[]>
  > = useCallback((nextTrips) => {
    const previousTrips =
      latestTrips.current;
    const resolvedTrips =
      typeof nextTrips === "function"
        ? nextTrips(
            previousTrips
          )
        : nextTrips;
    const normalizedTrips =
      resolvedTrips.map(
        normalizeTripForSync
      );

    if (
      typeof nextTrips === "function" &&
      hasTripOrderChanged(previousTrips, normalizedTrips)
    ) {
      localStorage.setItem(pendingTripOrderStorageKey, crypto.randomUUID());
    }

    if (hasLoadedTrips.current) {
      recordDeletedTrips(
        previousTrips,
        normalizedTrips
      );
    }

    const serializedTrips =
      serializeTrips(
        normalizedTrips
      );

    latestTrips.current =
      normalizedTrips;
    localStorage.setItem(
      "trips",
      serializedTrips
    );
    setTripsState(normalizedTrips);
  }, []);

  const loadTrips = useCallback(
    async (migrateLocalTrips = false) => {
      if (!sessionUserId || !supabase || syncInFlight.current) {
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

      let orderRevision = localStorage.getItem(pendingTripOrderStorageKey);
      const loadingSnapshot = serializeTrips(latestTrips.current);

      try {
        const cloudTrips =
          await fetchTrips();

        if (
          !migrateLocalTrips &&
          (syncInFlight.current ||
            serializeTrips(latestTrips.current) !== loadingSnapshot)
        ) {
          return;
        }

        orderRevision = localStorage.getItem(pendingTripOrderStorageKey);
        rememberCloudTrips(cloudTrips);
        const deletedTrips =
          readDeletedTrips();
        const activeCloudTrips =
          filterDeletedTrips(
            cloudTrips,
            deletedTrips
          );
        const localTrips =
          filterTripsDeletedFromCloud(
            readLocalTrips(),
            cloudTrips,
            !hasLoadedTrips.current
          );
        const mergedTrips =
          migrateLocalTrips &&
          localTrips.length > 0
            ? mergeTripListsByTimestamp(
                activeCloudTrips,
                localTrips,
                Boolean(orderRevision)
              )
            : activeCloudTrips.map(
                normalizeTripForSync
              );
        const shouldSaveMergedTrips =
          migrateLocalTrips &&
          (localTrips.length > 0 ||
            deletedTrips.length > 0) &&
          serializeTrips(mergedTrips) !==
            serializeTrips(cloudTrips);
        const nextTrips =
          shouldSaveMergedTrips
            ? await saveTrips(mergedTrips, Boolean(orderRevision))
            : mergedTrips;

        if (shouldSaveMergedTrips) {
          assertTripsWereSaved(
            mergedTrips,
            nextTrips
          );
          rememberCloudTrips(
            nextTrips
          );
          clearConfirmedDeletedTrips(
            nextTrips
          );
        }

        confirmTripOrder(orderRevision);
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
          setStatus(orderRevision ? "error" : "cached");
          setErrorMessage(orderRevision ? getErrorMessage(error, "Could not save trip order.") : "");
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
    [sessionUserId, setTrips]
  );

  const syncTripsNow = useCallback(
    async (manual = true) => {
      if (!sessionUserId || !supabase) {
        if (manual) {
          setStatus("error");
          setErrorMessage("Please sign in and complete two-factor authentication before syncing.");
        }
        return;
      }

      if (saveTimer.current) {
        window.clearTimeout(saveTimer.current);
        saveTimer.current = null;
      }

      if (manual) setIsSyncingNow(true);

      try {
        if (!syncInFlight.current) {
          const sync = async () => {
            setStatus("saving");
            setErrorMessage("");

            try {
              while (true) {
                const cloudTrips = await fetchTrips();
                const orderRevision = localStorage.getItem(pendingTripOrderStorageKey);
                rememberCloudTrips(cloudTrips);
                const activeCloudTrips = filterDeletedTrips(cloudTrips, readDeletedTrips());
                const currentTrips = filterTripsDeletedFromCloud(
                  latestTrips.current,
                  cloudTrips,
                  true
                );
                const syncSnapshot = serializeTrips(latestTrips.current);
                const tripsToSave = mergeTripListsByTimestamp(
                  activeCloudTrips,
                  currentTrips,
                  Boolean(orderRevision)
                );
                const savedTrips = await saveTrips(tripsToSave, Boolean(orderRevision));
                assertTripsWereSaved(tripsToSave, savedTrips);
                rememberCloudTrips(savedTrips);
                confirmTripOrder(orderRevision);
                clearConfirmedDeletedTrips(savedTrips);
                lastSavedTrips.current = serializeTrips(savedTrips);

                // Save any edits made while this request was in progress before reporting success.
                if (serializeTrips(latestTrips.current) !== syncSnapshot) {
                  continue;
                }

                hasLoadedTrips.current = true;
                setTrips(savedTrips);
                setStatus("synced");
                return;
              }
            } catch (error) {
              setStatus("error");
              setErrorMessage(getErrorMessage(error, "Could not save trips."));
            } finally {
              syncInFlight.current = null;
            }
          };

          syncInFlight.current = sync();
        }

        await syncInFlight.current;
      } finally {
        if (manual) setIsSyncingNow(false);
      }
    },
    [sessionUserId, setTrips]
  );

  const deleteTripAtIndex = useCallback(
    (tripIndex: number) => {
      setTrips((currentTrips) => {
        const tripToDelete =
          currentTrips[tripIndex];

        if (!tripToDelete) {
          return currentTrips;
        }

        recordDeletedTrip(
          tripToDelete
        );

        return currentTrips
          .filter(
            (_, index) =>
              index !== tripIndex
          )
          .map((trip, index) => ({
            ...trip,
            sortOrder: index,
          }));
      });
    },
    [setTrips]
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

    if (sessionUserId) {
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
  }, [loadTrips, sessionUserId]);

  useEffect(() => {
    if (!sessionUserId) return;

    const refreshTrips = () => {
      if (document.visibilityState === "visible") {
        void loadTrips(false);
      }
    };

    window.addEventListener("focus", refreshTrips);
    window.addEventListener("online", refreshTrips);
    document.addEventListener("visibilitychange", refreshTrips);

    return () => {
      window.removeEventListener("focus", refreshTrips);
      window.removeEventListener("online", refreshTrips);
      document.removeEventListener("visibilitychange", refreshTrips);
    };
  }, [loadTrips, sessionUserId]);

  useEffect(() => {
    if (!sessionUserId || !supabase) {
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
  }, [loadTrips, sessionUserId]);

  useEffect(() => {
    if (
      !sessionUserId ||
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
      window.setTimeout(() => {
        saveTimer.current = null;
        void syncTripsNow(false);
      }, 500);

    return () => {
      if (saveTimer.current) {
        window.clearTimeout(
          saveTimer.current
        );
      }
    };
  }, [sessionUserId, syncTripsNow, trips]);

  return {
    trips,
    setTrips,
    status,
    errorMessage,
    isLoading,
    isSyncingNow,
    reloadTrips: loadTrips,
    syncTripsNow,
    deleteTripAtIndex,
  };
};
