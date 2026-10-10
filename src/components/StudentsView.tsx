import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Filter, 
  Edit3, 
  Trash2, 
  Eye, 
  Phone, 
  MapPin, 
  Heart, 
  AlertTriangle, 
  Award, 
  Download, 
  Upload,
  UserCheck, 
  GraduationCap, 
  Sparkles, 
  PhoneCall, 
  ChevronRight,
  Layers,
  LayoutGrid,
  Table as TableIcon,
  CheckCircle2,
  RefreshCw,
  Printer,
  Save
} from 'lucide-react';
import { 
  Student, 
  Gender, 
  Ethnicity, 
  ViolationRecord, 
  RewardRecord, 
  AttendanceRecord, 
  ConductEvaluation, 
  ParentContact, 
  PolicyDocumentItem, 
  ClassInfo 
} from '../types';

import { StudentDetailModal } from './students/StudentDetailModal';
import { StudentFormModal } from './students/StudentFormModal';
import { DeleteStudentModal } from './students/DeleteStudentModal';
import { ImportExportModal } from './students/ImportExportModal';
import { getDefaultTeamForStudent } from '../mockData';

interface StudentsViewProps {
  students: Student[];
  classInfo?: ClassInfo;
  violations?: ViolationRecord[];
  rewards?: RewardRecord[];
  attendance?: AttendanceRecord[];
  conduct?: ConductEvaluation[];
  parents?: ParentContact[];
  policies?: PolicyDocumentItem[];
  onAddStudent: (student: Student) => void;
  onBulkAddStudents?: (students: Student[]) => void;
  onUpdateStudent: (student: Student) => void;
  onDeleteStudent: (studentId: string) => void;
  onAddReward?: (reward: RewardRecord) => void;
  onAddViolation?: (violation: ViolationRecord) => void;
  initialSelectedStudent?: Student | null;
  onClearInitialSelected?: () => void;
}

export const StudentsView: React.FC<StudentsViewProps> = ({
  students = [],
  classInfo = {
    className: '11A3',
    grade: '11',
    schoolName: 'TRƯỜNG PTDTNT THCS VÀ THPT VÂN CANH',
    schoolYear: '2026–2027',
    homeroomTeacher: 'Đặng Thị Thùy Quanh',
    teacherPhone: '0988.123.456',
    teacherEmail: 'thuyquanh97@gmail.com',
    roomNumber: 'Phòng 203 - Khu A',
    classMonitor: 'Nguyễn Lương Tường Vy',
    viceMonitor: 'Măng Lê Thùy Trang',
    totalStudents: 38,
    maleCount: 14,
    femaleCount: 24
  },
  violations = [],
  rewards = [],
  attendance = [],
  conduct = [],
  parents = [],
  policies = [],
  onAddStudent,
  onBulkAddStudents,
  onUpdateStudent,
  onDeleteStudent,
  onAddReward,
  onAddViolation,
  initialSelectedStudent = null,
  onClearInitialSelected
}) => {
  // State for search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGender, setFilterGender] = useState<string>('all');
  const [filterEthnicity, setFilterEthnicity] = useState<string>('all');
  const [filterAcademic, setFilterAcademic] = useState<string>('all');
  const [filterConduct, setFilterConduct] = useState<string>('all');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterPolicy, setFilterPolicy] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Modal States
  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState<Student | null>(initialSelectedStudent);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);
  const [saveNotification, setSaveNotification] = useState<string | null>(null);

  const showSaveToast = (msg: string = 'Đã lưu thay đổi danh sách lớp thành công!') => {
    setSaveNotification(msg);
    setTimeout(() => {
      setSaveNotification(null);
    }, 3000);
  };

  // Sync initialSelectedStudent if passed from parent
  React.useEffect(() => {
    if (initialSelectedStudent) {
      setSelectedStudentForDetail(initialSelectedStudent);
    }
  }, [initialSelectedStudent]);

  // Filter logic
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const q = searchTerm.toLowerCase().trim();
      const matchSearch = !q || 
        s.fullName.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        s.ethnicity.toLowerCase().includes(q) ||
        s.gender.toLowerCase().includes(q) ||
        s.phone.includes(q) ||
        s.fatherPhone.includes(q) ||
        s.motherPhone.includes(q) ||
        s.address.toLowerCase().includes(q);

      const matchGender = filterGender === 'all' || s.gender === filterGender;
      const matchEthnicity = filterEthnicity === 'all' || s.ethnicity === filterEthnicity;
      const matchAcademic = filterAcademic === 'all' || (s.academicRating || 'Khá') === filterAcademic;
      const matchConduct = filterConduct === 'all' || (s.conductRating || 'Tốt') === filterConduct;
      const matchPolicy = filterPolicy === 'all' || 
        (filterPolicy === 'policy' ? s.policyType !== 'Không' : s.policyType === 'Không');
      
      let matchRole = true;
      const stTeam = s.team || getDefaultTeamForStudent(s.id, s.role);
      if (filterRole === 'officers') {
        matchRole = !!(s.role && s.role !== 'Học sinh');
      } else if (filterRole === 'attention') {
        matchRole = s.needsAttention;
      } else if (filterRole === 'progressing') {
        matchRole = s.isProgressing;
      } else if (filterRole.startsWith('Tổ ')) {
        matchRole = stTeam === filterRole;
      }

      return matchSearch && matchGender && matchEthnicity && matchAcademic && matchConduct && matchPolicy && matchRole;
    });
  }, [students, searchTerm, filterGender, filterEthnicity, filterAcademic, filterConduct, filterPolicy, filterRole]);

  // Summary statistics calculations
  const stats = useMemo(() => {
    const total = students.length;
    const female = students.filter(s => s.gender === 'Nữ').length;
    const male = students.filter(s => s.gender === 'Nam').length;
    const ethnicMinority = students.filter(s => s.ethnicity !== 'Kinh').length;
    const goodConduct = students.filter(s => (s.conductRating || 'Tốt') === 'Tốt').length;
    const needsAttention = students.filter(s => s.needsAttention).length;
    const policyStudents = students.filter(s => s.policyType !== 'Không').length;
    const progressing = students.filter(s => s.isProgressing).length;

    return {
      total,
      female,
      male,
      ethnicMinority,
      goodConduct,
      needsAttention,
      policyStudents,
      progressing
    };
  }, [students]);

  // Reset filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterGender('all');
    setFilterEthnicity('all');
    setFilterAcademic('all');
    setFilterConduct('all');
    setFilterRole('all');
    setFilterPolicy('all');
  };

  // Format date helper
  const formatDate = (dStr?: string) => {
    if (!dStr) return 'Chưa cập nhật';
    const parts = dStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dStr;
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-blue-50/70 to-transparent pointer-events-none hidden md:block" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-blue-100 text-blue-800 tracking-wide">
                NĂM HỌC {classInfo.schoolYear}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {classInfo.schoolName}
              </span>
            </div>
            
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
              DANH SÁCH HỌC SINH – LỚP {classInfo.className}
            </h1>

            {/* Official Header Meta Requested by User */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2.5 text-xs sm:text-sm text-slate-600">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-medium">Giáo viên chủ nhiệm:</span>
                <strong className="text-slate-900 font-bold">{classInfo.homeroomTeacher}</strong>
              </div>
              <span className="text-slate-300 hidden sm:inline">•</span>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-medium">Lớp:</span>
                <strong className="text-blue-700 font-bold">{classInfo.className}</strong>
              </div>
              <span className="text-slate-300 hidden sm:inline">•</span>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-medium">Sĩ số:</span>
                <strong className="text-slate-900 font-bold">{stats.total} học sinh</strong>
              </div>
              <span className="text-slate-300 hidden sm:inline">•</span>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-medium">Nam:</span>
                <strong className="text-blue-600 font-bold">{stats.male}</strong>
              </div>
              <span className="text-slate-300 hidden sm:inline">•</span>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-medium">Nữ:</span>
                <strong className="text-rose-600 font-bold">{stats.female}</strong>
              </div>
            </div>
          </div>

          {/* Top Quick Actions */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => {
                // Save current students list to storage and show confirmation
                try {
                  localStorage.setItem('tlcn_students_v1', JSON.stringify(students));
                } catch (e) {
                  console.error(e);
                }
                showSaveToast('Đã lưu mọi thay đổi danh sách học sinh lớp 11A3!');
              }}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs hover:shadow-md transition-all flex items-center gap-2 cursor-pointer"
              title="Lưu toàn bộ thay đổi hiện tại"
            >
              <Save className="w-4 h-4" />
              Lưu thay đổi
            </button>
            <button
              onClick={() => {
                setEditingStudent(null);
                setIsFormModalOpen(true);
              }}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs hover:shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Thêm học sinh
            </button>
            <button
              onClick={() => setIsImportExportOpen(true)}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs sm:text-sm rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Nhập / Xuất dữ liệu Excel"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">Xuất/Nhập</span> Excel
            </button>
          </div>
        </div>

        {/* Save confirmation banner */}
        {saveNotification && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center justify-between animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{saveNotification}</span>
            </div>
            <span className="text-[11px] text-emerald-600 font-normal hidden sm:inline">Dữ liệu đã được đồng bộ an toàn</span>
          </div>
        )}
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-center text-slate-500 mb-1">
            <span className="text-xs font-semibold">Tổng sĩ số</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-slate-900">{stats.total}</span>
            <span className="text-xs text-slate-400 font-medium">học sinh</span>
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-center text-slate-500 mb-1">
            <span className="text-xs font-semibold">Nữ / Nam</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-600">
              {Math.round((stats.female / (stats.total || 1)) * 100)}% Nữ
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-black text-rose-600">{stats.female} Nữ</span>
            <span className="text-xs text-slate-400 font-medium">/ {stats.male} Nam</span>
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-center text-slate-500 mb-1">
            <span className="text-xs font-semibold">Dân tộc thiểu số</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700">
              Chăm & Ba-na
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-amber-600">{stats.ethnicMinority}</span>
            <span className="text-xs text-slate-400 font-medium">/ {stats.total} HS</span>
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-center text-slate-500 mb-1">
            <span className="text-xs font-semibold">Rèn luyện Tốt</span>
            <Award className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-emerald-600">{stats.goodConduct}</span>
            <span className="text-xs text-slate-400 font-medium">học sinh</span>
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-center text-slate-500 mb-1">
            <span className="text-xs font-semibold">Cần theo dõi</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-rose-600">{stats.needsAttention}</span>
            <span className="text-xs text-slate-400 font-medium">học sinh</span>
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-center text-slate-500 mb-1">
            <span className="text-xs font-semibold">Diện chính sách</span>
            <Heart className="w-4 h-4 text-purple-600" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-purple-700">{stats.policyStudents}</span>
            <span className="text-xs text-slate-400 font-medium">đối tượng</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Field */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm theo Tên học sinh, Dân tộc, Giới tính, SĐT, Địa chỉ..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700 font-semibold"
              >
                Xóa
              </button>
            )}
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0 self-start md:self-auto">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              Bảng dữ liệu
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                viewMode === 'cards' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Thẻ học sinh
            </button>
          </div>
        </div>

        {/* Filter Dropdowns */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2 border-t border-slate-100 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Giới tính</label>
            <select
              value={filterGender}
              onChange={(e) => setFilterGender(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-200 bg-white text-slate-800 font-medium focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">Tất cả giới tính</option>
              <option value="Nữ">Nữ ({stats.female})</option>
              <option value="Nam">Nam ({stats.male})</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Dân tộc</label>
            <select
              value={filterEthnicity}
              onChange={(e) => setFilterEthnicity(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-200 bg-white text-slate-800 font-medium focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">Tất cả dân tộc</option>
              <option value="Chăm">Chăm</option>
              <option value="Ba-na">Ba-na</option>
              <option value="Kinh">Kinh</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Học lực</label>
            <select
              value={filterAcademic}
              onChange={(e) => setFilterAcademic(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-200 bg-white text-slate-800 font-medium focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">Tất cả học lực</option>
              <option value="Tốt">Tốt</option>
              <option value="Khá">Khá</option>
              <option value="Đạt">Đạt</option>
              <option value="Chưa đạt">Chưa đạt</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Rèn luyện</label>
            <select
              value={filterConduct}
              onChange={(e) => setFilterConduct(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-200 bg-white text-slate-800 font-medium focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">Tất cả rèn luyện</option>
              <option value="Tốt">Tốt</option>
              <option value="Khá">Khá</option>
              <option value="Đạt">Đạt</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Tổ / Đối tượng</label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-200 bg-white text-slate-800 font-medium focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">Tất cả 4 Tổ & Đối tượng</option>
              <option value="Tổ 1">Tổ 1 (TT: Nhật Vỹ)</option>
              <option value="Tổ 2">Tổ 2 (TT: Kim Thủy)</option>
              <option value="Tổ 3">Tổ 3 (TT: Thị Hường)</option>
              <option value="Tổ 4">Tổ 4 (TT: Phương Trâm)</option>
              <option value="officers">Cán bộ lớp / Tổ trưởng</option>
              <option value="attention">Cần quan tâm đặc biệt</option>
              <option value="progressing">Có tiến bộ biểu dương</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Chính sách</label>
            <select
              value={filterPolicy}
              onChange={(e) => setFilterPolicy(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-200 bg-white text-slate-800 font-medium focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">Tất cả</option>
              <option value="policy">Diện chính sách ({stats.policyStudents})</option>
              <option value="none">Không hưởng chính sách</option>
            </select>
          </div>
        </div>

        {/* Results summary & reset */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <span>
            Đang hiển thị <strong>{filteredStudents.length}</strong> / <strong>{students.length}</strong> học sinh
          </span>
          {(searchTerm || filterGender !== 'all' || filterEthnicity !== 'all' || filterAcademic !== 'all' || filterConduct !== 'all' || filterRole !== 'all' || filterPolicy !== 'all') && (
            <button
              onClick={handleResetFilters}
              className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Đặt lại bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Main Student Listing */}
      {viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead className="bg-slate-900 text-white font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-3.5 text-center w-12">STT</th>
                  <th className="py-3 px-4 min-w-[200px]">Họ và tên</th>
                  <th className="py-3 px-3 text-center">Giới tính</th>
                  <th className="py-3 px-3 text-center">Dân tộc</th>
                  <th className="py-3 px-3 text-center min-w-[100px]">Ngày sinh</th>
                  <th className="py-3 px-3 min-w-[120px]">Số điện thoại</th>
                  <th className="py-3 px-3 min-w-[160px]">Phụ huynh & SĐT</th>
                  <th className="py-3 px-3 min-w-[180px]">Địa chỉ cư trú</th>
                  <th className="py-3 px-3 text-center min-w-[110px]">Chính sách</th>
                  <th className="py-3 px-3 text-center min-w-[120px]">Học lực / HK</th>
                  <th className="py-3 px-4 text-center min-w-[130px] sticky right-0 bg-slate-900 shadow-l">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-slate-500">
                      <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-sm">Không tìm thấy học sinh nào phù hợp</p>
                      <p className="text-xs text-slate-400 mt-1">Hãy thử điều chỉnh lại từ khóa tìm kiếm hoặc bộ lọc</p>
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((st, idx) => {
                    const isOfficer = st.role && st.role !== 'Học sinh';
                    return (
                      <tr 
                        key={st.id} 
                        className={`hover:bg-blue-50/40 transition-colors ${
                          st.needsAttention ? 'bg-rose-50/20' : 
                          st.isProgressing ? 'bg-emerald-50/20' : ''
                        }`}
                      >
                        {/* 1. STT */}
                        <td className="py-3 px-3 text-center font-bold text-slate-400">
                          {idx + 1}
                        </td>

                        {/* 2. Họ và tên */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full ${st.avatarColor || 'bg-blue-600'} text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs`}>
                              {st.fullName.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-slate-900 text-sm hover:text-blue-600 cursor-pointer" onClick={() => setSelectedStudentForDetail(st)}>
                                  {st.fullName}
                                </span>
                                {isOfficer && (
                                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                                    ⭐ {st.role}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                                <span className="font-mono">{st.code}</span>
                                <span className="px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                                  {st.team || getDefaultTeamForStudent(st.id, st.role)}
                                </span>
                                {st.needsAttention && (
                                  <span className="text-rose-600 font-semibold flex items-center gap-0.5">
                                    <AlertTriangle className="w-3 h-3" /> Cần quan tâm
                                  </span>
                                )}
                                {st.isProgressing && (
                                  <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
                                    <Award className="w-3 h-3" /> Tiến bộ
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 3. Giới tính */}
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            st.gender === 'Nữ' 
                              ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                              : 'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}>
                            {st.gender}
                          </span>
                        </td>

                        {/* 4. Dân tộc */}
                        <td className="py-3 px-3 text-center">
                          <span className="font-semibold text-slate-800">
                            {st.ethnicity}
                          </span>
                        </td>

                        {/* 5. Ngày sinh */}
                        <td className="py-3 px-3 text-center text-slate-600 font-medium">
                          {formatDate(st.dob)}
                        </td>

                        {/* 6. Số điện thoại */}
                        <td className="py-3 px-3">
                          {st.phone ? (
                            <a href={`tel:${st.phone}`} className="text-blue-600 hover:underline flex items-center gap-1 font-medium">
                              <Phone className="w-3 h-3" />
                              {st.phone}
                            </a>
                          ) : (
                            <span className="text-slate-400 italic text-xs">Chưa cập nhật</span>
                          )}
                        </td>

                        {/* 7. Phụ huynh & SĐT */}
                        <td className="py-3 px-3">
                          <div className="space-y-0.5 text-xs">
                            <p className="font-medium text-slate-900 truncate max-w-[150px]">
                              {st.fatherName ? `Bố: ${st.fatherName}` : (st.motherName ? `Mẹ: ${st.motherName}` : 'Chưa cập nhật')}
                            </p>
                            {(st.fatherPhone || st.motherPhone) && (
                              <a 
                                href={`tel:${st.fatherPhone || st.motherPhone}`} 
                                className="text-emerald-700 hover:underline flex items-center gap-1 text-[11px] font-semibold"
                              >
                                <PhoneCall className="w-3 h-3" />
                                {st.fatherPhone || st.motherPhone}
                              </a>
                            )}
                          </div>
                        </td>

                        {/* 8. Địa chỉ cư trú */}
                        <td className="py-3 px-3">
                          <span className="text-xs text-slate-600 line-clamp-2 max-w-[180px]" title={st.address}>
                            {st.address || 'Chưa cập nhật'}
                          </span>
                        </td>

                        {/* 9. Chính sách */}
                        <td className="py-3 px-3 text-center">
                          {st.policyType !== 'Không' ? (
                            <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 line-clamp-1" title={st.policyType}>
                              {st.policyType}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">—</span>
                          )}
                        </td>

                        {/* 10. Học lực / Hạnh kiểm */}
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              st.academicRating === 'Tốt' ? 'bg-emerald-100 text-emerald-800' :
                              st.academicRating === 'Khá' ? 'bg-blue-100 text-blue-800' :
                              st.academicRating === 'Đạt' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                            }`} title="Học lực">
                              {st.academicRating || 'Khá'}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              st.conductRating === 'Tốt' ? 'bg-emerald-600 text-white' :
                              st.conductRating === 'Khá' ? 'bg-blue-600 text-white' :
                              st.conductRating === 'Đạt' ? 'bg-amber-500 text-white' : 'bg-slate-500 text-white'
                            }`} title="Hạnh kiểm / Rèn luyện">
                              {st.conductRating || 'Tốt'}
                            </span>
                          </div>
                        </td>

                        {/* 11. Thao tác */}
                        <td className="py-3 px-4 text-center sticky right-0 bg-white group-hover:bg-blue-50/40 shadow-l">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setSelectedStudentForDetail(st)}
                              className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                              title="Xem hồ sơ chi tiết"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingStudent(st);
                                setIsFormModalOpen(true);
                              }}
                              className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Chỉnh sửa thông tin"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeletingStudent(st)}
                              className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors"
                              title="Xóa học sinh"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* CARD VIEW FOR MOBILE & TABLET */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-sm">Không tìm thấy học sinh nào</p>
            </div>
          ) : (
            filteredStudents.map((st, idx) => (
              <div 
                key={st.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-3"
              >
                <div>
                  {/* Top card bar */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${st.avatarColor || 'bg-blue-600'} text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0`}>
                        {st.fullName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-bold text-slate-900 text-sm hover:text-blue-600 cursor-pointer" onClick={() => setSelectedStudentForDetail(st)}>
                            {st.fullName}
                          </h3>
                        </div>
                        <span className="text-xs text-slate-400 font-mono">{st.code}</span>
                      </div>
                    </div>
                    
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      st.gender === 'Nữ' ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {st.gender}
                    </span>
                  </div>

                  {/* Role and tags */}
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700">
                      DT: {st.ethnicity}
                    </span>
                    {st.role && st.role !== 'Học sinh' && (
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-900">
                        ⭐ {st.role}
                      </span>
                    )}
                    {st.needsAttention && (
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-rose-100 text-rose-800">
                        ⚠️ Cần quan tâm
                      </span>
                    )}
                    {st.isProgressing && (
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-100 text-emerald-800">
                        ⭐ Tiến bộ
                      </span>
                    )}
                  </div>

                  {/* Key details */}
                  <div className="mt-3 space-y-1 text-xs text-slate-600 border-t border-slate-100 pt-2.5">
                    <p className="flex items-center justify-between">
                      <span className="text-slate-400">Ngày sinh:</span>
                      <strong className="text-slate-800">{formatDate(st.dob)}</strong>
                    </p>
                    <p className="flex items-center justify-between">
                      <span className="text-slate-400">Học lực / Rèn luyện:</span>
                      <strong className="text-slate-800">{st.academicRating || 'Khá'} / {st.conductRating || 'Tốt'}</strong>
                    </p>
                    {st.address && (
                      <p className="text-slate-500 line-clamp-1 mt-1">
                        📍 {st.address}
                      </p>
                    )}
                  </div>
                </div>

                {/* Card action buttons */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    {st.phone && (
                      <a 
                        href={`tel:${st.phone}`} 
                        className="p-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                        title="Gọi học sinh"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                    )}
                    {(st.fatherPhone || st.motherPhone) && (
                      <a 
                        href={`tel:${st.fatherPhone || st.motherPhone}`} 
                        className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors"
                        title="Gọi phụ huynh"
                      >
                        <PhoneCall className="w-4 h-4" />
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setSelectedStudentForDetail(st)}
                      className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition-colors"
                    >
                      Hồ sơ
                    </button>
                    <button
                      onClick={() => {
                        setEditingStudent(st);
                        setIsFormModalOpen(true);
                      }}
                      className="p-1 text-slate-500 hover:text-slate-900 rounded-lg"
                      title="Sửa"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeletingStudent(st)}
                      className="p-1 text-rose-500 hover:text-rose-700 rounded-lg"
                      title="Xóa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>
            ))
          )}
        </div>
      )}

      {/* Modals */}
      <StudentDetailModal
        student={selectedStudentForDetail}
        isOpen={!!selectedStudentForDetail}
        onClose={() => {
          setSelectedStudentForDetail(null);
          if (onClearInitialSelected) onClearInitialSelected();
        }}
        violations={violations}
        rewards={rewards}
        attendance={attendance}
        conduct={conduct}
        parents={parents}
        classInfo={classInfo}
        onEditStudent={(st) => {
          setSelectedStudentForDetail(null);
          setEditingStudent(st);
          setIsFormModalOpen(true);
        }}
        onSaveStudent={(updatedSt) => {
          onUpdateStudent(updatedSt);
          setSelectedStudentForDetail(updatedSt);
          showSaveToast(`Đã lưu thay đổi hồ sơ học sinh ${updatedSt.fullName}!`);
        }}
        onAddReward={(reward) => {
          if (onAddReward) {
            onAddReward(reward);
            showSaveToast(`Đã lưu thành tích hoạt động của em ${reward.studentName} (${reward.team || 'Tổ'})!`);
          }
        }}
        onAddViolation={(violation) => {
          if (onAddViolation) {
            onAddViolation(violation);
            showSaveToast(`Đã ghi nhận và lưu vi phạm của học sinh ${violation.studentName}!`);
          }
        }}
      />

      <StudentFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingStudent(null);
        }}
        onSave={(student) => {
          if (editingStudent) {
            onUpdateStudent(student);
            showSaveToast(`Đã lưu thay đổi thông tin học sinh ${student.fullName}!`);
          } else {
            onAddStudent(student);
            showSaveToast(`Đã thêm học sinh ${student.fullName} vào lớp ${classInfo.className}!`);
          }
        }}
        initialStudent={editingStudent}
        totalStudentsCount={students.length}
      />

      <DeleteStudentModal
        student={deletingStudent}
        isOpen={!!deletingStudent}
        onClose={() => setDeletingStudent(null)}
        onConfirm={(id) => {
          onDeleteStudent(id);
          showSaveToast('Đã xóa học sinh khỏi danh sách lớp và cập nhật bộ nhớ!');
        }}
      />

      <ImportExportModal
        isOpen={isImportExportOpen}
        onClose={() => setIsImportExportOpen(false)}
        students={students}
        classInfo={classInfo}
        onImportStudents={(newStudents) => {
          if (onBulkAddStudents) {
            onBulkAddStudents(newStudents);
          } else {
            newStudents.forEach(st => onAddStudent(st));
          }
          showSaveToast(`Đã nhập và lưu thành công ${newStudents.length} học sinh mới!`);
        }}
      />

    </div>
  );
};
