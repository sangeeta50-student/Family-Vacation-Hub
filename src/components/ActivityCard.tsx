import type { Activity } from "../types/Activity";

type Props = {
  activity: Activity;

  onDelete: () => void;

  onEdit: () => void;
};

function ActivityCard({
  activity,
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
      <h3>🎟 {activity.name}</h3>

      {activity.date && (
        <p>📅 {activity.date}</p>
      )}

      {activity.time && (
        <p>🕒 {activity.time}</p>
      )}

      {activity.location && (
        <p>📍 {activity.location}</p>
      )}

      {typeof activity.paid ===
        "boolean" && (
        <p>
          {activity.paid
            ? "💰 Paid"
            : "💸 Not Paid"}
        </p>
      )}

      {activity.notes && (
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
            {activity.notes}
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
        ✏ Edit Activity
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
        🗑 Delete Activity
      </button>
    </div>
  );
}

export default ActivityCard;
