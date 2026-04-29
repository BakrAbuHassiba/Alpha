import { useState, useEffect } from "react";
import { submitTimesheet, fetchActiveTimesheet, saveActiveTimesheet, updateTimesheetById } from "../api/auth";
import TimesheetHeader from "./TimesheetHeader";

const DAYS_IN_MONTH = 31;

const generateDays = () => {
  return Array.from({ length: DAYS_IN_MONTH }, (_, i) => ({
    day: i + 1,
    start: "",
    end: "",
    pause: "0.30",
    rooms: "",
    signature: "",
    isLocked: false,
  }));
};

const parseNumber = (value) => {
  const normalized = String(value ?? "").replace(",", ".");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const clampPause = (value) => {
  const num = parseNumber(value);
  if (num >= 0.6) return 0.6; // We treat anything 0.6 or higher as 60 minutes
  return Math.max(0, num);
};

const normalizePauseValue = (value) => {
  const num = parseNumber(value);
  if (num >= 0.6) return 1.0; // 0.60 or more becomes 1 hour
  const minutes = Math.round(num * 100);
  return minutes / 60;
};

const timeToMinutes = (time) => {
  if (!time) {
    return 0;
  }

  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

const calculateDurationMinutes = (start, end) => {
  if (!start || !end) {
    return 0;
  }

  const startMin = timeToMinutes(start);
  const endMin = timeToMinutes(end);

  if (startMin === endMin) {
    return 0;
  }

  const directDiff = endMin - startMin;
  if (directDiff > 0) {
    return directDiff;
  }

  const minutesInDay = 24 * 60;
  const wrapped24Diff = endMin + minutesInDay - startMin;
  if (wrapped24Diff > 0) {
    return wrapped24Diff;
  }

  return 0;
};

const pauseToMinutes = (pause) => {
  const normalizedPauseHours = normalizePauseValue(parseNumber(pause));
  return Math.round(normalizedPauseHours * 60);
};

const calculateTotalMinutesWithPause = (start, end, pause) => {
  const durationMinutes = calculateDurationMinutes(start, end);
  if (durationMinutes <= 0) {
    return 0;
  }

  return durationMinutes + pauseToMinutes(pause);
};

const calculateStdGesamt = (rooms, ratio) => {
  const roomsValue = parseNumber(rooms);
  const ratioValue = parseNumber(ratio);

  if (ratioValue <= 0) {
    return 0;
  }

  return roomsValue / ratioValue;
};

const formatGerman = (value) => {
  return Number(value).toLocaleString("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatMinutesAsHourValue = (totalMinutes) => {
  const safeMinutes = Math.max(0, Math.round(totalMinutes));
  const hours = Math.floor(safeMinutes / 60);
  const minutes = safeMinutes % 60;
  return `${hours},${String(minutes).padStart(2, "0")}`;
};

export default function TimesheetTable({ hotelName, verhaltnis = 1, token, initialData = null, readOnly = false, isAdmin = false }) {
  const [rows, setRows] = useState(() => (initialData?.data?.length > 0 ? initialData.data : generateDays()));
  const [month, setMonth] = useState(initialData?.month || "");
  const [year, setYear] = useState(() => initialData?.year || new Date().getFullYear().toString());
  const [employeeName, setEmployeeName] = useState(initialData?.employee_name || "");
  const [persNr, setPersNr] = useState(initialData?.pers_nr || "");
  const [statusMsg, setStatusMsg] = useState("");
  const [isLoaded, setIsLoaded] = useState(!!initialData);

  const handleNumberKeyDown = (e) => {
    if (e.key === "e" || e.key === "E") {
      e.preventDefault();
    }
  };

  // Load draft on mount
  useEffect(() => {
    if (readOnly || initialData) return;
    let active = true;
    fetchActiveTimesheet(token).then((data) => {
      if (active && data) {
        if (data.data && data.data.length > 0) {
          setRows(data.data);
        }
        if (data.month) setMonth(data.month);
        if (data.year) setYear(data.year);
        if (data.employee_name) setEmployeeName(data.employee_name);
        if (data.pers_nr) setPersNr(data.pers_nr);
      }
      setIsLoaded(true);
    });
    return () => { active = false; };
  }, [token, readOnly]);

  // Auto-save when changed
  useEffect(() => {
    if (!isLoaded || readOnly) return;
    const timeoutId = setTimeout(() => {
      if (isAdmin && initialData?.id) {
        updateTimesheetById(token, initialData.id, month, year, employeeName, persNr, rows);
      } else {
        saveActiveTimesheet(token, month, year, employeeName, persNr, rows);
      }
    }, 1000); // 1s debounce
    return () => clearTimeout(timeoutId);
  }, [rows, month, year, employeeName, persNr, isLoaded, token, readOnly, isAdmin, initialData]);

  const handleSubmit = async () => {
    if (!month.trim() || !year.trim() || !employeeName.trim() || !persNr.trim()) {
      setStatusMsg("Bitte füllen Sie Monat, Jahr, Name und Pers.Nr. aus, bevor Sie speichern.");
      return;
    }

    const invalidRow = rows.find(row => {
      // Check if the row contains ANY data
      const hasAnyData = row.start !== "" || row.end !== "" || row.rooms !== "" || row.signature !== "";
      if (!hasAnyData) return false;

      // If it has data, all data fields MUST be filled (except signature)
      const isDataComplete = row.start !== "" && row.end !== "" && row.pause !== "" && row.rooms !== "";
      return !isDataComplete;
    });

    if (invalidRow) {
      window.alert(`Bitte füllen Sie alle erforderlichen Felder in Zeile (Tag ${invalidRow.day}) aus!`);
      return;
    }

    const confirmSubmit = window.confirm("Möchten Sie diesen Monat abschließen und speichern? Die Tabelle wird nach dem Speichern zurückgesetzt!");
    if (!confirmSubmit) {
      return;
    }

    setStatusMsg("Wird gespeichert...");
    try {
      await submitTimesheet(token, month, year, employeeName, persNr, rows);
      setStatusMsg("Erfolgreich gespeichert! Liste wurde zurückgesetzt.");
      window.alert("Erfolgreich gespeichert! Liste wurde zurückgesetzt.");
      setRows(generateDays());
      setMonth("");
      setEmployeeName("");
      setPersNr("");
    } catch (err) {
      setStatusMsg("Fehler beim Speichern.");
    }
  };

  const handleChange = (index, field, value) => {
    setRows((currentRows) => {
      const updatedRows = [...currentRows];
      updatedRows[index] = { ...updatedRows[index], [field]: value };
      return updatedRows;
    });
  };

  const toggleRowLock = (index) => {
    setRows((currentRows) => {
      const updatedRows = [...currentRows];
      updatedRows[index] = { ...updatedRows[index], isLocked: !updatedRows[index].isLocked };
      return updatedRows;
    });
  };

  const handlePauseBlur = (index) => {
    setRows((currentRows) => {
      const updatedRows = [...currentRows];
      const currentPause = updatedRows[index].pause;

      if (currentPause === "") {
        return updatedRows;
      }

      const num = parseNumber(currentPause);
      let normalizedDisplay = "";
      if (num >= 0.6) {
        normalizedDisplay = "1.00";
      } else {
        normalizedDisplay = Math.max(0, num).toFixed(2);
      }
      
      updatedRows[index] = { ...updatedRows[index], pause: normalizedDisplay };
      return updatedRows;
    });
  };

  const totalMonth = rows.reduce((sum, row) => {
    return sum + calculateStdGesamt(row.rooms, verhaltnis);
  }, 0);
  const totalHoursMinutes = rows.reduce((sum, row) => {
    return sum + calculateTotalMinutesWithPause(row.start, row.end, row.pause);
  }, 0);
  const totalRooms = rows.reduce((sum, row) => {
    return sum + parseNumber(row.rooms);
  }, 0);
  const totalPauseMinutes = rows.reduce((sum, row) => {
    return sum + pauseToMinutes(row.pause);
  }, 0);

  return (
    <div className="timesheet-table-section">
      <TimesheetHeader 
        hotelName={hotelName}
        month={month} setMonth={setMonth}
        employeeName={employeeName} setEmployeeName={setEmployeeName}
        persNr={persNr} setPersNr={setPersNr}
      />
      <div style={{ marginBottom: 15, display: "flex", gap: 10, alignItems: "center" }}>
        <input 
          type="text" 
          placeholder="Jahr" 
          value={year} 
          onChange={e => setYear(e.target.value)} 
          style={{ padding: 8, width: 80 }}
          disabled={readOnly}
        />
        {!readOnly && (
          <button onClick={handleSubmit} style={{ padding: "8px 16px", cursor: "pointer" }}>
            Speichern
          </button>
        )}
        {statusMsg && <span>{statusMsg}</span>}
      </div>

      <div
        className="table-container"
        role="region"
        aria-label="Timesheet Tabelle"
      >
        <table className="timesheet-table">
          <thead>
            <tr>
              <th className="day-cell">Tag</th>
              <th className="time-cell">
                Uhrzeit von
                <span className="column-hint">(Beispiel 10:00)</span>
              </th>
              <th className="time-cell">
                Uhrzeit bis
                <span className="column-hint">(Beispiel 15:00)</span>
              </th>
              <th className="num-cell">
                Pause
                <span className="column-hint">(Min 0.00 / Max 0.60)</span>
              </th>
              <th className="stats-cell">Anzahl der Stunden</th>
              <th className="rooms-header-cell num-cell">
                <div
                  className="sheet-verhaltnis-readonly"
                  title="Verhältnis (nur im Admin änderbar)"
                >
                  {formatGerman(verhaltnis)}
                </div>
                Gereinigte Zimmer
              </th>
              <th className="stats-cell">Std. gesamt</th>
              <th className="signature-cell">Unterschrift Kunde</th>
              <th className="lock-cell">Aktion</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row, index) => {
              const sumMinutes = calculateTotalMinutesWithPause(
                row.start,
                row.end,
                row.pause,
              );
              const stdGesamt = calculateStdGesamt(row.rooms, verhaltnis);

              // Logic: Row is editable if:
              // 1. It's the first row (index 0)
              // 2. OR the previous row is locked
              // 3. AND the current row is NOT locked
              // 4. OR the user is an admin
              const isPrevLocked = index === 0 || rows[index - 1].isLocked;
              const isEditable = isAdmin || (isPrevLocked && !row.isLocked);
              const fieldDisabled = readOnly || !isEditable;

              return (
                <tr key={row.day} className={row.isLocked ? "row-locked" : ""}>
                  <td className="day-cell">{row.day}</td>

                  <td>
                    <input
                      type="time"
                      min="00:00"
                      max="23:59"
                      step="60"
                      value={row.start}
                      onChange={(event) =>
                        handleChange(index, "start", event.target.value)
                      }
                      disabled={fieldDisabled}
                      aria-label={`Tag ${row.day} Uhrzeit von`}
                    />
                  </td>

                  <td>
                    <input
                      type="time"
                      min="00:00"
                      max="23:59"
                      step="60"
                      value={row.end}
                      onChange={(event) =>
                        handleChange(index, "end", event.target.value)
                      }
                      disabled={fieldDisabled}
                      aria-label={`Tag ${row.day} Uhrzeit bis`}
                    />
                  </td>

                  <td>
                    <input
                      className="pause-input"
                      type="number"
                      min="0"
                      max="0.60"
                      step="0.01"
                      onKeyDown={handleNumberKeyDown}
                      value={row.pause}
                      onChange={(event) =>
                        handleChange(index, "pause", event.target.value)
                      }
                      onBlur={() => handlePauseBlur(index)}
                      disabled={fieldDisabled}
                      aria-label={`Tag ${row.day} Pause`}
                    />
                  </td>

                  <td className="hours-cell">
                    {formatMinutesAsHourValue(sumMinutes)}
                  </td>

                  <td>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0"
                      onKeyDown={handleNumberKeyDown}
                      value={row.rooms}
                      onChange={(event) =>
                        handleChange(index, "rooms", event.target.value)
                      }
                      disabled={fieldDisabled}
                      aria-label={`Tag ${row.day} Gereinigte Zimmer`}
                    />
                  </td>

                  <td className="total-cell">{formatGerman(stdGesamt)}</td>

                  <td>
                    <input
                      className="signature-input"
                      type="text"
                      value={row.signature}
                      onChange={(event) =>
                        handleChange(index, "signature", event.target.value)
                      }
                      disabled={fieldDisabled}
                      aria-label={`Tag ${row.day} Unterschrift Kunde`}
                    />
                  </td>
                  <td className="lock-cell">
                    <button 
                      type="button"
                      className={`row-lock-btn ${row.isLocked ? "locked" : ""}`}
                      onClick={() => toggleRowLock(index)}
                      disabled={readOnly || (!isAdmin && (row.isLocked || !isPrevLocked))}
                      title={row.isLocked ? (isAdmin ? "Bearbeiten" : "Bestätigt") : "Bestätigen"}
                    >
                      {row.isLocked ? "✅" : "✔️"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>

          <tfoot>
            <tr>
              <td className="month-total-label"></td>
              <td></td>
              <td></td>
              <td className="month-total-value">
                {formatMinutesAsHourValue(totalPauseMinutes)}
              </td>
              <td className="month-total-value">
                {formatMinutesAsHourValue(totalHoursMinutes)}
              </td>
              <td className="month-total-value">{formatGerman(totalRooms)}</td>
              <td className="month-total-value">{formatGerman(totalMonth)}</td>
              <td></td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="sheet-bottom">
        <div className="signature-line">
          Unterschrift/ Name in Druckbuchstaben
        </div>

        <div className="sheet-note-wrap">
          <div className="sheet-abbrev">
            K= Krank&nbsp;&nbsp;&nbsp;U= Urlaub
          </div>
          <div className="sheet-warning">
            Wichtig: Abgabe bis zum 2. des Monats
          </div>
        </div>
      </div>
    </div>
  );
}
