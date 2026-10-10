import React from 'react';
import { 
  Home, 
  Users, 
  CalendarCheck, 
  AlertTriangle, 
  Award, 
  Target, 
  PhoneCall, 
  FileText, 
  BarChart3, 
  Bot, 
  Settings,
  GraduationCap,
  Sparkles,
  X,
  ChevronRight
} from 'lucide-react';
import { ActiveTab, ClassInfo } from '../types';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  classInfo: ClassInfo;
  isOpen: boolean;
  onClose: () => void;
  counts: {
    students: number;
    violations: number;
    rewards: number;
    attentionStudents: number;
    pendingPolicies: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  classInfo,
  isOpen,
  onClose,
  counts
}) => {
  const menuItems = [
    { 
      id: 'dashboard' as ActiveTab, 
      label: 'Trang chủ', 
      icon: Home,
      badge: null
    },
    { 
      id: 'students' as ActiveTab, 
      label: 'Học sinh', 
      icon: Users,
      badge: counts.students.toString()
    },
    { 
      id: 'attendance' as ActiveTab, 
      label: 'Điểm danh', 
      icon: CalendarCheck,
      badge: null
    },
    { 
      id: 'violations' as ActiveTab, 
      label: 'Vi phạm', 
      icon: AlertTriangle,
      badge: counts.violations > 0 ? counts.violations.toString() : null,
      badgeColor: 'bg-rose-500 text-white'
    },
    { 
      id: 'rewards' as ActiveTab, 
      label: 'Thi đua & Hoạt động tổ', 
      icon: Award,
      badge: counts.rewards > 0 ? counts.rewards.toString() : null,
      badgeColor: 'bg-amber-500 text-white'
    },
    { 
      id: 'conduct' as ActiveTab, 
      label: 'Rèn luyện', 
      icon: Target,
      badge: null
    },
    { 
      id: 'parents' as ActiveTab, 
      label: 'Phụ huynh', 
      icon: PhoneCall,
      badge: null
    },
    { 
      id: 'policies' as ActiveTab, 
      label: 'Chế độ chính sách', 
      icon: FileText,
      badge: counts.pendingPolicies > 0 ? `${counts.pendingPolicies} chưa nộp` : null,
      badgeColor: 'bg-orange-500 text-white'
    },
    { 
      id: 'reports' as ActiveTab, 
      label: 'Báo cáo', 
      icon: BarChart3,
      badge: null
    },
    { 
      id: 'ai-assistant' as ActiveTab, 
      label: 'Trợ lý AI', 
      icon: Bot,
      badge: 'Gemini',
      badgeColor: 'bg-indigo-600 text-white animate-pulse'
    },
    { 
      id: 'settings' as ActiveTab, 
      label: 'Cài đặt', 
      icon: Settings,
      badge: null
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Content */}
      <aside
        id="main-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col w-72 bg-slate-900 text-slate-100 shadow-2xl transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header Branding */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/80">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-md shadow-blue-500/20">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-base tracking-wide text-white flex items-center gap-1.5">
                TRỢ LÝ CHỦ NHIỆM
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              </h1>
              <p className="text-xs text-slate-400 font-medium">Quản lý lớp THPT</p>
            </div>
          </div>
          <button
            id="close-sidebar-button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
            title="Đóng menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Class Pill */}
        <div className="px-4 py-3 border-b border-slate-800/60 bg-slate-950/40">
          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-800/70 border border-slate-700/60">
            <div className="flex items-center space-x-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <div>
                <p className="text-xs font-semibold text-white">Lớp {classInfo.className}</p>
                <p className="text-[11px] text-slate-400">{classInfo.schoolYear}</p>
              </div>
            </div>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
              {classInfo.grade} THPT
            </span>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-700">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Danh mục quản lý
          </p>

          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-item-${item.id}`}
                onClick={() => {
                  setActiveTab(item.id);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 group ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <Icon className={`w-5 h-5 shrink-0 transition-colors ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'
                  }`} />
                  <span className="truncate">{item.label}</span>
                </div>

                <div className="flex items-center space-x-1.5 shrink-0">
                  {item.badge && (
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      item.badgeColor || (isActive ? 'bg-blue-700 text-blue-100' : 'bg-slate-800 text-slate-300')
                    }`}>
                      {item.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-4 h-4 text-blue-200" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer Homeroom Teacher Card */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60">
          <div className="flex items-center space-x-3 p-2 rounded-xl bg-slate-800/60 border border-slate-700/50">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-rose-500 text-white flex items-center justify-center font-bold text-sm shadow">
              {classInfo.homeroomTeacher.split(' ').slice(-1)[0]?.charAt(0) || 'G'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">{classInfo.homeroomTeacher}</p>
              <p className="text-[11px] text-slate-400 truncate">GVCN • {classInfo.teacherPhone}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
