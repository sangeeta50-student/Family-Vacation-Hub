import {
  useState,
  useEffect,
} from "react";
import TripCard from "./components/TripCard";

import FlightCard from "./components/FlightCard";

import {
  parseFlights,
  parseDestinationCity,
} from "./parsers/flightParser";

import type { Flight } from "./types/Flight";

import type { Trip } from "./types/Trip";

function App() {
  const [flights, setFlights] =
  useState<Flight[]>([]);

  const [trips, setTrips] =
  useState<Trip[]>(() => {
    const savedTrips =
      localStorage.getItem("trips");

    return savedTrips
      ? JSON.parse(savedTrips)
      : [];
  });

  const [selectedTripIndex, setSelectedTripIndex] =
  useState<number | null>(null);

  const [reservationText, setReservationText] = useState("");

  const [preview, setPreview] = useState(
  "No reservation parsed yet.");

  const renameTrip = (
  tripIndex: number
) => {
  const newName = prompt(
    "Enter new trip name:"
  );

  if (!newName) return;

  const updatedTrips = [...trips];

  updatedTrips[tripIndex] = {
    ...updatedTrips[tripIndex],
    name: newName,
  };

  setTrips(updatedTrips);
};
const deleteTrip = (
  tripIndex: number
) => {
  const confirmed = window.confirm(
    "Delete this trip?"
  );

  if (!confirmed) return;

  const updatedTrips =
    trips.filter(
      (_, index) =>
        index !== tripIndex
    );

  setTrips(updatedTrips);

  setSelectedTripIndex(null);
};
useEffect(() => {
  localStorage.setItem(
    "trips",
    JSON.stringify(trips)
  );
}, [trips]);

  return (
    <div
      style={{
        padding: "20px",
        background: "#f4f7fb",
        minHeight: "100vh",
         lineHeight: "1.2",
      }}
    >
      <h1>🌎 Family Travel Hub</h1>
<div
  style={{
    background: "white",
    padding: "16px",
    borderRadius: "16px",
    marginBottom: "20px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  }}
>
  <h2>📥 Import Reservation</h2>

<textarea
  value={reservationText}
  onChange={(e) => setReservationText(e.target.value)}
  placeholder="Paste airline, hotel, or rental car reservation here..."
  rows={8}
  style={{
    width: "100%",
    padding: "12px",
    boxSizing: "border-box",
  }}
/>


<button
  onClick={() => {
    const parsedFlights =
  parseFlights(reservationText);

setFlights(parsedFlights);

setPreview(
  `${parsedFlights.length} flight(s) found`
);}}
  style={{
    marginTop: "12px",
    padding: "10px 16px",
    borderRadius: "8px",
    border: "none",
    background: "#0ea5e9",
    color: "white",
    cursor: "pointer",
  }}
>
  Parse Reservation
</button> 
<button
  onClick={() => {
  if (flights.length === 0) return;

  const destinationCity =
    parseDestinationCity(
      reservationText
    );

  const newTrip: Trip = {
    name:
      destinationCity
        ? `Trip to ${destinationCity}`
        : "Imported Trip",

    flights,
  };

  setTrips([...trips, newTrip]);

  setFlights([]);

  setPreview(
    "Trip saved successfully."
  );
}}
  style={{
    marginLeft: "10px",
    padding: "10px 16px",
    borderRadius: "8px",
    border: "none",
    background: "#16a34a",
    color: "white",
    cursor: "pointer",
  }}
>
  Save Trip
</button>
  <div
  style={{
    marginTop: "20px",
    padding: "16px",
    background: "#f8fafc",
    borderRadius: "12px",
    border: "1px solid #ddd",
  }}
>
  <h3>Preview</h3>

  <div>
  <p>{preview}</p>

  {flights.map((flight, index) => (
    <FlightCard
      key={index}
      flight={flight}
    />
  ))}
</div>
</div>
</div>
{trips.map((trip, index) => (
  <div
    key={index}
   onClick={() => {
  if (selectedTripIndex === index) {
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
      hotels={0}
      cars={0}
    />
  </div>
))}
{selectedTripIndex !== null && (
  <div
    style={{
      background: "white",
      padding: "16px",
      borderRadius: "16px",
      marginTop: "20px",
      boxShadow:
        "0 2px 8px rgba(0,0,0,0.1)",
    }}
  >
    <h2>
      {trips[selectedTripIndex].name}
    </h2>
    <button
  onClick={() =>
    renameTrip(
      selectedTripIndex
    )
  }
  style={{
    marginBottom: "16px",
    padding: "8px 12px",
    borderRadius: "8px",
    border: "none",
    background: "#2563eb",
    color: "white",
    cursor: "pointer",
  }}
>
  ✏ Rename Trip
</button>
<button
  onClick={() =>
    deleteTrip(
      selectedTripIndex
    )
  }
  style={{
    marginLeft: "10px",
    marginBottom: "16px",
    padding: "8px 12px",
    borderRadius: "8px",
    border: "none",
    background: "#dc2626",
    color: "white",
    cursor: "pointer",
  }}
>
  🗑 Delete Trip
</button>

    {trips[selectedTripIndex].flights.map(
      (flight, index) => (
        <FlightCard
          key={index}
          flight={flight}
        />
      )
    )}
  </div>
)}
    </div>
  );
}

export default App;