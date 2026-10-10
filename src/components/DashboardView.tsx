import React from 'react';
import { 
  Users, 
  UserCheck, 
  AlertTriangle, 
  Award, 
  TrendingUp, 
  HeartHandshake, 
  Calendar, 
  ArrowUpRight, 
  Sparkles, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  PhoneCall, 
  FileText,
  ChevronRight,
  UserX,
  Bot
} from 'lucide-react';
import { 
  Student, 
  ViolationRecord, 
  RewardRecord, 
  AttendanceRecord, 
  ConductEvaluation,
  ClassInfo,
  ActiveTab 
} from '../types';

interface DashboardViewProps {
  students: Student[];
  violations: ViolationRecord[];
  rewards: RewardRecord[];
  attendance: AttendanceRecord[];
  conduct: ConductEvaluation[];
  classInfo: ClassInfo;
  setActiveTab: (tab: ActiveTab) => void;
  onSelectStudent: (student: Student) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  students,
  violations,
  rewards,
  attendance,
  conduct,
  classInfo,
  setActiveTab,
  onSelectStudent
}) => {
  // Statistics Calculations
  const totalStudents = students.length;
  // Strict count per user specification: Nam 14, Nữ 24
  const maleCount = classInfo.maleCount ?? 14;
  const femaleCount = classInfo.femaleCount ?? 24;

  // Ethnicity exact counts based on 38 students
  const chamCount = students.filter(s => s.ethnicity === 'Chăm').length;
  const banaCount = students.filter(s => s.ethnicity === 'Ba-na' || s.ethnicity === 'Ba Na').length;
  const kinhCount = students.filter(s => s.ethnicity === 'Kinh').length;
  const ethnicMinorityCount = chamCount + banaCount;

  const attentionStudents = students.filter(s => s.needsAttention);
  const progressingStudents = students.filter(s => s.isProgressing);

  // Recent violations (this week)
  const recentViolations = violations.slice(0, 5);
  const unresolvedViolationsCount = violations.filter(v => !v.resolved).length;

  // Recent rewards
  const recentRewards = rewards.slice(0, 5);

  // Today attendance calculation
  const todayStr = new Date().toISOString().split('T')[0];
  const todayAttendance = attendance.find(a => a.date === todayStr) || attendance[0];
  
  let presentCount = 0;
  let excusedCount = 0;
  let unexcusedCount = 0;
  let lateCount = 0;
  let attendanceRate = 97.4;

  if (todayAttendance && todayAttendance.records.length > 0) {
    todayAttendance.records.forEach(r => {
      if (r.status === 'present') presentCount++;
      else if (r.status === 'excused') excusedCount++;
      else if (r.status === 'unexcused') unexcusedCount++;
      else if (r.status === 'late') lateCount++;
    });
    const totalRecorded = todayAttendance.records.length;
    attendanceRate = totalRecorded > 0 ? Math.round(((presentCount + lateCount) / totalRecorded) * 1000) / 10 : 97.4;
  }

  // Conduct Distribution
  const conductStats = {
    tot: conduct.filter(c => c.overallGrade === 'Tốt').length,
    kha: conduct.filter(c => c.overallGrade === 'Khá').length,
    dat: conduct.filter(c => c.overallGrade === 'Đạt').length,
    chuaDat: conduct.filter(c => c.overallGrade === 'Chưa đạt').length,
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-900 text-white p-5 sm:p-6 shadow-md">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-blue-100 text-xs font-semibold backdrop-blur-xs mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Năm học {classInfo.schoolYear}</span>
              <span className="text-white/40">•</span>
              <span className="text-amber-300 font-bold">LỚP {classInfo.className}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Giáo viên chủ nhiệm: {classInfo.homeroomTeacher}
            </h1>
            <p className="text-sm text-blue-100/90 mt-1">
              Hệ thống quản lý nề nếp, chuyên cần & hồ sơ học sinh tập thể <strong className="text-white font-bold">Lớp {classInfo.className}</strong> (Sĩ số: <strong className="text-amber-300">{totalStudents} học sinh</strong> • Nam: <strong className="text-white">{maleCount}</strong>, Nữ: <strong className="text-white">{femaleCount}</strong>).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              id="dash-quick-attendance"
              onClick={() => setActiveTab('attendance')}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-white text-blue-900 font-semibold text-xs sm:text-sm hover:bg-blue-50 transition shadow"
            >
              <UserCheck className="w-4 h-4 text-blue-700" />
              <span>Điểm danh ngay</span>
            </button>

            <button
              id="dash-quick-ai"
              onClick={() => setActiveTab('ai-assistant')}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-indigo-500/30 hover:bg-indigo-500/40 text-white font-semibold text-xs sm:text-sm border border-indigo-300/30 transition backdrop-blur-xs"
            >
              <Bot className="w-4 h-4 text-amber-300" />
              <span>AI Trợ lý Sư phạm</span>
            </button>
          </div>
        </div>

        {/* Decorative background shapes */}
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 translate-y-12 w-48 h-48 bg-indigo-400/10 rounded-full blur-xl pointer-events-none" />
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 sm:gap-4">
        {/* Total Students */}
        <div 
          onClick={() => setActiveTab('students')}
          className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Sĩ số lớp</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-slate-800">{totalStudents}</span>
            <p className="text-[11px] text-slate-400 mt-0.5">Lớp {classInfo.className}</p>
          </div>
        </div>

        {/* Gender: Nam / Nữ */}
        <div 
          onClick={() => setActiveTab('students')}
          className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:shadow-md transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Cơ cấu Nam / Nữ</span>
            <div className="p-2 rounded-lg bg-cyan-50 text-cyan-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline space-x-1.5">
              <span className="text-lg font-bold text-blue-600">{maleCount}</span>
              <span className="text-xs text-slate-400 font-normal">Nam</span>
              <span className="text-slate-300">/</span>
              <span className="text-lg font-bold text-rose-500">{femaleCount}</span>
              <span className="text-xs text-slate-400 font-normal">Nữ</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">{maleCount} Nam • {femaleCount} Nữ</p>
          </div>
        </div>

        {/* Ethnic Minority Students */}
        <div 
          onClick={() => setActiveTab('students')}
          className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Dân tộc thiểu số</span>
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition">
              <HeartHandshake className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-purple-700">{ethnicMinorityCount}</span>
            <p className="text-[11px] text-purple-600 font-medium mt-0.5">{chamCount} Chăm, {banaCount} Ba-na</p>
          </div>
        </div>

        {/* Needs Attention */}
        <div 
          onClick={() => setActiveTab('students')}
          className="bg-white p-4 rounded-xl border border-amber-200/80 shadow-xs hover:shadow-md transition cursor-pointer bg-gradient-to-br from-white to-amber-50/40 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-800">Cần quan tâm</span>
            <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-amber-700">{attentionStudents.length}</span>
            <p className="text-[11px] text-amber-700/80 font-medium mt-0.5">Theo dõi nề nếp & chế độ</p>
          </div>
        </div>

        {/* Violations this week */}
        <div 
          onClick={() => setActiveTab('violations')}
          className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Vi phạm tuần</span>
            <div className="p-2 rounded-lg bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-rose-600">{violations.length}</span>
            <p className="text-[11px] text-slate-400 mt-0.5">{unresolvedViolationsCount} vụ chưa xử lý</p>
          </div>
        </div>

        {/* Rewards this week */}
        <div 
          onClick={() => setActiveTab('rewards')}
          className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Khen thưởng tuần</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-emerald-600">{rewards.length}</span>
            <p className="text-[11px] text-emerald-700 font-medium mt-0.5">Học tập & Kỷ luật</p>
          </div>
        </div>

        {/* Attendance Rate */}
        <div 
          onClick={() => setActiveTab('attendance')}
          className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:shadow-md transition cursor-pointer group col-span-2 sm:col-span-3 lg:col-span-1"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Chuyên cần</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-blue-700">{attendanceRate}%</span>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {presentCount}/{totalStudents} có mặt hôm nay
            </p>
          </div>
        </div>
      </div>

      {/* Detailed Ethnicity Breakdown Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3.5 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <HeartHandshake className="w-4 h-4 text-purple-600" />
              Thống kê Thành phần Dân tộc Lớp {classInfo.className}
            </h3>
            <p className="text-xs text-slate-500">
              Tổng số {totalStudents} học sinh gồm 3 thành phần dân tộc chính xác theo danh sách lớp
            </p>
          </div>
          <div className="text-xs font-semibold text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-100 shrink-0">
            Dân tộc thiểu số: {ethnicMinorityCount}/{totalStudents} ({Math.round((ethnicMinorityCount / totalStudents) * 1000) / 10}%)
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          {/* Chăm */}
          <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200/70 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-purple-600 inline-block" />
                <span className="text-sm font-bold text-purple-900">Dân tộc Chăm</span>
              </div>
              <p className="text-xs text-purple-700 mt-1">
                Tỷ lệ: <strong className="font-bold">{Math.round((chamCount / totalStudents) * 1000) / 10}%</strong> sĩ số
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-purple-700">{chamCount}</span>
              <span className="text-xs text-purple-600 block">học sinh</span>
            </div>
          </div>

          {/* Ba-na */}
          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/70 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-600 inline-block" />
                <span className="text-sm font-bold text-amber-900">Dân tộc Ba-na</span>
              </div>
              <p className="text-xs text-amber-700 mt-1">
                Tỷ lệ: <strong className="font-bold">{Math.round((banaCount / totalStudents) * 1000) / 10}%</strong> sĩ số
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-amber-700">{banaCount}</span>
              <span className="text-xs text-amber-600 block">học sinh</span>
            </div>
          </div>

          {/* Kinh */}
          <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200/70 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-600 inline-block" />
                <span className="text-sm font-bold text-blue-900">Dân tộc Kinh</span>
              </div>
              <p className="text-xs text-blue-700 mt-1">
                Tỷ lệ: <strong className="font-bold">{Math.round((kinhCount / totalStudents) * 1000) / 10}%</strong> sĩ số
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-blue-700">{kinhCount}</span>
              <span className="text-xs text-blue-600 block">học sinh</span>
            </div>
          </div>
        </div>

        {/* Visual progress bar */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
            <div 
              className="bg-purple-600 h-full transition-all" 
              style={{ width: `${(chamCount / totalStudents) * 100}%` }} 
              title={`Chăm: ${chamCount} học sinh (${Math.round((chamCount/totalStudents)*100)}%)`}
            />
            <div 
              className="bg-amber-500 h-full transition-all" 
              style={{ width: `${(banaCount / totalStudents) * 100}%` }} 
              title={`Ba-na: ${banaCount} học sinh (${Math.round((banaCount/totalStudents)*100)}%)`}
            />
            <div 
              className="bg-blue-600 h-full transition-all" 
              style={{ width: `${(kinhCount / totalStudents) * 100}%` }} 
              title={`Kinh: ${kinhCount} học sinh (${Math.round((kinhCount/totalStudents)*100)}%)`}
            />
          </div>
          <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 mt-2 font-medium">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-600" /> Chăm ({chamCount})</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> Ba-na ({banaCount})</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-600" /> Kinh ({kinhCount})</span>
            <span className="font-bold text-slate-700">Tổng: {totalStudents} học sinh</span>
          </div>
        </div>
      </div>

      {/* Main Content Layout: 3 Columns Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Học sinh cần quan tâm */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col">
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Học sinh cần quan tâm</h3>
                <p className="text-xs text-slate-500">{attentionStudents.length} em cần GVCN theo dõi</p>
              </div>
            </div>
            <button 
              onClick={() => setActiveTab('students')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              Tất cả <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-4 space-y-3 flex-1 overflow-y-auto max-h-[340px] pr-1">
            {attentionStudents.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                Không có học sinh nào trong danh sách cần quan tâm.
              </div>
            ) : (
              attentionStudents.map(student => (
                <div
                  key={student.id}
                  onClick={() => onSelectStudent(student)}
                  className="p-3 rounded-xl bg-amber-50/50 hover:bg-amber-100/60 border border-amber-200/60 transition cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div className={`w-8 h-8 rounded-full ${student.avatarColor || 'bg-amber-600'} text-white flex items-center justify-center text-xs font-bold shrink-0`}>
                        {student.fullName.split(' ').slice(-1)[0]?.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 group-hover:text-amber-900 truncate">
                          {student.fullName}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {student.code} • {student.ethnicity}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 shrink-0">
                      {student.familyBackground}
                    </span>
                  </div>
                  
                  {student.attentionReason && (
                    <div className="mt-2 text-[11px] text-amber-900/90 bg-white/70 p-2 rounded-lg border border-amber-200/40">
                      <strong>Lưu ý:</strong> {student.attentionReason}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Bottom Action */}
          <div className="mt-4 pt-3 border-t border-slate-100">
            <button
              onClick={() => setActiveTab('parents')}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition"
            >
              <PhoneCall className="w-3.5 h-3.5 text-slate-600" />
              <span>Liên hệ phụ huynh trao đổi</span>
            </button>
          </div>
        </div>

        {/* Center Column: Học sinh có tiến bộ & Khen thưởng */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col">
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Học sinh có tiến bộ & Khen thưởng</h3>
                <p className="text-xs text-slate-500">Tuyên dương các cá nhân nỗ lực</p>
              </div>
            </div>
            <button 
              onClick={() => setActiveTab('rewards')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              Tất cả <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-4 space-y-3 flex-1 overflow-y-auto max-h-[340px] pr-1">
            {progressingStudents.map(student => (
              <div
                key={student.id}
                onClick={() => onSelectStudent(student)}
                className="p-3 rounded-xl bg-emerald-50/50 hover:bg-emerald-100/60 border border-emerald-200/60 transition cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div className={`w-8 h-8 rounded-full ${student.avatarColor || 'bg-emerald-600'} text-white flex items-center justify-center text-xs font-bold shrink-0`}>
                      {student.fullName.split(' ').slice(-1)[0]?.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 group-hover:text-emerald-900 truncate">
                        {student.fullName}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {student.code} • Tổ {Math.floor(Math.random() * 4) + 1}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 shrink-0 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> Tiến bộ
                  </span>
                </div>
                {student.progressNote && (
                  <div className="mt-2 text-[11px] text-emerald-900 bg-white/80 p-2 rounded-lg border border-emerald-200/50">
                    ⭐ {student.progressNote}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <button
              onClick={() => setActiveTab('rewards')}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold transition"
            >
              <Award className="w-3.5 h-3.5 text-emerald-600" />
              <span>Ghi nhận khen thưởng mới</span>
            </button>
          </div>
        </div>

        {/* Right Column: Vi phạm trong tuần */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col">
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 rounded-lg bg-rose-100 text-rose-700">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Vi phạm trong tuần</h3>
                <p className="text-xs text-slate-500">{violations.length} vụ việc ghi nhận</p>
              </div>
            </div>
            <button 
              onClick={() => setActiveTab('violations')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              Xem sổ <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-4 space-y-3 flex-1 overflow-y-auto max-h-[340px] pr-1">
            {recentViolations.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                Không có vi phạm nào trong tuần. Lớp chấp hành rất tốt!
              </div>
            ) : (
              recentViolations.map(violation => (
                <div
                  key={violation.id}
                  className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/70 transition"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-800">{violation.studentName}</p>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      violation.severity === 'Nghiêm trọng' 
                        ? 'bg-rose-100 text-rose-800' 
                        : violation.severity === 'Vừa'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {violation.severity}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 mt-1 font-medium">
                    {violation.content}
                  </p>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/50 text-[11px] text-slate-500">
                    <span>{violation.date}</span>
                    <span className={`flex items-center gap-1 font-medium ${
                      violation.resolved ? 'text-emerald-600' : 'text-amber-600'
                    }`}>
                      {violation.resolved ? (
                        <><CheckCircle2 className="w-3 h-3" /> Đã xử lý</>
                      ) : (
                        <><Clock className="w-3 h-3" /> Đang theo dõi</>
                      )}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <button
              onClick={() => setActiveTab('violations')}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-semibold transition"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
              <span>Ghi nhận vi phạm mới</span>
            </button>
          </div>
        </div>

      </div>

      {/* Bottom Section: Rèn luyện & Lời nhắc việc GVCN */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conduct Matrix Snapshot */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Phân bổ Xếp loại Rèn luyện / Hạnh kiểm</h3>
              <p className="text-xs text-slate-500">Đánh giá theo các tiêu chí Thông tư 22 Bộ GD&ĐT</p>
            </div>
            <button
              onClick={() => setActiveTab('conduct')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              Chi tiết bảng điểm <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-4">
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200/80">
              <span className="text-xs font-semibold text-emerald-800">Loại Tốt</span>
              <p className="text-2xl font-bold text-emerald-700 mt-1">{conductStats.tot}</p>
              <p className="text-[11px] text-emerald-600 mt-0.5">
                {Math.round((conductStats.tot / totalStudents) * 100)}% tổng số
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200/80">
              <span className="text-xs font-semibold text-blue-800">Loại Khá</span>
              <p className="text-2xl font-bold text-blue-700 mt-1">{conductStats.kha}</p>
              <p className="text-[11px] text-blue-600 mt-0.5">
                {Math.round((conductStats.kha / totalStudents) * 100)}% tổng số
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200/80">
              <span className="text-xs font-semibold text-amber-800">Loại Đạt</span>
              <p className="text-2xl font-bold text-amber-700 mt-1">{conductStats.dat}</p>
              <p className="text-[11px] text-amber-600 mt-0.5">
                {Math.round((conductStats.dat / totalStudents) * 100)}% tổng số
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200/80">
              <span className="text-xs font-semibold text-rose-800">Cần cố gắng</span>
              <p className="text-2xl font-bold text-rose-700 mt-1">{conductStats.chuaDat}</p>
              <p className="text-[11px] text-rose-600 mt-0.5">
                {Math.round((conductStats.chuaDat / totalStudents) * 100)}% tổng số
              </p>
            </div>
          </div>

          {/* Progress Bar Visualizer */}
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1.5">
              <span>Tỷ lệ thi đua toàn lớp</span>
              <span className="text-emerald-700 font-semibold">Tốt + Khá: {Math.round(((conductStats.tot + conductStats.kha)/totalStudents)*100)}%</span>
            </div>
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
              <div 
                className="bg-emerald-500 h-full" 
                style={{ width: `${(conductStats.tot / totalStudents) * 100}%` }} 
                title={`Tốt: ${conductStats.tot}`}
              />
              <div 
                className="bg-blue-500 h-full" 
                style={{ width: `${(conductStats.kha / totalStudents) * 100}%` }} 
                title={`Khá: ${conductStats.kha}`}
              />
              <div 
                className="bg-amber-500 h-full" 
                style={{ width: `${(conductStats.dat / totalStudents) * 100}%` }} 
                title={`Đạt: ${conductStats.dat}`}
              />
              <div 
                className="bg-rose-500 h-full" 
                style={{ width: `${(conductStats.chuaDat / totalStudents) * 100}%` }} 
                title={`Cần cố gắng: ${conductStats.chuaDat}`}
              />
            </div>
          </div>
        </div>

        {/* Homeroom Teacher Daily Checklist */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
              <Calendar className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-slate-800 text-sm">Lịch việc của GVCN</h3>
            </div>

            <ul className="mt-3.5 space-y-2.5 text-xs">
              <li className="flex items-start space-x-2.5 p-2 rounded-lg bg-slate-50">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span className="text-slate-700">Điểm danh 15 phút đầu giờ sáng và duyệt sổ đầu bài.</span>
              </li>
              <li className="flex items-start space-x-2.5 p-2 rounded-lg bg-slate-50">
                <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span className="text-slate-700">Đôn đốc 2 học sinh nộp hồ sơ miễn giảm học phí trước thứ Sáu.</span>
              </li>
              <li className="flex items-start space-x-2.5 p-2 rounded-lg bg-slate-50">
                <PhoneCall className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <span className="text-slate-700">Hẹn gặp bà nội em Lương Văn Cường lúc 16h30 thứ 6.</span>
              </li>
            </ul>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <button
              onClick={() => setActiveTab('reports')}
              className="w-full py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs transition flex items-center justify-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Xem báo cáo tuần nộp BGH</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
