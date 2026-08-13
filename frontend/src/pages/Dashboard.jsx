import { useState, useEffect, useCallback } from 'react';
import { 
  User, Award, BookOpen, AlertCircle, RefreshCw, 
  Phone, Mail, CheckCircle2, ShieldAlert, AlertTriangle, FileText
} from 'lucide-react';
import Navbar from '../components/Navbar';
import CGPAMeter from '../components/CGPAMeter';
import SGPACard from '../components/SGPACard';
import BacklogBadge from '../components/BacklogBadge';
import DiscrepancyModal from '../components/DiscrepancyModal';
import { QRCodeCanvas } from 'qrcode.react';
import { studentAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const [profile, setProfile]               = useState(null);
  const [loading, setLoading]               = useState(true);
  const [refreshing, setRefreshing]         = useState(false);
  const [isModalOpen, setIsModalOpen]       = useState(false);

  const fetchProfile = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const res = await studentAPI.getProfile();
      if (res.data?.success) {
        setProfile(res.data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch student data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  if (loading) {
    return (
      <div className="min-h-screen bg-rtu-light flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-rtu-navy border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-rtu-navy animate-pulse">
            Fetching student record from central system...
          </p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-rtu-light">
        <Navbar onRefresh={() => fetchProfile(true)} />
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <div className="bg-white p-8 rounded-2xl shadow-card border border-gray-100 max-w-md mx-auto">
            <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-gray-800 mb-2">Record Not Found</h2>
            <p className="text-sm text-gray-500 mb-6">
              Unable to load student record from the Google Sheet database. Please contact T&P Office.
            </p>
            <button 
              onClick={() => fetchProfile()} 
              className="btn-primary inline-flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Retry Fetching
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-rtu-light pb-12">
      <Navbar studentName={profile.studentName} onRefresh={() => fetchProfile(true)} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* Banner & General Info */}
        <div className="bg-rtu-gradient rounded-3xl p-6 sm:p-8 text-white shadow-rtu-lg relative overflow-hidden">
          {/* Background Accents */}
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-rtu-gold/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 flex items-center justify-center shadow-inner">
                <User className="w-8 h-8 sm:w-10 sm:h-10 text-rtu-gold" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black font-display tracking-tight">
                    {profile.studentName}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rtu-gold text-rtu-navy">
                    {profile.branch}
                  </span>
                </div>
                <p className="text-blue-100 text-xs sm:text-sm mt-0.5">
                  Roll No: <span className="font-semibold text-white">{profile.rollNumber}</span> &bull; 
                  Enrollment: <span className="font-semibold text-white">{profile.rtuEnrollmentNo}</span>
                </p>
                <div className="flex flex-wrap gap-4 mt-3 text-xs text-blue-200">
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-rtu-gold" /> {profile.email}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-rtu-gold" /> {profile.phoneNumber || 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions / Discrepancy Button */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
              <button
                id="report-discrepancy-btn"
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-xs font-semibold text-white flex items-center justify-center gap-2 transition-all duration-200"
              >
                <FileText className="w-4 h-4 text-rtu-gold" />
                Report Discrepancy
              </button>
            </div>
          </div>
        </div>

        {/* Persistent Student QR Code (static for lifetime) */}
        <div className="mt-6 flex flex-col items-center">
          <p className="text-sm font-medium text-gray-600 mb-2">
            Scan this QR to mark attendance
          </p>
          <QRCodeCanvas
            value={profile.rtuEnrollmentNo}
            size={150}
            bgColor="#ffffff"
            fgColor="#003087"
            level="M"
          />
        </div>

        {/* Academic Overview Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* CGPA Meter Card */}
          <div className="stat-card flex flex-col items-center justify-between">
            <div className="flex items-center justify-between w-full mb-4">
              <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <Award className="w-4 h-4 text-rtu-blue" />
                Overall CGPA
              </h3>
              <span className="text-[10px] bg-blue-50 text-rtu-blue px-2 py-0.5 rounded-full font-semibold">
                Sem {profile.currentYearSem}
              </span>
            </div>
            
            <CGPAMeter cgpa={profile.currentCGPA} />

            <div className="mt-4 pt-4 border-t border-gray-100 w-full text-center">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                profile.isEligibleForPlacements 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {profile.isEligibleForPlacements ? (
                  <><CheckCircle2 className="w-3.5 h-3.5" /> Eligible for Placement Drives</>
                ) : (
                  <><AlertTriangle className="w-3.5 h-3.5" /> Ineligible / Needs Review</>
                )}
              </span>
            </div>
          </div>

          {/* Backlog Status Card */}
          <div className="stat-card md:col-span-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rtu-blue" />
                  Academic Standing & Backlogs
                </h3>
              </div>

              <BacklogBadge 
                count={profile.activeBacklogsCount} 
                details={profile.backlogDetails} 
              />
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-600 space-y-1">
              <p className="font-semibold text-gray-800">📌 Placement Eligibility Criteria:</p>
              <p>&bull; Minimum CGPA of <strong>7.00</strong> across completed semesters.</p>
              <p>&bull; Maximum of <strong>0 active backlogs</strong> allowed for core hiring drives.</p>
            </div>
          </div>
        </div>

        {/* Semester SGPA Breakdown */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-800 flex items-center gap-2 font-display">
              <BookOpen className="w-4 h-4 text-rtu-blue" />
              Semester-wise SGPA Breakdown
            </h2>
            <span className="text-xs text-gray-500 font-medium">
              Data synchronized live with central sheet
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            <SGPACard sem={1} sgpa={profile.sgpa?.sem1} />
            <SGPACard sem={2} sgpa={profile.sgpa?.sem2} />
            <SGPACard sem={3} sgpa={profile.sgpa?.sem3} />
            <SGPACard sem={4} sgpa={profile.sgpa?.sem4} />
            <SGPACard sem={5} sgpa={profile.sgpa?.sem5} />
            <SGPACard sem={6} sgpa={profile.sgpa?.sem6} />
          </div>
        </div>

      </main>

      {/* Discrepancy Modal */}
      <DiscrepancyModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        profile={profile}
      />
    </div>
  );
}
