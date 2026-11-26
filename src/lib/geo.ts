/** Where an entry was made: the phone's position and its distance from the site pin. */

export type Fix = { lat: number; lng: number; accuracy: number };

/** Ask the phone for its position; resolves null if refused, unavailable or slow (8 s). */
export function getFix(): Promise<Fix | null> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (p) =>
        resolve({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 },
    );
  });
}

/** Metres between two points (haversine). */
export function distanceM(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Within this distance of the site pin (plus the phone's own accuracy) counts as on site. */
export const ON_SITE_M = 300;

export function geoLabel(distance: number | null | undefined) {
  if (distance === null || distance === undefined) return null;
  return distance <= ON_SITE_M
    ? { tone: "emerald" as const, text: `On site · ${Math.round(distance)} m` }
    : {
        tone: "amber" as const,
        text: `${distance >= 1000 ? `${(distance / 1000).toFixed(1)} km` : `${Math.round(distance)} m`} from site`,
      };
}
