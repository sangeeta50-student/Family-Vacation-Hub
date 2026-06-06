import type { CarRental } from "../types/Trip";

type Props = {
  car: CarRental;

  onDelete: () => void;

  onEdit: () => void;
};

function CarCard({
  car,
  onDelete,
  onEdit,
}: Props) {
  const title =
    car.company ||
    car.vehicle ||
    car.vehicleType ||
    "Car Rental";

  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: "12px",
        padding: "12px",
        marginBottom: "12px",
      }}
    >
      <h3>🚗 {title}</h3>

      {car.vehicleType && (
        <p>🚙 {car.vehicleType}</p>
      )}

      {car.vehicle &&
        car.vehicle !== title && (
          <p>🚘 {car.vehicle}</p>
        )}

      {car.pickupLocation && (
        <p>
          📍 Pick-up:{" "}
          {car.pickupLocation}
        </p>
      )}

      {car.returnLocation && (
        <p>
          ↩ Drop-off:{" "}
          {car.returnLocation}
        </p>
      )}

      {(car.pickupDate ||
        car.returnDate) && (
        <p>
          📅{" "}
          {car.pickupDate ||
            "Pick-up date TBD"}
          {" → "}
          {car.returnDate ||
            "Drop-off date TBD"}
        </p>
      )}

      {(car.pickupTime ||
        car.returnTime) && (
        <p>
          🕒{" "}
          {car.pickupTime ||
            "Pick-up time TBD"}
          {" → "}
          {car.returnTime ||
            "Drop-off time TBD"}
        </p>
      )}

      {car.confirmationNumber && (
        <p>
          🔖 {car.confirmationNumber}
        </p>
      )}

      {car.notes && (
        <div
          style={{
            marginTop: "10px",
            padding: "10px",
            borderRadius: "8px",
            background: "#f8fafc",
          }}
        >
          <strong>📝 Notes</strong>

          <p
            style={{
              marginBottom: 0,
              whiteSpace: "pre-wrap",
            }}
          >
            {car.notes}
          </p>
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
        ✏ Edit Car
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
        🗑 Delete Car
      </button>
    </div>
  );
}

export default CarCard;
