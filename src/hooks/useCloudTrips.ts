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
        const nextTrips =
          migrateLocalTrips &&
          cloudTrips.length === 0 &&
          localTrips.length > 0
            ? await saveTrips(localTrips)
            : cloudTrips;

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
          const savedTrips =
            await saveTrips(trips);
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
  };
};
