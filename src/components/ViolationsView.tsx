import React, { useState, useMemo } from 'react';
import { 
  AlertTriangle, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  Edit3, 
  X, 
  ShieldAlert,
  FileCheck
} from 'lucide-react';
import { Student, ViolationRecord, ViolationSeverity } from '../types';

interface ViolationsViewProps {
  students: Student[];
  violations: ViolationRecord[];
  onAddViolation: (violation: ViolationRecord) => void;
  onUpdateViolation: (violation: ViolationRecord) => void;
  onDeleteViolation: (violationId: string) => void;
}

const COMMON_VIOLATIONS = [
  'Đi học muộn không phép',
  'Không đeo phù hiệu / không đúng đồng phục',
  'Sử dụng điện thoại trong giờ học',
  'Nói chuyện riêng, mất trật tự trong lớp',
  'Chưa làm bài tập về nhà / không thuộc bài',
  'Trốn tiết, bỏ học buổi chiều',
  'Gây gổ, to tiếng với bạn trong lớp',
  'Gian lận trong giờ kiểm tra'
];

const COMMON_ACTIONS = [
  'Nhắc nhở trước lớp và trừ điểm thi đua',
  'Viết bản tự kiểm điểm có chữ ký phụ huynh',
  'Lao động trực nhật vệ sinh lớp 3 ngày',
  'Tạm giữ điện thoại giao lại cuối buổi học',
  'Mời phụ huynh đến trường trao đổi trực tiếp',
  'Báo cáo Đoàn trường và Hội đồng kỷ luật'
];

export const ViolationsView: React.FC<ViolationsViewProps> = ({
  students,
  violations,
  onAddViolation,
  onUpdateViolation,
  onDeleteViolation
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingViolation, setEditingViolation] = useState<ViolationRecord | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<ViolationRecord>>({
    studentId: students[0]?.id || '',
    studentName: students[0]?.fullName || '',
    date: new Date().toISOString().split('T')[0],
    content: '',
    severity: 'Nhẹ',
    disciplinaryAction: '',
    notes: '',
    resolved: false
  });

  // Filtered Violations
  const filteredViolations = useMemo(() => {
    return violations.filter(v => {
      const matchSearch = 
        v.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.disciplinaryAction.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchSeverity = filterSeverity === 'all' || v.severity === filterSeverity;
      const matchStatus = 
        filterStatus === 'all' ? true :
        filterStatus === 'resolved' ? v.resolved :
        !v.resolved;

      return matchSearch && matchSeverity && matchStatus;
    });
  }, [violations, searchTerm, filterSeverity, filterStatus]);

  const handleOpenAdd = () => {
    const firstStudent = students[0];
    setFormData({
      studentId: firstStudent?.id || '',
      studentName: firstStudent?.fullName || '',
      date: new Date().toISOString().split('T')[0],
      content: '',
      severity: 'Nhẹ',
      disciplinaryAction: 'Nhắc nhở trước lớp và trừ điểm thi đua',
      notes: '',
      resolved: false
    });
    setEditingViolation(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (violation: ViolationRecord) => {
    setFormData({ ...violation });
    setEditingViolation(violation);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentId || !formData.content) {
      alert('Vui lòng chọn học sinh và nhập nội dung vi phạm!');
      return;
    }

    const matchedStudent = students.find(s => s.id === formData.studentId);
    const studentName = matchedStudent ? matchedStudent.fullName : formData.studentName || '';

    if (editingViolation) {
      onUpdateViolation({
        ...editingViolation,
        studentId: formData.studentId!,
        studentName,
        date: formData.date || new Date().toISOString().split('T')[0],
        content: formData.content || '',
        severity: (formData.severity as ViolationSeverity) || 'Nhẹ',
        disciplinaryAction: formData.disciplinaryAction || '',
        notes: formData.notes || '',
        resolved: !!formData.resolved
      });
    } else {
      const newV: ViolationRecord = {
        id: `vp-${Date.now()}`,
        studentId: formData.studentId!,
        studentName,
        date: formData.date || new Date().toISOString().split('T')[0],
        content: formData.content || '',
        severity: (formData.severity as ViolationSeverity) || 'Nhẹ',
        disciplinaryAction: formData.disciplinaryAction || '',
        notes: formData.notes || '',
        resolved: false
      };
      onAddViolation(newV);
    }

    setIsModalOpen(false);
    setEditingViolation(null);
  };

  const toggleResolved = (v: ViolationRecord) => {
    onUpdateViolation({
      ...v,
      resolved: !v.resolved
    });
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            Sổ Theo dõi Nề nếp & Kỷ luật
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700">
              {violations.length} vụ việc
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Ghi nhận vi phạm, mức độ xử lý và tiến độ giáo dục học sinh
          </p>
        </div>

        <button
          id="add-violation-btn"
          onClick={handleOpenAdd}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-semibold transition shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Ghi nhận vi phạm mới</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên học sinh, lỗi vi phạm, hình thức xử lý..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-hidden"
          >
            <option value="all">Tất cả mức độ</option>
            <option value="Nhẹ">Nhẹ</option>
            <option value="Vừa">Vừa</option>
            <option value="Nghiêm trọng">Nghiêm trọng</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-hidden"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="unresolved">Đang theo dõi</option>
            <option value="resolved">Đã giải quyết</option>
          </select>
        </div>
      </div>

      {/* Table of Violations */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4 w-12 text-center">STT</th>
                <th className="py-3 px-4">Học sinh vi phạm</th>
                <th className="py-3 px-3">Ngày</th>
                <th className="py-3 px-4">Nội dung vi phạm</th>
                <th className="py-3 px-3 text-center">Mức độ</th>
                <th className="py-3 px-4">Hình thức xử lý</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredViolations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Không có bản ghi vi phạm nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredViolations.map((v, idx) => (
                  <tr key={v.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 text-center font-medium text-slate-400">
                      {idx + 1}
                    </td>

                    <td className="py-3 px-4 font-bold text-slate-800">
                      {v.studentName}
                    </td>

                    <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                      {v.date}
                    </td>

                    <td className="py-3 px-4 max-w-xs font-medium text-slate-800">
                      {v.content}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full font-semibold text-[10px] ${
                        v.severity === 'Nghiêm trọng'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : v.severity === 'Vừa'
                          ? 'bg-orange-100 text-orange-800 border border-orange-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        {v.severity}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-600">
                      <p className="font-medium text-slate-700">{v.disciplinaryAction}</p>
                      {v.notes && <p className="text-[11px] text-slate-400 mt-0.5 italic">{v.notes}</p>}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => toggleResolved(v)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                          v.resolved 
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' 
                            : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                        }`}
                        title="Bấm để chuyển trạng thái"
                      >
                        {v.resolved ? (
                          <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Đã khắc phục</>
                        ) : (
                          <><Clock className="w-3.5 h-3.5 text-amber-600" /> Đang theo dõi</>
                        )}
                      </button>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => handleOpenEdit(v)}
                          className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                          title="Sửa"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteViolation(v.id)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit Violation */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                {editingViolation ? 'Sửa thông tin vi phạm' : 'Ghi nhận vi phạm nề nếp'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Chọn học sinh vi phạm <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.studentId}
                  onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-rose-500/20"
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.code}) - {s.gender}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ngày vi phạm</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mức độ vi phạm</label>
                  <select
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value as ViolationSeverity })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                    <option value="Nhẹ">Nhẹ (Trừ điểm thi đua)</option>
                    <option value="Vừa">Vừa (Viết kiểm điểm / Mời PH)</option>
                    <option value="Nghiêm trọng">Nghiêm trọng (Hội đồng kỷ luật)</option>
                  </select>
                </div>
              </div>

              {/* Violation Content with suggestion buttons */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nội dung vi phạm <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nhập lỗi vi phạm..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm"
                />

                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-[11px] text-slate-400 py-0.5">Gợi ý:</span>
                  {COMMON_VIOLATIONS.slice(0, 4).map(v => (
                    <button
                      type="button"
                      key={v}
                      onClick={() => setFormData({ ...formData, content: v })}
                      className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px]"
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Hình thức xử lý / Giáo dục
                </label>
                <input
                  type="text"
                  placeholder="VD: Nhắc nhở trước lớp, viết bản kiểm điểm..."
                  value={formData.disciplinaryAction}
                  onChange={(e) => setFormData({ ...formData, disciplinaryAction: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm"
                />

                <div className="flex flex-wrap gap-1.5 mt-2">
                  {COMMON_ACTIONS.slice(0, 3).map(a => (
                    <button
                      type="button"
                      key={a}
                      onClick={() => setFormData({ ...formData, disciplinaryAction: a })}
                      className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px]"
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes & Status */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ghi chú bổ sung</label>
                <textarea
                  rows={2}
                  placeholder="Ghi chú thêm về thái độ nhận lỗi, lời hứa của học sinh..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="resolved-check"
                  checked={formData.resolved}
                  onChange={(e) => setFormData({ ...formData, resolved: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded-md focus:ring-emerald-500"
                />
                <label htmlFor="resolved-check" className="font-semibold text-slate-700 cursor-pointer">
                  Đánh dấu "Đã giải quyết / Đã khắc phục xong"
                </label>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-xs"
                >
                  {editingViolation ? 'Lưu cập nhật' : 'Ghi nhận'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
