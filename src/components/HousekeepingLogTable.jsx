import { useState, useEffect } from "react";
import { submitHousekeepingLog, fetchActiveHousekeeping, saveActiveHousekeeping } from "../api/auth";
import TimesheetHeader from "./TimesheetHeader";

const DAYS_IN_MONTH = 31;

const generateRows = () =>
  Array.from({ length: DAYS_IN_MONTH }, (_, i) => ({
    day: i + 1,
    start: "",
    end: "",
    housekeepingDoubleMit: "",
    housekeepingDoubleOhne: "",
    housekeepingSuiteMit: "",
    housekeepingSuiteOhne: "",
    aufbettung: "",
    publicShift: "",
    extra: "",
    signature: "",
  }));

const parseNumber = (value) => {
  const normalized = String(value ?? "").replace(",", ".");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatGerman = (value) =>
  Number(value).toLocaleString("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function TheadRow({ config }) {
  return (
    <tr>
      <th className="day-cell hk-th-stacked">{config.label_tag}</th>
      <th className="time-cell hk-th-stacked">
        {config.label_uhrzeit_von}
        <span className="column-hint">(Beispiel 10:00)</span>
      </th>
      <th className="time-cell hk-th-stacked">
        {config.label_uhrzeit_bis}
        <span className="column-hint">(Beispiel 15:00)</span>
      </th>
      <th colSpan={2} className="hk-th-merged hk-th-wrap" style={{ width: 100 }}>
        <HeaderLabel label={config.label_housekeeping_double} />
      </th>
      <th colSpan={2} className="hk-th-merged hk-th-wrap" style={{ width: 100 }}>
        <HeaderLabel label={config.label_housekeeping_suites} />
      </th>
      <th className="num-cell hk-th-stacked hk-th-wrap">{config.label_aufbettung}</th>
      <th className="num-cell hk-th-stacked hk-th-wrap">{config.label_public}</th>
      <th className="num-cell hk-th-stacked hk-th-wrap">{config.label_extra}</th>
      <th className="signature-cell hk-th-stacked hk-th-wrap">{config.label_unterschrift}</th>
    </tr>
  );
}

function RepeatFooterLabels({ config }) {
  return (
    <tr className="hk-repeat-head-row">
      <td className="day-cell hk-repeat-header">{config.label_tag}</td>
      <td className="time-cell hk-repeat-header">{config.label_uhrzeit_von}</td>
      <td className="time-cell hk-repeat-header">{config.label_uhrzeit_bis}</td>
      <td
        colSpan={2}
        className="hk-repeat-header hk-repeat-wrap hk-repeat-merged"
        style={{ width: 100 }}
      >
        <HeaderLabel label={config.label_housekeeping_double} />
      </td>
      <td
        colSpan={2}
        className="hk-repeat-header hk-repeat-wrap hk-repeat-merged"
        style={{ width: 100 }}
      >
        <HeaderLabel label={config.label_housekeeping_suites} />
      </td>
      <td className="num-cell hk-repeat-header hk-repeat-wrap">
        {config.label_aufbettung}
      </td>
      <td className="num-cell hk-repeat-header hk-repeat-wrap">{config.label_public}</td>
      <td className="num-cell hk-repeat-header hk-repeat-wrap">{config.label_extra}</td>
      <td className="signature-cell hk-repeat-header hk-repeat-wrap">
        {config.label_unterschrift}
      </td>
    </tr>
  );
}

export default function HousekeepingLogTable({ hotelName, config, token, initialData = null, readOnly = false }) {
  const [rows, setRows] = useState(() => (initialData?.data?.length > 0 ? initialData.data : generateRows()));
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

  useEffect(() => {
    if (readOnly) return;
    let active = true;
    fetchActiveHousekeeping(token).then((data) => {
      if (active && data) {
        if (data.data && data.data.length > 0) setRows(data.data);
        if (data.month) setMonth(data.month);
        if (data.year) setYear(data.year);
        if (data.employee_name) setEmployeeName(data.employee_name);
        if (data.pers_nr) setPersNr(data.pers_nr);
      }
      setIsLoaded(true);
    });
    return () => { active = false; };
  }, [token, readOnly]);

  useEffect(() => {
    if (!isLoaded || readOnly) return;
    const timeoutId = setTimeout(() => {
      saveActiveHousekeeping(token, month, year, employeeName, persNr, rows);
    }, 1000);
    return () => clearTimeout(timeoutId);
  }, [rows, month, year, employeeName, persNr, isLoaded, token, readOnly]);

  const handleSubmit = async () => {
    if (!month.trim() || !year.trim() || !employeeName.trim() || !persNr.trim()) {
      setStatusMsg("Bitte füllen Sie Monat, Jahr, Name und Pers.Nr. aus, bevor Sie speichern.");
      return;
    }

    const invalidRow = rows.find(row => {
      // Check if the row contains ANY data
      const hasAnyData = row.start !== "" || row.end !== "" || row.housekeepingDoubleMit !== "" || row.housekeepingDoubleOhne !== "" || row.housekeepingSuiteMit !== "" || row.housekeepingSuiteOhne !== "" || row.aufbettung !== "" || row.publicShift !== "" || row.extra !== "" || row.signature !== "";
      if (!hasAnyData) return false;

      // If it has data, all data fields MUST be filled (except signature)
      const isDataComplete = row.start !== "" && row.end !== "" && row.housekeepingDoubleMit !== "" && row.housekeepingDoubleOhne !== "" && row.housekeepingSuiteMit !== "" && row.housekeepingSuiteOhne !== "" && row.aufbettung !== "" && row.publicShift !== "" && row.extra !== "";
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
      await submitHousekeepingLog(token, month, year, employeeName, persNr, rows);
      setStatusMsg("Erfolgreich gespeichert! Liste wurde zurückgesetzt.");
      window.alert("Erfolgreich gespeichert! Liste wurde zurückgesetzt.");
      setRows(generateRows());
      setMonth("");
      setEmployeeName("");
      setPersNr("");
    } catch (err) {
      setStatusMsg("Fehler beim Speichern.");
    }
  };

  const handleChange = (index, field, value) => {
    setRows((current) => {
      const updatedRows = [...current];
      updatedRows[index] = { ...updatedRows[index], [field]: value };
      return updatedRows;
    });
  };

  const totals = rows.reduce(
    (acc, row) => {
      acc.doubleMit += parseNumber(row.housekeepingDoubleMit);
      acc.doubleOhne += parseNumber(row.housekeepingDoubleOhne);
      acc.suiteMit += parseNumber(row.housekeepingSuiteMit);
      acc.suiteOhne += parseNumber(row.housekeepingSuiteOhne);
      acc.aufbettung += parseNumber(row.aufbettung);
      acc.publicShift += parseNumber(row.publicShift);
      acc.extra += parseNumber(row.extra);
      return acc;
    },
    {
      doubleMit: 0,
      doubleOhne: 0,
      suiteMit: 0,
      suiteOhne: 0,
      aufbettung: 0,
      publicShift: 0,
      extra: 0,
    },
  );

  const dBase = `${config.label_tag}`;
  const dDouble = config.label_housekeeping_double;
  const dSuite = config.label_housekeeping_suites;

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
        aria-label="Housekeeping Tagesliste"
      >
        <table className="timesheet-table hk-table">
          <thead>
            <TheadRow config={config} />
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.day}>
                <td className="day-cell">{row.day}</td>
                <td>
                  <input
                    type="time"
                    min="00:00"
                    max="23:59"
                    step="60"
                    value={row.start}
                    onChange={(e) =>
                      handleChange(index, "start", e.target.value)
                    }
                    disabled={readOnly}
                    aria-label={`${dBase} ${row.day} ${config.label_uhrzeit_von}`}
                  />
                </td>
                <td>
                  <input
                    type="time"
                    min="00:00"
                    max="23:59"
                    step="60"
                    value={row.end}
                    onChange={(e) => handleChange(index, "end", e.target.value)}
                    disabled={readOnly}
                    aria-label={`${dBase} ${row.day} ${config.label_uhrzeit_bis}`}
                  />
                </td>
                <td className="hk-split-pair-left">
                  <input
                    className="hk-num-input"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    onKeyDown={handleNumberKeyDown}
                    value={row.housekeepingDoubleMit}
                    onChange={(e) =>
                      handleChange(
                        index,
                        "housekeepingDoubleMit",
                        e.target.value,
                      )
                    }
                    disabled={readOnly}
                    aria-label={`${dBase} ${row.day} ${dDouble}, mit Check`}
                  />
                </td>
                <td className="hk-split-pair-right">
                  <input
                    className="hk-num-input"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    onKeyDown={handleNumberKeyDown}
                    value={row.housekeepingDoubleOhne}
                    onChange={(e) =>
                      handleChange(
                        index,
                        "housekeepingDoubleOhne",
                        e.target.value,
                      )
                    }
                    disabled={readOnly}
                    aria-label={`${dBase} ${row.day} ${dDouble}, ohne`}
                  />
                </td>
                <td className="hk-split-pair-left">
                  <input
                    className="hk-num-input"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    onKeyDown={handleNumberKeyDown}
                    value={row.housekeepingSuiteMit}
                    onChange={(e) =>
                      handleChange(
                        index,
                        "housekeepingSuiteMit",
                        e.target.value,
                      )
                    }
                    disabled={readOnly}
                    aria-label={`${dBase} ${row.day} ${dSuite}, mit Check`}
                  />
                </td>
                <td className="hk-split-pair-right">
                  <input
                    className="hk-num-input"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    onKeyDown={handleNumberKeyDown}
                    value={row.housekeepingSuiteOhne}
                    onChange={(e) =>
                      handleChange(
                        index,
                        "housekeepingSuiteOhne",
                        e.target.value,
                      )
                    }
                    disabled={readOnly}
                    aria-label={`${dBase} ${row.day} ${dSuite}, ohne`}
                  />
                </td>
                <td>
                  <input
                    className="hk-num-input"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    onKeyDown={handleNumberKeyDown}
                    value={row.aufbettung}
                    onChange={(e) =>
                      handleChange(index, "aufbettung", e.target.value)
                    }
                    disabled={readOnly}
                    aria-label={`${dBase} ${row.day} ${config.label_aufbettung}`}
                  />
                </td>
                <td>
                  <input
                    className="hk-num-input"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    onKeyDown={handleNumberKeyDown}
                    value={row.publicShift}
                    onChange={(e) =>
                      handleChange(index, "publicShift", e.target.value)
                    }
                    disabled={readOnly}
                    aria-label={`${dBase} ${row.day} ${config.label_public}`}
                  />
                </td>
                <td>
                  <input
                    className="hk-num-input"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    onKeyDown={handleNumberKeyDown}
                    value={row.extra}
                    onChange={(e) =>
                      handleChange(index, "extra", e.target.value)
                    }
                    disabled={readOnly}
                    aria-label={`${dBase} ${row.day} ${config.label_extra}`}
                  />
                </td>
                <td>
                  <input
                    className="signature-input"
                    type="text"
                    value={row.signature}
                    onChange={(e) =>
                      handleChange(index, "signature", e.target.value)
                    }
                    disabled={readOnly}
                    aria-label={`${dBase} ${row.day} ${config.label_unterschrift}`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="hk-totals-row">
              <td className="hk-total-empty" />
              <td className="hk-total-empty" />
              <td className="hk-total-empty" />
              <td className="month-total-value hk-split-pair-left">
                {formatGerman(totals.doubleMit)}
              </td>
              <td className="month-total-value hk-split-pair-right">
                {formatGerman(totals.doubleOhne)}
              </td>
              <td className="month-total-value hk-split-pair-left">
                {formatGerman(totals.suiteMit)}
              </td>
              <td className="month-total-value hk-split-pair-right">
                {formatGerman(totals.suiteOhne)}
              </td>
              <td className="month-total-value">
                {formatGerman(totals.aufbettung)}
              </td>
              <td className="month-total-value">
                {formatGerman(totals.publicShift)}
              </td>
              <td className="month-total-value">
                {formatGerman(totals.extra)}
              </td>
              <td className="hk-gesamtsummen">Gesamtsummen</td>
            </tr>
            <RepeatFooterLabels config={config} />
          </tfoot>
        </table>
      </div>
      <p className="hk-footer-note">{config.footer_note}</p>
    </div>
  );
}

function HeaderLabel({ label }) {
  if (!label) return null;
  const parts = String(label).split(/\r?\n|\|/);
  return (
    <>
      {parts.map((p, i) => (
        <span key={i}>
          {p}
          {i < parts.length - 1 && <br />}
        </span>
      ))}
    </>
  );
}
