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

{flight.notes && (
  <div
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
