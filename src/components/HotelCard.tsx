import type { Hotel } from "../types/Trip";

type Props = {
  hotel: Hotel;

  onDelete: () => void;

  onEdit: () => void;
};

function HotelCard({
  hotel,
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
      <h3>🏨 {hotel.name}</h3>

      {hotel.address && (
        <p>📍 {hotel.address}</p>
      )}

      {hotel.phone && (
        <p>☎ {hotel.phone}</p>
      )}

      {(hotel.checkInDate ||
        hotel.checkInTime ||
        hotel.checkOutDate ||
        hotel.checkOutTime) && (
        <p>
          📅 {hotel.checkInDate || "Check-in TBD"}
          {hotel.checkInTime &&
            ` at ${hotel.checkInTime}`}
          {" → "}
          {hotel.checkOutDate ||
            "Check-out TBD"}
          {hotel.checkOutTime &&
            ` at ${hotel.checkOutTime}`}
        </p>
      )}

      {hotel.notes && (
        <p>📝 {hotel.notes}</p>
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
        ✏ Edit Hotel
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
        🗑 Delete Hotel
      </button>
    </div>
  );
}

export default HotelCard;
