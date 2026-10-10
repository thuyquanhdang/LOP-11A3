import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Save, 
  Heart, 
  AlertTriangle, 
  Award, 
  MapPin, 
  Phone, 
  ShieldCheck,
  GraduationCap
} from 'lucide-react';
import { 
  Student, 
  Gender, 
  Ethnicity, 
  FamilyBackground, 
  PolicyType, 
  ClassRole,
  AcademicRating,
  ConductRating,
  TeamGroup
} from '../../types';
import { generateSampleSubjectScores, generateSampleWeeklyEmulation, getDefaultTeamForStudent } from '../../mockData';

interface StudentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (student: Student) => void;
  initialStudent: Student | null;
  totalStudentsCount: number;
}

const ETHNICITY_LIST: Ethnicity[] = [
  'Chăm', 'Ba-na', 'Kinh', 'Tày', 'Thái', 'Mường', 'H\'Mông', 'Dao', 'Khmer', 'Nùng', 'Hoa', 'Gia Rai', 'Ê Đê', 'Khác'
];

const FAMILY_BACKGROUND_LIST: FamilyBackground[] = [
  'Bình thường', 'Hộ nghèo', 'Hộ cận nghèo', 'Mồ côi cha/mẹ', 'Cha mẹ ly hôn', 'Sống cùng ông bà', 'Khó khăn đặc biệt'
];

const POLICY_TYPE_LIST: PolicyType[] = [
  'Không',
  'Miễn giảm 100% học phí',
  'Miễn giảm 70% học phí',
  'Miễn giảm 50% học phí',
  'Hỗ trợ chi phí học tập (NĐ 81)',
  'Học sinh Dân tộc thiểu số khó khăn',
  'Con Thương binh / Liệt sĩ',
  'Học sinh Khuyết tật'
];

const ROLE_LIST: ClassRole[] = [
  'Học sinh',
  'Lớp trưởng',
  'Lớp phó học tập',
  'Lớp phó phong trào',
  'Lớp phó lao động',
  'Tổ trưởng tổ 1',
  'Tổ trưởng tổ 2',
  'Tổ trưởng tổ 3',
  'Tổ trưởng tổ 4',
  'Bí thư chi đoàn',
  'Phó Bí thư chi đoàn',
  'Thủ quỹ'
];

const TEAM_LIST: TeamGroup[] = ['Tổ 1', 'Tổ 2', 'Tổ 3', 'Tổ 4'];

const AVATAR_COLORS = [
  'bg-blue-600', 'bg-emerald-600', 'bg-indigo-600', 'bg-purple-600',
  'bg-rose-600', 'bg-amber-600', 'bg-teal-600', 'bg-cyan-600', 'bg-pink-600'
];

export const StudentFormModal: React.FC<StudentFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialStudent,
  totalStudentsCount
}) => {
  const [formData, setFormData] = useState<Partial<Student>>({
    code: '',
    fullName: '',
    dob: '2009-01-01',
    gender: 'Nữ',
    ethnicity: 'Chăm',
    address: '',
    phone: '',
    fatherName: '',
    fatherPhone: '',
    fatherJob: '',
    motherName: '',
    motherPhone: '',
    motherJob: '',
    familyBackground: 'Bình thường',
    policyType: 'Không',
    role: 'Học sinh',
    team: 'Tổ 1',
    academicRating: 'Khá',
    conductRating: 'Tốt',
    notes: '',
    needsAttention: false,
    attentionReason: '',
    isProgressing: false,
    progressNote: '',
  });

  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (initialStudent) {
      setFormData({
        ...initialStudent,
        team: initialStudent.team || getDefaultTeamForStudent(initialStudent.id, initialStudent.role)
      });
    } else {
      const nextNum = totalStudentsCount + 1;
      const codeStr = `11A3-${nextNum < 10 ? '0' + nextNum : nextNum}`;
      setFormData({
        code: codeStr,
        fullName: '',
        dob: '2009-01-01',
        gender: 'Nữ',
        ethnicity: 'Chăm',
        address: '',
        phone: '',
        fatherName: '',
        fatherPhone: '',
        fatherJob: '',
        motherName: '',
        motherPhone: '',
        motherJob: '',
        familyBackground: 'Bình thường',
        policyType: 'Không',
        role: 'Học sinh',
        team: 'Tổ 1',
        academicRating: 'Khá',
        conductRating: 'Tốt',
        notes: '',
        needsAttention: false,
        attentionReason: '',
        isProgressing: false,
        progressNote: '',
      });
    }
    setFormErrors({});
  }, [initialStudent, isOpen, totalStudentsCount]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { [key: string]: string } = {};

    if (!formData.fullName?.trim()) {
      errors.fullName = 'Vui lòng nhập họ và tên học sinh';
    }
    if (!formData.code?.trim()) {
      errors.code = 'Vui lòng nhập mã học sinh';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const academicRate = (formData.academicRating as any) || 'Khá';
    const conductRate = (formData.conductRating as any) || 'Tốt';

    const finalStudent: Student = {
      id: initialStudent ? initialStudent.id : `hs11a3-${Date.now()}`,
      code: formData.code!.trim(),
      fullName: formData.fullName!.trim(),
      dob: formData.dob || '',
      gender: (formData.gender as Gender) || 'Nữ',
      ethnicity: (formData.ethnicity as Ethnicity) || 'Chăm',
      address: formData.address || '',
      phone: formData.phone || '',
      fatherName: formData.fatherName || '',
      fatherPhone: formData.fatherPhone || '',
      fatherJob: formData.fatherJob || '',
      motherName: formData.motherName || '',
      motherPhone: formData.motherPhone || '',
      motherJob: formData.motherJob || '',
      familyBackground: (formData.familyBackground as FamilyBackground) || 'Bình thường',
      policyType: (formData.policyType as PolicyType) || 'Không',
      role: (formData.role as ClassRole) || 'Học sinh',
      team: (formData.team as TeamGroup) || 'Tổ 1',
      academicRating: academicRate,
      conductRating: conductRate,
      subjectScores: initialStudent?.subjectScores || generateSampleSubjectScores(academicRate === 'Chưa cập nhật' ? 'Khá' : academicRate),
      weeklyEmulation: initialStudent?.weeklyEmulation || generateSampleWeeklyEmulation(conductRate === 'Chưa cập nhật' ? 'Tốt' : conductRate),
      notes: formData.notes || '',
      needsAttention: !!formData.needsAttention,
      attentionReason: formData.attentionReason || '',
      isProgressing: !!formData.isProgressing,
      progressNote: formData.progressNote || '',
      avatarColor: initialStudent?.avatarColor || AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]
    };

    onSave(finalStudent);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden my-auto">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                {initialStudent ? 'Chỉnh sửa thông tin học sinh' : 'Thêm học sinh mới vào lớp 11A3'}
              </h3>
              <p className="text-xs text-slate-400">Giáo viên chủ nhiệm: Đặng Thị Thùy Quanh</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-sm">
          
          {/* Section 1: Basic Info */}
          <div className="space-y-4">
            <h4 className="font-bold text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-2 text-xs uppercase tracking-wider">
              <User className="w-4 h-4 text-blue-600" />
              1. Thông tin cơ bản
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mã học sinh <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.code || ''}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="Ví dụ: 11A3-01"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                />
                {formErrors.code && <p className="text-xs text-rose-500 mt-1">{formErrors.code}</p>}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Họ và tên học sinh <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.fullName || ''}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Nhập họ và tên đầy đủ"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm font-semibold"
                />
                {formErrors.fullName && <p className="text-xs text-rose-500 mt-1">{formErrors.fullName}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Giới tính</label>
                <select
                  value={formData.gender || 'Nữ'}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                >
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Dân tộc</label>
                <select
                  value={formData.ethnicity || 'Chăm'}
                  onChange={(e) => setFormData({ ...formData, ethnicity: e.target.value as Ethnicity })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                >
                  {ETHNICITY_LIST.map(eth => (
                    <option key={eth} value={eth}>{eth}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Ngày sinh</label>
                <input
                  type="date"
                  value={formData.dob || ''}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tổ sinh hoạt</label>
                <select
                  value={formData.team || 'Tổ 1'}
                  onChange={(e) => setFormData({ ...formData, team: e.target.value as TeamGroup })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm bg-indigo-50 font-bold text-indigo-800"
                >
                  {TEAM_LIST.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Chức vụ trong lớp</label>
                <select
                  value={formData.role || 'Học sinh'}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as ClassRole })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm bg-white font-medium text-blue-700"
                >
                  {ROLE_LIST.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Số điện thoại cá nhân (nếu có)</label>
                <input
                  type="text"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Ví dụ: 0382.491.820"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Địa chỉ thường trú / Nơi ở</label>
                <input
                  type="text"
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Ví dụ: Làng Canh Tiến, Xã Canh Liên, Vân Canh, Bình Định"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Family Info */}
          <div className="space-y-4">
            <h4 className="font-bold text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-2 text-xs uppercase tracking-wider">
              <Heart className="w-4 h-4 text-rose-600" />
              2. Thông tin gia đình & Người liên hệ
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Họ tên Bố (Cha)</label>
                <input
                  type="text"
                  value={formData.fatherName || ''}
                  onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                  placeholder="Họ tên bố"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">SĐT Bố</label>
                <input
                  type="text"
                  value={formData.fatherPhone || ''}
                  onChange={(e) => setFormData({ ...formData, fatherPhone: e.target.value })}
                  placeholder="Số điện thoại bố"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nghề nghiệp Bố</label>
                <input
                  type="text"
                  value={formData.fatherJob || ''}
                  onChange={(e) => setFormData({ ...formData, fatherJob: e.target.value })}
                  placeholder="Ví dụ: Làm nông / Cán bộ"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Họ tên Mẹ</label>
                <input
                  type="text"
                  value={formData.motherName || ''}
                  onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                  placeholder="Họ tên mẹ"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">SĐT Mẹ</label>
                <input
                  type="text"
                  value={formData.motherPhone || ''}
                  onChange={(e) => setFormData({ ...formData, motherPhone: e.target.value })}
                  placeholder="Số điện thoại mẹ"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nghề nghiệp Mẹ</label>
                <input
                  type="text"
                  value={formData.motherJob || ''}
                  onChange={(e) => setFormData({ ...formData, motherJob: e.target.value })}
                  placeholder="Ví dụ: Nội trợ / Buôn bán"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div className="sm:col-span-1">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Hoàn cảnh gia đình</label>
                <select
                  value={formData.familyBackground || 'Bình thường'}
                  onChange={(e) => setFormData({ ...formData, familyBackground: e.target.value as FamilyBackground })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                >
                  {FAMILY_BACKGROUND_LIST.map(fb => (
                    <option key={fb} value={fb}>{fb}</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Chế độ chính sách</label>
                <select
                  value={formData.policyType || 'Không'}
                  onChange={(e) => setFormData({ ...formData, policyType: e.target.value as PolicyType })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm bg-white font-medium text-amber-800"
                >
                  {POLICY_TYPE_LIST.map(pol => (
                    <option key={pol} value={pol}>{pol}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Evaluation & Special Tracking */}
          <div className="space-y-4">
            <h4 className="font-bold text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-2 text-xs uppercase tracking-wider">
              <GraduationCap className="w-4 h-4 text-indigo-600" />
              3. Đánh giá học tập & Theo dõi đặc biệt
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Xếp loại học lực dự kiến</label>
                <select
                  value={formData.academicRating || 'Khá'}
                  onChange={(e) => setFormData({ ...formData, academicRating: e.target.value as AcademicRating })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                >
                  <option value="Tốt">Tốt</option>
                  <option value="Khá">Khá</option>
                  <option value="Đạt">Đạt</option>
                  <option value="Chưa đạt">Chưa đạt</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mức rèn luyện / Hạnh kiểm</label>
                <select
                  value={formData.conductRating || 'Tốt'}
                  onChange={(e) => setFormData({ ...formData, conductRating: e.target.value as ConductRating })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                >
                  <option value="Tốt">Tốt</option>
                  <option value="Khá">Khá</option>
                  <option value="Đạt">Đạt</option>
                  <option value="Chưa đạt">Chưa đạt</option>
                </select>
              </div>

              {/* Special Flags */}
              <div className="sm:col-span-2 p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="needsAttentionCheck"
                    checked={formData.needsAttention || false}
                    onChange={(e) => setFormData({ ...formData, needsAttention: e.target.checked })}
                    className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500"
                  />
                  <label htmlFor="needsAttentionCheck" className="text-sm font-semibold text-rose-900 cursor-pointer flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                    Học sinh cần quan tâm đặc biệt (hoàn cảnh / nề nếp / học tập)
                  </label>
                </div>
                {formData.needsAttention && (
                  <input
                    type="text"
                    value={formData.attentionReason || ''}
                    onChange={(e) => setFormData({ ...formData, attentionReason: e.target.value })}
                    placeholder="Lý do cần quan tâm (Ví dụ: Hay đi học muộn, hoàn cảnh khó khăn...)"
                    className="w-full px-3 py-2 rounded-lg border border-rose-200 focus:outline-hidden focus:ring-2 focus:ring-rose-500 text-xs bg-white text-rose-900"
                  />
                )}

                <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                  <input
                    type="checkbox"
                    id="isProgressingCheck"
                    checked={formData.isProgressing || false}
                    onChange={(e) => setFormData({ ...formData, isProgressing: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <label htmlFor="isProgressingCheck" className="text-sm font-semibold text-emerald-900 cursor-pointer flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-emerald-500" />
                    Học sinh có tiến bộ / biểu dương trong tuần
                  </label>
                </div>
                {formData.isProgressing && (
                  <input
                    type="text"
                    value={formData.progressNote || ''}
                    onChange={(e) => setFormData({ ...formData, progressNote: e.target.value })}
                    placeholder="Nội dung tiến bộ (Ví dụ: Tích cực phát biểu, đạt điểm cao môn Toán...)"
                    className="w-full px-3 py-2 rounded-lg border border-emerald-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-xs bg-white text-emerald-900"
                  />
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Ghi chú của GVCN</label>
                <textarea
                  rows={2}
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Ghi chú thêm về tính cách, năng khiếu, sở trường..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {initialStudent ? 'Lưu thay đổi' : 'Thêm học sinh'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
