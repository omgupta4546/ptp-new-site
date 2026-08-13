/**
 * Individual semester SGPA card
 * Props:
 *   sem   {number} - 1 to 8
 *   sgpa  {number|null}
 */
export default function SGPACard({ sem, sgpa }) {
  const hasData = sgpa !== null && sgpa !== undefined && sgpa !== '';

  // Bar height as percentage of max 10
  const barHeight = hasData ? `${(parseFloat(sgpa) / 10) * 100}%` : '0%';
  const barColor  = hasData
    ? parseFloat(sgpa) >= 7.5 ? '#003087' : parseFloat(sgpa) >= 6.0 ? '#0063CF' : '#f59e0b'
    : '#e5e7eb';

  return (
    <div className={`
      relative flex flex-col items-center justify-between
      bg-white rounded-2xl p-4 border-2 transition-all duration-300
      hover:-translate-y-1 hover:shadow-card-hover group cursor-default
      ${hasData ? 'border-gray-100 shadow-card' : 'border-dashed border-gray-200'}
    `}>
      {/* Semester label */}
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
        Semester {sem}
      </span>

      {/* Mini bar chart */}
      <div className="w-full mt-2.5 mb-3 flex justify-center">
        <div className="w-5 h-16 bg-slate-100 rounded-full overflow-hidden flex flex-col-reverse p-0.5">
          <div
            className="w-full rounded-full transition-all duration-700 ease-out shadow-sm"
            style={{ height: barHeight, backgroundColor: barColor }}
          />
        </div>
      </div>

      {/* SGPA value */}
      <div className={`text-xl font-black font-display tracking-tight ${hasData ? 'text-rtu-navy' : 'text-gray-300'}`}>
        {hasData ? parseFloat(sgpa).toFixed(2) : '—'}
      </div>

      <span className="text-[10px] text-gray-400 font-medium mt-1">
        {hasData ? 'SGPA' : 'Pending'}
      </span>
    </div>
  );
}
