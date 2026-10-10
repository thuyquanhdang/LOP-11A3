import React, { useState, useEffect } from 'react';
import { 
  ActiveTab, 
  Student, 
  AttendanceRecord, 
  ViolationRecord, 
  RewardRecord, 
  ConductEvaluation, 
  ParentContact, 
  PolicyDocumentItem, 
  ClassInfo 
} from './types';

import { 
  getInitialAppState, 
  saveToStorage, 
  loadFromStorage,
  STORAGE_KEYS, 
  resetAllDataToDefault 
} from './utils/storage';

import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { StudentsView } from './components/StudentsView';
import { AttendanceView } from './components/AttendanceView';
import { ViolationsView } from './components/ViolationsView';
import { RewardsView } from './components/RewardsView';
import { ConductView } from './components/ConductView';
import { ParentsView } from './components/ParentsView';
import { PoliciesView } from './components/PoliciesView';
import { ReportsView } from './components/ReportsView';
import { AIAssistantView } from './components/AIAssistantView';
import { SettingsView } from './components/SettingsView';

export default function App() {
  // Navigation tab state persisted across reloads
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    const savedTab = loadFromStorage<ActiveTab>(STORAGE_KEYS.ACTIVE_TAB, 'dashboard');
    const validTabs: ActiveTab[] = [
      'dashboard', 'students', 'attendance', 'violations', 'rewards',
      'conduct', 'parents', 'policies', 'reports', 'ai-assistant', 'settings'
    ];
    return validTabs.includes(savedTab) ? savedTab : 'dashboard';
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedStudentForModal, setSelectedStudentForModal] = useState<Student | null>(null);
  const [storageError, setStorageError] = useState<string | null>(null);

  // App Domain State loaded from localStorage
  const [initialData] = useState(() => getInitialAppState());
  
  const [classInfo, setClassInfo] = useState<ClassInfo>(initialData.classInfo);
  const [students, setStudents] = useState<Student[]>(initialData.students);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(initialData.attendance);
  const [violations, setViolations] = useState<ViolationRecord[]>(initialData.violations);
  const [rewards, setRewards] = useState<RewardRecord[]>(initialData.rewards);
  const [conduct, setConduct] = useState<ConductEvaluation[]>(initialData.conduct);
  const [parents, setParents] = useState<ParentContact[]>(initialData.parents);
  const [policies, setPolicies] = useState<PolicyDocumentItem[]>(initialData.policies);

  const checkSaveResult = (res: { success: boolean; error?: string }) => {
    if (!res.success && res.error) {
      setStorageError(res.error);
      return false;
    }
    setStorageError(null);
    return true;
  };

  // Persist activeTab
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.ACTIVE_TAB, activeTab);
  }, [activeTab]);

  // Auto-sync state to localStorage whenever it changes
  useEffect(() => {
    checkSaveResult(saveToStorage(STORAGE_KEYS.CLASS_INFO, classInfo));
  }, [classInfo]);

  useEffect(() => {
    checkSaveResult(saveToStorage(STORAGE_KEYS.STUDENTS, students));
  }, [students]);

  useEffect(() => {
    checkSaveResult(saveToStorage(STORAGE_KEYS.ATTENDANCE, attendance));
  }, [attendance]);

  useEffect(() => {
    checkSaveResult(saveToStorage(STORAGE_KEYS.VIOLATIONS, violations));
  }, [violations]);

  useEffect(() => {
    checkSaveResult(saveToStorage(STORAGE_KEYS.REWARDS, rewards));
  }, [rewards]);

  useEffect(() => {
    checkSaveResult(saveToStorage(STORAGE_KEYS.CONDUCT, conduct));
  }, [conduct]);

  useEffect(() => {
    checkSaveResult(saveToStorage(STORAGE_KEYS.PARENTS, parents));
  }, [parents]);

  useEffect(() => {
    checkSaveResult(saveToStorage(STORAGE_KEYS.POLICIES, policies));
  }, [policies]);

  // Helper to update students & sync classInfo student counts immediately to localStorage
  const syncStudentsAndClassCounts = (nextStudents: Student[]) => {
    const resStudents = saveToStorage(STORAGE_KEYS.STUDENTS, nextStudents);
    if (!checkSaveResult(resStudents)) return false;

    const maleCount = nextStudents.filter(s => s.gender === 'Nam').length;
    const femaleCount = nextStudents.filter(s => s.gender === 'Nữ').length;
    setClassInfo(prevClass => {
      const nextClass: ClassInfo = {
        ...prevClass,
        totalStudents: nextStudents.length,
        maleCount,
        femaleCount
      };
      saveToStorage(STORAGE_KEYS.CLASS_INFO, nextClass);
      return nextClass;
    });
    return true;
  };

  // Counts for sidebar badges
  const sidebarCounts = {
    students: students.length,
    violations: violations.filter(v => !v.resolved).length,
    rewards: rewards.length,
    attentionStudents: students.filter(s => s.needsAttention).length,
    pendingPolicies: policies.filter(p => !p.submitted).length
  };

  // Student Handlers
  const handleAddStudent = (newStudent: Student) => {
    setStudents(prev => {
      const next = [newStudent, ...prev];
      syncStudentsAndClassCounts(next);
      return next;
    });
  };

  const handleBulkAddStudents = (newStudents: Student[]) => {
    setStudents(prev => {
      const next = [...newStudents, ...prev];
      syncStudentsAndClassCounts(next);
      return next;
    });
  };

  const handleUpdateStudent = (updatedStudent: Student) => {
    setStudents(prev => {
      const next = prev.map(s => s.id === updatedStudent.id ? updatedStudent : s);
      syncStudentsAndClassCounts(next);
      return next;
    });
  };

  const handleDeleteStudent = (studentId: string) => {
    setStudents(prev => {
      const next = prev.filter(s => s.id !== studentId);
      syncStudentsAndClassCounts(next);
      return next;
    });
    setViolations(prev => {
      const next = prev.filter(v => v.studentId !== studentId);
      saveToStorage(STORAGE_KEYS.VIOLATIONS, next);
      return next;
    });
    setRewards(prev => {
      const next = prev.filter(r => r.studentId !== studentId);
      saveToStorage(STORAGE_KEYS.REWARDS, next);
      return next;
    });
    setParents(prev => {
      const next = prev.filter(p => p.studentId !== studentId);
      saveToStorage(STORAGE_KEYS.PARENTS, next);
      return next;
    });
    setPolicies(prev => {
      const next = prev.filter(p => p.studentId !== studentId);
      saveToStorage(STORAGE_KEYS.POLICIES, next);
      return next;
    });
  };

  // Attendance Handlers
  const handleSaveAttendance = (record: AttendanceRecord) => {
    setAttendance(prev => {
      const idx = prev.findIndex(a => a.date === record.date);
      let next: AttendanceRecord[];
      if (idx >= 0) {
        next = [...prev];
        next[idx] = record;
      } else {
        next = [record, ...prev];
      }
      checkSaveResult(saveToStorage(STORAGE_KEYS.ATTENDANCE, next));
      return next;
    });
  };

  // Violations Handlers
  const handleAddViolation = (v: ViolationRecord) => {
    setViolations(prev => {
      const next = [v, ...prev];
      checkSaveResult(saveToStorage(STORAGE_KEYS.VIOLATIONS, next));
      return next;
    });
  };

  const handleUpdateViolation = (v: ViolationRecord) => {
    setViolations(prev => {
      const next = prev.map(item => item.id === v.id ? v : item);
      checkSaveResult(saveToStorage(STORAGE_KEYS.VIOLATIONS, next));
      return next;
    });
  };

  const handleDeleteViolation = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bản ghi vi phạm này?')) {
      setViolations(prev => {
        const next = prev.filter(item => item.id !== id);
        checkSaveResult(saveToStorage(STORAGE_KEYS.VIOLATIONS, next));
        return next;
      });
    }
  };

  // Rewards Handlers
  const handleAddReward = (r: RewardRecord) => {
    setRewards(prev => {
      const next = [r, ...prev];
      checkSaveResult(saveToStorage(STORAGE_KEYS.REWARDS, next));
      return next;
    });
  };

  const handleUpdateReward = (r: RewardRecord) => {
    setRewards(prev => {
      const next = prev.map(item => item.id === r.id ? r : item);
      checkSaveResult(saveToStorage(STORAGE_KEYS.REWARDS, next));
      return next;
    });
  };

  const handleDeleteReward = (id: string) => {
    if (window.confirm('Bạn có chắc muốn xóa bản ghi khen thưởng này?')) {
      setRewards(prev => {
        const next = prev.filter(item => item.id !== id);
        checkSaveResult(saveToStorage(STORAGE_KEYS.REWARDS, next));
        return next;
      });
    }
  };

  // Conduct Handlers
  const handleUpdateConduct = (newConduct: ConductEvaluation[]) => {
    setConduct(newConduct);
    checkSaveResult(saveToStorage(STORAGE_KEYS.CONDUCT, newConduct));
  };

  // Parent Contacts Handlers
  const handleAddContact = (c: ParentContact) => {
    setParents(prev => {
      const next = [c, ...prev];
      checkSaveResult(saveToStorage(STORAGE_KEYS.PARENTS, next));
      return next;
    });
  };

  const handleUpdateContact = (c: ParentContact) => {
    setParents(prev => {
      const next = prev.map(item => item.id === c.id ? c : item);
      checkSaveResult(saveToStorage(STORAGE_KEYS.PARENTS, next));
      return next;
    });
  };

  const handleDeleteContact = (id: string) => {
    if (window.confirm('Bạn có chắc muốn xóa nhật ký trao đổi này?')) {
      setParents(prev => {
        const next = prev.filter(item => item.id !== id);
        checkSaveResult(saveToStorage(STORAGE_KEYS.PARENTS, next));
        return next;
      });
    }
  };

  // Policy Handlers
  const handleAddPolicy = (p: PolicyDocumentItem) => {
    setPolicies(prev => {
      const next = [p, ...prev];
      checkSaveResult(saveToStorage(STORAGE_KEYS.POLICIES, next));
      return next;
    });
  };

  const handleUpdatePolicy = (p: PolicyDocumentItem) => {
    setPolicies(prev => {
      const next = prev.map(item => item.id === p.id ? p : item);
      checkSaveResult(saveToStorage(STORAGE_KEYS.POLICIES, next));
      return next;
    });
  };

  const handleDeletePolicy = (id: string) => {
    if (window.confirm('Bạn có chắc muốn xóa hồ sơ chế độ này?')) {
      setPolicies(prev => {
        const next = prev.filter(item => item.id !== id);
        checkSaveResult(saveToStorage(STORAGE_KEYS.POLICIES, next));
        return next;
      });
    }
  };

  // Backup and Restore
  const handleExportData = () => {
    const backup = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      classInfo,
      students,
      attendance,
      violations,
      rewards,
      conduct,
      parents,
      policies
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `tro_ly_chu_nhiem_${classInfo.className}_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportData = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        if (parsed.students && Array.isArray(parsed.students)) {
          if (parsed.classInfo) {
            setClassInfo(parsed.classInfo);
            saveToStorage(STORAGE_KEYS.CLASS_INFO, parsed.classInfo);
          }
          if (parsed.students) {
            setStudents(parsed.students);
            syncStudentsAndClassCounts(parsed.students);
          }
          if (parsed.attendance) {
            setAttendance(parsed.attendance);
            saveToStorage(STORAGE_KEYS.ATTENDANCE, parsed.attendance);
          }
          if (parsed.violations) {
            setViolations(parsed.violations);
            saveToStorage(STORAGE_KEYS.VIOLATIONS, parsed.violations);
          }
          if (parsed.rewards) {
            setRewards(parsed.rewards);
            saveToStorage(STORAGE_KEYS.REWARDS, parsed.rewards);
          }
          if (parsed.conduct) {
            setConduct(parsed.conduct);
            saveToStorage(STORAGE_KEYS.CONDUCT, parsed.conduct);
          }
          if (parsed.parents) {
            setParents(parsed.parents);
            saveToStorage(STORAGE_KEYS.PARENTS, parsed.parents);
          }
          if (parsed.policies) {
            setPolicies(parsed.policies);
            saveToStorage(STORAGE_KEYS.POLICIES, parsed.policies);
          }
          alert('Khôi phục dữ liệu từ tệp thành công!');
        } else {
          alert('Tệp dữ liệu không hợp lệ!');
        }
      } catch (err) {
        alert('Lỗi đọc tệp JSON: ' + err);
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = () => {
    const defaults = resetAllDataToDefault();
    setClassInfo(defaults.classInfo);
    setStudents(defaults.students);
    setAttendance(defaults.attendance);
    setViolations(defaults.violations);
    setRewards(defaults.rewards);
    setConduct(defaults.conduct);
    setParents(defaults.parents);
    setPolicies(defaults.policies);
  };

  const handleSaveAllChanges = (): boolean => {
    const results = [
      saveToStorage(STORAGE_KEYS.CLASS_INFO, classInfo),
      saveToStorage(STORAGE_KEYS.STUDENTS, students),
      saveToStorage(STORAGE_KEYS.ATTENDANCE, attendance),
      saveToStorage(STORAGE_KEYS.VIOLATIONS, violations),
      saveToStorage(STORAGE_KEYS.REWARDS, rewards),
      saveToStorage(STORAGE_KEYS.CONDUCT, conduct),
      saveToStorage(STORAGE_KEYS.PARENTS, parents),
      saveToStorage(STORAGE_KEYS.POLICIES, policies),
    ];
    const failed = results.find(r => !r.success);
    if (failed) {
      setStorageError(failed.error || 'Lỗi lưu dữ liệu vào bộ nhớ trình duyệt.');
      return false;
    }
    setStorageError(null);
    return true;
  };

  return (
    <div className="flex h-screen bg-slate-100/90 text-slate-800 antialiased overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        classInfo={classInfo}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        counts={sidebarCounts}
      />

      {/* Main App Canvas */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Sticky Header */}
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          classInfo={classInfo}
          onSaveAllChanges={handleSaveAllChanges}
          storageError={storageError}
        />

        {/* Storage Error Banner if saving fails */}
        {storageError && (
          <div className="bg-rose-600 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between">
            <span>⚠️ Lỗi lưu trữ dữ liệu: {storageError}</span>
            <button
              onClick={() => setStorageError(null)}
              className="underline ml-4 hover:text-rose-100"
            >
              Đóng
            </button>
          </div>
        )}

        {/* Dynamic Views Viewport */}
        <main className="flex-1 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              students={students}
              violations={violations}
              rewards={rewards}
              attendance={attendance}
              conduct={conduct}
              classInfo={classInfo}
              setActiveTab={setActiveTab}
              onSelectStudent={(st) => {
                setSelectedStudentForModal(st);
                setActiveTab('students');
              }}
            />
          )}

          {activeTab === 'students' && (
            <StudentsView
              students={students}
              classInfo={classInfo}
              violations={violations}
              rewards={rewards}
              attendance={attendance}
              conduct={conduct}
              parents={parents}
              policies={policies}
              onAddStudent={handleAddStudent}
              onBulkAddStudents={handleBulkAddStudents}
              onUpdateStudent={handleUpdateStudent}
              onDeleteStudent={handleDeleteStudent}
              onAddReward={handleAddReward}
              onAddViolation={handleAddViolation}
              initialSelectedStudent={selectedStudentForModal}
              onClearInitialSelected={() => setSelectedStudentForModal(null)}
            />
          )}

          {activeTab === 'attendance' && (
            <AttendanceView
              students={students}
              attendance={attendance}
              classInfo={classInfo}
              onSaveAttendance={handleSaveAttendance}
            />
          )}

          {activeTab === 'violations' && (
            <ViolationsView
              students={students}
              violations={violations}
              onAddViolation={handleAddViolation}
              onUpdateViolation={handleUpdateViolation}
              onDeleteViolation={handleDeleteViolation}
            />
          )}

          {activeTab === 'rewards' && (
            <RewardsView
              students={students}
              rewards={rewards}
              classInfo={classInfo}
              onAddReward={handleAddReward}
              onUpdateReward={handleUpdateReward}
              onDeleteReward={handleDeleteReward}
              onUpdateStudent={handleUpdateStudent}
            />
          )}

          {activeTab === 'conduct' && (
            <ConductView
              students={students}
              conduct={conduct}
              onUpdateConduct={handleUpdateConduct}
            />
          )}

          {activeTab === 'parents' && (
            <ParentsView
              students={students}
              parents={parents}
              onAddContact={handleAddContact}
              onUpdateContact={handleUpdateContact}
              onDeleteContact={handleDeleteContact}
            />
          )}

          {activeTab === 'policies' && (
            <PoliciesView
              students={students}
              policies={policies}
              onAddPolicy={handleAddPolicy}
              onUpdatePolicy={handleUpdatePolicy}
              onDeletePolicy={handleDeletePolicy}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView
              students={students}
              violations={violations}
              rewards={rewards}
              attendance={attendance}
              conduct={conduct}
              classInfo={classInfo}
            />
          )}

          {activeTab === 'ai-assistant' && (
            <AIAssistantView
              classInfo={classInfo}
              students={students}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              classInfo={classInfo}
              onUpdateClassInfo={setClassInfo}
              onResetData={handleResetData}
              onExportData={handleExportData}
              onImportData={handleImportData}
            />
          )}
        </main>
      </div>
    </div>
  );
}
