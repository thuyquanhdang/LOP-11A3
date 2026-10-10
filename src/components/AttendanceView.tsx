import React, { useState, useEffect } from 'react';
import { 
  CalendarCheck, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  UserX, 
  Sparkles, 
  Save, 
  Check, 
  ChevronLeft, 
  ChevronRight,
  HelpCircle,
  FileSpreadsheet,
  Zap,
  ExternalLink,
  Copy,
  Download,
  Settings,
  RefreshCw,
  X,
  Link,
  ShieldCheck,
  Info
} from 'lucide-react';
import { Student, AttendanceRecord, AttendanceStatus, DailyAttendance, ClassInfo } from '../types';
import { 
  GOOGLE_APPS_SCRIPT_CODE, 
  GOOGLE_SHEET_STORAGE_KEY, 
  LAST_SYNCED_KEY, 
  syncAttendanceToGoogleSheet, 
  SyncPayload 
} from '../utils/googleAppsScript';

interface AttendanceViewProps {
  students: Student[];
  attendance: AttendanceRecord[];
  classInfo?: ClassInfo;
  onSaveAttendance: (record: AttendanceRecord) => void;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  students,
  attendance,
  classInfo,
  onSaveAttendance
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [justSaved, setJustSaved] = useState(false);

  // Google Apps Script integration state
  const [googleSheetUrl, setGoogleSheetUrl] = useState<string>(() => {
    return localStorage.getItem(GOOGLE_SHEET_STORAGE_KEY) || '';
  });
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [tempUrl, setTempUrl] = useState(googleSheetUrl);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success?: boolean; message?: string } | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<'setup' | 'code' | 'guide'>('setup');
  const [syncStatusNotification, setSyncStatusNotification] = useState<{
    show: boolean;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
  } | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string>(() => {
    return localStorage.getItem(LAST_SYNCED_KEY) || '';
  });

  // Find attendance for selected date or initialize with default 'present' for all students
  const currentRecord = attendance.find(a => a.date === selectedDate);
  
  // Local editable state for current day
  const [dailyRecords, setDailyRecords] = useState<DailyAttendance[]>(() => {
    if (currentRecord) {
      return currentRecord.records;
    }
    return students.map(s => ({ studentId: s.id, status: 'present' as AttendanceStatus }));
  });

  // Whenever selectedDate changes, reload dailyRecords
  useEffect(() => {
    const rec = attendance.find(a => a.date === selectedDate);
    if (rec) {
      // Merge with any new students added
      const merged = students.map(s => {
        const existing = rec.records.find(r => r.studentId === s.id);
        return existing || { studentId: s.id, status: 'present' as AttendanceStatus };
      });
      setDailyRecords(merged);
    } else {
      setDailyRecords(students.map(s => ({ studentId: s.id, status: 'present' as AttendanceStatus })));
    }
  }, [selectedDate, attendance, students]);

  // Status counters
  const total = students.length;
  const presentCount = dailyRecords.filter(r => r.status === 'present').length;
  const excusedCount = dailyRecords.filter(r => r.status === 'excused').length;
  const unexcusedCount = dailyRecords.filter(r => r.status === 'unexcused').length;
  const lateCount = dailyRecords.filter(r => r.status === 'late').length;
  const attendanceRate = total > 0 ? Math.round(((presentCount + lateCount) / total) * 1000) / 10 : 100;

  // Change individual student status
  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setDailyRecords(prev => {
      const updated = prev.map(r => r.studentId === studentId ? { ...r, status } : r);
      // Auto persist immediately to prevent data loss
      onSaveAttendance({ date: selectedDate, records: updated });
      return updated;
    });
    triggerSavedIndicator();
  };

  // Change individual note
  const handleNoteChange = (studentId: string, note: string) => {
    setDailyRecords(prev => {
      const updated = prev.map(r => r.studentId === studentId ? { ...r, note } : r);
      onSaveAttendance({ date: selectedDate, records: updated });
      return updated;
    });
  };

  // Quick action: Mark all present
  const handleMarkAllPresent = () => {
    const allPresent = students.map(s => ({ studentId: s.id, status: 'present' as AttendanceStatus }));
    setDailyRecords(allPresent);
    onSaveAttendance({ date: selectedDate, records: allPresent });
    triggerSavedIndicator();
  };

  const triggerSavedIndicator = () => {
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  };

  // Date stepper
  const handleShiftDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  // Construct current payload for Google Sheet
  const buildSyncPayload = (): SyncPayload => {
    const currentClassName = classInfo?.className || '11A3';
    const currentTeacher = classInfo?.homeroomTeacher || 'Đặng Thị Thùy Quanh';

    const records = students.map(st => {
      const rec = dailyRecords.find(r => r.studentId === st.id) || { studentId: st.id, status: 'present' as AttendanceStatus };
      return {
        studentId: st.id,
        studentCode: st.code,
        fullName: st.fullName,
        ethnicity: st.ethnicity,
        gender: st.gender,
        status: rec.status,
        note: rec.note || ''
      };
    });

    return {
      action: 'saveAttendance',
      className: currentClassName,
      homeroomTeacher: currentTeacher,
      date: selectedDate,
      records: records,
      summary: {
        total,
        presentCount,
        excusedCount,
        unexcusedCount,
        lateCount,
        attendanceRate
      }
    };
  };

  // Trigger "Điểm danh ngay" button
  const handleDirectAttendance = async () => {
    // 1. Save locally first
    onSaveAttendance({ date: selectedDate, records: dailyRecords });
    triggerSavedIndicator();

    // 2. Check if Google Sheet URL is set
    const activeUrl = googleSheetUrl.trim();
    if (!activeUrl) {
      setTempUrl('');
      setActiveModalTab('setup');
      setIsSyncModalOpen(true);
      return;
    }

    // 3. Send to Google Apps Script
    setIsSyncing(true);
    try {
      const payload = buildSyncPayload();
      const res = await syncAttendanceToGoogleSheet(activeUrl, payload);
      
      const timeNow = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const timeStr = `${timeNow} (${selectedDate})`;
      setLastSyncTime(timeStr);
      localStorage.setItem(LAST_SYNCED_KEY, timeStr);

      setSyncStatusNotification({
        show: true,
        type: 'success',
        title: 'Đã điểm danh & đồng bộ Google Sheet thành công!',
        message: `Đã lưu danh sách ${students.length} học sinh Lớp ${classInfo?.className || '11A3'} ngày ${selectedDate} vào Google Sheet (Có mặt: ${presentCount}, Nghỉ có phép: ${excusedCount}, Nghỉ không phép: ${unexcusedCount}, Đi muộn: ${lateCount}).`
      });

      setTimeout(() => {
        setSyncStatusNotification(null);
      }, 5000);
    } catch {
      setSyncStatusNotification({
        show: true,
        type: 'error',
        title: 'Lỗi gửi dữ liệu điểm danh',
        message: 'Không thể kết nối đến Web App. Vui lòng kiểm tra lại URL Google Apps Script và quyền truy cập.'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Test Web App connection
  const handleTestConnection = async () => {
    if (!tempUrl.trim()) {
      setTestResult({ success: false, message: 'Vui lòng nhập URL Google Apps Script Web App.' });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const pingPayload: SyncPayload = {
        action: 'ping',
        className: classInfo?.className || '11A3',
        homeroomTeacher: classInfo?.homeroomTeacher || 'Đặng Thị Thùy Quanh',
        date: selectedDate,
        records: [],
        summary: { total: 0, presentCount: 0, excusedCount: 0, unexcusedCount: 0, lateCount: 0, attendanceRate: 100 }
      };

      const res = await syncAttendanceToGoogleSheet(tempUrl.trim(), pingPayload);
      setTestResult({
        success: true,
        message: res.message || 'Kết nối Google Apps Script thành công! Web App phản hồi tốt.'
      });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setTestResult({
        success: false,
        message: 'Không thể kết nối. Hãy đảm bảo bạn đã triển khai Web App với quyền "Ai có quyền truy cập: Bất kỳ ai". Chi tiết: ' + errMsg
      });
    } finally {
      setIsTesting(false);
    }
  };

  // Save URL configuration
  const handleSaveGoogleSheetConfig = () => {
    const clean = tempUrl.trim();
    setGoogleSheetUrl(clean);
    localStorage.setItem(GOOGLE_SHEET_STORAGE_KEY, clean);
    setIsSyncModalOpen(false);

    if (clean) {
      setSyncStatusNotification({
        show: true,
        type: 'success',
        title: 'Đã lưu cấu hình Google Sheet',
        message: 'Bạn có thể bấm "Điểm danh ngay" bất cứ lúc nào để tự động ghi dữ liệu vào Sheet.'
      });
      setTimeout(() => setSyncStatusNotification(null), 4000);
    }
  };

  // Copy code to clipboard
  const handleCopyCode = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  // Download .gs file
  const handleDownloadCode = () => {
    const element = document.createElement('a');
    const file = new Blob([GOOGLE_APPS_SCRIPT_CODE], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = 'Code_DiemDanh_11A3.gs';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner / Sync Notification */}
      {syncStatusNotification && (
        <div className={`p-4 rounded-2xl border transition-all animate-fade-in flex items-start justify-between gap-3 ${
          syncStatusNotification.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
            : 'bg-rose-50 border-rose-200 text-rose-900'
        }`}>
          <div className="flex items-start gap-3">
            {syncStatusNotification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div>
              <h4 className="font-bold text-sm">{syncStatusNotification.title}</h4>
              <p className="text-xs mt-0.5 leading-relaxed">{syncStatusNotification.message}</p>
            </div>
          </div>
          <button 
            onClick={() => setSyncStatusNotification(null)}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Controls: Date Selector & Quick Actions */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Date Stepper */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleShiftDate(-1)}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
            title="Ngày trước"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="relative flex items-center">
            <Calendar className="w-4 h-4 text-blue-600 absolute left-3 pointer-events-none" />
            <input
              id="attendance-date-picker"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <button
            onClick={() => handleShiftDate(1)}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
            title="Ngày sau"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {selectedDate !== todayStr && (
            <button
              onClick={() => setSelectedDate(todayStr)}
              className="px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition"
            >
              Hôm nay
            </button>
          )}

          {/* Connection Status Badge */}
          <button
            onClick={() => {
              setTempUrl(googleSheetUrl);
              setIsSyncModalOpen(true);
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition ${
              googleSheetUrl 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100' 
                : 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
            }`}
            title="Cài đặt kết nối Google Sheet"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>{googleSheetUrl ? 'Google Sheet: Đã kết nối' : 'Kết nối Google Sheet'}</span>
            <Settings className="w-3 h-3 text-slate-400 ml-0.5" />
          </button>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {justSaved && (
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Đã lưu bộ nhớ
            </span>
          )}

          {/* All present quick button */}
          <button
            id="mark-all-present-btn"
            onClick={handleMarkAllPresent}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold transition"
          >
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Tất cả có mặt</span>
          </button>

          {/* PRIMARY BUTTON: "ĐIỂM DANH NGAY" */}
          <button
            id="btn-diem-danh-ngay"
            onClick={handleDirectAttendance}
            disabled={isSyncing}
            className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {isSyncing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Đang gửi Google Sheet...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                <span>Điểm danh ngay</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Sync Sub-Bar if last synced info available */}
      {lastSyncTime && (
        <div className="px-4 py-2 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Đồng bộ lần cuối: <strong className="text-slate-700">{lastSyncTime}</strong>
          </span>
          <span className="text-slate-400">
            Dữ liệu tự động lưu vào tab: <strong className="text-slate-600">Điểm_Danh_{classInfo?.className || '11A3'}</strong>
          </span>
        </div>
      )}

      {/* Summary KPI Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500">Sĩ số lớp</span>
          <p className="text-xl font-bold text-slate-800 mt-1">{total}</p>
          <p className="text-[10px] text-slate-400">Học sinh Lớp {classInfo?.className || '11A3'}</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/30 shadow-xs">
          <span className="text-[11px] font-semibold text-emerald-800">Có mặt</span>
          <p className="text-xl font-bold text-emerald-700 mt-1">{presentCount}</p>
          <p className="text-[10px] text-emerald-600 font-medium">{Math.round((presentCount/total)*100)}% tổng số</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-blue-200 bg-blue-50/30 shadow-xs">
          <span className="text-[11px] font-semibold text-blue-800">Nghỉ có phép</span>
          <p className="text-xl font-bold text-blue-700 mt-1">{excusedCount}</p>
          <p className="text-[10px] text-blue-600 font-medium">Có đơn / gọi điện</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-rose-200 bg-rose-50/30 shadow-xs">
          <span className="text-[11px] font-semibold text-rose-800">Nghỉ không phép</span>
          <p className="text-xl font-bold text-rose-700 mt-1">{unexcusedCount}</p>
          <p className="text-[10px] text-rose-600 font-medium">Cần liên hệ gia đình</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-amber-200 bg-amber-50/30 shadow-xs col-span-2 sm:col-span-1">
          <span className="text-[11px] font-semibold text-amber-800">Đi muộn</span>
          <p className="text-xl font-bold text-amber-700 mt-1">{lateCount}</p>
          <p className="text-[10px] text-amber-600 font-medium">Tiết 1 đầu giờ</p>
        </div>
      </div>

      {/* Attendance Sheet Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <CalendarCheck className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-800 text-sm">
              Bảng điểm danh ngày: <span className="text-blue-600">{selectedDate}</span>
            </h3>
          </div>
          <div className="flex items-center space-x-2 text-xs text-slate-500 font-medium">
            <span>Tự động cập nhật khi đổi trạng thái</span>
            <span>•</span>
            <button
              onClick={() => setIsSyncModalOpen(true)}
              className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 font-semibold"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Xem mã Google Apps Script
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4 w-12 text-center">STT</th>
                <th className="py-3 px-4">Họ và tên</th>
                <th className="py-3 px-3">Dân tộc</th>
                <th className="py-3 px-3">Mã HS</th>
                <th className="py-3 px-4 text-center">Trạng thái điểm danh</th>
                <th className="py-3 px-4">Lý do / Ghi chú</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {students.map((student, idx) => {
                const record = dailyRecords.find(r => r.studentId === student.id) || { studentId: student.id, status: 'present' as AttendanceStatus };
                const currentStatus = record.status;

                return (
                  <tr key={student.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 text-center font-medium text-slate-400">
                      {idx + 1}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2.5">
                        <div className={`w-7 h-7 rounded-full ${student.avatarColor || 'bg-blue-600'} text-white flex items-center justify-center font-bold text-[11px] shrink-0`}>
                          {student.fullName.split(' ').slice(-1)[0]?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{student.fullName}</p>
                          <p className="text-[10px] text-slate-400">{student.gender}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                        student.ethnicity === 'Chăm' 
                          ? 'bg-purple-100 text-purple-700' 
                          : student.ethnicity === 'Ba-na' 
                          ? 'bg-amber-100 text-amber-800' 
                          : 'bg-blue-50 text-blue-700'
                      }`}>
                        {student.ethnicity}
                      </span>
                    </td>

                    <td className="py-3 px-3 font-mono font-medium text-slate-500">
                      {student.code}
                    </td>

                    {/* 4 Interactive Status Buttons */}
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center space-x-1 sm:space-x-1.5">
                        {/* Có mặt */}
                        <button
                          type="button"
                          onClick={() => handleStatusChange(student.id, 'present')}
                          className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] font-semibold transition flex items-center gap-1 ${
                            currentStatus === 'present'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Có mặt</span>
                        </button>

                        {/* Nghỉ có phép */}
                        <button
                          type="button"
                          onClick={() => handleStatusChange(student.id, 'excused')}
                          className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] font-semibold transition flex items-center gap-1 ${
                            currentStatus === 'excused'
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700'
                          }`}
                        >
                          <HelpCircle className="w-3.5 h-3.5" />
                          <span>Có phép</span>
                        </button>

                        {/* Nghỉ không phép */}
                        <button
                          type="button"
                          onClick={() => handleStatusChange(student.id, 'unexcused')}
                          className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] font-semibold transition flex items-center gap-1 ${
                            currentStatus === 'unexcused'
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-700'
                          }`}
                        >
                          <UserX className="w-3.5 h-3.5" />
                          <span>Không phép</span>
                        </button>

                        {/* Đi muộn */}
                        <button
                          type="button"
                          onClick={() => handleStatusChange(student.id, 'late')}
                          className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] font-semibold transition flex items-center gap-1 ${
                            currentStatus === 'late'
                              ? 'bg-amber-500 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-700'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>Đi muộn</span>
                        </button>
                      </div>
                    </td>

                    {/* Note Input */}
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        placeholder="Ghi chú (VD: Ốm, có đơn phép, xe hỏng...)"
                        value={record.note || ''}
                        onChange={(e) => handleNoteChange(student.id, e.target.value)}
                        className="w-full px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: KẾT NỐI GOOGLE SHEET & GOOGLE APPS SCRIPT                         */}
      {/* ========================================================================= */}
      {isSyncModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-8">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 p-5 text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-white/15">
                  <FileSpreadsheet className="w-6 h-6 text-emerald-300" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Kết nối Google Sheet & Google Apps Script</h3>
                  <p className="text-xs text-blue-100">
                    Tự động lưu bảng điểm danh Lớp {classInfo?.className || '11A3'} vào Google Drive của bạn
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSyncModalOpen(false)}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-slate-200 bg-slate-50 px-5 pt-3">
              <button
                onClick={() => setActiveModalTab('setup')}
                className={`pb-3 px-4 text-xs font-bold border-b-2 transition ${
                  activeModalTab === 'setup'
                    ? 'border-blue-600 text-blue-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                1. Cài đặt Web App URL
              </button>
              <button
                onClick={() => setActiveModalTab('code')}
                className={`pb-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
                  activeModalTab === 'code'
                    ? 'border-blue-600 text-blue-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>2. Mã Google Apps Script</span>
                <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-700 rounded text-[10px]">Ready</span>
              </button>
              <button
                onClick={() => setActiveModalTab('guide')}
                className={`pb-3 px-4 text-xs font-bold border-b-2 transition ${
                  activeModalTab === 'guide'
                    ? 'border-blue-600 text-blue-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                3. Hướng dẫn 4 bước
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
              {/* TAB 1: SETUP */}
              {activeModalTab === 'setup' && (
                <div className="space-y-5">
                  <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-100 flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-blue-900 space-y-1">
                      <p className="font-bold">Cách hoạt động:</p>
                      <p className="text-blue-800">
                        Khi bạn bấm nút <strong className="text-emerald-700">"Điểm danh ngay"</strong>, ứng dụng sẽ gửi danh sách điểm danh 38 học sinh tới Google Apps Script Web App của bạn, và tự động tạo/cập nhật bảng tính Google Sheet tương ứng.
                      </p>
                    </div>
                  </div>

                  {/* URL Input */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700">
                      URL Google Apps Script Web App (Có đuôi /exec):
                    </label>
                    <div className="relative">
                      <Link className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="url"
                        placeholder="https://script.google.com/macros/s/.../exec"
                        value={tempUrl}
                        onChange={(e) => setTempUrl(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400">
                      * Bạn lấy link này sau khi chọn: Triển khai (Deploy) → Ứng dụng web (Web app) trong Google Apps Script.
                    </p>
                  </div>

                  {/* Test Status Banner */}
                  {testResult && (
                    <div className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                      testResult.success 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                        : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}>
                      {testResult.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      )}
                      <span>{testResult.message}</span>
                    </div>
                  )}

                  {/* Quick Guide summary */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <p className="text-xs font-bold text-slate-700">Chưa có mã Google Apps Script?</p>
                    <p className="text-xs text-slate-500">
                      Chuyển sang tab <strong>"2. Mã Google Apps Script"</strong> để sao chép mã code đã được tạo sẵn riêng cho Lớp 11A3 của cô Đặng Thị Thùy Quanh.
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 2: CODE */}
              {activeModalTab === 'code' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-slate-800">Tệp mã nguồn Code.gs</h4>
                      <p className="text-xs text-slate-500">Đã tối ưu chuẩn cho 38 học sinh Lớp 11A3 & tạo tiêu đề tự động</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleDownloadCode}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                        title="Tải về file .gs"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Tải file .gs</span>
                      </button>
                      <button
                        onClick={handleCopyCode}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
                      >
                        {copySuccess ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-300" />
                            <span>Đã sao chép!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Sao chép mã</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-900 text-slate-200 font-mono text-[11px] p-4 max-h-[350px] overflow-y-auto leading-relaxed">
                    <pre>{GOOGLE_APPS_SCRIPT_CODE}</pre>
                  </div>
                </div>
              )}

              {/* TAB 3: STEP-BY-STEP GUIDE */}
              {activeModalTab === 'guide' && (
                <div className="space-y-4">
                  <div className="space-y-3 text-xs text-slate-700">
                    <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1">
                      <span className="font-bold text-blue-700 text-sm">Bước 1: Mở Google Sheet</span>
                      <p className="text-slate-600">
                        Mở Google Drive của bạn, tạo một <strong>Bảng tính Google mới (Google Sheets)</strong> hoặc mở một bảng tính đã có. Đặt tên ví dụ: <em>"Điểm Danh Lớp 11A3 - 2026-2027"</em>.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1">
                      <span className="font-bold text-blue-700 text-sm">Bước 2: Mở Apps Script</span>
                      <p className="text-slate-600">
                        Trên thanh menu của Google Sheet, chọn: <strong>Tiện ích mở rộng (Extensions) → Apps Script</strong>.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1">
                      <span className="font-bold text-blue-700 text-sm">Bước 3: Dán mã & Triển khai Web App</span>
                      <p className="text-slate-600">
                        Xóa sạch mã mặc định trong tệp <code>Code.gs</code>, dán toàn bộ mã ở tab <strong>"2. Mã Google Apps Script"</strong> vào.
                      </p>
                      <p className="text-slate-600 mt-1">
                        Nhấn nút <strong>Triển khai (Deploy)</strong> ở góc trên bên phải → Chọn <strong>Tùy chọn triển khai mới (New deployment)</strong>:
                      </p>
                      <ul className="list-disc pl-5 mt-1 space-y-1 text-slate-600">
                        <li>Chọn loại: <strong>Ứng dụng web (Web app)</strong></li>
                        <li>Thực thi dưới dạng (Execute as): <strong>Tôi (Me)</strong></li>
                        <li>Ai có quyền truy cập (Who has access): <strong>Bất kỳ ai (Anyone)</strong> *(Quan trọng để web gửi được dữ liệu)*</li>
                        <li>Nhấn <strong>Triển khai (Deploy)</strong> và cấp quyền Google Account nếu được hỏi.</li>
                      </ul>
                    </div>

                    <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1">
                      <span className="font-bold text-blue-700 text-sm">Bước 4: Sao chép URL & Lưu</span>
                      <p className="text-slate-600">
                        Sao chép đường link <strong>URL của ứng dụng web</strong> (có đuôi <code>/exec</code>), dán vào tab <strong>"1. Cài đặt Web App URL"</strong> và nhấn <strong>Lưu cấu hình</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
              <div>
                {activeModalTab === 'setup' && (
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={isTesting || !tempUrl.trim()}
                    className="px-3.5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold transition flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isTesting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Đang kiểm tra...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                        <span>Kiểm tra kết nối</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsSyncModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={handleSaveGoogleSheetConfig}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs"
                >
                  Lưu cấu hình
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
