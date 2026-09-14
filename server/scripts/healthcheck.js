/**
 * Health check script for Render.
 * Exits 0 if /health returns 200, 1 otherwise.
 */
const url = `http://localhost:${process.env.PORT || 4000}/health`;

try {
  const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (res.ok) {
    console.log('Health check passed');
    process.exit(0);
  } else {
    console.error(`Health check failed: ${res.status}`);
    process.exit(1);
  }
} catch (err) {
  console.error(`Health check error: ${err.message}`);
  process.exit(1);
}
