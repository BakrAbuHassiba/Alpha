const apiBase = (import.meta.env.VITE_API_BASE || "").replace(/\/$/, "");

export const getDefaultHousekeepingLogSettings = () => ({
  hotel_name: "Barcelo Hamburg, Ferdinandstrasse 15 in 20095 Hamburg",
  label_tag: "Tag",
  label_uhrzeit_von: "Uhrzeit von",
  label_uhrzeit_bis: "Uhrzeit bis",
  label_housekeeping_double: "Housekeeping Doppelzimmer|mit Check / ohne",
  label_housekeeping_suites: "Housekeeping Suiten|mit Check / ohne",
  label_aufbettung: "Aufbettung",
  label_public: "Public Früh / Spät",
  label_extra: "Extra-Leistungen",
  label_unterschrift: "Unterschrift Kunde",
  footer_note:
    "Digitale Abgabe bis zum 1. des Monats -> buchhaltung@alfagruppe.de",
});

export async function fetchHousekeepingLogSettings() {
  const url = `${apiBase}/api/housekeeping-log/`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Housekeeping settings failed: ${response.status}`);
  }
  const data = await response.json();
  const defaults = getDefaultHousekeepingLogSettings();
  return {
    hotel_name:
      typeof data.hotel_name === "string"
        ? data.hotel_name
        : defaults.hotel_name,
    label_tag: data.label_tag || defaults.label_tag,
    label_uhrzeit_von: data.label_uhrzeit_von || defaults.label_uhrzeit_von,
    label_uhrzeit_bis: data.label_uhrzeit_bis || defaults.label_uhrzeit_bis,
    label_housekeeping_double:
      data.label_housekeeping_double || defaults.label_housekeeping_double,
    label_housekeeping_suites:
      data.label_housekeeping_suites || defaults.label_housekeeping_suites,
    label_aufbettung: data.label_aufbettung || defaults.label_aufbettung,
    label_public: data.label_public || defaults.label_public,
    label_extra: data.label_extra || defaults.label_extra,
    label_unterschrift: data.label_unterschrift || defaults.label_unterschrift,
    footer_note:
      typeof data.footer_note === "string"
        ? data.footer_note
        : defaults.footer_note,
  };
}
