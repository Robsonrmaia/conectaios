/**
 * Public probe page to test if preview is accessible without authentication
 */

export default function PublicProbe() {
  return (
    <div style={{ padding: 20 }}>
      <h1>OK público</h1>
      <p>Base URL: {import.meta.env.VITE_PUBLIC_SITE_URL || "sem VITE_PUBLIC_SITE_URL"}</p>
      <p>Current origin: {window.location.origin}</p>
      <p>Timestamp: {new Date().toISOString()}</p>
    </div>
  );
}