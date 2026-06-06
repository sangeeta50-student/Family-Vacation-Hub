type TripCardProps = {
  title: string;
  flights: number;
  hotels: number;
  cars: number;
  activities?: number;
};

function TripCard({
  title,
  flights,
  hotels,
  cars,
  activities,
}: TripCardProps) {
  return (
    <div
      style={{
        background: "white",
        borderRadius: "16px",
        padding: "10px",
        marginBottom: "16px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
       
      }}
    >
      <h2>{title}</h2>

      <div
  style={{
    display: "flex",
    gap: "24px",
    flexWrap: "wrap",
    marginTop: "8px",
  }}
>
  <span>
    ✈ {flights} Flight
    {flights !== 1 ? "s" : ""}
  </span>

  <span>
    🏨 {hotels} Hotel
    {hotels !== 1 ? "s" : ""}
  </span>

  <span>
    🚗 {cars} Car
    {cars !== 1 ? "s" : ""}
  </span>

  <span>
    🎟 {activities} Activit
    {activities !== 1 ? "ies" : "y"}
  </span>
</div>
    </div>
  );
}

export default TripCard;