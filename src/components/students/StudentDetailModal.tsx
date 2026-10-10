import React, { useState } from 'react';
import { 
  X, 
  User, 
  Phone, 
  MapPin, 
  Heart, 
  GraduationCap, 
  Award, 
  AlertTriangle, 
  Calendar, 
  BookOpen, 
  ShieldCheck, 
  PhoneCall, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  PlusCircle,
  FileSpreadsheet,
  Save,
  Edit3
} from 'lucide-react';
import { 
  Student, 
  ViolationRecord, 
  RewardRecord, 
  AttendanceRecord, 
  ConductEvaluation, 
  ParentContact,
  ClassInfo,
  SubjectScore,
  ConductRating,
  AcademicRating,
  RewardCategory,
  ViolationSeverity,
  TeamGroup
} from '../../types';
import { getDefaultTeamForStudent } from '../../mockData';

interface StudentDetailModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
  violations: ViolationRecord[];
  rewards: RewardRecord[];
  attendance: AttendanceRecord[];
  conduct: ConductEvaluation[];
  parents: ParentContact[];
  classInfo: ClassInfo;
  onEditStudent: (student: Student) => void;
  onSaveStudent?: (updatedStudent: Student) => void;
  onAddReward?: (reward: RewardRecord) => void;
  onAddViolation?: (violation: ViolationRecord) => void;
  onAddViolationForStudent?: (studentId: string, studentName: string) => void;
  onAddRewardForStudent?: (studentId: string, studentName: string) => void;
  onAddParentContactForStudent?: (studentId: string, studentName: string) => void;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  student,
  isOpen,
  onClose,
  violations,
  rewards,
  attendance,
  conduct,
  parents,
  classInfo,
  onEditStudent,
  onSaveStudent,
  onAddReward,
  onAddViolation
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'academic' | 'conduct' | 'emulation' | 'attendance' | 'parents'>('profile');
  const [editableScores, setEditableScores] = useState<SubjectScore[]>([]);
  const [editableEmulation, setEditableEmulation] = useState<{ [week: number]: ConductRating }>({});
  const [editableAcademicRating, setEditableAcademicRating] = useState<AcademicRating>('Khá');
  const [editableConductRating, setEditableConductRating] = useState<ConductRating>('Tốt');
  const [editableNotes, setEditableNotes] = useState<string>('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveSuccessToast, setSaveSuccessToast] = useState(false);
  const [showAddActivityForm, setShowAddActivityForm] = useState(false);
  const [newActivityTitle, setNewActivityTitle] = useState('');
  const [newActivityName, setNewActivityName] = useState('');
  const [newActivityContent, setNewActivityContent] = useState('');
  const [newActivityCategory, setNewActivityCategory] = useState<RewardCategory>('Hoạt động tổ');
  const [newActivityPoints, setNewActivityPoints] = useState<number>(15);

  const [showAddViolationForm, setShowAddViolationForm] = useState(false);
  const [newViolationContent, setNewViolationContent] = useState('');
  const [newViolationSeverity, setNewViolationSeverity] = useState<ViolationSeverity>('Nhẹ');
  const [newViolationAction, setNewViolationAction] = useState('Nhắc nhở trước lớp và trừ điểm thi đua');
  const [newViolationNotes, setNewViolationNotes] = useState('');

  React.useEffect(() => {
    if (student) {
      setEditableScores(student.subjectScores ? student.subjectScores.map(s => ({ ...s })) : []);
      setEditableEmulation(student.weeklyEmulation ? { ...student.weeklyEmulation } : {});
      setEditableAcademicRating(student.academicRating || 'Khá');
      setEditableConductRating(student.conductRating || 'Tốt');
      setEditableNotes(student.notes || '');
      setHasUnsavedChanges(false);
      setSaveSuccessToast(false);
    }
  }, [student]);

  if (!isOpen || !student) return null;

  // Handle score change
  const handleScoreChange = (idx: number, field: keyof SubjectScore, val: string) => {
    const numVal = val === '' ? undefined : parseFloat(val);
    setEditableScores(prev => {
      const next = [...prev];
      const item = { ...next[idx], [field]: numVal };
      // Recalculate avg if numeric scores exist
      const tx1 = item.tx1 ?? 0;
      const tx2 = item.tx2 ?? 0;
      const tx3 = item.tx3 ?? 0;
      const gk = item.gk ?? 0;
      const ck = item.ck ?? 0;
      if (item.tx1 !== undefined && item.gk !== undefined && item.ck !== undefined) {
        const countTx = (item.tx1 !== undefined ? 1 : 0) + (item.tx2 !== undefined ? 1 : 0) + (item.tx3 !== undefined ? 1 : 0);
        const sumTx = tx1 + tx2 + tx3;
        const avg = (sumTx + gk * 2 + ck * 3) / (countTx + 5);
        item.avg = Math.round(avg * 10) / 10;
      }
      next[idx] = item;
      return next;
    });
    setHasUnsavedChanges(true);
  };

  // Handle emulation change
  const handleEmulationChange = (weekNum: number, rating: ConductRating) => {
    setEditableEmulation(prev => ({
      ...prev,
      [weekNum]: rating
    }));
    setHasUnsavedChanges(true);
  };

  // Save changes handler
  const handleSaveChanges = () => {
    if (!onSaveStudent) return;
    const updated: Student = {
      ...student,
      subjectScores: editableScores,
      weeklyEmulation: editableEmulation,
      academicRating: editableAcademicRating,
      conductRating: editableConductRating,
      notes: editableNotes
    };
    onSaveStudent(updated);
    setHasUnsavedChanges(false);
    setSaveSuccessToast(true);
    setTimeout(() => setSaveSuccessToast(false), 3000);
  };

  // Student specific records
  const studentViolations = violations.filter(v => v.studentId === student.id);
  const studentRewards = rewards.filter(r => r.studentId === student.id);
  const studentConduct = conduct.find(c => c.studentId === student.id);
  const studentParents = parents.filter(p => p.studentId === student.id);

  // Attendance stats for student
  let totalDays = 0;
  let presentDays = 0;
  let excusedDays = 0;
  let unexcusedDays = 0;
  let lateDays = 0;

  attendance.forEach(day => {
    const rec = day.records.find(r => r.studentId === student.id);
    if (rec) {
      totalDays++;
      if (rec.status === 'present') presentDays++;
      else if (rec.status === 'excused') excusedDays++;
      else if (rec.status === 'unexcused') unexcusedDays++;
      else if (rec.status === 'late') lateDays++;
    }
  });

  const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100;

  // Format date helper
  const formatDate = (dStr?: string) => {
    if (!dStr) return 'Chưa cập nhật';
    const parts = dStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dStr;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-auto">
        
        {/* Header Profile Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white p-5 sm:p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl ${student.avatarColor || 'bg-blue-600'} text-white flex items-center justify-center font-bold text-2xl sm:text-3xl shadow-lg ring-4 ring-white/10 shrink-0`}>
              {student.fullName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">{student.fullName}</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/15 text-blue-200 border border-white/10">
                  {student.code}
                </span>
                {student.role && student.role !== 'Học sinh' && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400 text-amber-950 shadow-xs">
                    ⭐ {student.role}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs sm:text-sm text-slate-300">
                <span>Lớp: <strong className="text-white">{classInfo.className}</strong></span>
                <span>•</span>
                <span>GVCN: <strong className="text-white">{classInfo.homeroomTeacher}</strong></span>
                <span>•</span>
                <span>Dân tộc: <strong className="text-white">{student.ethnicity}</strong></span>
                <span>•</span>
                <span>Giới tính: <strong className="text-white">{student.gender}</strong></span>
              </div>

              {/* Status Badges */}
              <div className="flex flex-wrap items-center gap-2 mt-3">
                {student.needsAttention && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Cần quan tâm đặc biệt
                  </span>
                )}
                {student.isProgressing && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <Award className="w-3.5 h-3.5" />
                    Tiến bộ trong tuần
                  </span>
                )}
                {student.policyType !== 'Không' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    <Heart className="w-3.5 h-3.5" />
                    Diện chính sách
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 sm:px-6 overflow-x-auto no-scrollbar gap-2 sm:gap-4 shrink-0">
          {[
            { id: 'profile', label: '1. Thông tin cá nhân & Gia đình', icon: User },
            { id: 'academic', label: '2. Theo dõi học tập', icon: BookOpen },
            { id: 'conduct', label: '3. Rèn luyện & Kỷ luật', icon: ShieldCheck },
            { id: 'emulation', label: '4. Thi đua tuần', icon: Award },
            { id: 'attendance', label: '5. Điểm danh', icon: Calendar },
            { id: 'parents', label: '6. Sổ liên lạc', icon: PhoneCall },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-3 px-2 text-xs sm:text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  isActive 
                    ? 'border-blue-600 text-blue-600 font-semibold' 
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Modal Tab Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 text-slate-800 space-y-6">
          
          {/* TAB 1: Profile & Family */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Personal Details */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600" />
                  Thông tin cá nhân
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">Mã học sinh</span>
                    <span className="font-semibold text-slate-900">{student.code}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">Họ và tên</span>
                    <span className="font-semibold text-slate-900">{student.fullName}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">Ngày sinh</span>
                    <span className="font-medium text-slate-800">{formatDate(student.dob)}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">Giới tính</span>
                    <span className="font-medium text-slate-800">{student.gender}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">Dân tộc</span>
                    <span className="font-medium text-slate-800">{student.ethnicity}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">Chức vụ trong lớp</span>
                    <span className="font-semibold text-blue-700">{student.role || 'Học sinh'}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-xs text-slate-400 block font-medium">Số điện thoại cá nhân</span>
                    <span className="font-medium text-slate-800 flex items-center gap-1.5 mt-0.5">
                      <Phone className="w-3.5 h-3.5 text-blue-600" />
                      {student.phone || 'Chưa cập nhật'}
                    </span>
                  </div>
                  <div className="sm:col-span-3">
                    <span className="text-xs text-slate-400 block font-medium">Địa chỉ thường trú / Nơi ở</span>
                    <span className="font-medium text-slate-800 flex items-center gap-1.5 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      {student.address || 'Chưa cập nhật'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Family Details */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-rose-600" />
                  Thông tin gia đình & Người liên hệ
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {/* Father */}
                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80">
                    <span className="font-semibold text-slate-900 block mb-2">Thông tin Bố (Cha)</span>
                    <div className="space-y-1 text-xs sm:text-sm">
                      <p><span className="text-slate-500">Họ và tên:</span> <strong className="text-slate-800">{student.fatherName || 'Chưa cập nhật'}</strong></p>
                      <p className="flex items-center gap-1"><span className="text-slate-500">SĐT liên hệ:</span> <strong className="text-blue-600">{student.fatherPhone || 'Chưa cập nhật'}</strong></p>
                      <p><span className="text-slate-500">Nghề nghiệp:</span> <span className="text-slate-700">{student.fatherJob || 'Chưa cập nhật'}</span></p>
                    </div>
                  </div>

                  {/* Mother */}
                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80">
                    <span className="font-semibold text-slate-900 block mb-2">Thông tin Mẹ</span>
                    <div className="space-y-1 text-xs sm:text-sm">
                      <p><span className="text-slate-500">Họ và tên:</span> <strong className="text-slate-800">{student.motherName || 'Chưa cập nhật'}</strong></p>
                      <p className="flex items-center gap-1"><span className="text-slate-500">SĐT liên hệ:</span> <strong className="text-blue-600">{student.motherPhone || 'Chưa cập nhật'}</strong></p>
                      <p><span className="text-slate-500">Nghề nghiệp:</span> <span className="text-slate-700">{student.motherJob || 'Chưa cập nhật'}</span></p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-200 text-sm">
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">Hoàn cảnh gia đình</span>
                    <span className="font-semibold text-slate-800">{student.familyBackground}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">Chế độ chính sách được hưởng</span>
                    <span className="font-semibold text-amber-700">{student.policyType}</span>
                  </div>
                </div>
              </div>

              {/* Notes & Special Attention */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-indigo-600" />
                  Ghi chú của GVCN (Có thể chỉnh sửa trực tiếp)
                </h3>
                <textarea
                  rows={2}
                  value={editableNotes}
                  onChange={(e) => {
                    setEditableNotes(e.target.value);
                    setHasUnsavedChanges(true);
                  }}
                  placeholder="Nhập ghi chú của GVCN cho học sinh này..."
                  className="w-full text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />

                {student.needsAttention && student.attentionReason && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-800">
                    <strong className="block text-xs font-bold uppercase tracking-wider text-rose-700 mb-1">
                      ⚠️ Lý do cần lưu ý đặc biệt:
                    </strong>
                    {student.attentionReason}
                  </div>
                )}

                {student.isProgressing && student.progressNote && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-800">
                    <strong className="block text-xs font-bold uppercase tracking-wider text-emerald-700 mb-1">
                      ⭐ Thành tích / Tiến bộ được biểu dương:
                    </strong>
                    {student.progressNote}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Academic Tracking */}
          {activeTab === 'academic' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-blue-50 p-4 rounded-xl border border-blue-200">
                <div>
                  <h4 className="font-bold text-blue-900 text-sm">Kết quả học tập & Bảng điểm các môn (Chỉnh sửa trực tiếp)</h4>
                  <p className="text-xs text-blue-700">Thầy/cô có thể nhập điểm trực tiếp vào các ô bên dưới và bấm "Lưu thay đổi"</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-600">Xếp loại học lực:</span>
                  <select
                    value={editableAcademicRating}
                    onChange={(e) => {
                      setEditableAcademicRating(e.target.value as AcademicRating);
                      setHasUnsavedChanges(true);
                    }}
                    className="px-3 py-1 rounded-lg text-xs font-bold bg-white border border-blue-300 text-blue-900 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Tốt">Tốt</option>
                    <option value="Khá">Khá</option>
                    <option value="Đạt">Đạt</option>
                    <option value="Chưa đạt">Chưa đạt</option>
                  </select>
                </div>
              </div>

              {/* Subject Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Môn học</th>
                      <th className="py-2.5 px-2 text-center">ĐGtx 1</th>
                      <th className="py-2.5 px-2 text-center">ĐGtx 2</th>
                      <th className="py-2.5 px-2 text-center">ĐGtx 3</th>
                      <th className="py-2.5 px-2 text-center">ĐGgk</th>
                      <th className="py-2.5 px-2 text-center">ĐGck</th>
                      <th className="py-2.5 px-3 text-center font-bold text-blue-900 bg-blue-100/60">ĐTB Môn</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {editableScores.length > 0 ? (
                      editableScores.map((sub, sIdx) => (
                        <tr key={sIdx} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2 px-3 font-medium text-slate-900">{sub.subjectName}</td>
                          <td className="py-1.5 px-1.5 text-center">
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              max="10"
                              value={sub.tx1 ?? ''}
                              onChange={(e) => handleScoreChange(sIdx, 'tx1', e.target.value)}
                              className="w-14 text-center py-1 px-1 rounded border border-slate-200 focus:border-blue-500 focus:outline-hidden text-xs"
                            />
                          </td>
                          <td className="py-1.5 px-1.5 text-center">
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              max="10"
                              value={sub.tx2 ?? ''}
                              onChange={(e) => handleScoreChange(sIdx, 'tx2', e.target.value)}
                              className="w-14 text-center py-1 px-1 rounded border border-slate-200 focus:border-blue-500 focus:outline-hidden text-xs"
                            />
                          </td>
                          <td className="py-1.5 px-1.5 text-center">
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              max="10"
                              value={sub.tx3 ?? ''}
                              onChange={(e) => handleScoreChange(sIdx, 'tx3', e.target.value)}
                              className="w-14 text-center py-1 px-1 rounded border border-slate-200 focus:border-blue-500 focus:outline-hidden text-xs"
                            />
                          </td>
                          <td className="py-1.5 px-1.5 text-center">
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              max="10"
                              value={sub.gk ?? ''}
                              onChange={(e) => handleScoreChange(sIdx, 'gk', e.target.value)}
                              className="w-14 text-center py-1 px-1 rounded border border-indigo-200 bg-indigo-50/30 font-semibold text-indigo-700 focus:border-indigo-500 focus:outline-hidden text-xs"
                            />
                          </td>
                          <td className="py-1.5 px-1.5 text-center">
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              max="10"
                              value={sub.ck ?? ''}
                              onChange={(e) => handleScoreChange(sIdx, 'ck', e.target.value)}
                              className="w-14 text-center py-1 px-1 rounded border border-blue-200 bg-blue-50/30 font-semibold text-blue-700 focus:border-blue-500 focus:outline-hidden text-xs"
                            />
                          </td>
                          <td className="py-2 px-3 text-center font-bold text-blue-950 bg-blue-50/50">
                            {sub.avg ?? '—'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-slate-400">
                          Chưa có dữ liệu điểm môn học chi tiết.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: Conduct & Discipline */}
          {activeTab === 'conduct' && (
            <div className="space-y-6">
              {/* Overall Conduct Card */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs">
                <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
                  <h4 className="font-bold text-slate-900 text-sm">Đánh giá kết quả rèn luyện học kỳ</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-600">Mức rèn luyện:</span>
                    <select
                      value={editableConductRating}
                      onChange={(e) => {
                        setEditableConductRating(e.target.value as ConductRating);
                        setHasUnsavedChanges(true);
                      }}
                      className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-50 border border-emerald-300 text-emerald-900 focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="Tốt">Tốt</option>
                      <option value="Khá">Khá</option>
                      <option value="Đạt">Đạt</option>
                      <option value="Chưa đạt">Chưa đạt</option>
                    </select>
                  </div>
                </div>

                {studentConduct && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-slate-500 block">Ý thức học tập:</span>
                      <strong className="text-slate-800 text-sm">{studentConduct.studyAttitude}</strong>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-slate-500 block">Chấp hành nội quy:</span>
                      <strong className="text-slate-800 text-sm">{studentConduct.ruleCompliance}</strong>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-slate-500 block">Chuyên cần:</span>
                      <strong className="text-slate-800 text-sm">{studentConduct.attendanceRate}</strong>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-slate-500 block">Vệ sinh & nề nếp:</span>
                      <strong className="text-slate-800 text-sm">{studentConduct.hygiene}</strong>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-slate-500 block">Làm việc nhóm:</span>
                      <strong className="text-slate-800 text-sm">{studentConduct.teamwork}</strong>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-slate-500 block">Phong trào & Đoàn:</span>
                      <strong className="text-slate-800 text-sm">{studentConduct.activityParticipation}</strong>
                    </div>
                  </div>
                )}
                {studentConduct?.teacherFeedback && (
                  <p className="mt-3 text-xs sm:text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200 italic">
                    Nhận xét của GVCN: "{studentConduct.teacherFeedback}"
                  </p>
                )}
              </div>

              {/* Violations and Rewards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Violations */}
                <div className="bg-white rounded-xl border border-rose-200 p-4 shadow-xs">
                  <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
                    <h5 className="font-bold text-rose-900 text-sm flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      Vi phạm nề nếp ({studentViolations.length})
                    </h5>
                    {onAddViolation && (
                      <button
                        type="button"
                        onClick={() => setShowAddViolationForm(!showAddViolationForm)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition cursor-pointer"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>+ Thêm vi phạm</span>
                      </button>
                    )}
                  </div>

                  {showAddViolationForm && onAddViolation && (
                    <div className="mb-3 p-3 rounded-xl bg-rose-50/90 border border-rose-200 space-y-2.5 text-xs">
                      <div className="font-bold text-rose-900 flex items-center justify-between">
                        <span>Ghi nhận vi phạm mới</span>
                        <button
                          type="button"
                          onClick={() => setShowAddViolationForm(false)}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="Nội dung vi phạm (VD: Đi học muộn, Chưa thuộc bài...)"
                        value={newViolationContent}
                        onChange={(e) => setNewViolationContent(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-rose-300 rounded-lg text-xs font-medium"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={newViolationSeverity}
                          onChange={(e) => setNewViolationSeverity(e.target.value as ViolationSeverity)}
                          className="px-2.5 py-1.5 bg-white border border-rose-300 rounded-lg text-xs"
                        >
                          <option value="Nhẹ">Mức độ: Nhẹ</option>
                          <option value="Trung bình">Mức độ: Trung bình</option>
                          <option value="Nghiêm trọng">Mức độ: Nghiêm trọng</option>
                        </select>
                        <input
                          type="text"
                          placeholder="Hình thức xử lý..."
                          value={newViolationAction}
                          onChange={(e) => setNewViolationAction(e.target.value)}
                          className="px-2.5 py-1.5 bg-white border border-rose-300 rounded-lg text-xs"
                        />
                      </div>
                      <textarea
                        rows={2}
                        placeholder="Ghi chú thêm của GVCN..."
                        value={newViolationNotes}
                        onChange={(e) => setNewViolationNotes(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-rose-300 rounded-lg text-xs"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (!newViolationContent.trim()) return;
                            onAddViolation({
                              id: `vp-${Date.now()}`,
                              studentId: student.id,
                              studentName: student.fullName,
                              date: new Date().toISOString().split('T')[0],
                              content: newViolationContent.trim(),
                              severity: newViolationSeverity,
                              disciplinaryAction: newViolationAction.trim() || 'Nhắc nhở trước lớp',
                              notes: newViolationNotes.trim(),
                              resolved: false
                            });
                            setNewViolationContent('');
                            setNewViolationNotes('');
                            setShowAddViolationForm(false);
                            setSaveSuccessToast(true);
                            setTimeout(() => setSaveSuccessToast(false), 2500);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Lưu vi phạm</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {studentViolations.length === 0 ? (
                    <p className="text-xs text-slate-400 py-3 text-center bg-slate-50 rounded-lg">Không có vi phạm ghi nhận.</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {studentViolations.map((v, vIdx) => (
                        <div key={vIdx} className="p-2.5 bg-rose-50/60 rounded-lg border border-rose-100 text-xs space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-rose-950">{v.content}</span>
                            <span className="text-[10px] text-slate-500">{formatDate(v.date)}</span>
                          </div>
                          <p className="text-slate-600"><span className="text-slate-400">Xử lý:</span> {v.disciplinaryAction}</p>
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${v.resolved ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-200 text-rose-800'}`}>
                            {v.resolved ? 'Đã khắc phục' : 'Chưa khắc phục'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Rewards & Team Activity Achievements */}
                <div className="bg-white rounded-xl border border-amber-200 p-4 shadow-xs">
                  <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
                    <h5 className="font-bold text-amber-900 text-sm flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-amber-600" />
                      Thành tích hoạt động Tổ & Khen thưởng ({studentRewards.length})
                    </h5>
                    {onAddReward && (
                      <button
                        type="button"
                        onClick={() => setShowAddActivityForm(!showAddActivityForm)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition cursor-pointer"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>+ Ghi nhận thành tích</span>
                      </button>
                    )}
                  </div>

                  {showAddActivityForm && onAddReward && (
                    <div className="mb-3 p-3 rounded-xl bg-amber-50/90 border border-amber-200 space-y-2.5 text-xs">
                      <div className="font-bold text-amber-900 flex items-center justify-between">
                        <span>Thêm thành tích hoạt động ({student.team || getDefaultTeamForStudent(student.id, student.role)})</span>
                        <button
                          type="button"
                          onClick={() => setShowAddActivityForm(false)}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="Tên thành tích (VD: Hoàn thành tốt trực nhật Tổ, Hoa điểm 10...)"
                        value={newActivityTitle}
                        onChange={(e) => setNewActivityTitle(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-medium"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={newActivityCategory}
                          onChange={(e) => setNewActivityCategory(e.target.value as RewardCategory)}
                          className="px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-xs"
                        >
                          <option value="Hoạt động tổ">Hoạt động tổ</option>
                          <option value="Học tập">Học tập</option>
                          <option value="Phong trào">Phong trào</option>
                          <option value="Thể thao - Văn nghệ">Thể thao - Văn nghệ</option>
                          <option value="Việc tốt">Việc tốt</option>
                          <option value="Kỷ luật">Kỷ luật</option>
                        </select>
                        <select
                          value={newActivityPoints}
                          onChange={(e) => setNewActivityPoints(Number(e.target.value))}
                          className="px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-bold text-emerald-700"
                        >
                          <option value={10}>+10 điểm tổ</option>
                          <option value={15}>+15 điểm tổ</option>
                          <option value={20}>+20 điểm tổ</option>
                          <option value={30}>+30 điểm tổ</option>
                        </select>
                      </div>
                      <input
                        type="text"
                        placeholder="Tên phong trào / hoạt động cụ thể..."
                        value={newActivityName}
                        onChange={(e) => setNewActivityName(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-xs"
                      />
                      <textarea
                        rows={2}
                        placeholder="Nội dung chi tiết & hình thức tuyên dương..."
                        value={newActivityContent}
                        onChange={(e) => setNewActivityContent(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-xs"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (!newActivityTitle.trim()) return;
                            const team: TeamGroup = student.team || getDefaultTeamForStudent(student.id, student.role);
                            onAddReward({
                              id: `kt-${Date.now()}`,
                              studentId: student.id,
                              studentName: student.fullName,
                              team,
                              date: new Date().toISOString().split('T')[0],
                              week: 4,
                              activityName: newActivityName.trim() || newActivityCategory,
                              achievement: newActivityTitle.trim(),
                              content: newActivityContent.trim() || `Tích cực tham gia hoạt động của ${team}`,
                              category: newActivityCategory,
                              points: newActivityPoints
                            });
                            setNewActivityTitle('');
                            setNewActivityName('');
                            setNewActivityContent('');
                            setShowAddActivityForm(false);
                            setSaveSuccessToast(true);
                            setTimeout(() => setSaveSuccessToast(false), 2500);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Lưu thành tích</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {studentRewards.length === 0 ? (
                    <p className="text-xs text-slate-400 py-3 text-center bg-slate-50 rounded-lg">Chưa có thành tích hoạt động riêng.</p>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto">
                      {studentRewards.map((r, rIdx) => (
                        <div key={rIdx} className="p-2.5 bg-amber-50/60 rounded-lg border border-amber-100 text-xs space-y-1">
                          <div className="flex justify-between items-center gap-2">
                            <span className="font-semibold text-amber-950">{r.achievement}</span>
                            <span className="text-[10px] text-slate-500 shrink-0">{formatDate(r.date)}</span>
                          </div>
                          {r.activityName && (
                            <p className="text-[11px] text-indigo-700 font-medium">Hoạt động: {r.activityName}</p>
                          )}
                          <p className="text-slate-600">{r.content}</p>
                          <div className="flex items-center gap-1.5 pt-0.5">
                            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">
                              {r.team || student.team || getDefaultTeamForStudent(student.id, student.role)}
                            </span>
                            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-800">
                              {r.category}
                            </span>
                            {r.points && (
                              <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                +{r.points} điểm
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Weekly Emulation */}
          {activeTab === 'emulation' && (
            <div className="space-y-4">
              <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-200">
                <h4 className="font-bold text-indigo-900 text-sm">Bảng theo dõi thi đua nề nếp theo tuần (Chỉnh sửa trực tiếp)</h4>
                <p className="text-xs text-indigo-700">Chọn xếp loại từng tuần (Tốt, Khá, Đạt, Chưa đạt) và bấm "Lưu thay đổi"</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {Array.from({ length: 12 }, (_, i) => i + 1).map(weekNum => {
                  const rating = editableEmulation[weekNum] || (weekNum <= 4 ? 'Tốt' : 'Chưa cập nhật');
                  return (
                    <div key={weekNum} className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col gap-1.5">
                      <span className="text-xs font-bold text-slate-500">Tuần {weekNum}</span>
                      <select
                        value={rating}
                        onChange={(e) => handleEmulationChange(weekNum, e.target.value as ConductRating)}
                        className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-bold border focus:outline-hidden ${
                          rating === 'Tốt' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                          rating === 'Khá' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                          rating === 'Đạt' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                          rating === 'Chưa đạt' ? 'bg-rose-50 text-rose-800 border-rose-200' :
                          'bg-slate-50 text-slate-500 border-slate-200'
                        }`}
                      >
                        <option value="Tốt">Tốt</option>
                        <option value="Khá">Khá</option>
                        <option value="Đạt">Đạt</option>
                        <option value="Chưa đạt">Chưa đạt</option>
                        <option value="Chưa cập nhật">Chưa cập nhật</option>
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 5: Attendance */}
          {activeTab === 'attendance' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
                  <span className="text-xs text-emerald-700 font-medium block">Tỷ lệ chuyên cần</span>
                  <span className="text-xl font-bold text-emerald-900">{attendanceRate}%</span>
                </div>
                <div className="p-3.5 bg-blue-50 rounded-xl border border-blue-200 text-center">
                  <span className="text-xs text-blue-700 font-medium block">Có mặt</span>
                  <span className="text-xl font-bold text-blue-900">{presentDays} buổi</span>
                </div>
                <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-center">
                  <span className="text-xs text-amber-700 font-medium block">Nghỉ có phép</span>
                  <span className="text-xl font-bold text-amber-900">{excusedDays} buổi</span>
                </div>
                <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200 text-center">
                  <span className="text-xs text-rose-700 font-medium block">Đi muộn / Không phép</span>
                  <span className="text-xl font-bold text-rose-900">{lateDays + unexcusedDays} buổi</span>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Ngày</th>
                      <th className="py-2.5 px-3 text-center">Trạng thái</th>
                      <th className="py-2.5 px-3">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {attendance.map((att, aIdx) => {
                      const rec = att.records.find(r => r.studentId === student.id);
                      if (!rec) return null;
                      return (
                        <tr key={aIdx}>
                          <td className="py-2 px-3 font-medium text-slate-800">{formatDate(att.date)}</td>
                          <td className="py-2 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                              rec.status === 'present' ? 'bg-emerald-100 text-emerald-800' :
                              rec.status === 'excused' ? 'bg-amber-100 text-amber-800' :
                              rec.status === 'late' ? 'bg-indigo-100 text-indigo-800' :
                              'bg-rose-100 text-rose-800'
                            }`}>
                              {rec.status === 'present' ? 'Có mặt' :
                               rec.status === 'excused' ? 'Vắng có phép' :
                               rec.status === 'late' ? 'Đi muộn' : 'Vắng không phép'}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-slate-500">{rec.note || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: Parents Contact */}
          {activeTab === 'parents' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-slate-900 text-sm">Nhật ký liên lạc phụ huynh</h4>
              </div>

              {studentParents.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
                  <PhoneCall className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">Chưa có nhật ký liên lạc nào cho học sinh này.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {studentParents.map((p, pIdx) => (
                    <div key={pIdx} className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2">
                      <div className="flex flex-wrap justify-between items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
                          <Phone className="w-4 h-4 text-blue-600" />
                          {p.parentName} ({p.relationship}) — {p.phone}
                        </span>
                        <span className="text-xs text-slate-400">{formatDate(p.date)}</span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        {p.content}
                      </p>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-400 font-medium">Kết quả:</span>
                        <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {p.result}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="border-t border-slate-200 bg-slate-50 px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleSaveChanges}
              className={`px-4 py-2 text-sm font-bold text-white rounded-xl transition-all shadow-xs flex items-center gap-2 ${
                hasUnsavedChanges 
                  ? 'bg-emerald-600 hover:bg-emerald-700 ring-2 ring-emerald-500/30 animate-pulse' 
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              <Save className="w-4 h-4" />
              Lưu thay đổi
            </button>
            <button
              onClick={() => onEditStudent(student)}
              className="px-4 py-2 text-sm font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <Edit3 className="w-4 h-4" />
              Chỉnh sửa lý lịch đầy đủ
            </button>
            {saveSuccessToast && (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Đã lưu thay đổi thành công!
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
};
