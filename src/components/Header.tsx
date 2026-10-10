import React, { useState } from 'react';
import { 
  Menu, 
  Calendar, 
  Sparkles, 
  Bot, 
  Bell, 
  UserCheck, 
  PlusCircle, 
  School,
  Save,
  CheckCircle2
} from 'lucide-react';
import { ActiveTab, ClassInfo } from '../types';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenMobileMenu: () => void;
  classInfo: ClassInfo;
  onQuickAddStudent?: () => void;
  onSaveAllChanges?: () => boolean | void;
  storageError?: string | null;
}

const TAB_TITLES: Record<ActiveTab, { title: string; subtitle: string }> = {
  dashboard: { title: 'Tổng quan Lớp Chủ nhiệm', subtitle: 'Bảng theo dõi toàn diện nề nếp, học tập & thi đua' },
  students: { title: 'Danh sách Học sinh', subtitle: 'Quản lý thông tin lý lịch, hồ sơ gia đình & diện chính sách' },
  attendance: { title: 'Sổ Điểm danh Hàng ngày', subtitle: 'Ghi nhận chuyên cần, vắng có phép/không phép và đi muộn' },
  violations: { title: 'Theo dõi Vi phạm Kỷ luật', subtitle: 'Ghi nhận nề nếp, mức độ vi phạm và biện pháp giáo dục' },
  rewards: { title: 'Bảng Vinh danh & Khen thưởng', subtitle: 'Ghi nhận thành tích học tập, phong trào và việc tốt' },
  conduct: { title: 'Đánh giá Rèn luyện & Hạnh kiểm', subtitle: 'Đánh giá 6 tiêu chí theo Thông tư 22 và gợi ý xếp loại' },
  parents: { title: 'Sổ Liên lạc Phụ huynh', subtitle: 'Danh bạ phụ huynh và nhật ký các lần trao đổi phối hợp' },
  policies: { title: 'Chế độ & Chính sách Hỗ trợ', subtitle: 'Theo dõi hồ sơ miễn giảm học phí, hỗ trợ chi phí theo NĐ 81' },
  reports: { title: 'Báo cáo & Thống kê Tổng hợp', subtitle: 'Tổng hợp số liệu nề nếp, chuyên cần nộp Ban Giám hiệu' },
  'ai-assistant': { title: 'Trợ lý AI Giáo viên Chủ nhiệm', subtitle: 'Tư vấn giải pháp sư phạm, phân tích số liệu & soạn nhận xét' },
  settings: { title: 'Cài đặt & Thông tin Lớp học', subtitle: 'Tùy chỉnh thông tin lớp, GVCN và quản lý dữ liệu' },
};

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenMobileMenu,
  classInfo,
  onSaveAllChanges,
  storageError
}) => {
  const [savedNotice, setSavedNotice] = useState(false);
  const [saveErrorNotice, setSaveErrorNotice] = useState(false);
  const currentTabInfo = TAB_TITLES[activeTab] || { title: 'Trợ Lý Chủ Nhiệm', subtitle: 'Hệ thống quản lý lớp học' };

  // Current formatted date in Vietnamese
  const today = new Date();
  const daysOfWeek = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const dayName = daysOfWeek[today.getDay()];
  const dateFormatted = `${dayName}, ngày ${today.getDate()} tháng ${today.getMonth() + 1} năm ${today.getFullYear()}`;

  const handleSaveClick = () => {
    if (onSaveAllChanges) {
      const ok = onSaveAllChanges();
      if (ok === false) {
        setSaveErrorNotice(true);
        setTimeout(() => setSaveErrorNotice(false), 3000);
        return;
      }
    }
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3.5">
        {/* Left: Mobile Toggle & Page Title */}
        <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
          <button
            id="mobile-menu-toggle"
            onClick={onOpenMobileMenu}
            className="p-2 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl lg:hidden focus:outline-hidden"
            title="Mở menu"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight truncate flex items-center gap-2">
              {currentTabInfo.title}
              {activeTab === 'ai-assistant' && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
                  <Sparkles className="w-3 h-3 text-indigo-600" />
                  Gemini
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-500 hidden sm:block truncate">
              {currentTabInfo.subtitle}
            </p>
          </div>
        </div>

        {/* Right: Date Info & Quick Actions */}
        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
          {/* School & Date pill */}
          <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-100/90 text-slate-600 text-xs font-medium border border-slate-200">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>{dateFormatted}</span>
          </div>

          <div className="hidden xl:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
            <School className="w-3.5 h-3.5 text-blue-600" />
            <span className="truncate max-w-[160px]">{classInfo.schoolName}</span>
          </div>

          {/* Global Save Changes Button */}
          <button
            id="header-save-changes-button"
            onClick={handleSaveClick}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer ${
              saveErrorNotice || storageError
                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                : savedNotice
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
            title="Lưu mọi thay đổi"
          >
            {saveErrorNotice || storageError ? (
              <span>⚠️ Lỗi lưu!</span>
            ) : savedNotice ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Đã lưu thay đổi!</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Lưu thay đổi</span>
              </>
            )}
          </button>

          {/* Quick AI Trigger button if not on AI tab */}
          {activeTab !== 'ai-assistant' && (
            <button
              id="header-ask-ai-button"
              onClick={() => setActiveTab('ai-assistant')}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-xs font-medium shadow-xs transition-all cursor-pointer"
              title="Mở Trợ lý AI"
            >
              <Bot className="w-3.5 h-3.5 text-indigo-200" />
              <span className="hidden sm:inline">Hỏi Trợ lý AI</span>
            </button>
          )}

          {/* Quick Attendance button if on dashboard */}
          {activeTab === 'dashboard' && (
            <button
              id="header-quick-attendance-button"
              onClick={() => setActiveTab('attendance')}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-xs transition-all cursor-pointer"
              title="Điểm danh hôm nay"
            >
              <UserCheck className="w-3.5 h-3.5 text-blue-200" />
              <span className="hidden sm:inline">Điểm danh ngay</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
