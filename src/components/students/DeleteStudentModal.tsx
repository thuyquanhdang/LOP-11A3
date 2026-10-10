import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { Student } from '../../types';

interface DeleteStudentModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (studentId: string) => void;
}

export const DeleteStudentModal: React.FC<DeleteStudentModalProps> = ({
  student,
  isOpen,
  onClose,
  onConfirm
}) => {
  if (!isOpen || !student) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 relative overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-bold text-slate-900 mb-2">Xác nhận xóa học sinh?</h3>
        <p className="text-sm text-slate-600 mb-4 leading-relaxed">
          Bạn có chắc chắn muốn xóa học sinh <strong className="text-slate-900 font-semibold">{student.fullName}</strong> ({student.code}) khỏi danh sách lớp 11A3?
        </p>

        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 mb-6">
          ⚠️ <strong>Lưu ý:</strong> Hành động này cũng sẽ đồng thời loại bỏ các dữ liệu vi phạm, khen thưởng và nhật ký liên lạc liên quan của học sinh này.
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            onClick={() => {
              onConfirm(student.id);
              onClose();
            }}
            className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-sm flex items-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            Xác nhận xóa
          </button>
        </div>
      </div>
    </div>
  );
};
