import { useRef, useEffect } from 'react';

/**
 * 6-digit segmented OTP input component
 * Props:
 *   otp        {string}   - controlled value (e.g. "123456")
 *   setOtp     {function} - setter from parent useState
 *   disabled   {boolean}  - disable all boxes
 *   onComplete {function} - called when all 6 digits are entered
 */
export default function OTPInput({ otp, setOtp, disabled = false, onComplete }) {
  const inputRefs = useRef([]);

  // Auto-focus first box on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (e, index) => {
    const val = e.target.value.replace(/\D/g, ''); // digits only
    if (!val) return;

    const newOtp = otp.split('');
    newOtp[index] = val.slice(-1); // take last digit if pasted multi-char
    const joined = newOtp.join('');
    setOtp(joined);

    // Move focus forward
    if (val && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Trigger completion
    if (joined.length === 6 && !joined.includes('') && onComplete) {
      onComplete(joined);
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      if (otp[index]) {
        // Clear current box
        const newOtp = otp.split('');
        newOtp[index] = '';
        setOtp(newOtp.join(''));
      } else if (index > 0) {
        // Move to previous box
        const newOtp = otp.split('');
        newOtp[index - 1] = '';
        setOtp(newOtp.join(''));
        inputRefs.current[index - 1]?.focus();
      }
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    setOtp(pasted.padEnd(6, '').slice(0, 6));
    // Focus the last filled or next box
    const nextIndex = Math.min(pasted.length, 5);
    inputRefs.current[nextIndex]?.focus();
    if (pasted.length === 6 && onComplete) onComplete(pasted);
  };

  return (
    <div className="flex gap-3 justify-center" onPaste={handlePaste}>
      {Array.from({ length: 6 }).map((_, index) => (
        <input
          key={index}
          id={`otp-${index}`}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={otp[index] || ''}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          disabled={disabled}
          autoComplete="one-time-code"
          className={`
            w-12 h-14 text-center text-xl font-bold rounded-xl border-2
            transition-all duration-200 outline-none
            ${otp[index]
              ? 'border-rtu-blue bg-blue-50 text-rtu-navy shadow-sm'
              : 'border-gray-200 bg-gray-50 text-gray-800'
            }
            focus:border-rtu-blue focus:bg-blue-50 focus:ring-2 focus:ring-rtu-blue/20
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        />
      ))}
    </div>
  );
}
