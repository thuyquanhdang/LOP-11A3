import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Trash2, 
  Edit3, 
  X, 
  CheckSquare, 
  Square,
  Sparkles,
  Download
} from 'lucide-react';
import { Student, PolicyDocumentItem, PolicyType, SubmissionStatus } from '../types';

interface PoliciesViewProps {
  students: Student[];
  policies: PolicyDocumentItem[];
  onAddPolicy: (item: PolicyDocumentItem) => void;
  onUpdatePolicy: (item: PolicyDocumentItem) => void;
  onDeletePolicy: (itemId: string) => void;
}

export const PoliciesView: React.FC<PoliciesViewProps> = ({
  students,
  policies,
  onAddPolicy,
  onUpdatePolicy,
  onDeletePolicy
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PolicyDocumentItem | null>(null);

  const [formData, setFormData] = useState<Partial<PolicyDocumentItem>>({
    studentId: students[0]?.id || '',
    studentName: students[0]?.fullName || '',
    policyType: 'Miễn giảm 100% học phí',
    requiredDocs: 'Giấy chứng nhận hộ nghèo/cận nghèo, Đơn đề nghị, Bản sao CCCD',
    submitted: false,
    submissionDate: '',
    status: 'Chưa nộp',
    notes: ''
  });

  const handleOpenAdd = () => {
    const firstStudent = students.find(s => s.policyType !== 'Không') || students[0];
    setFormData({
      studentId: firstStudent?.id || '',
      studentName: firstStudent?.fullName || '',
      policyType: firstStudent?.policyType !== 'Không' ? firstStudent?.policyType : 'Miễn giảm 100% học phí',
      requiredDocs: 'Đơn xin miễn giảm học phí, Bản sao giấy chứng nhận diện chính sách, CCCD photo',
      submitted: false,
      submissionDate: '',
      status: 'Chưa nộp',
      notes: ''
    });
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: PolicyDocumentItem) => {
    setFormData({ ...item });
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleToggleSubmitted = (item: PolicyDocumentItem) => {
    const newSubmitted = !item.submitted;
    onUpdatePolicy({
      ...item,
      submitted: newSubmitted,
      status: newSubmitted ? 'Đã hoàn thành' : 'Chưa nộp',
      submissionDate: newSubmitted ? (item.submissionDate || new Date().toISOString().split('T')[0]) : ''
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentId || !formData.requiredDocs) {
      alert('Vui lòng chọn học sinh và nhập các hồ sơ cần nộp!');
      return;
    }

    const matchedStudent = students.find(s => s.id === formData.studentId);
    const studentName = matchedStudent ? matchedStudent.fullName : formData.studentName || '';

    if (editingItem) {
      onUpdatePolicy({
        ...editingItem,
        studentId: formData.studentId!,
        studentName,
        policyType: (formData.policyType as PolicyType) || 'Miễn giảm 100% học phí',
        requiredDocs: formData.requiredDocs || '',
        submitted: !!formData.submitted,
        submissionDate: formData.submissionDate || '',
        status: (formData.status as SubmissionStatus) || 'Chưa nộp',
        notes: formData.notes || ''
      });
    } else {
      const newItem: PolicyDocumentItem = {
        id: `cs-${Date.now()}`,
        studentId: formData.studentId!,
        studentName,
        policyType: (formData.policyType as PolicyType) || 'Miễn giảm 100% học phí',
        requiredDocs: formData.requiredDocs || '',
        submitted: !!formData.submitted,
        submissionDate: formData.submitted ? (formData.submissionDate || new Date().toISOString().split('T')[0]) : '',
        status: (formData.status as SubmissionStatus) || 'Chưa nộp',
        notes: formData.notes || ''
      };
      onAddPolicy(newItem);
    }

    setIsModalOpen(false);
    setEditingItem(null);
  };

  const filteredPolicies = useMemo(() => {
    return policies.filter(p => {
      const matchSearch = 
        p.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.policyType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.requiredDocs.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchStatus = 
        filterStatus === 'all' ? true :
        filterStatus === 'submitted' ? p.submitted :
        filterStatus === 'pending' ? !p.submitted : true;

      return matchSearch && matchStatus;
    });
  }, [policies, searchTerm, filterStatus]);

  const completedCount = policies.filter(p => p.submitted).length;
  const pendingCount = policies.length - completedCount;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            Quản Lý Hồ Sơ Chế Độ & Chính Sách
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
              {policies.length} hồ sơ theo dõi
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Theo dõi tiến độ nộp hồ sơ miễn giảm học phí, học bổng và hỗ trợ chi phí theo Nghị định 81
          </p>
        </div>

        <button
          id="add-policy-btn"
          onClick={handleOpenAdd}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold transition shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm hồ sơ theo dõi</span>
        </button>
      </div>

      {/* Progress Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Tổng số hồ sơ diện chính sách</span>
          <p className="text-2xl font-bold text-slate-800 mt-1">{policies.length}</p>
          <p className="text-xs text-slate-400 mt-0.5">Học sinh thuộc diện hỗ trợ</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 shadow-xs">
          <span className="text-xs font-semibold text-emerald-800">Đã nộp đủ hồ sơ</span>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{completedCount}</p>
          <p className="text-xs text-emerald-600 mt-0.5">Đã nộp về phòng Kế toán / BGH</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-orange-200 bg-orange-50/40 shadow-xs">
          <span className="text-xs font-semibold text-orange-800">Chưa nộp / Đang xử lý</span>
          <p className="text-2xl font-bold text-orange-700 mt-1">{pendingCount}</p>
          <p className="text-xs text-orange-600 mt-0.5">Cần nhắc nhở trước hạn chót</p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên học sinh, loại chế độ, tên giấy tờ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-hidden"
        >
          <option value="all">Tất cả tiến độ</option>
          <option value="pending">Chưa nộp / Đang hoàn thiện</option>
          <option value="submitted">Đã nộp hoàn thành</option>
        </select>
      </div>

      {/* Policy Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4 w-10 text-center">STT</th>
                <th className="py-3 px-4">Học sinh</th>
                <th className="py-3 px-4">Loại chế độ hỗ trợ</th>
                <th className="py-3 px-4">Hồ sơ / Giấy tờ cần nộp</th>
                <th className="py-3 px-3 text-center">Trạng thái</th>
                <th className="py-3 px-3">Ngày nộp</th>
                <th className="py-3 px-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredPolicies.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Không tìm thấy hồ sơ chính sách nào.
                  </td>
                </tr>
              ) : (
                filteredPolicies.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 text-center font-medium text-slate-400">
                      {idx + 1}
                    </td>

                    <td className="py-3 px-4 font-bold text-slate-800">
                      {p.studentName}
                    </td>

                    <td className="py-3 px-4">
                      <span className="inline-block px-2.5 py-0.5 rounded-md font-semibold text-[11px] bg-indigo-50 text-indigo-700 border border-indigo-200/50">
                        {p.policyType}
                      </span>
                    </td>

                    <td className="py-3 px-4 max-w-xs">
                      <p className="text-slate-700 font-medium leading-relaxed">{p.requiredDocs}</p>
                      {p.notes && <p className="text-[11px] text-slate-400 italic mt-0.5">{p.notes}</p>}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => handleToggleSubmitted(p)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                          p.submitted
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                        }`}
                        title="Bấm để chuyển trạng thái đã nộp / chưa nộp"
                      >
                        {p.submitted ? (
                          <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Đã nộp</>
                        ) : (
                          <><Clock className="w-3.5 h-3.5 text-orange-600" /> Chưa nộp</>
                        )}
                      </button>
                    </td>

                    <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                      {p.submissionDate || <span className="text-slate-400 italic">Chưa có</span>}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                          title="Sửa"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeletePolicy(p.id)}
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

      {/* Modal Add / Edit Policy Item */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                {editingItem ? 'Sửa hồ sơ chế độ chính sách' : 'Thêm hồ sơ theo dõi chính sách'}
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
                  Chọn học sinh <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.studentId}
                  onChange={(e) => {
                    const st = students.find(s => s.id === e.target.value);
                    setFormData({
                      ...formData,
                      studentId: e.target.value,
                      studentName: st?.fullName || '',
                      policyType: st?.policyType !== 'Không' ? st?.policyType : formData.policyType
                    });
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium"
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.code}) - {s.familyBackground}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Loại chế độ hỗ trợ <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.policyType}
                  onChange={(e) => setFormData({ ...formData, policyType: e.target.value as PolicyType })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm"
                >
                  <option value="Miễn giảm 100% học phí">Miễn giảm 100% học phí</option>
                  <option value="Miễn giảm 70% học phí">Miễn giảm 70% học phí</option>
                  <option value="Miễn giảm 50% học phí">Miễn giảm 50% học phí</option>
                  <option value="Hỗ trợ chi phí học tập (NĐ 81)">Hỗ trợ chi phí học tập (NĐ 81)</option>
                  <option value="Học sinh Dân tộc thiểu số khó khăn">Học sinh Dân tộc thiểu số khó khăn</option>
                  <option value="Con Thương binh / Liệt sĩ">Con Thương binh / Liệt sĩ</option>
                  <option value="Học sinh Khuyết tật">Học sinh Khuyết tật</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Danh mục hồ sơ / giấy tờ cần nộp <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="VD: Giấy xác nhận hộ nghèo 2026, Đơn xin miễn giảm, CCCD photo..."
                  value={formData.requiredDocs}
                  onChange={(e) => setFormData({ ...formData, requiredDocs: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Trạng thái</label>
                  <select
                    value={formData.submitted ? 'yes' : 'no'}
                    onChange={(e) => {
                      const isSub = e.target.value === 'yes';
                      setFormData({ 
                        ...formData, 
                        submitted: isSub, 
                        status: isSub ? 'Đã hoàn thành' : 'Chưa nộp',
                        submissionDate: isSub ? (formData.submissionDate || new Date().toISOString().split('T')[0]) : ''
                      });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                    <option value="no">Chưa nộp</option>
                    <option value="yes">Đã nộp đầy đủ</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ngày nộp</label>
                  <input
                    type="date"
                    value={formData.submissionDate || ''}
                    onChange={(e) => setFormData({ ...formData, submissionDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ghi chú tiến độ / Hạn chót</label>
                <input
                  type="text"
                  placeholder="VD: Hạn chót nộp 30/8, đang chờ gửi giấy xác nhận ở quê..."
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
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
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs"
                >
                  {editingItem ? 'Lưu cập nhật' : 'Lưu hồ sơ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
