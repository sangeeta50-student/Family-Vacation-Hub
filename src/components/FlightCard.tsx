import type { Flight } from "../types/Flight";

type Props = {
  flight: Flight;
};

function FlightCard({ flight }: Props) {
  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: "12px",
        padding: "12px",
        marginBottom: "12px",
      }}
    >
      <h3>✈ {flight.flightNumber}</h3>
      {flight.date && (
  <p>
    📅 {flight.date}
  </p>
)}

      <p>
        {flight.from} → {flight.to}
      </p>

      {flight.departureTime &&
        flight.arrivalTime && (
          <p>
            🕒 {flight.departureTime}
            {" → "}
            {flight.arrivalTime}
          </p>
        )}

      {flight.duration && (
        <p>
          ⏱ {flight.duration}
        </p>
      )}
      {flight.aircraft && (
  <p>
    ✈ {flight.aircraft}
  </p>
)}

{flight.cabin && (
  <p>
    💺 {flight.cabin}
  </p>
)}
    </div>
  );
}

export default FlightCard;