import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Upload, 
  FileSpreadsheet, 
  Check, 
  AlertCircle, 
  FileText,
  HelpCircle
} from 'lucide-react';
import { Student, Gender, Ethnicity, ClassInfo } from '../../types';
import { generateSampleSubjectScores, generateSampleWeeklyEmulation } from '../../mockData';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  classInfo: ClassInfo;
  onImportStudents: (newStudents: Student[]) => void;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  isOpen,
  onClose,
  students,
  classInfo,
  onImportStudents
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [importText, setImportText] = useState('');
  const [importPreview, setImportPreview] = useState<Partial<Student>[]>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handle Export CSV with UTF-8 BOM
  const handleExportCSV = () => {
    const headers = [
      'STT',
      'Mã HS',
      'Họ và tên',
      'Giới tính',
      'Dân tộc',
      'Ngày sinh',
      'Chức vụ',
      'SĐT học sinh',
      'Họ tên Bố',
      'SĐT Bố',
      'Họ tên Mẹ',
      'SĐT Mẹ',
      'Địa chỉ',
      'Hoàn cảnh gia đình',
      'Chế độ chính sách',
      'Học lực',
      'Hạnh kiểm',
      'Ghi chú GVCN'
    ];

    const rows = students.map((s, idx) => [
      idx + 1,
      `"${s.code}"`,
      `"${s.fullName}"`,
      `"${s.gender}"`,
      `"${s.ethnicity}"`,
      `"${s.dob || 'Chưa cập nhật'}"`,
      `"${s.role || 'Học sinh'}"`,
      `"${s.phone || ''}"`,
      `"${s.fatherName || ''}"`,
      `"${s.fatherPhone || ''}"`,
      `"${s.motherName || ''}"`,
      `"${s.motherPhone || ''}"`,
      `"${s.address || ''}"`,
      `"${s.familyBackground}"`,
      `"${s.policyType}"`,
      `"${s.academicRating || 'Khá'}"`,
      `"${s.conductRating || 'Tốt'}"`,
      `"${s.notes || ''}"`
    ]);

    const csvContent = '\uFEFF' + [
      `DANH SÁCH HỌC SINH - LỚP ${classInfo.className}`,
      `Giáo viên chủ nhiệm: ${classInfo.homeroomTeacher} - Năm học: ${classInfo.schoolYear}`,
      `Sĩ số: ${students.length} học sinh (Nam: ${students.filter(s => s.gender === 'Nam').length}, Nữ: ${students.filter(s => s.gender === 'Nữ').length})`,
      '',
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Danh_Sach_Hoc_Sinh_${classInfo.className}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Parse pasted CSV / Excel data
  const handleParseText = () => {
    setImportError(null);
    setImportSuccess(null);
    if (!importText.trim()) {
      setImportError('Vui lòng dán danh sách dữ liệu từ bảng tính Excel.');
      return;
    }

    try {
      const lines = importText.trim().split('\n');
      const parsedList: Partial<Student>[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Split by tab (Excel copy-paste) or comma
        const parts = line.includes('\t') ? line.split('\t') : line.split(',');

        // Skip headers if contains 'Họ và tên' or 'Họ tên'
        if (parts.some(p => p.toLowerCase().includes('họ và tên') || p.toLowerCase().includes('họ tên'))) {
          continue;
        }

        // Expected formats:
        // Option A: STT, Họ và tên, Dân tộc, Giới tính...
        // Option B: Họ và tên, Dân tộc
        let fullName = '';
        let ethnicity: Ethnicity = 'Chăm';
        let gender: Gender = 'Nữ';
        let phone = '';

        if (parts.length >= 2) {
          const part0 = parts[0].trim().replace(/^["']|["']$/g, '');
          const part1 = parts[1].trim().replace(/^["']|["']$/g, '');

          // Check if first column is STT number
          if (/^\d+$/.test(part0)) {
            fullName = part1;
            ethnicity = (parts[2] ? parts[2].trim().replace(/^["']|["']$/g, '') : 'Chăm') as Ethnicity;
            gender = (parts[3] ? parts[3].trim().replace(/^["']|["']$/g, '') : 'Nữ') as Gender;
          } else {
            fullName = part0;
            ethnicity = part1 as Ethnicity;
            gender = (parts[2] ? parts[2].trim().replace(/^["']|["']$/g, '') : 'Nữ') as Gender;
          }
        }

        if (fullName) {
          parsedList.push({
            fullName,
            ethnicity: (ethnicity || 'Chăm') as Ethnicity,
            gender: gender === 'Nam' ? 'Nam' : 'Nữ',
            phone
          });
        }
      }

      if (parsedList.length === 0) {
        setImportError('Không tìm thấy dòng học sinh hợp lệ nào. Vui lòng kiểm tra lại định dạng dữ liệu.');
      } else {
        setImportPreview(parsedList);
        setImportSuccess(`Đã nhận diện thành công ${parsedList.length} học sinh. Xem trước bên dưới và bấm "Xác nhận nhập dữ liệu".`);
      }
    } catch (e: any) {
      setImportError('Lỗi xử lý dữ liệu: ' + e.message);
    }
  };

  // Confirm Import
  const handleConfirmImport = () => {
    if (importPreview.length === 0) return;

    const newStudents: Student[] = importPreview.map((item, idx) => {
      const codeNum = students.length + idx + 1;
      const code = `11A3-${codeNum < 10 ? '0' + codeNum : codeNum}`;
      return {
        id: `hs11a3-import-${Date.now()}-${idx}`,
        code,
        fullName: item.fullName || 'Học sinh mới',
        dob: '2009-01-01',
        gender: (item.gender as Gender) || 'Nữ',
        ethnicity: (item.ethnicity as Ethnicity) || 'Chăm',
        address: item.address || 'Vân Canh, Bình Định',
        phone: item.phone || '',
        fatherName: '',
        fatherPhone: '',
        fatherJob: '',
        motherName: '',
        motherPhone: '',
        motherJob: '',
        familyBackground: 'Bình thường',
        policyType: 'Không',
        role: 'Học sinh',
        academicRating: 'Khá',
        conductRating: 'Tốt',
        subjectScores: generateSampleSubjectScores('Khá'),
        weeklyEmulation: generateSampleWeeklyEmulation('Tốt'),
        notes: 'Nhập từ bảng tính Excel',
        needsAttention: false,
        isProgressing: false
      };
    });

    onImportStudents(newStudents);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden my-auto">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Nhập / Xuất danh sách Excel & CSV</h3>
              <p className="text-xs text-slate-400">Lớp 11A3 — Năm học 2026–2027</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-5 pt-3 gap-3 shrink-0">
          <button
            onClick={() => setActiveTab('export')}
            className={`flex items-center gap-2 py-2.5 px-4 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'export'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Download className="w-4 h-4" />
            Xuất dữ liệu (.CSV / Excel)
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`flex items-center gap-2 py-2.5 px-4 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'import'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-4 h-4" />
            Nhập từ Excel / Bảng tính
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 text-sm">
          {activeTab === 'export' ? (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                <h4 className="font-bold text-emerald-900 text-sm mb-1">Xuất toàn bộ 38 học sinh Lớp 11A3</h4>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  Tệp tải về tương thích 100% với Microsoft Excel, Google Sheets, LibreOffice Calc với đầy đủ thông tin: STT, Mã HS, Họ tên, Giới tính, Dân tộc, Ngày sinh, Số điện thoại, Phụ huynh, Địa chỉ, Chế độ chính sách, Học lực, Hạnh kiểm.
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs text-slate-600">
                <p><strong>• Tổng số học sinh:</strong> {students.length}</p>
                <p><strong>• Số học sinh Nữ:</strong> {students.filter(s => s.gender === 'Nữ').length}</p>
                <p><strong>• Số học sinh Nam:</strong> {students.filter(s => s.gender === 'Nam').length}</p>
                <p><strong>• Giáo viên chủ nhiệm:</strong> {classInfo.homeroomTeacher}</p>
              </div>

              <div className="pt-3">
                <button
                  onClick={handleExportCSV}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm"
                >
                  <Download className="w-4 h-4" />
                  Tải danh sách Excel (.CSV chuẩn UTF-8)
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 text-xs text-blue-900 leading-relaxed space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-sm">
                  <HelpCircle className="w-4 h-4 text-blue-600" />
                  Hướng dẫn sao chép từ Excel:
                </p>
                <p>1. Mở file Excel danh sách học sinh của thầy/cô.</p>
                <p>2. Chọn và copy (Ctrl+C) các cột: <strong>Họ và tên</strong>, <strong>Dân tộc</strong>, <strong>Giới tính</strong> (hoặc STT, Họ tên, Dân tộc).</p>
                <p>3. Dán (Ctrl+V) vào ô văn bản bên dưới và bấm <strong>"Xử lý dữ liệu"</strong>.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Dán nội dung từ Excel vào đây:
                </label>
                <textarea
                  rows={5}
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="Ví dụ:&#10;Chu Lan Dinh	Chăm	Nữ&#10;Nguyễn Thị Huyền Giang	Chăm	Nữ&#10;Đoàn Văn Hải	Chăm	Nam"
                  className="w-full p-3 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <button
                type="button"
                onClick={handleParseText}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
              >
                Xử lý dữ liệu
              </button>

              {importError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  {importError}
                </div>
              )}

              {importSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  {importSuccess}
                </div>
              )}

              {importPreview.length > 0 && (
                <div className="space-y-2">
                  <h5 className="font-bold text-xs text-slate-700 uppercase tracking-wider">
                    Xem trước ({importPreview.length} học sinh):
                  </h5>
                  <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100 text-xs">
                    {importPreview.map((item, pIdx) => (
                      <div key={pIdx} className="p-2 flex justify-between items-center bg-white hover:bg-slate-50">
                        <span className="font-semibold text-slate-800">{pIdx + 1}. {item.fullName}</span>
                        <div className="flex gap-2">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600">{item.ethnicity}</span>
                          <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700">{item.gender}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleConfirmImport}
                    className="w-full mt-3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-colors text-sm"
                  >
                    Xác nhận nhập {importPreview.length} học sinh
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 bg-slate-50 px-5 py-3 flex justify-end shrink-0">
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
