import { useEffect, useState } from "react";
import {
  fetchHousekeepingLogSettings,
  getDefaultHousekeepingLogSettings,
} from "../api/housekeepingLogSettings";
import HousekeepingLogTable from "../components/HousekeepingLogTable";
import TimesheetHeader from "../components/TimesheetHeader";
import { printElementAsPdf } from "../utils/printUtils";

export default function HousekeepingLogPage({ token }) {
  const [config, setConfig] = useState(() =>
    getDefaultHousekeepingLogSettings(),
  );

  useEffect(() => {
    let cancelled = false;
    fetchHousekeepingLogSettings()
      .then((data) => {
        if (!cancelled) {
          setConfig(data);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section
      className="timesheet-sheet timesheet-sheet--wide"
      aria-label="Housekeeping Tagesliste"
    >
      <HousekeepingLogTable hotelName={config.hotel_name} config={config} token={token} />
    </section>
  );
}
