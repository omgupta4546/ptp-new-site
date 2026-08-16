/**
 * Individual semester SGPA card
 * Props:
 *   sem           {number} - 1 to 8
 *   sgpa          {number|null}
 *   result        {string}
 *   back          {string}
 *   pendingBacks  {number|string}
 */
export default function SGPACard({ sem, sgpa, result, back, pendingBacks }) {
  const hasData = sgpa !== null && sgpa !== undefined && sgpa !== '' && parseFloat(sgpa) > 0;
  
  const isPass = String(result || '').trim().toLowerCase() === 'pass';
  const isFail = String(result || '').trim().toLowerCase() === 'fail' || 
                 String(result || '').trim().toLowerCase() === 'back' ||
                 (pendingBacks !== undefined && parseInt(pendingBacks, 10) > 0);

  const hasBack = isFail || 
                  (back && String(back).trim() !== '' && String(back).trim() !== '0' && String(back).trim().toLowerCase() !== 'none' && String(back).trim().toLowerCase() !== 'nil' && String(back).trim().toLowerCase() !== 'na');

  // Bar height as percentage of max 10
  const barHeight = hasData ? `${(parseFloat(sgpa) / 10) * 100}%` : '0%';
  const barColor  = hasData
    ? parseFloat(sgpa) >= 7.5 ? '#003087' : parseFloat(sgpa) >= 6.0 ? '#0063CF' : '#f59e0b'
    : '#e5e7eb';

  return (
    <div className={`
      relative flex flex-col items-center justify-between
      bg-white rounded-2xl p-4 border-2 transition-all duration-300
      hover:-translate-y-1 hover:shadow-card-hover group cursor-default min-h-[235px]
      ${hasData ? 'border-gray-100 shadow-card' : 'border-dashed border-gray-200'}
    `}>
      {/* Semester label */}
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
        Semester {sem}
      </span>

      {/* Mini bar chart */}
      <div className="w-full mt-2 mb-2 flex justify-center">
        <div className="w-4 h-12 bg-slate-100 rounded-full overflow-hidden flex flex-col-reverse p-0.5">
          <div
            className="w-full rounded-full transition-all duration-700 ease-out shadow-sm"
            style={{ height: barHeight, backgroundColor: barColor }}
          />
        </div>
      </div>

      {/* SGPA value */}
      <div className="flex flex-col items-center">
        <div className={`text-xl font-black font-display tracking-tight ${hasData ? 'text-rtu-navy' : 'text-gray-300'}`}>
          {hasData ? parseFloat(sgpa).toFixed(2) : '—'}
        </div>
        <span className="text-[10px] text-gray-400 font-medium">
          SGPA
        </span>
      </div>

      {/* Result and Backlog details */}
      {isPass && !hasBack ? (
        <div className="w-full mt-2.5 pt-2.5 border-t border-gray-100 flex flex-col items-center gap-1.5">
          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase tracking-wider">
            Pass
          </span>
          <span className="text-[9px] text-emerald-600/80 font-semibold">
            All Clear
          </span>
        </div>
      ) : isFail || hasBack ? (
        <div className="w-full mt-2.5 pt-2.5 border-t border-gray-100 flex flex-col items-center gap-1.5">
          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-100 uppercase tracking-wider">
            Fail
          </span>
          <div className="w-full text-center">
            {pendingBacks !== undefined && parseInt(pendingBacks, 10) > 0 && (
              <span className="text-[9px] text-rose-600 font-bold block mb-0.5">
                Backs: {pendingBacks}
              </span>
            )}
            {back && back !== '0' && back !== String(pendingBacks) && (
              <span 
                className="text-[9px] leading-tight text-rose-500 font-semibold bg-rose-50/70 border border-rose-100 rounded px-1.5 py-0.5 inline-block max-w-full break-words text-center"
                title={back}
              >
                {back}
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="w-full mt-2.5 pt-2.5 border-t border-gray-100 text-center flex flex-col items-center gap-1">
          <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-gray-100 text-gray-500 border border-gray-250 uppercase tracking-wider">
            {result || 'Pending'}
          </span>
        </div>
      )}
    </div>
  );
}
