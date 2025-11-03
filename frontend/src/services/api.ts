export async function fetchStandings() {
    const res = await fetch('/standings/'); // proxied to :8000
    if (!res.ok) throw new Error(`Failed to fetch standings: ${res.status}`);
    return await res.json();
  }
  