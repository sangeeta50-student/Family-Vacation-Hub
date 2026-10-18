import type { Flight } from "../types/Flight";

type Props = {
  flight: Flight;

  onDelete: () => void;

  onEdit: () => void;
};

function FlightCard({
  flight,
  onDelete,
  onEdit,
}: Props) {
  return (
    <div
      className="info-card"
      style={{
        border: "1px solid #ddd",
        borderRadius: "12px",
        padding: "12px",
        marginBottom: "12px",
      }}
    >
      <h3>✈ {flight.flightNumber}</h3>
      <p>
        {flight.from} → {flight.to}
      </p>

      {(flight.date || flight.departureTime) && (
        <p>
          <strong>Departure:</strong>{" "}
          {[flight.date, flight.departureTime]
            .filter(Boolean)
            .join(" at ")}
        </p>
      )}

      {(flight.arrivalDate || flight.arrivalTime) && (
        <p>
          <strong>Arrival:</strong>{" "}
          {[flight.arrivalDate, flight.arrivalTime]
            .filter(Boolean)
            .join(" at ")}
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

{flight.notes && (
  <div
    className="notes-block"
    style={{
      background: "#f8fafc",
      borderLeft:
        "3px solid #2563eb",
      marginTop: "10px",
      padding: "8px 10px",
      whiteSpace: "pre-wrap",
    }}
  >
    <strong>Notes</strong>
    <div>{flight.notes}</div>
  </div>
)}
<button
  onClick={(e) => {
    e.stopPropagation();

    onEdit();
  }}
  style={{
    marginTop: "10px",
    marginRight: "10px",
    padding: "6px 10px",
    borderRadius: "8px",
    border: "none",
    background: "#2563eb",
    color: "white",
    cursor: "pointer",
  }}
>
  ✏ Edit Flight
</button>
<button
  onClick={(e) => {
    e.stopPropagation();

    onDelete();
  }}
  style={{
    marginTop: "10px",
    padding: "6px 10px",
    borderRadius: "8px",
    border: "none",
    background: "#dc2626",
    color: "white",
    cursor: "pointer",
  }}
>
  🗑 Delete Flight
</button>
    </div>
  );
}

export default FlightCard;
