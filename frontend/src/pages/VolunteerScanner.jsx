import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import axios from 'axios';
import toast from 'react-hot-toast';

const VolunteerScanner = () => {
  const { eventId, token } = useParams();
  const [message, setMessage] = useState('Initializing camera...');
  const [scannedList, setScannedList] = useState([]);
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef(null);
  const isProcessing = useRef(false);

  useEffect(() => {
    const scanner = new Html5Qrcode('qr-reader');
    scannerRef.current = scanner;

    // Initialize scanner with available cameras, prefer back/environment camera
    Html5Qrcode.getCameras()
      .then((cameras) => {
        if (!cameras || cameras.length === 0) {
          console.error('No cameras found for QR scanning');
          setMessage('❌ No camera available');
          return;
        }
        // Prefer a camera whose label mentions back or environment
        const backCamera = cameras.find((c) => /back|environment/i.test(c.label)) || cameras[0];
        const cameraId = backCamera.id;
        // Start scanner with higher fps and larger qrbox for better detection
        scanner
          .start(
            cameraId,
            { fps: 15, qrbox: { width: 300, height: 300 } },
            async (decodedText) => {
              // Prevent duplicate rapid scans
              if (isProcessing.current) return;
              isProcessing.current = true;

              try {
                // Trim whitespace from raw QR string
                const raw = decodedText.trim();
                console.log('QR decoded raw:', raw);
                // Detect if scanned QR is a volunteer link (contains eventId and token)
                const urlParts = raw.split('/').filter(Boolean);
                const isVolunteerLink = urlParts.includes(eventId) && urlParts.includes(token);
                if (isVolunteerLink) {
                  toast.error('Scanned QR is a volunteer link, not a student ID');
                  setMessage('⚠️ Invalid QR for attendance');
                  // Reset processing after short delay
                  setTimeout(() => {
                    isProcessing.current = false;
                    setMessage('Ready — scan next QR code');
                  }, 2000);
                  return;
                }

                // Assume QR contains student identifier (enrollment number or roll)
                const identifier = raw.includes('/') ? raw.split('/').pop() : raw;

                // Build API URL (supports VITE env var)
                const backendBase = import.meta.env.VITE_BACKEND_URL || '';
                const apiUrl = backendBase
                  ? `${backendBase}/api/attendance/${eventId}/${token}/scan`
                  : `http://localhost:5000/api/attendance/${eventId}/${token}/scan`;

                const res = await axios.post(
                  apiUrl,
                  { studentIdentifier: identifier },
                  { headers: { 'Content-Type': 'application/json' } }
                );
                console.log('Attendance response:', res.data);
                toast.success(res.data.message || 'Attendance recorded!');
                setMessage(`✅ Scanned: ${identifier}`);
                setScannedList((prev) => [
                  { id: identifier, time: new Date().toLocaleTimeString(), msg: res.data.message },
                  ...prev,
                ]);
              } catch (err) {
                console.error(err);
                const errMsg = err.response?.data?.message || 'Scan failed';
                toast.error(errMsg);
                setMessage(`❌ Error: ${errMsg}`);
              } finally {
                // Allow next scan after 2 seconds
                setTimeout(() => {
                  isProcessing.current = false;
                  setMessage('Ready — scan next QR code');
                }, 2000);
              }
            },
            (errorMessage) => { console.warn('QR Scan error:', errorMessage); }
          )
          .then(() => {
            setScanning(true);
            setMessage('Ready — point camera at student QR code');
          })
          .catch((err) => {
            console.error('Camera start error:', err);
            setMessage('❌ Camera error');
          });
      })
      .catch((err) => {
        console.error('Failed to get cameras:', err);
        setMessage('❌ Unable to access camera');
      });

    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [eventId, token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-indigo-950 flex flex-col items-center p-4">
      {/* Header */}
      <div className="text-center mb-6 mt-4">
        <h2 className="text-2xl font-bold text-white mb-1">📷 Volunteer QR Scanner</h2>
        <p className="text-sm text-indigo-300">Scan student QR codes to mark attendance</p>
      </div>

      {/* Scanner viewport */}
      <div className="w-full max-w-sm bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10">
        <div id="qr-reader" style={{ width: '100%' }} />
      </div>

      {/* Status message */}
      <div className={`mt-4 px-4 py-2 rounded-xl text-sm font-semibold text-center max-w-sm w-full ${
        message.startsWith('✅') ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
        message.startsWith('❌') ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
        'bg-white/10 text-indigo-200 border border-white/10'
      }`}>
        {message}
      </div>

      {/* Scanned list */}
      {scannedList.length > 0 && (
        <div className="mt-6 w-full max-w-sm">
          <h3 className="text-sm font-bold text-white mb-2">
            Recent Scans ({scannedList.length})
          </h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {scannedList.map((s, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 flex items-center justify-between border border-white/5">
                <span className="text-white text-xs font-mono">{s.id}</span>
                <span className="text-indigo-300 text-[11px]">{s.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VolunteerScanner;
