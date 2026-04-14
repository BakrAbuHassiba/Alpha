export default function TimesheetHeader({
  hotelName,
  month = "",
  setMonth = () => {},
  employeeName = "",
  setEmployeeName = () => {},
  persNr = "",
  setPersNr = () => {},
}) {
  const title =
    hotelName?.trim() ||
    "Stundennachweis fuer Hotel Barcelo, Hamburg";

  return (
    <header className="sheet-header">
      <div className="sheet-brand-row">
        <div className="sheet-company-strip">
          ALFA Reinigung GmbH & Co. KG | Am Doeben 27 - 25494 Borstel-Hohenraden
        </div>
        <div className="sheet-logo-wrap">
          <img src="/logo.jpg" alt="ALFA Unternehmensgruppe Logo" />
        </div>
      </div>

      <div className="sheet-info-grid">
        <div className="sheet-title-cell">{title}</div>
        <label className="sheet-month-cell sheet-field-cell">
          <span>Monat:</span>
          <input type="text" aria-label="Monat" value={month} onChange={(e) => setMonth(e.target.value)} />
        </label>
        <label className="sheet-name-cell sheet-field-cell">
          <span>Nachname, Vorname:</span>
          <input type="text" aria-label="Nachname und Vorname" value={employeeName} onChange={(e) => setEmployeeName(e.target.value)} />
        </label>
        <label className="sheet-person-cell sheet-field-cell">
          <span>Pers.Nr.:</span>
          <input type="text" aria-label="Personalnummer" value={persNr} onChange={(e) => setPersNr(e.target.value)} />
        </label>
      </div>
    </header>
  );
}
