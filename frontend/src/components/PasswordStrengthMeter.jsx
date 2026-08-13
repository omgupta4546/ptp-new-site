/**
 * Password strength meter with visual bar and criteria checklist
 * Props:
 *   password {string}
 */
export default function PasswordStrengthMeter({ password }) {
  const criteria = [
    { label: 'At least 8 characters',         test: (p) => p.length >= 8            },
    { label: 'One uppercase letter (A–Z)',     test: (p) => /[A-Z]/.test(p)         },
    { label: 'One lowercase letter (a–z)',     test: (p) => /[a-z]/.test(p)         },
    { label: 'One number (0–9)',               test: (p) => /\d/.test(p)            },
    { label: 'One special character (@$!%*?&^#)', test: (p) => /[@$!%*?&^#]/.test(p) },
  ];

  const met        = criteria.filter((c) => c.test(password)).length;
  const strength   = met === 0 ? 0 : met <= 2 ? 1 : met <= 3 ? 2 : met <= 4 ? 3 : 4;

  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['', '#ef4444', '#f97316', '#3b82f6', '#22c55e'];
  const widths = ['0%', '25%', '50%', '75%', '100%'];

  if (!password) return null;

  return (
    <div className="mt-3 space-y-3 animate-fade-in">
      {/* Strength bar */}
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs text-gray-500">Password Strength</span>
          <span className="text-xs font-semibold" style={{ color: colors[strength] }}>
            {labels[strength]}
          </span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: widths[strength],
              backgroundColor: colors[strength],
            }}
          />
        </div>
      </div>

      {/* Criteria checklist */}
      <div className="grid grid-cols-1 gap-1">
        {criteria.map((c) => {
          const passed = c.test(password);
          return (
            <div key={c.label} className="flex items-center gap-2">
              <span
                className={`text-xs font-bold transition-colors duration-200 ${
                  passed ? 'text-emerald-500' : 'text-gray-300'
                }`}
              >
                {passed ? '✓' : '○'}
              </span>
              <span
                className={`text-xs transition-colors duration-200 ${
                  passed ? 'text-emerald-600' : 'text-gray-400'
                }`}
              >
                {c.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
