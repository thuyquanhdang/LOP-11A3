import React, { useState } from 'react';
import { 
  BarChart3, 
  Printer, 
  Download, 
  Calendar, 
  FileText, 
  Users, 
  Award, 
  AlertTriangle, 
  TrendingUp, 
  CheckCircle2,
  School,
  Sparkles
} from 'lucide-react';
import { 
  Student, 
  ViolationRecord, 
  RewardRecord, 
  AttendanceRecord, 
  ConductEvaluation,
  ClassInfo 
} from '../types';

interface ReportsViewProps {
  students: Student[];
  violations: ViolationRecord[];
  rewards: RewardRecord[];
  attendance: AttendanceRecord[];
  conduct: ConductEvaluation[];
  classInfo: ClassInfo;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  students,
  violations,
  rewards,
  attendance,
  conduct,
  classInfo
}) => {
  const [reportType, setReportType] = useState<'week' | 'month' | 'term'>('week');
  const [reportWeek, setReportWeek] = useState('Tuần 4 - Tháng 8/2026');

  // Attendance metrics
  let totalPresences = 0;
  let totalExcused = 0;
  let totalUnexcused = 0;
  let totalLate = 0;
  let totalRecords = 0;

  attendance.forEach(att => {
    att.records.forEach(r => {
      totalRecords++;
      if (r.status === 'present') totalPresences++;
      else if (r.status === 'excused') totalExcused++;
      else if (r.status === 'unexcused') totalUnexcused++;
      else if (r.status === 'late') totalLate++;
    });
  });

  const overallAttendanceRate = totalRecords > 0 
    ? Math.round(((totalPresences + totalLate) / totalRecords) * 1000) / 10 
    : 96.5;

  // Conduct metrics
  const conductTot = conduct.filter(c => c.overallGrade === 'Tốt').length;
  const conductKha = conduct.filter(c => c.overallGrade === 'Khá').length;
  const conductDat = conduct.filter(c => c.overallGrade === 'Đạt').length;
  const conductChuaDat = conduct.filter(c => c.overallGrade === 'Chưa đạt').length;

  const attentionStudents = students.filter(s => s.needsAttention);
  const progressingStudents = students.filter(s => s.isProgressing);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Top Controls (Hidden on Print) */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            Báo Cáo & Thống Kê Tổng Hợp
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
              Lớp {classInfo.className}
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Mẫu báo cáo nề nếp thi đua, chuyên cần và học tập nộp Ban Giám Hiệu & Đoàn Trường
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold transition shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>In bản báo cáo (PDF)</span>
          </button>
        </div>
      </div>

      {/* PRINTABLE REPORT SHEET */}
      <div className="bg-white p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-sm print:border-none print:shadow-none print:p-0 space-y-6 text-slate-800 font-sans">
        
        {/* Formal Header in Vietnamese Standard */}
        <div className="grid grid-cols-2 gap-4 pb-4 border-b-2 border-slate-800 text-center sm:text-left">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-wider">{classInfo.schoolName}</p>
            <p className="text-xs font-bold text-slate-700">LỚP CHỦ NHIỆM: {classInfo.className}</p>
            <p className="text-[11px] text-slate-500 italic mt-0.5">Năm học: {classInfo.schoolYear}</p>
          </div>

          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-wider">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
            <p className="text-[11px] font-bold text-slate-700 underline">Độc lập - Tự do - Hạnh phúc</p>
            <p className="text-[11px] text-slate-500 italic mt-1">Ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}</p>
          </div>
        </div>

        {/* Title */}
        <div className="text-center py-2">
          <h1 className="text-lg sm:text-xl font-bold uppercase tracking-wide text-slate-900">
            BÁO CÁO TỔNG HỢP NỀ NẾP & HỌC TẬP TUẦN
          </h1>
          <p className="text-xs text-slate-600 font-medium mt-1">
            Giáo viên chủ nhiệm: <strong className="text-slate-900">{classInfo.homeroomTeacher}</strong> • Sĩ số: <strong className="text-slate-900">{students.length} học sinh</strong>
          </p>
        </div>

        {/* Section 1: Thống kê Sĩ số & Chuyên cần */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wide text-slate-900 flex items-center gap-1.5 border-b border-slate-200 pb-1">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            I. TÌNH HÌNH SĨ SỐ & CHUYÊN CẦN
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 font-medium">Tổng số học sinh:</span>
              <p className="text-base font-bold text-slate-800 mt-0.5">{students.length} em ({students.filter(s=>s.gender==='Nam').length} Nam / {students.filter(s=>s.gender==='Nữ').length} Nữ)</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 font-medium">Tỷ lệ chuyên cần chung:</span>
              <p className="text-base font-bold text-blue-700 mt-0.5">{overallAttendanceRate}%</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 font-medium">Nghỉ có phép:</span>
              <p className="text-base font-bold text-slate-800 mt-0.5">{totalExcused} lượt</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 font-medium">Nghỉ không phép / Đi muộn:</span>
              <p className="text-base font-bold text-rose-600 mt-0.5">{totalUnexcused} vắng / {totalLate} trễ</p>
            </div>
          </div>
        </div>

        {/* Section 2: Thống kê Vi phạm kỷ luật */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wide text-slate-900 flex items-center gap-1.5 border-b border-slate-200 pb-1">
            <span className="w-2 h-2 rounded-full bg-rose-600"></span>
            II. NỀ NẾP KỶ LUẬT & CÁC TRƯỜNG HỢP VI PHẠM ({violations.length} VỤ VIỆC)
          </h3>
          {violations.length === 0 ? (
            <p className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded-xl">Trong tuần toàn thể học sinh chấp hành tốt nội quy trường lớp, không có vi phạm.</p>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 font-semibold text-slate-700">
                    <th className="p-2.5">Học sinh</th>
                    <th className="p-2.5">Ngày</th>
                    <th className="p-2.5">Lỗi vi phạm</th>
                    <th className="p-2.5 text-center">Mức độ</th>
                    <th className="p-2.5">Hình thức xử lý</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {violations.map(v => (
                    <tr key={v.id}>
                      <td className="p-2.5 font-bold">{v.studentName}</td>
                      <td className="p-2.5 text-slate-500">{v.date}</td>
                      <td className="p-2.5">{v.content}</td>
                      <td className="p-2.5 text-center">{v.severity}</td>
                      <td className="p-2.5 text-slate-600">{v.disciplinaryAction}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Section 3: Khen thưởng & Thành tích */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wide text-slate-900 flex items-center gap-1.5 border-b border-slate-200 pb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            III. THÀNH TÍCH, KHEN THƯỞNG & GƯƠNG TIẾN BỘ ({rewards.length} THÀNH TÍCH)
          </h3>
          <div className="space-y-2">
            {rewards.map(r => (
              <div key={r.id} className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl text-xs">
                <div className="flex justify-between font-bold text-slate-900">
                  <span>🏆 {r.achievement} - Em {r.studentName}</span>
                  <span className="text-emerald-700">{r.date}</span>
                </div>
                <p className="text-slate-600 mt-1">{r.content}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Đánh giá Xếp loại Rèn luyện */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wide text-slate-900 flex items-center gap-1.5 border-b border-slate-200 pb-1">
            <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
            IV. TỔNG HỢP XẾP LOẠI RÈN LUYỆN / HẠNH KIỂM
          </h3>
          <div className="grid grid-cols-4 gap-3 text-xs text-center">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-semibold text-emerald-800">Tốt:</span>
              <p className="text-base font-bold text-emerald-700 mt-0.5">{conductTot} ({Math.round((conductTot/students.length)*100)}%)</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-semibold text-blue-800">Khá:</span>
              <p className="text-base font-bold text-blue-700 mt-0.5">{conductKha} ({Math.round((conductKha/students.length)*100)}%)</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-semibold text-amber-800">Đạt:</span>
              <p className="text-base font-bold text-amber-700 mt-0.5">{conductDat} ({Math.round((conductDat/students.length)*100)}%)</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-semibold text-rose-800">Cần cố gắng:</span>
              <p className="text-base font-bold text-rose-700 mt-0.5">{conductChuaDat} ({Math.round((conductChuaDat/students.length)*100)}%)</p>
            </div>
          </div>
        </div>

        {/* Section 5: Danh sách học sinh cần quan tâm */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wide text-slate-900 flex items-center gap-1.5 border-b border-slate-200 pb-1">
            <span className="w-2 h-2 rounded-full bg-amber-600"></span>
            V. DANH SÁCH HỌC SINH CẦN QUAN TÂM ĐẶC BIỆT & BIỆN PHÁP SƯ PHẠM
          </h3>
          <div className="space-y-1.5 text-xs">
            {attentionStudents.map(s => (
              <div key={s.id} className="p-2.5 bg-amber-50/50 border border-amber-200/70 rounded-xl">
                <p className="font-bold text-slate-900">Em {s.fullName} ({s.code}) - Hoàn cảnh: {s.familyBackground}</p>
                <p className="text-slate-600 mt-0.5"><strong>Lý do & Kế hoạch theo dõi:</strong> {s.attentionReason || s.notes}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-8 pt-8 text-center text-xs">
          <div>
            <p className="font-bold uppercase">LỚP TRƯỞNG</p>
            <p className="text-[11px] text-slate-500 italic">(Ký và ghi rõ họ tên)</p>
            <div className="h-16"></div>
            <p className="font-bold text-slate-800">{classInfo.classMonitor}</p>
          </div>

          <div>
            <p className="font-bold uppercase">GIÁO VIÊN CHỦ NHIỆM</p>
            <p className="text-[11px] text-slate-500 italic">(Ký và ghi rõ họ tên)</p>
            <div className="h-16"></div>
            <p className="font-bold text-slate-800">{classInfo.homeroomTeacher}</p>
          </div>
        </div>

      </div>
    </div>
  );
};
