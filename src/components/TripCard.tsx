type TripCardProps = {
  title: string;
  flights: number;
  hotels: number;
  cars: number;
};

function TripCard({
  title,
  flights,
  hotels,
  cars,
}: TripCardProps) {
  return (
    <div
      style={{
        background: "white",
        borderRadius: "16px",
        padding: "12px",
        marginBottom: "16px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
       
      }}
    >
      <h2>{title}</h2>

      <p>✈ Flights: {flights}</p>

      <p>🏨 Hotels: {hotels}</p>

      <p>🚗 Cars: {cars}</p>
    </div>
  );
}

export default TripCard;