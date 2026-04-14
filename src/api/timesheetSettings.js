const DEFAULT_SETTINGS = {
  hotel_name: "Stundennachweis fuer Hotel Barcelo, Hamburg",
  verhaltnis: 1,
};

const apiBase = (import.meta.env.VITE_API_BASE || "").replace(/\/$/, "");

export async function fetchTimesheetSettings() {
  const url = `${apiBase}/api/settings/`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Settings request failed: ${response.status}`);
  }
  const data = await response.json();
  const rawRatio = data.verhaltnis;
  const verhaltnis =
    typeof rawRatio === "number" && Number.isFinite(rawRatio)
      ? rawRatio
      : Number.parseFloat(String(rawRatio ?? "").replace(",", "."));
  return {
    hotel_name:
      typeof data.hotel_name === "string"
        ? data.hotel_name
        : DEFAULT_SETTINGS.hotel_name,
    verhaltnis: Number.isFinite(verhaltnis)
      ? verhaltnis
      : DEFAULT_SETTINGS.verhaltnis,
  };
}

export function getDefaultTimesheetSettings() {
  return { ...DEFAULT_SETTINGS };
}
