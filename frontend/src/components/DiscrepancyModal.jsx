import { useState } from 'react';
import { X, AlertCircle, Send, Loader2 } from 'lucide-react';
import { studentAPI } from '../services/api';
import toast from 'react-hot-toast';

const FIELD_OPTIONS = [
  { value: 'CGPA',                 label: 'Current CGPA'         },
  { value: 'SGPA_Sem1',            label: 'SGPA — Semester 1'    },
  { value: 'SGPA_Sem2',            label: 'SGPA — Semester 2'    },
  { value: 'SGPA_Sem3',            label: 'SGPA — Semester 3'    },
  { value: 'SGPA_Sem4',            label: 'SGPA — Semester 4'    },
  { value: 'SGPA_Sem5',            label: 'SGPA — Semester 5'    },
  { value: 'SGPA_Sem6',            label: 'SGPA — Semester 6'    },
  { value: 'Active_Backlogs_Count',label: 'Active Backlogs Count'},
  { value: 'Backlog_Details',      label: 'Backlog Details'      },
  { value: 'Branch',               label: 'Branch'               },
  { value: 'Phone_Number',         label: 'Phone Number'         },
  { value: 'RTU_Enrollment_No',    label: 'RTU Enrollment No.'   },
  { value: 'Other',                label: 'Other'                },
];

/**
 * Discrepancy report modal
 * Props:
 *   isOpen  {boolean}
 *   onClose {function}
 *   profile {object} - student profile data (for pre-filling current values)
 */
export default function DiscrepancyModal({ isOpen, onClose, profile }) {
  const [field, setField]                 = useState('');
  const [currentValue, setCurrentValue]   = useState('');
  const [expectedValue, setExpectedValue] = useState('');
  const [message, setMessage]             = useState('');
  const [loading, setLoading]             = useState(false);

  // Pre-fill currentValue when field changes
  const handleFieldChange = (val) => {
    setField(val);
    if (!profile) return;
    const map = {
      CGPA:                  profile.currentCGPA,
      SGPA_Sem1:             profile.sgpa?.sem1,
      SGPA_Sem2:             profile.sgpa?.sem2,
      SGPA_Sem3:             profile.sgpa?.sem3,
      SGPA_Sem4:             profile.sgpa?.sem4,
      SGPA_Sem5:             profile.sgpa?.sem5,
      SGPA_Sem6:             profile.sgpa?.sem6,
      Active_Backlogs_Count: profile.activeBacklogsCount,
      Backlog_Details:       profile.backlogDetails,
      Branch:                profile.branch,
      Phone_Number:          profile.phoneNumber,
      RTU_Enrollment_No:     profile.rtuEnrollmentNo,
    };
    setCurrentValue(map[val] !== undefined && map[val] !== null ? String(map[val]) : '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!field || !currentValue || !expectedValue) {
      toast.error('Please fill in all required fields.');
      return;
    }
    setLoading(true);
    try {
      await studentAPI.reportDiscrepancy({
        field,
        currentValue,
        expectedValue,
        additionalMessage: message,
      });
      toast.success('Discrepancy report submitted! The T&P Cell will review it shortly.');
      onClose();
      // Reset
      setField(''); setCurrentValue(''); setExpectedValue(''); setMessage('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit report.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-rtu-lg animate-bounce-in overflow-hidden">
        {/* Header */}
        <div className="bg-rtu-gradient p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-base">Report Data Discrepancy</h3>
              <p className="text-white/70 text-xs">Your correction request will be logged for the T&P Admin</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Field selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Which field is incorrect? <span className="text-red-500">*</span>
            </label>
            <select
              id="discrepancy-field"
              value={field}
              onChange={(e) => handleFieldChange(e.target.value)}
              required
              className="input-field"
            >
              <option value="">Select field…</option>
              {FIELD_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Current value (auto-filled) */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Current Value (shown in portal) <span className="text-red-500">*</span>
            </label>
            <input
              id="discrepancy-current"
              type="text"
              value={currentValue}
              onChange={(e) => setCurrentValue(e.target.value)}
              className="input-field"
              required
              placeholder="Auto-filled when you select a field"
            />
          </div>

          {/* Expected value */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Correct / Expected Value <span className="text-red-500">*</span>
            </label>
            <input
              id="discrepancy-expected"
              type="text"
              value={expectedValue}
              onChange={(e) => setExpectedValue(e.target.value)}
              className="input-field"
              required
              placeholder="Enter the correct value"
            />
          </div>

          {/* Additional message */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Additional Comments <span className="text-gray-400">(optional)</span>
            </label>
            <textarea
              id="discrepancy-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="input-field min-h-[80px] resize-none"
              placeholder="Any additional details…"
              maxLength={500}
            />
            <p className="text-right text-[10px] text-gray-400 mt-1">{message.length}/500</p>
          </div>

          {/* Submit */}
          <button
            id="discrepancy-submit-btn"
            type="submit"
            disabled={loading || !field || !currentValue || !expectedValue}
            className="btn-primary flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting…
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Submit Report
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
