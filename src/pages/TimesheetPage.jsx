import { useEffect, useState } from "react";
import {
  fetchTimesheetSettings,
  getDefaultTimesheetSettings,
} from "../api/timesheetSettings";
import TimesheetHeader from "../components/TimesheetHeader";
import TimesheetTable from "../components/TimesheetTable";

export default function TimesheetPage({ token }) {
  const [settings, setSettings] = useState(() => getDefaultTimesheetSettings());

  useEffect(() => {
    let cancelled = false;
    fetchTimesheetSettings()
      .then((data) => {
        if (!cancelled) {
          setSettings(data);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="timesheet-sheet" aria-label="Stundennachweis">
      <TimesheetTable hotelName={settings.hotel_name} verhaltnis={settings.verhaltnis} token={token} />
    </section>
  );
}
