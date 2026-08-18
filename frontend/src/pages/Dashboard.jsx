import { useState, useEffect, useCallback } from 'react';
import {
  User, Award, BookOpen, AlertCircle, RefreshCw,
  Phone, Mail, CheckCircle2, ShieldAlert, AlertTriangle, FileText, Download, QrCode, Calendar
} from 'lucide-react';
import Navbar from '../components/Navbar';
import CGPAMeter from '../components/CGPAMeter';
import SGPACard from '../components/SGPACard';
import BacklogBadge from '../components/BacklogBadge';
import { QRCodeCanvas } from 'qrcode.react';
import { studentAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState('btech');

  const fetchProfile = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const res = await studentAPI.getProfile();
      if (res.data?.success) {
        const studentData = res.data.data;
        setProfile(studentData);
        const saved = localStorage.getItem('selectedCourse');
        setSelectedCourse(saved || studentData.primaryCourse || 'btech');
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

  const activeCourseData = profile.courses?.[selectedCourse] || {
    sgpa: {},
    semestersDetails: {},
    cgpa: null,
    activeBacklogsCount: 0,
    backlogDetails: '',
    isEligibleForPlacements: false
  };

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
                  University Roll No: <span className="font-semibold text-white">{profile.rollNumber}</span> &bull; 
                  College Roll No: <span className="font-semibold text-white">{profile.collegeRollNo || 'N/A'}</span>
                </p>
                
                {selectedCourse === 'mba' && (activeCourseData.firstSpecialization || activeCourseData.secondSpecialization) && (
                  <p className="text-blue-100 text-xs mt-1.5 bg-white/10 rounded-lg py-1 px-2.5 inline-block border border-white/10">
                    MBA Specializations: <span className="font-semibold text-white">{activeCourseData.firstSpecialization || 'NA'}</span> &bull; <span className="font-semibold text-white">{activeCourseData.secondSpecialization || 'NA'}</span>
                  </p>
                )}
                
                {selectedCourse === 'mtech' && activeCourseData.specialization && (
                  <div className="mt-1.5 flex flex-col gap-1 text-blue-100 text-xs bg-white/10 rounded-xl p-2.5 border border-white/10 max-w-xl">
                    <p>M.Tech Specialization: <span className="font-semibold text-white">{activeCourseData.specialization}</span></p>
                    {activeCourseData.thesisTitle && activeCourseData.thesisTitle !== '0' && activeCourseData.thesisTitle !== 'NA' && (
                      <p className="italic">Thesis: <span className="font-semibold text-white">"{activeCourseData.thesisTitle}"</span></p>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap gap-4 mt-3 text-xs text-blue-200">
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-rtu-gold" /> {profile.email}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-rtu-gold" /> {profile.phoneNumber || 'N/A'}
                  </span>
                  {profile.dob && (
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-rtu-gold" /> DOB: {profile.dob}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Course Switcher Tabs */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="inline-flex p-1 bg-white border border-gray-200 rounded-2xl shadow-card gap-1">
            {[
              { id: 'btech', label: 'B.Tech Program' },
              { id: 'mba', label: 'MBA Program' },
              { id: 'mtech', label: 'M.Tech Program' }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setSelectedCourse(t.id);
                  localStorage.setItem('selectedCourse', t.id);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                  selectedCourse === t.id
                    ? 'bg-rtu-gradient text-white shadow-md'
                    : 'text-gray-500 hover:text-rtu-navy hover:bg-gray-50'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <span className="text-xs text-gray-500 font-semibold bg-white border border-gray-150 px-3 py-1.5 rounded-xl shadow-sm">
            Current View: <strong className="text-rtu-blue uppercase">{selectedCourse}</strong>
          </span>
        </div>

        {/* Academic Overview Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* CGPA Meter Card */}
          <div className="stat-card flex flex-col items-center justify-between">
            <div className="flex items-center justify-between w-full mb-4">
              <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <Award className="w-4 h-4 text-rtu-blue" />
                {selectedCourse === 'mtech' ? 'M.Tech Percentage/CGPA' : 'Overall CGPA'}
              </h3>
              <span className="text-[10px] bg-blue-50 text-rtu-blue px-2 py-0.5 rounded-full font-semibold uppercase">
                {selectedCourse}
              </span>
            </div>
            
            <CGPAMeter cgpa={activeCourseData.cgpa} />

            <div className="mt-4 pt-4 border-t border-gray-100 w-full text-center">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                activeCourseData.isEligibleForPlacements 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {activeCourseData.isEligibleForPlacements ? (
                  <>
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                    Eligible for Placement Drives
                  </>
                ) : (
                  <>
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                    Ineligible / Needs Review
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Backlog Status Card */}
          <div className="stat-card flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rtu-blue" />
                  Academic Standing & Backlogs
                </h3>
              </div>

              <BacklogBadge 
                count={activeCourseData.activeBacklogsCount} 
                details={activeCourseData.backlogDetails} 
              />
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-600 space-y-1">
              <p className="font-semibold text-gray-800">📌 Placement Eligibility:</p>
              <p>&bull; Minimum CGPA of <strong>7.00</strong> across semesters.</p>
              <p>&bull; Maximum of <strong>0 active backlogs</strong> allowed.</p>
            </div>
          </div>

          {/* Student QR Card */}
          <div className="stat-card flex flex-col items-center justify-between">
            <div className="flex items-center justify-between w-full mb-4">
              <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <QrCode className="w-4 h-4 text-rtu-blue" />
                Attendance QR
              </h3>
              <span className="text-[10px] bg-blue-50 text-rtu-blue px-2 py-0.5 rounded-full font-semibold">
                Student ID
              </span>
            </div>

            <div className="bg-white p-3 rounded-xl border-2 border-dashed border-blue-100 flex items-center justify-center my-auto">
              <QRCodeCanvas
                id="student-qr-canvas"
                value={profile.rollNumber || ''}
                size={140}
                bgColor="#ffffff"
                fgColor="#003087"
                level="H"
                includeMargin={true}
              />
            </div>

            <div className="w-full text-center mt-4 pt-4 border-t border-gray-100 flex flex-col gap-3">
              <button
                id="download-qr-btn"
                onClick={() => {
                  const canvas = document.getElementById('student-qr-canvas');
                  if (!canvas) return;
                  const url = canvas.toDataURL('image/png');
                  const link = document.createElement('a');
                  link.download = `QR_${profile.rollNumber || 'student'}.png`;
                  link.href = url;
                  link.click();
                }}
                className="w-full px-4 py-2.5 rounded-xl bg-rtu-gradient text-white text-xs font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all duration-200 shadow-md"
              >
                <Download className="w-4 h-4" /> Download QR
              </button>
            </div>
          </div>
        </div>

        {/* Prior Academic Records */}
        <div className="bg-white rounded-2xl p-6 shadow-card border border-gray-150">
          <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-4 font-display">
            <Award className="w-4 h-4 text-rtu-blue" />
            Prior Academic Records
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-[10px] uppercase font-bold text-gray-400">Class 10th (Percentage/CGPA)</p>
              <p className="text-lg font-black text-rtu-navy mt-1">{profile.class10 || 'N/A'}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-[10px] uppercase font-bold text-gray-400">Class 12th (Percentage/CGPA)</p>
              <p className="text-lg font-black text-rtu-navy mt-1">{profile.class12 || 'N/A'}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-[10px] uppercase font-bold text-gray-400">Diploma (Percentage/CGPA)</p>
              <p className="text-lg font-black text-rtu-navy mt-1">{profile.diploma || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Semester SGPA Breakdown */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-800 flex items-center gap-2 font-display">
              <BookOpen className="w-4 h-4 text-rtu-blue" />
              Semester-wise Academic Breakdown
            </h2>
            <span className="text-xs text-gray-500 font-medium">
              Data synchronized live with central sheet
            </span>
          </div>

          <div className={`grid gap-4 ${selectedCourse === 'btech' ? 'grid-cols-2 sm:grid-cols-4 lg:grid-cols-8' : 'grid-cols-2 sm:grid-cols-4'}`}>
            {Array.from({ length: selectedCourse === 'btech' ? 8 : 4 }, (_, i) => {
              const semNum = i + 1;
              const semKey = `sem${semNum}`;
              const semDetails = activeCourseData.semestersDetails?.[semKey] || {};
              return (
                <SGPACard
                  key={semNum}
                  sem={semNum}
                  sgpa={semDetails.sgpa}
                  result={semDetails.result}
                  back={semDetails.back || semDetails.backObtained}
                  pendingBacks={semDetails.backPending || (selectedCourse !== 'btech' ? semDetails.back : undefined)}
                />
              );
            })}
          </div>
        </div>

      </main>
    </div>
  );
}
