function SupabaseSetupMissing() {
  return (
    <div
      style={{
        background: "#f4f7fb",
        minHeight: "100vh",
        padding: "24px",
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: "12px",
          boxShadow:
            "0 2px 8px rgba(0,0,0,0.1)",
          margin: "0 auto",
          maxWidth: "720px",
          padding: "24px",
        }}
      >
        <h1>
          Supabase setup needed
        </h1>
        <p>
          Add these environment
          variables before using the
          shared family version:
        </p>
        <pre
          style={{
            overflowX: "auto",
          }}
        >
          {`VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_SUPABASE_FAMILY_ID=...`}
        </pre>
      </div>
    </div>
  );
}

export default SupabaseSetupMissing;
