/**
 * Circular SVG CGPA gauge
 * Props:
 *   cgpa       {number}  - 0 to 10
 *   maxCGPA    {number}  - default 10
 *   size       {number}  - SVG size in px, default 160
 */
export default function CGPAMeter({ cgpa, maxCGPA = 10, size = 160 }) {
  const safeValue  = Math.min(Math.max(cgpa || 0, 0), maxCGPA);
  const percentage = safeValue / maxCGPA;

  const strokeWidth = 10;
  const radius      = (size - strokeWidth * 2) / 2;
  const cx          = size / 2;
  const cy          = size / 2;
  const circumference = 2 * Math.PI * radius;

  // Only draw 270° of the circle (from 135° to 405°)
  const arcLength   = circumference * 0.75;
  const filledArc   = arcLength * percentage;
  const offset      = circumference - filledArc;

  // Color based on CGPA
  const getColor = (v) => {
    if (v >= 8.5) return '#22c55e';   // Excellent — green
    if (v >= 7.0) return '#3b82f6';   // Good     — blue
    if (v >= 5.5) return '#f97316';   // Average  — orange
    return '#ef4444';                  // Poor     — red
  };

  const color = getColor(safeValue);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="rotate-[135deg]"
        >
          {/* Background track */}
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
          />
          {/* Filled arc */}
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${filledArc} ${circumference}`}
            strokeDashoffset={0}
            strokeLinecap="round"
            style={{
              filter: `drop-shadow(0 0 6px ${color}60)`,
              transition: 'stroke-dasharray 1s ease-out',
            }}
          />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center -rotate-0">
          <span className="text-3xl font-black font-display" style={{ color }}>
            {safeValue.toFixed(2)}
          </span>
          <span className="text-xs text-gray-500 font-medium mt-0.5">/ {maxCGPA}.00</span>
          <span className="text-xs text-gray-400 font-medium">CGPA</span>
        </div>
      </div>
    </div>
  );
}
