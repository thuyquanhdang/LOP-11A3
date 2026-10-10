import React, { useState } from 'react';
import { 
  Settings, 
  School, 
  User, 
  Save, 
  RotateCcw, 
  Download, 
  Upload, 
  CheckCircle2, 
  Sparkles,
  ShieldCheck,
  Database,
  FileSpreadsheet,
  Link,
  Copy,
  Check
} from 'lucide-react';
import { ClassInfo } from '../types';
import { GOOGLE_APPS_SCRIPT_CODE, GOOGLE_SHEET_STORAGE_KEY } from '../utils/googleAppsScript';

interface SettingsViewProps {
  classInfo: ClassInfo;
  onUpdateClassInfo: (info: ClassInfo) => void;
  onResetData: () => void;
  onExportData: () => void;
  onImportData: (file: File) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  classInfo,
  onUpdateClassInfo,
  onResetData,
  onExportData,
  onImportData
}) => {
  const [formData, setFormData] = useState<ClassInfo>(classInfo);
  const [savedSuccess, setSavedSuccess] = useState(false);

  React.useEffect(() => {
    setFormData(classInfo);
  }, [classInfo]);

  const [googleSheetUrl, setGoogleSheetUrl] = useState<string>(() => {
    return localStorage.getItem(GOOGLE_SHEET_STORAGE_KEY) || '';
  });
  const [copiedCode, setCopiedCode] = useState(false);
  const [sheetSaved, setSheetSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateClassInfo(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleSaveGoogleSheetUrl = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem(GOOGLE_SHEET_STORAGE_KEY, googleSheetUrl.trim());
    setSheetSaved(true);
    setTimeout(() => setSheetSaved(false), 2500);
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportData(file);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            Cài Đặt & Cấu Hình Lớp Chủ Nhiệm
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tùy chỉnh thông tin trường lớp, giáo viên chủ nhiệm và quản trị dữ liệu
          </p>
        </div>

        {savedSuccess && (
          <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Đã lưu thông tin lớp!
          </span>
        )}
      </div>

      {/* Form: Class Info Settings */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
        <h3 className="text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
          <School className="w-4 h-4 text-blue-600" />
          Thông tin Trường & Lớp học
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Tên trường THPT <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.schoolName}
                onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Năm học / Niên khóa <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.schoolYear}
                onChange={(e) => setFormData({ ...formData, schoolYear: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Tên lớp chủ nhiệm <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.className}
                onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-blue-600 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Khối lớp
              </label>
              <select
                value={formData.grade}
                onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium"
              >
                <option value="10">Khối 10</option>
                <option value="11">Khối 11</option>
                <option value="12">Khối 12</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Phòng học chính
              </label>
              <input
                type="text"
                value={formData.roomNumber}
                onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Giáo viên chủ nhiệm <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.homeroomTeacher}
                onChange={(e) => setFormData({ ...formData, homeroomTeacher: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Lớp trưởng
              </label>
              <input
                type="text"
                value={formData.classMonitor}
                onChange={(e) => setFormData({ ...formData, classMonitor: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Lớp phó / Bí thư
              </label>
              <input
                type="text"
                value={formData.viceMonitor}
                onChange={(e) => setFormData({ ...formData, viceMonitor: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              id="save-settings-btn"
              type="submit"
              className="flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs transition"
            >
              <Save className="w-4 h-4" />
              <span>Lưu cập nhật thông tin lớp</span>
            </button>
          </div>
        </form>
      </div>

      {/* Google Sheet & Google Apps Script Sync Settings */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Tích hợp Google Sheet & Google Apps Script (Điểm danh tự động)
          </h3>
          <button
            type="button"
            onClick={handleCopyScript}
            className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 self-start sm:self-auto"
          >
            {copiedCode ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Đã sao chép mã script!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Sao chép mã Google Apps Script</span>
              </>
            )}
          </button>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Cấu hình Web App URL từ Google Apps Script để khi bạn bấm <strong>"Điểm danh ngay"</strong> ở trang Điểm danh, toàn bộ dữ liệu 38 học sinh sẽ được tự động đồng bộ sang tệp Google Sheet của bạn.
        </p>

        <form onSubmit={handleSaveGoogleSheetUrl} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              URL Google Apps Script Web App:
            </label>
            <div className="relative">
              <Link className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="url"
                placeholder="https://script.google.com/macros/s/.../exec"
                value={googleSheetUrl}
                onChange={(e) => setGoogleSheetUrl(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            {sheetSaved ? (
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                Đã lưu URL kết nối Google Sheet!
              </span>
            ) : (
              <span className="text-[11px] text-slate-400">
                Mẹo: Bạn có thể xem và tải file <code>google_apps_script.gs</code> trong thư mục dự án.
              </span>
            )}

            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Lưu cấu hình Sheet</span>
            </button>
          </div>
        </form>
      </div>

      {/* Data Backup & Restore */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-800 pb-2 border-b border-slate-100 flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-600" />
          Quản trị & Sao lưu Dữ liệu Lớp học
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Backup Export */}
          <button
            id="export-data-btn"
            onClick={onExportData}
            className="p-4 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 rounded-xl text-left transition flex flex-col justify-between space-y-2 group"
          >
            <div className="flex items-center space-x-2 text-emerald-600 font-bold text-xs">
              <Download className="w-4 h-4" />
              <span>Sao lưu dữ liệu (JSON)</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Tải toàn bộ danh sách học sinh, điểm danh, khen thưởng, vi phạm về máy tính.
            </p>
          </button>

          {/* Import Backup */}
          <label className="p-4 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-xl text-left transition flex flex-col justify-between space-y-2 group cursor-pointer">
            <div className="flex items-center space-x-2 text-blue-600 font-bold text-xs">
              <Upload className="w-4 h-4" />
              <span>Khôi phục từ tệp JSON</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Nhập tệp dữ liệu đã sao lưu trước đó để tiếp tục quản lý lớp.
            </p>
            <input
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          {/* Reset to Samples */}
          <button
            id="reset-sample-data-btn"
            onClick={() => {
              if (window.confirm('Bạn có chắc chắn muốn khôi phục lại toàn bộ dữ liệu mẫu ban đầu? Mọi chỉnh sửa hiện tại sẽ được đặt lại.')) {
                onResetData();
              }
            }}
            className="p-4 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-xl text-left transition flex flex-col justify-between space-y-2 group"
          >
            <div className="flex items-center space-x-2 text-rose-600 font-bold text-xs">
              <RotateCcw className="w-4 h-4" />
              <span>Khôi phục dữ liệu mẫu</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Nạp lại 10 học sinh mẫu ban đầu và các bản ghi mẫu để dùng thử nghiệm.
            </p>
          </button>
        </div>
      </div>
    </div>
  );
};
