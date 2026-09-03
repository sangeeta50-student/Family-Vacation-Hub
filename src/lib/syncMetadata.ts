import type { Trip } from "../types/Trip";

export type SyncMetadata = {
  id?: string;
  updatedAt?: string;
  deletedAt?: string;
};

type SectionKind =
  | "flights"
  | "hotels"
  | "cars"
  | "activities";

const legacyTimestamp =
  "1970-01-01T00:00:00.000Z";

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

const hashString = (value: string) => {
  let hash = 0;

  for (
    let index = 0;
    index < value.length;
    index += 1
  ) {
    hash =
      (hash * 31 +
        value.charCodeAt(index)) >>>
      0;
  }

  return hash.toString(36);
};

const stripSyncMetadata = (
  item: object
) =>
  Object.fromEntries(
    Object.entries(item).filter(
      ([key]) =>
        ![
          "id",
          "updatedAt",
          "deletedAt",
        ].includes(key)
    )
  );

const legacyItemId = (
  section: SectionKind,
  item: object
) =>
  `legacy-${section}-${hashString(
    stableStringify(
      stripSyncMetadata(item)
    )
  )}`;

const currentTimestamp = () =>
  new Date().toISOString();

const getExistingItemId = (
  item: SyncMetadata
) =>
  typeof item.id === "string" &&
  item.id
    ? item.id
    : undefined;

export const isDeletedItem = (
  item: SyncMetadata
) => Boolean(item.deletedAt);

export const visibleItems = <
  T extends SyncMetadata,
>(
  items: T[] = []
) =>
  items
    .map((item, index) => ({
      item,
      index,
    }))
    .filter(
      ({ item }) =>
        !isDeletedItem(item)
    );

export const visibleItemCount = <
  T extends SyncMetadata,
>(
  items: T[] = []
) => visibleItems(items).length;

export const touchItem = <
  T extends object,
>(
  item: T,
  existingItem?: SyncMetadata
): T & SyncMetadata => ({
  ...item,
  id:
    getExistingItemId(
      existingItem || {}
    ) ||
    getExistingItemId(
      item as SyncMetadata
    ) ||
    crypto.randomUUID(),
  updatedAt: currentTimestamp(),
  deletedAt: undefined,
});

export const markItemDeleted = <
  T extends object,
>(
  section: SectionKind,
  item: T & SyncMetadata
): T & SyncMetadata => {
  const timestamp =
    currentTimestamp();

  return {
    ...item,
    id:
      item.id ||
      legacyItemId(section, item),
    updatedAt: timestamp,
    deletedAt: timestamp,
  };
};

const normalizeItemForSync = <
  T extends object,
>(
  section: SectionKind,
  item: T & SyncMetadata
): T & SyncMetadata => ({
  ...item,
  id:
    item.id ||
    legacyItemId(section, item),
  updatedAt:
    item.updatedAt ||
    item.deletedAt ||
    legacyTimestamp,
});

const itemChangeTime = (
  item: SyncMetadata
) =>
  Math.max(
    Date.parse(
      item.updatedAt ||
        legacyTimestamp
    ),
    Date.parse(
      item.deletedAt ||
        legacyTimestamp
    )
  );

const chooseNewestItem = <
  T extends SyncMetadata,
>(
  first: T,
  second: T
) =>
  itemChangeTime(second) >=
  itemChangeTime(first)
    ? second
    : first;

const mergeItemsByTimestamp = <
  T extends SyncMetadata,
>(
  section: SectionKind,
  cloudItems: T[] = [],
  localItems: T[] = []
) => {
  const mergedItems = new Map<
    string,
    T
  >();

  [
    ...cloudItems.map((item) =>
      normalizeItemForSync(
        section,
        item
      )
    ),
    ...localItems.map((item) =>
      normalizeItemForSync(
        section,
        item
      )
    ),
  ].forEach((item) => {
    const itemId = item.id;

    if (!itemId) {
      return;
    }

    const existingItem =
      mergedItems.get(itemId);

    mergedItems.set(
      itemId,
      existingItem
        ? chooseNewestItem(
            existingItem,
            item
          )
        : item
    );
  });

  return Array.from(
    mergedItems.values()
  );
};

export const normalizeTripForSync = (
  trip: Trip
): Trip => ({
  ...trip,
  flights: (trip.flights || []).map(
    (flight) =>
      normalizeItemForSync(
        "flights",
        flight
      )
  ),
  hotels: (trip.hotels || []).map(
    (hotel) =>
      normalizeItemForSync(
        "hotels",
        hotel
      )
  ),
  cars: (trip.cars || []).map((car) =>
    normalizeItemForSync("cars", car)
  ),
  activities: (
    trip.activities || []
  ).map((activity) =>
    normalizeItemForSync(
      "activities",
      activity
    )
  ),
});

const mergeTripDetails = (
  cloudTrip: Trip,
  localTrip: Trip
): Trip => ({
  ...cloudTrip,
  destinationCity:
    localTrip.destinationCity ||
    cloudTrip.destinationCity,
  flights: mergeItemsByTimestamp(
    "flights",
    cloudTrip.flights,
    localTrip.flights
  ),
  hotels: mergeItemsByTimestamp(
    "hotels",
    cloudTrip.hotels,
    localTrip.hotels
  ),
  cars: mergeItemsByTimestamp(
    "cars",
    cloudTrip.cars,
    localTrip.cars
  ),
  activities:
    mergeItemsByTimestamp(
      "activities",
      cloudTrip.activities,
      localTrip.activities
    ),
});

const tripMatchKey = (trip: Trip) =>
  [
    trip.name.trim().toLowerCase(),
    (trip.destinationCity || "")
      .trim()
      .toLowerCase(),
  ].join("|");

export const mergeTripListsByTimestamp =
  (
    cloudTrips: Trip[],
    localTrips: Trip[]
  ) => {
    const normalizedCloudTrips =
      cloudTrips.map(
        normalizeTripForSync
      );
    const normalizedLocalTrips =
      localTrips.map(
        normalizeTripForSync
      );
    const localById = new Map(
      normalizedLocalTrips
        .filter((trip) => trip.id)
        .map((trip) => [
          trip.id,
          trip,
        ])
    );
    const localByName = new Map(
      normalizedLocalTrips.map(
        (trip) => [
          tripMatchKey(trip),
          trip,
        ]
      )
    );
    const mergedTrips =
      normalizedCloudTrips.map(
        (cloudTrip) => {
          const localTrip =
            (cloudTrip.id &&
              localById.get(
                cloudTrip.id
              )) ||
            localByName.get(
              tripMatchKey(cloudTrip)
            );

          return localTrip
            ? mergeTripDetails(
                cloudTrip,
                localTrip
              )
            : cloudTrip;
        }
      );
    const cloudIds = new Set(
      normalizedCloudTrips
        .map((trip) => trip.id)
        .filter(Boolean)
    );
    const cloudNames = new Set(
      normalizedCloudTrips.map(
        tripMatchKey
      )
    );
    const localOnlyTrips =
      normalizedLocalTrips.filter(
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
