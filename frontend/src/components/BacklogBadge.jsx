import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

/**
 * Backlog status badge with expandable details
 * Props:
 *   count   {number}  - active backlogs count
 *   details {string}  - comma-separated backlog subject details
 */
export default function BacklogBadge({ count = 0, details = '' }) {
  const hasBacklogs = count > 0;

  const detailsList = details
    ? details.split(',').map((d) => d.trim()).filter(Boolean)
    : [];

  return (
    <div className={`
      rounded-2xl border-2 p-5 transition-all duration-300
      ${hasBacklogs
        ? 'bg-red-50/70 border-red-200 shadow-sm'
        : 'bg-emerald-50/70 border-emerald-200 shadow-sm'
      }
    `}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className={`
          w-10 h-10 rounded-xl flex items-center justify-center
          ${hasBacklogs ? 'bg-red-100' : 'bg-emerald-100'}
        `}>
          {hasBacklogs
            ? <XCircle className="w-5 h-5 text-red-600" />
            : <CheckCircle className="w-5 h-5 text-emerald-600" />
          }
        </div>
        <div>
          <p className={`text-sm font-bold ${hasBacklogs ? 'text-red-800' : 'text-emerald-800'}`}>
            {hasBacklogs ? `${count} Active Backlog${count > 1 ? 's' : ''}` : '0 Active Backlogs'}
          </p>
          <p className={`text-xs ${hasBacklogs ? 'text-red-600' : 'text-emerald-600'}`}>
            {hasBacklogs ? 'Clear all backlogs to be eligible for placement drives' : 'All clear — No backlogs!'}
          </p>
        </div>
      </div>

      {/* Details list */}
      {hasBacklogs && detailsList.length > 0 && (
        <div className="mt-4 pt-3 border-t border-red-200">
          <p className="text-xs font-semibold text-red-700 mb-2 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            Pending Subjects
          </p>
          <div className="flex flex-wrap gap-1.5">
            {detailsList.map((subject, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-2.5 py-1 rounded-lg bg-red-100 text-red-700 text-xs font-medium border border-red-200"
              >
                {subject}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
