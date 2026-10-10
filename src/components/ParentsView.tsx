import React, { useState, useMemo } from 'react';
import { 
  PhoneCall, 
  Plus, 
  Search, 
  Phone, 
  Copy, 
  Check, 
  Calendar, 
  User, 
  MessageSquare, 
  Trash2, 
  Edit3, 
  X,
  HeartHandshake
} from 'lucide-react';
import { Student, ParentContact, ParentRelationship, ContactResult } from '../types';

interface ParentsViewProps {
  students: Student[];
  parents: ParentContact[];
  onAddContact: (contact: ParentContact) => void;
  onUpdateContact: (contact: ParentContact) => void;
  onDeleteContact: (contactId: string) => void;
}

export const ParentsView: React.FC<ParentsViewProps> = ({
  students,
  parents,
  onAddContact,
  onUpdateContact,
  onDeleteContact
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<ParentContact | null>(null);

  const [formData, setFormData] = useState<Partial<ParentContact>>({
    studentId: students[0]?.id || '',
    studentName: students[0]?.fullName || '',
    parentName: '',
    relationship: 'Mẹ',
    phone: '',
    date: new Date().toISOString().split('T')[0],
    content: '',
    result: 'Đã thống nhất',
    notes: ''
  });

  const handleCopy = (phone: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedPhone(phone);
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  const handleStudentSelect = (studentId: string) => {
    const st = students.find(s => s.id === studentId);
    if (st) {
      setFormData(prev => ({
        ...prev,
        studentId: st.id,
        studentName: st.fullName,
        parentName: st.motherName || st.fatherName || 'Phụ huynh em ' + st.fullName,
        relationship: st.motherName ? 'Mẹ' : 'Bố',
        phone: st.motherPhone || st.fatherPhone || st.phone
      }));
    }
  };

  const handleOpenAdd = () => {
    const firstStudent = students[0];
    setFormData({
      studentId: firstStudent?.id || '',
      studentName: firstStudent?.fullName || '',
      parentName: firstStudent?.motherName || firstStudent?.fatherName || '',
      relationship: firstStudent?.motherName ? 'Mẹ' : 'Bố',
      phone: firstStudent?.motherPhone || firstStudent?.fatherPhone || '',
      date: new Date().toISOString().split('T')[0],
      content: '',
      result: 'Gia đình cam kết phối hợp',
      notes: ''
    });
    setEditingContact(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (contact: ParentContact) => {
    setFormData({ ...contact });
    setEditingContact(contact);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentId || !formData.content) {
      alert('Vui lòng chọn học sinh và nhập nội dung trao đổi!');
      return;
    }

    const matchedStudent = students.find(s => s.id === formData.studentId);
    const studentName = matchedStudent ? matchedStudent.fullName : formData.studentName || '';

    if (editingContact) {
      onUpdateContact({
        ...editingContact,
        studentId: formData.studentId!,
        studentName,
        parentName: formData.parentName || 'Phụ huynh',
        relationship: (formData.relationship as ParentRelationship) || 'Mẹ',
        phone: formData.phone || '',
        date: formData.date || new Date().toISOString().split('T')[0],
        content: formData.content || '',
        result: (formData.result as ContactResult) || 'Đã thống nhất',
        notes: formData.notes || ''
      });
    } else {
      const newC: ParentContact = {
        id: `ph-${Date.now()}`,
        studentId: formData.studentId!,
        studentName,
        parentName: formData.parentName || 'Phụ huynh',
        relationship: (formData.relationship as ParentRelationship) || 'Mẹ',
        phone: formData.phone || '',
        date: formData.date || new Date().toISOString().split('T')[0],
        content: formData.content || '',
        result: (formData.result as ContactResult) || 'Đã thống nhất',
        notes: formData.notes || ''
      };
      onAddContact(newC);
    }

    setIsModalOpen(false);
    setEditingContact(null);
  };

  const filteredParents = useMemo(() => {
    return parents.filter(p => {
      const match = 
        p.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.parentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.phone.includes(searchTerm) ||
        p.content.toLowerCase().includes(searchTerm.toLowerCase());
      return match;
    });
  }, [parents, searchTerm]);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            Sổ Liên Lạc & Trao Đổi Phụ Huynh
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
              {parents.length} lượt trao đổi
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Lưu nhật ký các cuộc gọi, tin nhắn và buổi gặp trực tiếp phụ huynh học sinh
          </p>
        </div>

        <button
          id="add-parent-contact-btn"
          onClick={handleOpenAdd}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold transition shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Ghi nhận liên hệ mới</span>
        </button>
      </div>

      {/* Quick Parent Phone Directory Drawer / Accordion */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
          <Phone className="w-4 h-4 text-blue-600" />
          Danh bạ Liên lạc Nhanh Phụ huynh ({students.length} gia đình)
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto pr-1">
          {students.map(s => (
            <div key={s.id} className="p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/70 rounded-xl text-xs space-y-1 transition">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 truncate">{s.fullName}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 text-slate-600">{s.code}</span>
              </div>
              
              <div className="text-[11px] text-slate-600 space-y-0.5 pt-1 border-t border-slate-200/40">
                {s.fatherPhone && (
                  <div className="flex items-center justify-between">
                    <span>Bố ({s.fatherName || 'Bố'}):</span>
                    <div className="flex items-center space-x-1">
                      <a href={`tel:${s.fatherPhone}`} className="font-mono text-blue-600 hover:underline">{s.fatherPhone}</a>
                      <button onClick={() => handleCopy(s.fatherPhone)} className="p-1 hover:text-blue-600">
                        {copiedPhone === s.fatherPhone ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-400" />}
                      </button>
                    </div>
                  </div>
                )}
                {s.motherPhone && (
                  <div className="flex items-center justify-between">
                    <span>Mẹ ({s.motherName || 'Mẹ'}):</span>
                    <div className="flex items-center space-x-1">
                      <a href={`tel:${s.motherPhone}`} className="font-mono text-blue-600 hover:underline">{s.motherPhone}</a>
                      <button onClick={() => handleCopy(s.motherPhone)} className="p-1 hover:text-blue-600">
                        {copiedPhone === s.motherPhone ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-400" />}
                      </button>
                    </div>
                  </div>
                )}
                {!s.fatherPhone && !s.motherPhone && (
                  <span className="text-slate-400 italic">Chưa có số liên hệ</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Log of Parent Communications */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-blue-600" />
            Nhật ký các lần trao đổi phối hợp
          </h3>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo học sinh, phụ huynh, nội dung..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4 w-10 text-center">STT</th>
                <th className="py-3 px-4">Học sinh</th>
                <th className="py-3 px-4">Người liên hệ</th>
                <th className="py-3 px-3">Ngày</th>
                <th className="py-3 px-4">Nội dung trao đổi</th>
                <th className="py-3 px-3">Kết quả</th>
                <th className="py-3 px-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredParents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Chưa có nhật ký trao đổi nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredParents.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 text-center font-medium text-slate-400">
                      {idx + 1}
                    </td>

                    <td className="py-3 px-4 font-bold text-slate-800">
                      {p.studentName}
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-slate-800 font-semibold">{p.parentName}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <span className="px-1.5 py-0.2 rounded bg-slate-100">{p.relationship}</span>
                        {p.phone && <span className="font-mono text-blue-600">{p.phone}</span>}
                      </div>
                    </td>

                    <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                      {p.date}
                    </td>

                    <td className="py-3 px-4 max-w-sm">
                      <p className="text-slate-700 font-medium leading-relaxed">{p.content}</p>
                      {p.notes && <p className="text-[11px] text-slate-400 italic mt-1">Lưu ý: {p.notes}</p>}
                    </td>

                    <td className="py-3 px-3">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full font-semibold text-[11px] ${
                        p.result === 'Đã thống nhất' || p.result === 'Gia đình cam kết phối hợp'
                          ? 'bg-emerald-100 text-emerald-800'
                          : p.result === 'Hẹn gặp trực tiếp'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {p.result}
                      </span>
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
                          onClick={() => onDeleteContact(p.id)}
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

      {/* Modal Add / Edit Parent Contact */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <PhoneCall className="w-5 h-5 text-blue-600" />
                {editingContact ? 'Sửa nhật ký liên hệ' : 'Ghi nhận trao đổi với phụ huynh'}
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
                  onChange={(e) => handleStudentSelect(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium"
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Họ tên phụ huynh</label>
                  <input
                    type="text"
                    placeholder="VD: Lê Thị Thu"
                    value={formData.parentName}
                    onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Quan hệ với HS</label>
                  <select
                    value={formData.relationship}
                    onChange={(e) => setFormData({ ...formData, relationship: e.target.value as ParentRelationship })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                    <option value="Mẹ">Mẹ</option>
                    <option value="Bố">Bố</option>
                    <option value="Người giám hộ">Người giám hộ</option>
                    <option value="Ông/Bà">Ông/Bà</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    placeholder="VD: 0905 123 456"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ngày trao đổi</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nội dung trao đổi <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Trao đổi về tình hình học tập, nề nếp, chuyên cần hoặc sức khỏe của học sinh..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kết quả trao đổi</label>
                  <select
                    value={formData.result}
                    onChange={(e) => setFormData({ ...formData, result: e.target.value as ContactResult })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                    <option value="Đã thống nhất">Đã thống nhất</option>
                    <option value="Gia đình cam kết phối hợp">Gia đình cam kết phối hợp</option>
                    <option value="Hẹn gặp trực tiếp">Hẹn gặp trực tiếp tại trường</option>
                    <option value="Chưa liên lạc được">Chưa liên lạc được (máy bận/tắt)</option>
                    <option value="Đang theo dõi thêm">Đang theo dõi thêm</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ghi chú cam kết</label>
                  <input
                    type="text"
                    placeholder="VD: Mẹ hứa thu điện thoại sau 22h..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
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
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs"
                >
                  {editingContact ? 'Lưu cập nhật' : 'Lưu nhật ký'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
