import {
  useState,
  useEffect,
  useCallback,
} from "react";
import type { Session } from "@supabase/supabase-js";
import TripCard from "./components/TripCard";

import FlightCard from "./components/FlightCard";

import HotelCard from "./components/HotelCard";

import CarCard from "./components/CarCard";

import ActivityCard from "./components/ActivityCard";

import AuthScreen from "./components/AuthScreen";

import MfaGate from "./components/MfaGate";

import Modal from "./components/Modal";

import SupabaseSetupMissing from "./components/SupabaseSetupMissing";

import { parseFlights } from "./parsers/flightParser";

import { parseHotels } from "./parsers/hotelParser";

import { parseCars } from "./parsers/carParser";

import { parseActivities } from "./parsers/activityParser";

import { useCloudTrips } from "./hooks/useCloudTrips";

import { isSupabaseConfigured, supabase } from "./lib/supabase";

import type { Trip } from "./types/Trip";

type DeleteTarget =
  | {
      kind: "trip";
      tripIndex: number;
    }
  | {
      kind: "flight";
      tripIndex: number;
      itemIndex: number;
    }
  | {
      kind: "hotel";
      tripIndex: number;
      itemIndex: number;
    }
  | {
      kind: "car";
      tripIndex: number;
      itemIndex: number;
    }
  | {
      kind: "activity";
      tripIndex: number;
      itemIndex: number;
    };

function App() {
  const [session, setSession] =
  useState<Session | null>(null);

  const [isAuthReady, setIsAuthReady] =
  useState(!supabase);

  const [isMfaVerified, setIsMfaVerified] =
  useState(false);

  const {
    trips,
    setTrips,
    status: cloudStatus,
    errorMessage: cloudErrorMessage,
    isLoading: isTripsLoading,
  } = useCloudTrips(
    isMfaVerified ? session : null
  );

  const handleMfaVerified =
  useCallback(() => {
    setIsMfaVerified(true);
  }, []);

  const [showTripModal,
  setShowTripModal] =
  useState(false);

  const [newTripName,
  setNewTripName] =
  useState("");

  const [newTripDestination,
  setNewTripDestination] =
  useState("");

  const [renameTripIndex,
  setRenameTripIndex] =
  useState<number | null>(null);

  const [renameTripName,
  setRenameTripName] =
  useState("");

  const [selectedTripIndex, setSelectedTripIndex] =
  useState<number | null>(null);

  const [deleteTarget,
  setDeleteTarget] =
  useState<DeleteTarget | null>(
    null
  );

  
  

  const [showActivityForm, setShowActivityForm] =
  useState(false);

  const [editingActivityIndex,
  setEditingActivityIndex] =
  useState<number | null>(null);

  const [activityName, setActivityName] =
  useState("");

  const [activityDate, setActivityDate] =
  useState("");

  const [activityTime, setActivityTime] =
  useState("");

  const [activityLocation, setActivityLocation] =
  useState("");

  const [activityPaid, setActivityPaid] =
  useState(false);

  const [activityNotes, setActivityNotes] =
  useState("");

  const [showActivityImportModal,
  setShowActivityImportModal] =
  useState(false);

  const [activityImportText,
  setActivityImportText] =
  useState("");

  const [showFlightForm,
  setShowFlightForm] =
  useState(false);

  const [editingFlightIndex,
  setEditingFlightIndex] =
  useState<number | null>(null);

  const [flightNumber,
  setFlightNumber] =
  useState("");

  const [flightFrom,
  setFlightFrom] =
  useState("");

  const [flightTo,
  setFlightTo] =
  useState("");

  const [flightDate,
  setFlightDate] =
  useState("");

  const [flightDeparture,
  setFlightDeparture] =
  useState("");

  const [flightArrival,
  setFlightArrival] =
  useState("");

  const [flightDuration,
  setFlightDuration] =
  useState("");

  const [flightAircraft,
  setFlightAircraft] =
  useState("");

  const [flightCabin,
  setFlightCabin] =
  useState("");

  const [flightNotes,
  setFlightNotes] =
  useState("");

  const [showFlightImportModal,
  setShowFlightImportModal] =
  useState(false);

  const [flightImportText,
  setFlightImportText] =
  useState("");

  const [showHotelForm,
  setShowHotelForm] =
  useState(false);

  const [editingHotelIndex,
  setEditingHotelIndex] =
  useState<number | null>(null);

  const [hotelName,
  setHotelName] =
  useState("");

  const [hotelAddress,
  setHotelAddress] =
  useState("");

  const [hotelPhone,
  setHotelPhone] =
  useState("");

  const [hotelCheckIn,
  setHotelCheckIn] =
  useState("");

  const [hotelCheckInTime,
  setHotelCheckInTime] =
  useState("");

  const [hotelCheckOut,
  setHotelCheckOut] =
  useState("");

  const [hotelCheckOutTime,
  setHotelCheckOutTime] =
  useState("");

  const [hotelNotes,
  setHotelNotes] =
  useState("");

  const [showHotelImportModal,
  setShowHotelImportModal] =
  useState(false);

  const [hotelImportText,
  setHotelImportText] =
  useState("");

  const [showCarForm,
  setShowCarForm] =
  useState(false);

  const [editingCarIndex,
  setEditingCarIndex] =
  useState<number | null>(null);

  const [carCompany,
  setCarCompany] =
  useState("");

  const [carVehicleType,
  setCarVehicleType] =
  useState("");

  const [carVehicle,
  setCarVehicle] =
  useState("");

  const [carPickupLocation,
  setCarPickupLocation] =
  useState("");

  const [carPickupDate,
  setCarPickupDate] =
  useState("");

  const [carPickupTime,
  setCarPickupTime] =
  useState("");

  const [carReturnLocation,
  setCarReturnLocation] =
  useState("");

  const [carReturnDate,
  setCarReturnDate] =
  useState("");

  const [carReturnTime,
  setCarReturnTime] =
  useState("");

  const [carNotes,
  setCarNotes] =
  useState("");

  const [showCarImportModal,
  setShowCarImportModal] =
  useState(false);

  const [carImportText,
  setCarImportText] =
  useState("");

  const renameTrip = (
  tripIndex: number
) => {
  setRenameTripIndex(tripIndex);
  setRenameTripName(
    trips[tripIndex].name
  );
};
const deleteTrip = (
  tripIndex: number
) => {
  setDeleteTarget({
    kind: "trip",
    tripIndex,
  });
};
useEffect(() => {
  if (!supabase) {
    return;
  }

  supabase.auth
    .getSession()
    .then(({ data }) => {
      setSession(data.session);
      setIsAuthReady(true);
    });

  const { data } =
    supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession);
        setIsMfaVerified(false);
        setIsAuthReady(true);
      }
    );

  return () => {
    data.subscription.unsubscribe();
  };
}, []);

const signOut = () => {
  void supabase?.auth.signOut();
};

const saveActivity = () => {
  if (
    selectedTripIndex === null
  )
    return;

  if (!activityName.trim())
    return;

  const updatedTrips = [...trips];

  const activityData = {
  name: activityName,
  date: activityDate,
  time: activityTime,
  location: activityLocation,
  paid: activityPaid,
  notes: activityNotes,
  source: "Manual",
};

if (
  editingActivityIndex !== null
) {
  updatedTrips[
    selectedTripIndex
  ].activities[
    editingActivityIndex
  ] = activityData;
} else {
  updatedTrips[
    selectedTripIndex
  ].activities.push(
    activityData
  );
}

  setTrips(updatedTrips);

  setActivityName("");
  setActivityDate("");
  setActivityTime("");
  setActivityLocation("");
  setActivityPaid(false);
  setActivityNotes("");
  setEditingActivityIndex(null);
  setShowActivityForm(false);
  
};
const importActivityDetails = () => {
  if (
    selectedTripIndex === null
  )
    return;

  const parsedActivities =
    parseActivities(
      activityImportText
    );

  if (
    parsedActivities.length === 0
  )
    return;

  const updatedTrips = [...trips];

  updatedTrips[
    selectedTripIndex
  ].activities ||= [];

  updatedTrips[
    selectedTripIndex
  ].activities.push(
    ...parsedActivities
  );

  setTrips(updatedTrips);
  setActivityImportText("");
  setShowActivityImportModal(
    false
  );
};
const saveFlight = () => {
  if (
    selectedTripIndex === null
  )
    return;

  if (!flightNumber.trim())
    return;

  const updatedTrips = [...trips];

  const flightData = {
  flightNumber,
  from: flightFrom,
  to: flightTo,
  date: flightDate,
  departureTime:
    flightDeparture,
  arrivalTime:
    flightArrival,
  duration:
    flightDuration,
  aircraft:
    flightAircraft,
  cabin:
    flightCabin,
  notes:
    flightNotes,
};

if (
  editingFlightIndex !== null
) {
  updatedTrips[
    selectedTripIndex
  ].flights[
    editingFlightIndex
  ] = flightData;
} else {
  updatedTrips[
    selectedTripIndex
  ].flights.push(
    flightData
  );
}

  setTrips(updatedTrips);

  setFlightNumber("");
  setFlightFrom("");
  setFlightTo("");
  setFlightDate("");
  setFlightDeparture("");
  setFlightArrival("");
  setFlightDuration("");
  setFlightAircraft("");
  setFlightCabin("");
  setFlightNotes("");

  setEditingFlightIndex(
    null
  );
  setShowFlightForm(false);
};
const importFlightDetails = () => {
  if (
    selectedTripIndex === null
  )
    return;

  const parsedFlights =
    parseFlights(
      flightImportText
    );

  if (
    parsedFlights.length === 0
  )
    return;

  const updatedTrips = [...trips];

  updatedTrips[
    selectedTripIndex
  ].flights.push(
    ...parsedFlights
  );

  setTrips(updatedTrips);

  setFlightImportText("");

  setShowFlightImportModal(
    false
  );
};
const clearHotelForm = () => {
  setHotelName("");
  setHotelAddress("");
  setHotelPhone("");
  setHotelCheckIn("");
  setHotelCheckInTime("");
  setHotelCheckOut("");
  setHotelCheckOutTime("");
  setHotelNotes("");
  setEditingHotelIndex(null);
};

const saveHotel = () => {
  if (
    selectedTripIndex === null
  )
    return;

  if (!hotelName.trim())
    return;

  const updatedTrips = [...trips];

  const hotelData = {
    name: hotelName,
    address: hotelAddress,
    phone: hotelPhone,
    checkInDate: hotelCheckIn,
    checkInTime: hotelCheckInTime,
    checkOutDate: hotelCheckOut,
    checkOutTime: hotelCheckOutTime,
    notes: hotelNotes,
  };

  updatedTrips[
    selectedTripIndex
  ].hotels ||= [];

  if (
    editingHotelIndex !== null
  ) {
    updatedTrips[
      selectedTripIndex
    ].hotels[
      editingHotelIndex
    ] = hotelData;
  } else {
    updatedTrips[
      selectedTripIndex
    ].hotels.push(
      hotelData
    );
  }

  setTrips(updatedTrips);
  clearHotelForm();
  setShowHotelForm(false);
};

const importHotelDetails = () => {
  if (
    selectedTripIndex === null
  )
    return;

  const parsedHotels =
    parseHotels(hotelImportText);

  if (
    parsedHotels.length === 0
  )
    return;

  const updatedTrips = [...trips];

  updatedTrips[
    selectedTripIndex
  ].hotels ||= [];

  updatedTrips[
    selectedTripIndex
  ].hotels.push(
    ...parsedHotels
  );

  setTrips(updatedTrips);
  setHotelImportText("");
  setShowHotelImportModal(
    false
  );
};

const clearCarForm = () => {
  setCarCompany("");
  setCarVehicleType("");
  setCarVehicle("");
  setCarPickupLocation("");
  setCarPickupDate("");
  setCarPickupTime("");
  setCarReturnLocation("");
  setCarReturnDate("");
  setCarReturnTime("");
  setCarNotes("");
  setEditingCarIndex(null);
};

const saveCar = () => {
  if (
    selectedTripIndex === null
  )
    return;

  if (
    !carCompany.trim() &&
    !carVehicle.trim() &&
    !carPickupLocation.trim()
  )
    return;

  const updatedTrips = [...trips];

  const carData = {
    company: carCompany,
    vehicleType: carVehicleType,
    vehicle: carVehicle,
    pickupLocation:
      carPickupLocation,
    pickupDate: carPickupDate,
    pickupTime: carPickupTime,
    returnLocation:
      carReturnLocation,
    returnDate: carReturnDate,
    returnTime: carReturnTime,
    notes: carNotes,
  };

  updatedTrips[
    selectedTripIndex
  ].cars ||= [];

  if (
    editingCarIndex !== null
  ) {
    updatedTrips[
      selectedTripIndex
    ].cars[
      editingCarIndex
    ] = carData;
  } else {
    updatedTrips[
      selectedTripIndex
    ].cars.push(carData);
  }

  setTrips(updatedTrips);
  clearCarForm();
  setShowCarForm(false);
};

const importCarDetails = () => {
  if (
    selectedTripIndex === null
  )
    return;

  const parsedCars =
    parseCars(carImportText);

  if (parsedCars.length === 0)
    return;

  const updatedTrips = [...trips];

  updatedTrips[
    selectedTripIndex
  ].cars ||= [];

  updatedTrips[
    selectedTripIndex
  ].cars.push(...parsedCars);

  setTrips(updatedTrips);
  setCarImportText("");
  setShowCarImportModal(false);
};

const editCar = (
  carIndex: number
) => {
  if (
    selectedTripIndex === null
  )
    return;

  const car =
    trips[selectedTripIndex]
      .cars[carIndex];

  setCarCompany(
    car.company || ""
  );
  setCarVehicleType(
    car.vehicleType || ""
  );
  setCarVehicle(
    car.vehicle || ""
  );
  setCarPickupLocation(
    car.pickupLocation || ""
  );
  setCarPickupDate(
    car.pickupDate || ""
  );
  setCarPickupTime(
    car.pickupTime || ""
  );
  setCarReturnLocation(
    car.returnLocation || ""
  );
  setCarReturnDate(
    car.returnDate || ""
  );
  setCarReturnTime(
    car.returnTime || ""
  );
  setCarNotes(
    car.notes || ""
  );
  setEditingCarIndex(carIndex);
  setShowCarForm(true);
};

const deleteCar = (
  carIndex: number
) => {
  if (
    selectedTripIndex === null
  )
    return;

  setDeleteTarget({
    kind: "car",
    tripIndex: selectedTripIndex,
    itemIndex: carIndex,
  });
};

const editHotel = (
  hotelIndex: number
) => {
  if (
    selectedTripIndex === null
  )
    return;

  const hotel =
    trips[selectedTripIndex]
      .hotels[hotelIndex];

  setHotelName(
    hotel.name || ""
  );
  setHotelAddress(
    hotel.address || ""
  );
  setHotelPhone(
    hotel.phone || ""
  );
  setHotelCheckIn(
    hotel.checkInDate || ""
  );
  setHotelCheckInTime(
    hotel.checkInTime || ""
  );
  setHotelCheckOut(
    hotel.checkOutDate || ""
  );
  setHotelCheckOutTime(
    hotel.checkOutTime || ""
  );
  setHotelNotes(
    hotel.notes || ""
  );
  setEditingHotelIndex(
    hotelIndex
  );
  setShowHotelForm(true);
};

const deleteHotel = (
  hotelIndex: number
) => {
  if (
    selectedTripIndex === null
  )
    return;

  setDeleteTarget({
    kind: "hotel",
    tripIndex: selectedTripIndex,
    itemIndex: hotelIndex,
  });
};

const deleteActivity = (
  activityIndex: number
) => {
  if (
    selectedTripIndex === null
  )
    return;

  setDeleteTarget({
    kind: "activity",
    tripIndex: selectedTripIndex,
    itemIndex: activityIndex,
  });
};
const editFlight = (
  flightIndex: number
) => {
  if (
    selectedTripIndex === null
  )
    return;

  const flight =
    trips[selectedTripIndex]
      .flights[flightIndex];

  setFlightNumber(
    flight.flightNumber || ""
  );

  setFlightFrom(
    flight.from || ""
  );

  setFlightTo(
    flight.to || ""
  );

  setFlightDate(
    flight.date || ""
  );

  setFlightDeparture(
    flight.departureTime || ""
  );

  setFlightArrival(
    flight.arrivalTime || ""
  );

  setFlightDuration(
    flight.duration || ""
  );

  setFlightAircraft(
    flight.aircraft || ""
  );

  setFlightCabin(
    flight.cabin || ""
  );

  setFlightNotes(
    flight.notes || ""
  );

  setEditingFlightIndex(
    flightIndex
  );



setShowFlightForm(true);};
const deleteFlight = (
  flightIndex: number
) => {
  if (
    selectedTripIndex === null
  )
    return;

  setDeleteTarget({
    kind: "flight",
    tripIndex: selectedTripIndex,
    itemIndex: flightIndex,
  });
};
const editActivity = (
  activityIndex: number
) => {
  if (
    selectedTripIndex === null
  )
    return;

  const activity =
    trips[selectedTripIndex]
      .activities[activityIndex];

  setActivityName(
    activity.name || ""
  );

  setActivityDate(
    activity.date || ""
  );

  setActivityTime(
    activity.time || ""
  );

  setActivityLocation(
    activity.location || ""
  );

  setActivityPaid(
    activity.paid || false
  );

  setActivityNotes(
    activity.notes || ""
  );

  setEditingActivityIndex(
    activityIndex
  );

  

setShowActivityForm(true);
};

const confirmDelete = () => {
  if (!deleteTarget) return;

  const updatedTrips = [...trips];

  if (deleteTarget.kind === "trip") {
    setTrips(
      updatedTrips.filter(
        (_, index) =>
          index !==
          deleteTarget.tripIndex
      )
    );

    setSelectedTripIndex(null);
    setDeleteTarget(null);
    return;
  }

  const targetTrip =
    updatedTrips[
      deleteTarget.tripIndex
    ];

  if (!targetTrip) {
    setDeleteTarget(null);
    return;
  }

  if (deleteTarget.kind === "flight") {
    targetTrip.flights.splice(
      deleteTarget.itemIndex,
      1
    );
  }

  if (deleteTarget.kind === "hotel") {
    targetTrip.hotels.splice(
      deleteTarget.itemIndex,
      1
    );
  }

  if (deleteTarget.kind === "car") {
    targetTrip.cars.splice(
      deleteTarget.itemIndex,
      1
    );
  }

  if (deleteTarget.kind === "activity") {
    targetTrip.activities.splice(
      deleteTarget.itemIndex,
      1
    );
  }

  setTrips(updatedTrips);
  setDeleteTarget(null);
};

const getDeleteMessage = () => {
  if (!deleteTarget)
    return "";

  if (deleteTarget.kind === "trip") {
    return `Delete "${
      trips[deleteTarget.tripIndex]
        ?.name || "this trip"
    }"?`;
  }

  if (deleteTarget.kind === "flight") {
    return `Delete flight "${
      trips[deleteTarget.tripIndex]
        ?.flights[
          deleteTarget.itemIndex
        ]?.flightNumber ||
      "this flight"
    }"?`;
  }

  if (deleteTarget.kind === "hotel") {
    return `Delete hotel "${
      trips[deleteTarget.tripIndex]
        ?.hotels[
          deleteTarget.itemIndex
        ]?.name || "this hotel"
    }"?`;
  }

  if (deleteTarget.kind === "car") {
    return `Delete car rental "${
      trips[deleteTarget.tripIndex]
        ?.cars[
          deleteTarget.itemIndex
        ]?.vehicle ||
      trips[deleteTarget.tripIndex]
        ?.cars[
          deleteTarget.itemIndex
        ]?.company ||
      "this car rental"
    }"?`;
  }

  return `Delete activity "${
    trips[deleteTarget.tripIndex]
      ?.activities[
        deleteTarget.itemIndex
      ]?.name || "this activity"
  }"?`;
};

  if (!isSupabaseConfigured) {
    return <SupabaseSetupMissing />;
  }

  if (!isAuthReady) {
    return (
      <div
        style={{
          alignItems: "center",
          background: "#f4f7fb",
          display: "flex",
          justifyContent: "center",
          minHeight: "100vh",
        }}
      >
        Loading sign-in...
      </div>
    );
  }

  if (!session) {
    return <AuthScreen />;
  }

  return (
    <MfaGate
      onVerified={handleMfaVerified}
    >
    <div
      style={{
        padding: "20px",
        background: "#f4f7fb",
        minHeight: "100vh",
         lineHeight: "1.2",
      }}
    >
      <div
        style={{
          alignItems: "center",
          display: "flex",
          gap: "12px",
          justifyContent:
            "space-between",
          marginBottom: "16px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1
            style={{
              marginBottom: "6px",
            }}
          >
            🌎 Family Travel Hub
          </h1>
          <div
            style={{
              color:
                cloudStatus === "error"
                  ? "#b91c1c"
                  : cloudStatus === "cached"
                    ? "#b45309"
                  : "#475569",
              fontSize: "14px",
            }}
          >
            {cloudStatus === "loading" ||
            isTripsLoading
              ? "Loading shared trips..."
              : cloudStatus === "saving"
                ? "Saving shared trips..."
                : cloudStatus === "synced"
                  ? "Shared trips synced"
                  : cloudStatus === "cached"
                    ? "Showing saved trips; sync will retry"
                  : cloudStatus === "error"
                    ? cloudErrorMessage ||
                      "Sync error"
                    : "Offline"}
          </div>
        </div>

        <div
          style={{
            alignItems: "center",
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              color: "#475569",
              fontSize: "14px",
            }}
          >
            {session.user.email}
          </span>

          <button
            onClick={signOut}
          >
            Sign Out
          </button>
        </div>
      </div>
      <button
        onClick={() =>
          setShowTripModal(true)
        }
        style={{
          marginBottom: "20px",
          padding: "10px 16px",
          borderRadius: "8px",
          border: "none",
          background: "#2563eb",
          color: "white",
          cursor: "pointer",
       }}
      >
  ➕ New Trip
</button>

{trips.map((trip, index) => (
  <div
    key={trip.id || index}
    onClick={() => {
      if (
        selectedTripIndex === index
      ) {
        setSelectedTripIndex(null);
      } else {
        setSelectedTripIndex(index);
      }
    }}
    style={{
      cursor: "pointer",
    }}
  >
    <TripCard
      title={
        selectedTripIndex === index
          ? `▼ ${trip.name}`
          : `▶ ${trip.name}`
      }
      flights={trip.flights.length}
      hotels={trip.hotels?.length || 0}
      cars={trip.cars?.length || 0}
      activities={
        trip.activities?.length || 0
      }
    />

    {selectedTripIndex === index && (
      <div
        style={{
          background: "white",
          padding: "16px",
          borderRadius: "16px",
          marginTop: "10px",
          marginBottom: "20px",
          marginLeft: "20px",
          boxShadow:
            "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        

        <div
  style={{
    display: "flex",
    gap: "16px",
    marginBottom: "16px",
    flexWrap: "wrap",
  }}
>
          <button
  onClick={(e) => {
  e.stopPropagation();

  renameTrip(index);
}}
>
  ✏ Rename Trip
</button>

<button
  onClick={(e) => {
  e.stopPropagation();

    deleteTrip(index);
  }}
>
  🗑 Delete Trip
</button>
<button
  onClick={(e) => {
  e.stopPropagation();

  setEditingFlightIndex(null);

  setFlightNumber("");
  setFlightFrom("");
  setFlightTo("");
  setFlightDate("");
  setFlightDeparture("");
  setFlightArrival("");
  setFlightDuration("");
  setFlightAircraft("");
  setFlightCabin("");
  setFlightNotes("");

  setShowFlightForm(true);
}}
>
  ✈ Add Flight
</button>
<button
  onClick={(e) => {
    e.stopPropagation();

    setFlightImportText("");

    setShowFlightImportModal(
      true
    );
  }}
  style={{
    marginLeft: "10px",
  }}
>
  📋 Import Flight Details
</button>
<button
  onClick={(e) => {
    e.stopPropagation();

    clearHotelForm();

    setShowHotelForm(true);
  }}
  style={{
    marginLeft: "10px",
  }}
>
  🏨 Add Hotel
</button>
<button
  onClick={(e) => {
    e.stopPropagation();

    setHotelImportText("");

    setShowHotelImportModal(
      true
    );
  }}
  style={{
    marginLeft: "10px",
  }}
>
  📋 Import Hotel Details
</button>
<button
  onClick={(e) => {
    e.stopPropagation();

    clearCarForm();

    setShowCarForm(true);
  }}
  style={{
    marginLeft: "10px",
  }}
>
  🚗 Add Car
</button>
<button
  onClick={(e) => {
    e.stopPropagation();

    setCarImportText("");

    setShowCarImportModal(
      true
    );
  }}
  style={{
    marginLeft: "10px",
  }}
>
  📋 Import Car Details
</button>
<button
  onClick={(e) => {
    e.stopPropagation();

    setEditingActivityIndex(
      null
    );

    setActivityName("");
    setActivityDate("");
    setActivityTime("");
    setActivityLocation("");
    setActivityPaid(false);
    setActivityNotes("");

    setShowActivityForm(true);
  }}
  style={{
    marginLeft: "10px",
  }}
>
  🎟 Add Activity
</button>
<button
  onClick={(e) => {
    e.stopPropagation();

    setActivityImportText("");

    setShowActivityImportModal(
      true
    );
  }}
  style={{
    marginLeft: "10px",
  }}
>
  📋 Import Activity Details
</button>




</div>
        {showActivityForm && (
  <Modal
    title={
  editingActivityIndex !== null
    ? "Edit Activity"
    : "Add Activity"
}
    onClose={() =>
      setShowActivityForm(false)
    }
  >
    
    

    <div
  style={{
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    maxWidth: "500px",
  }}
>
  <input
    placeholder="Activity Name"
    value={activityName}
    onChange={(e) =>
      setActivityName(
        e.target.value
      )
    }
  />

  <div
    style={{
      display: "flex",
      gap: "12px",
    }}
  >
    <input
      placeholder="Date"
      value={activityDate}
      onChange={(e) =>
        setActivityDate(
          e.target.value
        )
      }
      style={{
        width: "150px",
      }}
    />

    <input
      placeholder="Time"
      value={activityTime}
      onChange={(e) =>
        setActivityTime(
          e.target.value
        )
      }
      style={{
        width: "150px",
      }}
    />
  </div>

  <input
    placeholder="Location"
    value={activityLocation}
    onChange={(e) =>
      setActivityLocation(
        e.target.value
      )
    }
  />

  <textarea
    rows={3}
    placeholder="Notes"
    value={activityNotes}
    onChange={(e) =>
      setActivityNotes(
        e.target.value
      )
    }
  />
</div>

<div
  style={{
    marginTop: "10px",
  }}
>
  <label>
    <input
      type="checkbox"
      checked={activityPaid}
      onChange={(e) =>
        setActivityPaid(
          e.target.checked
        )
      }
    />
    {" "}
    Paid Activity
  </label>
</div>
<div
  style={{
    display: "flex",
    gap: "10px",
    marginTop: "10px",
  }}
>
  <button
    onClick={(e) => {
      e.stopPropagation();
      saveActivity();
    }}
  >
    Save Activity
  </button>

  <button
        onClick={(e) => {
      e.stopPropagation();
      setShowActivityForm(false);
    }}
  >
    Cancel
  </button>
</div>

        

    
  </Modal>
)}
{showFlightForm && (
  <Modal
    title={
      editingFlightIndex !== null
        ? "Edit Flight"
        : "Add Flight"
    }
    onClose={() =>
      setShowFlightForm(false)
    }
  >
    

   <div
  style={{
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    maxWidth: "600px",
  }}
>
  <input
    placeholder="Flight Number"
    value={flightNumber}
    onChange={(e) =>
      setFlightNumber(
        e.target.value
      )
    }
  />

  <div
    style={{
      display: "flex",
      gap: "12px",
    }}
  >
    <input
      placeholder="From"
      value={flightFrom}
      onChange={(e) =>
        setFlightFrom(
          e.target.value
        )
      }
      style={{
        width: "120px",
      }}
    />

    <input
      placeholder="To"
      value={flightTo}
      onChange={(e) =>
        setFlightTo(
          e.target.value
        )
      }
      style={{
        width: "120px",
      }}
    />
  </div>

  <div
    style={{
      display: "flex",
      gap: "12px",
    }}
  >
    <input
      placeholder="Date"
      value={flightDate}
      onChange={(e) =>
        setFlightDate(
          e.target.value
        )
      }
      style={{
        width: "160px",
      }}
    />

    <input
      placeholder="Departure"
      value={flightDeparture}
      onChange={(e) =>
        setFlightDeparture(
          e.target.value
        )
      }
      style={{
        width: "160px",
      }}
    />

    <input
      placeholder="Arrival"
      value={flightArrival}
      onChange={(e) =>
        setFlightArrival(
          e.target.value
        )
      }
      style={{
        width: "160px",
      }}
    />
  </div>

  <input
    placeholder="Duration"
    value={flightDuration}
    onChange={(e) =>
      setFlightDuration(
        e.target.value
      )
    }
    style={{
      width: "160px",
    }}
  />

  <input
    placeholder="Aircraft"
    value={flightAircraft}
    onChange={(e) =>
      setFlightAircraft(
        e.target.value
      )
    }
  />

  <input
    placeholder="Cabin"
    value={flightCabin}
    onChange={(e) =>
      setFlightCabin(
        e.target.value
      )
    }
  />

  <textarea
    placeholder="Notes"
    value={flightNotes}
    onChange={(e) =>
      setFlightNotes(
        e.target.value
      )
    }
    rows={4}
    style={{
      resize: "vertical",
    }}
  />
</div>
<br />
<br />
    <button
  onClick={(e) => {
    e.stopPropagation();
    saveFlight();
  }}
>
  Save Flight
</button>

    <button
      onClick={(e) => {
        e.stopPropagation();
        setEditingFlightIndex(
          null
        );
        setShowFlightForm(false);
      }}
      style={{
        marginLeft: "10px",
      }}
    >
      Cancel
    </button>
    
  </Modal>
)}
{showHotelForm && (
  <Modal
    title={
      editingHotelIndex !== null
        ? "Edit Hotel"
        : "Add Hotel"
    }
    onClose={() =>
      setShowHotelForm(false)
    }
  >
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        maxWidth: "600px",
      }}
    >
      <input
        placeholder="Hotel Name"
        value={hotelName}
        onChange={(e) =>
          setHotelName(
            e.target.value
          )
        }
      />

      <input
        placeholder="Address"
        value={hotelAddress}
        onChange={(e) =>
          setHotelAddress(
            e.target.value
          )
        }
      />

      <input
        placeholder="Phone"
        value={hotelPhone}
        onChange={(e) =>
          setHotelPhone(
            e.target.value
          )
        }
      />

	      <div
	        style={{
	          display: "flex",
	          flexDirection: "column",
	          gap: "12px",
	        }}
	      >
	        <div
	          style={{
	            display: "grid",
	            gap: "12px",
	            gridTemplateColumns:
	              "minmax(0, 1fr) 150px",
	          }}
	        >
	          <input
	            placeholder="Check-in"
	            value={hotelCheckIn}
	            onChange={(e) =>
	              setHotelCheckIn(
	                e.target.value
	              )
	            }
	            style={{
	              minWidth: 0,
	            }}
	          />

	          <input
	            placeholder="Check-in Time"
	            value={hotelCheckInTime}
	            onChange={(e) =>
	              setHotelCheckInTime(
	                e.target.value
	              )
	            }
	            style={{
	              minWidth: 0,
	            }}
	          />
	        </div>

	        <div
	          style={{
	            display: "grid",
	            gap: "12px",
	            gridTemplateColumns:
	              "minmax(0, 1fr) 150px",
	          }}
	        >
	          <input
	            placeholder="Check-out"
	            value={hotelCheckOut}
	            onChange={(e) =>
	              setHotelCheckOut(
	                e.target.value
	              )
	            }
	            style={{
	              minWidth: 0,
	            }}
	          />

	          <input
	            placeholder="Check-out Time"
	            value={hotelCheckOutTime}
	            onChange={(e) =>
	              setHotelCheckOutTime(
	                e.target.value
	              )
	            }
	            style={{
	              minWidth: 0,
	            }}
	          />
	        </div>
	      </div>

      <textarea
        rows={3}
        placeholder="Hotel Notes"
        value={hotelNotes}
        onChange={(e) =>
          setHotelNotes(
            e.target.value
          )
        }
      />
    </div>

    <br />

    <button
      onClick={(e) => {
        e.stopPropagation();
        saveHotel();
      }}
    >
      Save Hotel
    </button>

    <button
      onClick={(e) => {
        e.stopPropagation();
        setEditingHotelIndex(null);
        setShowHotelForm(false);
      }}
      style={{
        marginLeft: "10px",
      }}
    >
      Cancel
    </button>
  </Modal>
)}
{showCarForm && (
  <Modal
    title={
      editingCarIndex !== null
        ? "Edit Car Rental"
        : "Add Car Rental"
    }
    onClose={() =>
      setShowCarForm(false)
    }
  >
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        maxWidth: "650px",
      }}
    >
      <input
        placeholder="Rental Company"
        value={carCompany}
        onChange={(e) =>
          setCarCompany(
            e.target.value
          )
        }
      />

      <div
        style={{
          display: "grid",
          gap: "12px",
          gridTemplateColumns:
            "minmax(0, 1fr) minmax(0, 1fr)",
        }}
      >
        <input
          placeholder="Vehicle Type"
          value={carVehicleType}
          onChange={(e) =>
            setCarVehicleType(
              e.target.value
            )
          }
          style={{
            minWidth: 0,
          }}
        />

        <input
          placeholder="Vehicle"
          value={carVehicle}
          onChange={(e) =>
            setCarVehicle(
              e.target.value
            )
          }
          style={{
            minWidth: 0,
          }}
        />
      </div>

      <input
        placeholder="Pick-up Location"
        value={carPickupLocation}
        onChange={(e) =>
          setCarPickupLocation(
            e.target.value
          )
        }
      />

      <div
        style={{
          display: "grid",
          gap: "12px",
          gridTemplateColumns:
            "minmax(0, 1fr) 150px",
        }}
      >
        <input
          placeholder="Pick-up Date"
          value={carPickupDate}
          onChange={(e) =>
            setCarPickupDate(
              e.target.value
            )
          }
          style={{
            minWidth: 0,
          }}
        />

        <input
          placeholder="Pick-up Time"
          value={carPickupTime}
          onChange={(e) =>
            setCarPickupTime(
              e.target.value
            )
          }
          style={{
            minWidth: 0,
          }}
        />
      </div>

      <input
        placeholder="Drop-off Location"
        value={carReturnLocation}
        onChange={(e) =>
          setCarReturnLocation(
            e.target.value
          )
        }
      />

      <div
        style={{
          display: "grid",
          gap: "12px",
          gridTemplateColumns:
            "minmax(0, 1fr) 150px",
        }}
      >
        <input
          placeholder="Drop-off Date"
          value={carReturnDate}
          onChange={(e) =>
            setCarReturnDate(
              e.target.value
            )
          }
          style={{
            minWidth: 0,
          }}
        />

        <input
          placeholder="Drop-off Time"
          value={carReturnTime}
          onChange={(e) =>
            setCarReturnTime(
              e.target.value
            )
          }
          style={{
            minWidth: 0,
          }}
        />
      </div>

      <textarea
        rows={3}
        placeholder="Car Notes"
        value={carNotes}
        onChange={(e) =>
          setCarNotes(
            e.target.value
          )
        }
      />
    </div>

    <br />

    <button
      onClick={(e) => {
        e.stopPropagation();
        saveCar();
      }}
    >
      Save Car
    </button>

    <button
      onClick={(e) => {
        e.stopPropagation();
        setEditingCarIndex(null);
        setShowCarForm(false);
      }}
      style={{
        marginLeft: "10px",
      }}
    >
      Cancel
    </button>
  </Modal>
)}
<h3>✈ Flights</h3>

{trip.flights?.length ? (
  trip.flights.map(
    (flight, flightIndex) => (
      <FlightCard
        key={flightIndex}
        flight={flight}
        onDelete={() =>
          deleteFlight(
            flightIndex
          )
        }
        onEdit={() =>
          editFlight(
            flightIndex
          )
        }
      />
    )
  )
) : (
  <p>No flights added yet.</p>
)}
<h3>🏨 Hotels</h3>

{trip.hotels?.length ? (
  trip.hotels.map(
    (hotel, hotelIndex) => (
      <HotelCard
        key={hotelIndex}
        hotel={hotel}
        onDelete={() =>
          deleteHotel(
            hotelIndex
          )
        }
        onEdit={() =>
          editHotel(
            hotelIndex
          )
        }
      />
    )
  )
) : (
  <p>No hotels added yet.</p>
)}
<h3>🚗 Cars</h3>

{trip.cars?.length ? (
  trip.cars.map(
    (car, carIndex) => (
      <CarCard
        key={carIndex}
        car={car}
        onDelete={() =>
          deleteCar(carIndex)
        }
        onEdit={() =>
          editCar(carIndex)
        }
      />
    )
  )
) : (
  <p>No cars added yet.</p>
)}
<h3>
  🎟 Planned Activities (
  {trip.activities?.length || 0}
  )
</h3>

{trip.activities?.length ? (
  trip.activities.map(
    (
      activity,
      activityIndex
    ) => (
      <ActivityCard
        key={activityIndex}
        activity={activity}
        onDelete={() =>
          deleteActivity(
            activityIndex
          )
        }
        onEdit={() =>
          editActivity(
            activityIndex
          )
        }
      />
    )
  )
) : (
  <p>
    No activities added yet.
  </p>
)}
      </div>
    )}
  </div>
))}
{showTripModal && (
  <Modal
    title="Create Trip"
    onClose={() =>
      setShowTripModal(false)
    }
  >
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        minWidth: "400px",
      }}
    >
      <input
        placeholder="Trip Name"
        value={newTripName}
        onChange={(e) =>
          setNewTripName(
            e.target.value
          )
        }
      />

      <input
        placeholder="Destination (optional)"
        value={
          newTripDestination
        }
        onChange={(e) =>
          setNewTripDestination(
            e.target.value
          )
        }
      />

      <div
        style={{
          display: "flex",
          gap: "10px",
        }}
      >
        <button
          onClick={() => {
            if (
              !newTripName.trim()
            )
              return;

            const trip: Trip = {
              name: newTripName,

              destinationCity:
                newTripDestination,

              flights: [],

              hotels: [],

              cars: [],

              activities: [],
            };

            setTrips([
              ...trips,
              trip,
            ]);

            setNewTripName("");
            setNewTripDestination(
              ""
            );

            setShowTripModal(
              false
            );
          }}
        >
          Create Trip
        </button>

        <button
          onClick={() =>
            setShowTripModal(false)
          }
        >
          Cancel
        </button>
      </div>
    </div>
  </Modal>
)}
{renameTripIndex !== null && (
  <Modal
    title="Rename Trip"
    onClose={() => {
      setRenameTripIndex(null);
      setRenameTripName("");
    }}
  >
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        minWidth: "400px",
      }}
    >
      <input
        placeholder="Trip Name"
        value={renameTripName}
        onChange={(e) =>
          setRenameTripName(
            e.target.value
          )
        }
      />

      <div
        style={{
          display: "flex",
          gap: "10px",
        }}
      >
        <button
          onClick={() => {
            if (
              !renameTripName.trim()
            )
              return;

            const updatedTrips =
              [...trips];

            updatedTrips[
              renameTripIndex
            ] = {
              ...updatedTrips[
                renameTripIndex
              ],
              name: renameTripName,
            };

            setTrips(updatedTrips);
            setRenameTripIndex(null);
            setRenameTripName("");
          }}
        >
          Save Name
        </button>

        <button
          onClick={() => {
            setRenameTripIndex(null);
            setRenameTripName("");
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  </Modal>
)}
{deleteTarget && (
  <Modal
    title="Confirm Delete"
    onClose={() =>
      setDeleteTarget(null)
    }
  >
    <p>{getDeleteMessage()}</p>

    <div
      style={{
        display: "flex",
        gap: "10px",
        marginTop: "16px",
      }}
    >
      <button
        onClick={confirmDelete}
        style={{
          background: "#dc2626",
          color: "white",
        }}
      >
        Delete
      </button>

      <button
        onClick={() =>
          setDeleteTarget(null)
        }
      >
        Cancel
      </button>
    </div>
  </Modal>
)}
{showFlightImportModal && (
  <Modal
    title="Import Flight Details"
    onClose={() =>
      setShowFlightImportModal(
        false
      )
    }
  >
    <p>
      Copy and paste your
      reservation or itinerary
      details below.
    </p>

    <textarea
      rows={12}
      value={flightImportText}
      onChange={(e) =>
        setFlightImportText(
          e.target.value
        )
      }
      style={{
        width: "100%",
      }}
    />

    <div
      style={{
        marginTop: "16px",
      }}
    >
      <button
         onClick={() =>
           importFlightDetails()
         }
         >
        Parse Flight
      </button>

      <button
        onClick={() =>
          setShowFlightImportModal(
            false
          )
        }
        style={{
          marginLeft: "10px",
        }}
      >
        Cancel
      </button>
    </div>
  </Modal>
)}
{showHotelImportModal && (
  <Modal
    title="Import Hotel Details"
    onClose={() =>
      setShowHotelImportModal(
        false
      )
    }
  >
    <p>
      Copy and paste your hotel
      reservation details below.
    </p>

    <textarea
      rows={12}
      value={hotelImportText}
      onChange={(e) =>
        setHotelImportText(
          e.target.value
        )
      }
      style={{
        width: "100%",
      }}
    />

    <div
      style={{
        marginTop: "16px",
      }}
    >
      <button
        onClick={() =>
          importHotelDetails()
        }
      >
        Parse Hotel
      </button>

      <button
        onClick={() =>
          setShowHotelImportModal(
            false
          )
        }
        style={{
          marginLeft: "10px",
        }}
      >
        Cancel
      </button>
    </div>
  </Modal>
)}
{showCarImportModal && (
  <Modal
    title="Import Car Details"
    onClose={() =>
      setShowCarImportModal(
        false
      )
    }
  >
    <p>
      Copy and paste your car rental
      reservation details below.
    </p>

    <textarea
      rows={12}
      value={carImportText}
      onChange={(e) =>
        setCarImportText(
          e.target.value
        )
      }
      style={{
        width: "100%",
      }}
    />

    <div
      style={{
        marginTop: "16px",
      }}
    >
      <button
        onClick={() =>
          importCarDetails()
        }
      >
        Parse Car
      </button>

      <button
        onClick={() =>
          setShowCarImportModal(
            false
          )
        }
        style={{
          marginLeft: "10px",
        }}
      >
        Cancel
      </button>
    </div>
  </Modal>
)}
{showActivityImportModal && (
  <Modal
    title="Import Activity Details"
    onClose={() =>
      setShowActivityImportModal(
        false
      )
    }
  >
    <p>
      Copy and paste your activity
      reservation or voucher details
      below.
    </p>

    <textarea
      rows={12}
      value={activityImportText}
      onChange={(e) =>
        setActivityImportText(
          e.target.value
        )
      }
      style={{
        width: "100%",
      }}
    />

    <div
      style={{
        marginTop: "16px",
      }}
    >
      <button
        onClick={() =>
          importActivityDetails()
        }
      >
        Parse Activity
      </button>

      <button
        onClick={() =>
          setShowActivityImportModal(
            false
          )
        }
        style={{
          marginLeft: "10px",
        }}
      >
        Cancel
      </button>
    </div>
  </Modal>
)}
    </div>
    </MfaGate>
  );
  
}
export default App;
