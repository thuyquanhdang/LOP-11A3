import React, { useState, useMemo } from 'react';
import { 
  Award, 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  X, 
  Sparkles, 
  Trophy, 
  Star, 
  Users,
  PartyPopper,
  Download,
  Save,
  CheckCircle2,
  Calendar,
  Flame,
  Filter
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Student, RewardRecord, RewardCategory, TeamGroup, ClassInfo } from '../types';
import { INITIAL_CLASS_INFO, getDefaultTeamForStudent } from '../mockData';

interface RewardsViewProps {
  students: Student[];
  rewards: RewardRecord[];
  classInfo?: ClassInfo;
  onAddReward: (reward: RewardRecord) => void;
  onUpdateReward: (reward: RewardRecord) => void;
  onDeleteReward: (rewardId: string) => void;
  onUpdateStudent?: (student: Student) => void;
}

const CATEGORY_COLORS: Record<RewardCategory, { bg: string; text: string; border: string }> = {
  'Học tập': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'Phong trào': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  'Kỷ luật': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  'Việc tốt': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  'Thể thao - Văn nghệ': { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  'Hoạt động tổ': { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
};

const TEAMS: TeamGroup[] = ['Tổ 1', 'Tổ 2', 'Tổ 3', 'Tổ 4'];

const TEAM_STYLES: Record<TeamGroup, {
  badge: string;
  cardBorder: string;
  headerBg: string;
  iconBg: string;
  accentText: string;
}> = {
  'Tổ 1': {
    badge: 'bg-blue-100 text-blue-700 border-blue-200',
    cardBorder: 'border-blue-200 hover:border-blue-400',
    headerBg: 'from-blue-600 to-indigo-600',
    iconBg: 'bg-blue-100 text-blue-600',
    accentText: 'text-blue-600'
  },
  'Tổ 2': {
    badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    cardBorder: 'border-emerald-200 hover:border-emerald-400',
    headerBg: 'from-emerald-600 to-teal-600',
    iconBg: 'bg-emerald-100 text-emerald-600',
    accentText: 'text-emerald-600'
  },
  'Tổ 3': {
    badge: 'bg-rose-100 text-rose-700 border-rose-200',
    cardBorder: 'border-rose-200 hover:border-rose-400',
    headerBg: 'from-rose-600 to-pink-600',
    iconBg: 'bg-rose-100 text-rose-600',
    accentText: 'text-rose-600'
  },
  'Tổ 4': {
    badge: 'bg-purple-100 text-purple-700 border-purple-200',
    cardBorder: 'border-purple-200 hover:border-purple-400',
    headerBg: 'from-purple-600 to-violet-600',
    iconBg: 'bg-purple-100 text-purple-600',
    accentText: 'text-purple-600'
  }
};

export const RewardsView: React.FC<RewardsViewProps> = ({
  students,
  rewards,
  classInfo = INITIAL_CLASS_INFO,
  onAddReward,
  onUpdateReward,
  onDeleteReward,
  onUpdateStudent
}) => {
  const [selectedTeam, setSelectedTeam] = useState<'all' | TeamGroup>('all');
  const [viewMode, setViewMode] = useState<'activities' | 'team-roster'>('activities');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterWeek, setFilterWeek] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<RewardRecord | null>(null);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  const getStudentTeam = (student?: Student, fallbackId?: string): TeamGroup => {
    if (student?.team) return student.team;
    return getDefaultTeamForStudent(student?.id || fallbackId || 'hs11a3-01', student?.role);
  };

  const getTeamLeaderName = (team: TeamGroup): string => {
    if (team === 'Tổ 1') return classInfo.leaderTeam1 || 'Nguyễn Lương Nhật Vỹ';
    if (team === 'Tổ 2') return classInfo.leaderTeam2 || 'La O Thị Kim Thủy';
    if (team === 'Tổ 3') return classInfo.leaderTeam3 || 'Đinh Thị Hường';
    return classInfo.leaderTeam4 || 'Nguyễn Vũ Thị Phương Trâm';
  };

  const [formData, setFormData] = useState<{
    team: TeamGroup;
    studentId: string;
    studentName: string;
    date: string;
    week: number;
    activityName: string;
    achievement: string;
    content: string;
    category: RewardCategory;
    points: number;
    notes: string;
  }>({
    team: 'Tổ 1',
    studentId: students[0]?.id || '',
    studentName: students[0]?.fullName || '',
    date: new Date().toISOString().split('T')[0],
    week: 4,
    activityName: '',
    achievement: '',
    content: '',
    category: 'Hoạt động tổ',
    points: 15,
    notes: ''
  });

  // Enrich rewards with team info if missing
  const enrichedRewards = useMemo(() => {
    return rewards.map((r) => {
      const st = students.find((s) => s.id === r.studentId);
      const team = r.team || getStudentTeam(st, r.studentId);
      return {
        ...r,
        team,
        points: r.points ?? 15,
        week: r.week ?? 4,
        activityName: r.activityName || r.category
      };
    });
  }, [rewards, students]);

  // Statistics per team
  const teamStats = useMemo(() => {
    return TEAMS.map((team) => {
      const teamStudents = students.filter((s) => getStudentTeam(s) === team);
      const teamRewards = enrichedRewards.filter((r) => r.team === team);
      const totalPoints = teamRewards.reduce((acc, r) => acc + (r.points || 10), 0);
      const goodConductCount = teamStudents.filter((s) => s.conductRating === 'Tốt').length;

      return {
        team,
        leader: getTeamLeaderName(team),
        studentCount: teamStudents.length,
        activityCount: teamRewards.length,
        totalPoints,
        goodConductCount,
        students: teamStudents,
        rewards: teamRewards
      };
    });
  }, [students, enrichedRewards, classInfo]);

  const filteredRewards = useMemo(() => {
    return enrichedRewards.filter((r) => {
      const matchTeam = selectedTeam === 'all' || r.team === selectedTeam;
      const matchSearch =
        r.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.achievement.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.activityName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.content.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = filterCategory === 'all' || r.category === filterCategory;
      const matchWeek = filterWeek === 'all' || String(r.week || 4) === filterWeek;

      return matchTeam && matchSearch && matchCat && matchWeek;
    });
  }, [enrichedRewards, selectedTeam, searchTerm, filterCategory, filterWeek]);

  // Students filtered for modal dropdown when selecting a team
  const modalTeamStudents = useMemo(() => {
    const list = students.filter((s) => getStudentTeam(s) === formData.team);
    return list.length > 0 ? list : students;
  }, [students, formData.team]);

  const handleOpenAdd = (defaultTeam?: TeamGroup, preselectedStudent?: Student) => {
    const targetTeam = preselectedStudent
      ? getStudentTeam(preselectedStudent)
      : defaultTeam || (selectedTeam !== 'all' ? selectedTeam : 'Tổ 1');
    const teamMembers = students.filter((s) => getStudentTeam(s) === targetTeam);
    const chosenStudent = preselectedStudent || teamMembers[0] || students[0];

    setFormData({
      team: targetTeam,
      studentId: chosenStudent?.id || '',
      studentName: chosenStudent?.fullName || '',
      date: new Date().toISOString().split('T')[0],
      week: 4,
      activityName: '',
      achievement: '',
      content: '',
      category: 'Hoạt động tổ',
      points: 15,
      notes: ''
    });
    setEditingReward(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (reward: RewardRecord) => {
    const st = students.find((s) => s.id === reward.studentId);
    const team = reward.team || getStudentTeam(st, reward.studentId);
    setFormData({
      team,
      studentId: reward.studentId,
      studentName: reward.studentName,
      date: reward.date || new Date().toISOString().split('T')[0],
      week: reward.week || 4,
      activityName: reward.activityName || '',
      achievement: reward.achievement || '',
      content: reward.content || '',
      category: reward.category || 'Hoạt động tổ',
      points: reward.points ?? 15,
      notes: reward.notes || ''
    });
    setEditingReward(reward);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentId || !formData.achievement.trim()) {
      return;
    }

    const matchedStudent = students.find((s) => s.id === formData.studentId);
    const studentName = matchedStudent ? matchedStudent.fullName : formData.studentName || '';
    const studentTeam = formData.team || getStudentTeam(matchedStudent, formData.studentId);

    if (editingReward) {
      onUpdateReward({
        ...editingReward,
        studentId: formData.studentId,
        studentName,
        team: studentTeam,
        date: formData.date,
        week: Number(formData.week) || 4,
        activityName: formData.activityName.trim() || formData.category,
        achievement: formData.achievement.trim(),
        content: formData.content.trim(),
        category: formData.category,
        points: Number(formData.points) || 10,
        notes: formData.notes.trim()
      });
      setSaveToast(`Đã cập nhật thành tích hoạt động của em ${studentName} (${studentTeam})!`);
    } else {
      const newReward: RewardRecord = {
        id: `kt-${Date.now()}`,
        studentId: formData.studentId,
        studentName,
        team: studentTeam,
        date: formData.date,
        week: Number(formData.week) || 4,
        activityName: formData.activityName.trim() || formData.category,
        achievement: formData.achievement.trim(),
        content: formData.content.trim(),
        category: formData.category,
        points: Number(formData.points) || 10,
        notes: formData.notes.trim()
      };
      onAddReward(newReward);
      setSaveToast(`Đã lưu thành tích hoạt động của em ${studentName} vào ${studentTeam}!`);

      try {
        confetti({
          particleCount: 70,
          spread: 65,
          origin: { y: 0.6 }
        });
      } catch {
        // ignore
      }
    }

    setTimeout(() => setSaveToast(null), 3500);
    setIsModalOpen(false);
    setEditingReward(null);
  };

  const handleChangeStudentTeam = (student: Student, newTeam: TeamGroup) => {
    if (!onUpdateStudent) return;
    onUpdateStudent({
      ...student,
      team: newTeam
    });
    setSaveToast(`Đã chuyển em ${student.fullName} sang ${newTeam} và lưu thay đổi!`);
    setTimeout(() => setSaveToast(null), 3000);
  };

  const handleExportTeamAchievementsCSV = () => {
    const headers = [
      'STT',
      'Tổ',
      'Tổ trưởng',
      'Họ và tên học sinh',
      'Tuần học',
      'Ngày ghi nhận',
      'Hoạt động tham gia',
      'Thành tích / Danh hiệu đạt được',
      'Lĩnh vực',
      'Điểm cộng thi đua',
      'Nội dung chi tiết',
      'Ghi chú'
    ];

    const rows = filteredRewards.map((r, idx) => {
      const team = r.team || 'Tổ 1';
      const leader = getTeamLeaderName(team);
      return [
        idx + 1,
        team,
        `"${leader}"`,
        `"${r.studentName}"`,
        `Tuần ${r.week || 4}`,
        r.date,
        `"${(r.activityName || r.category).replace(/"/g, '""')}"`,
        `"${r.achievement.replace(/"/g, '""')}"`,
        `"${r.category}"`,
        `+${r.points || 15}`,
        `"${(r.content || '').replace(/"/g, '""')}"`,
        `"${(r.notes || '').replace(/"/g, '""')}"`
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Thanh_Tich_Hoat_Dong_4_To_11A3_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleManualSaveConfirm = () => {
    setSaveToast('Đã lưu toàn bộ hồ sơ thành tích hoạt động của 4 tổ lớp 11A3!');
    setTimeout(() => setSaveToast(null), 3000);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {saveToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-700 text-white px-4 py-3 rounded-xl shadow-xl border border-emerald-500 flex items-center gap-2.5 text-xs sm:text-sm font-semibold animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-blue-900 to-slate-900 rounded-2xl p-5 sm:p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-300/30 text-amber-200 text-xs font-bold mb-2">
              <Trophy className="w-3.5 h-3.5 text-amber-300" />
              THI ĐUA & LƯU TRỮ THÀNH TÍCH HOẠT ĐỘNG TỪNG TỔ – LỚP 11A3
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight flex items-center gap-2">
              Quản Lý Thành Tích Hoạt Động Học Sinh Theo Tổ (Tổ 1 – Tổ 4)
            </h2>
            <p className="text-xs sm:text-sm text-blue-100/90 mt-1">
              GVCN: <span className="font-bold text-white">{classInfo.homeroomTeacher}</span> • Lớp trưởng: <span className="font-bold text-amber-300">{classInfo.classMonitor}</span> • Lớp phó học tập: <span className="font-bold text-emerald-300">{classInfo.viceMonitor}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={handleManualSaveConfirm}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold transition shadow-md cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Lưu thay đổi</span>
            </button>

            <button
              onClick={handleExportTeamAchievementsCSV}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs sm:text-sm font-semibold transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Xuất Excel theo tổ</span>
            </button>

            <button
              id="add-reward-btn"
              onClick={() => handleOpenAdd()}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs sm:text-sm font-extrabold transition shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>+ Ghi nhận thành tích tổ</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Team Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {teamStats.map((stat) => {
          const style = TEAM_STYLES[stat.team];
          const isSelected = selectedTeam === stat.team;
          return (
            <div
              key={stat.team}
              onClick={() => setSelectedTeam(isSelected ? 'all' : stat.team)}
              className={`bg-white rounded-2xl p-4 border-2 transition cursor-pointer shadow-xs hover:shadow-md flex flex-col justify-between ${
                isSelected ? 'border-indigo-600 ring-2 ring-indigo-500/20' : style.cardBorder
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className={`px-3 py-1 rounded-xl text-xs font-extrabold border ${style.badge}`}>
                    {stat.team}
                  </span>
                  <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    +{stat.totalPoints} điểm
                  </span>
                </div>

                <p className="text-xs text-slate-500 font-medium">Tổ trưởng phụ trách:</p>
                <p className="text-sm font-bold text-slate-800 truncate mt-0.5 flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-400 shrink-0" />
                  {stat.leader}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-center">
                <div className="bg-slate-50 rounded-xl p-2">
                  <p className="text-[11px] text-slate-500">Thành viên</p>
                  <p className="text-sm font-extrabold text-slate-800">{stat.studentCount} HS</p>
                </div>
                <div className="bg-emerald-50/70 rounded-xl p-2">
                  <p className="text-[11px] text-emerald-700">Thành tích</p>
                  <p className="text-sm font-extrabold text-emerald-700">{stat.activityCount} lượt</p>
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenAdd(stat.team);
                }}
                className="mt-3 w-full py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 text-xs font-bold transition flex items-center justify-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Thêm hoạt động {stat.team}
              </button>
            </div>
          );
        })}
      </div>

      {/* Mode Switcher & Team Filter Pills */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
          {/* Team Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setSelectedTeam('all')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                selectedTeam === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tất cả 4 Tổ ({enrichedRewards.length} thành tích)
            </button>
            {TEAMS.map((team) => {
              const count = enrichedRewards.filter((r) => r.team === team).length;
              return (
                <button
                  key={team}
                  onClick={() => setSelectedTeam(team)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    selectedTeam === team
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span>{team}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    selectedTeam === team ? 'bg-indigo-800 text-white' : 'bg-white text-slate-600'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Sub-view mode switcher */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl self-start md:self-auto">
            <button
              onClick={() => setViewMode('activities')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'activities'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              Nhật ký Thành tích Hoạt động
            </button>
            <button
              onClick={() => setViewMode('team-roster')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'team-roster'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Danh sách Học sinh & Thành tích theo Tổ
            </button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên học sinh, tên hoạt động, giải thưởng, nội dung..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-transparent text-xs font-medium text-slate-700 focus:outline-hidden"
              >
                <option value="all">Tất cả lĩnh vực hoạt động</option>
                <option value="Hoạt động tổ">Hoạt động tổ & Trực nhật</option>
                <option value="Học tập">Học tập & Hoa điểm 10</option>
                <option value="Phong trào">Phong trào Đoàn - Đội</option>
                <option value="Thể thao - Văn nghệ">Thể thao - Văn nghệ</option>
                <option value="Việc tốt">Người tốt việc tốt</option>
                <option value="Kỷ luật">Nề nếp & Nội trú</option>
              </select>
            </div>

            <select
              value={filterWeek}
              onChange={(e) => setFilterWeek(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-hidden"
            >
              <option value="all">Tất cả các tuần</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((w) => (
                <option key={w} value={String(w)}>
                  Tuần {w}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* VIEW MODE 1: ACTIVITY ACHIEVEMENTS LIST */}
      {viewMode === 'activities' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRewards.length === 0 ? (
            <div className="col-span-2 bg-white rounded-2xl p-12 text-center text-slate-400 border border-slate-200 space-y-3">
              <Trophy className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-medium text-slate-600">
                Chưa có thành tích hoạt động nào trong mục đang chọn.
              </p>
              <button
                onClick={() => handleOpenAdd()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition"
              >
                <Plus className="w-4 h-4" />
                Ghi nhận thành tích hoạt động đầu tiên
              </button>
            </div>
          ) : (
            filteredRewards.map((r) => {
              const catStyle = CATEGORY_COLORS[r.category] || CATEGORY_COLORS['Hoạt động tổ'];
              const team = r.team || 'Tổ 1';
              const teamStyle = TEAM_STYLES[team];
              return (
                <div
                  key={r.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition relative group flex flex-col justify-between"
                >
                  <div>
                    {/* Top badges: Team + Category + Points */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-lg border ${teamStyle.badge}`}>
                          {team}
                        </span>
                        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${catStyle.bg} ${catStyle.text} border ${catStyle.border}`}>
                          {r.category}
                        </span>
                        {r.week && (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                            Tuần {r.week}
                          </span>
                        )}
                      </div>

                      <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                        +{r.points || 15} điểm thi đua
                      </span>
                    </div>

                    {/* Main Achievement Info */}
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold shrink-0 shadow-xs">
                        <Trophy className="w-5 h-5 text-amber-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
                          {r.achievement}
                        </h3>
                        <p className="text-xs text-slate-600 font-semibold mt-1">
                          Học sinh: <span className="text-indigo-600 font-bold">{r.studentName}</span>
                        </p>
                        {r.activityName && (
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Hoạt động: <span className="font-semibold text-slate-700">{r.activityName}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <p className="mt-3 text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                      {r.content || 'Tham gia tích cực và hoàn thành xuất sắc nhiệm vụ của tổ.'}
                    </p>

                    {r.notes && (
                      <p className="mt-2 text-[11px] text-emerald-700 font-medium italic">
                        * Ghi chú khen thưởng: {r.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-amber-500" />
                      Ngày ghi nhận: {r.date}
                    </span>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleOpenEdit(r)}
                        className="px-2.5 py-1 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition flex items-center gap-1 font-semibold cursor-pointer"
                        title="Chỉnh sửa thành tích"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Sửa</span>
                      </button>
                      <button
                        onClick={() => onDeleteReward(r.id)}
                        className="px-2.5 py-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition flex items-center gap-1 font-semibold cursor-pointer"
                        title="Xóa thành tích"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Xóa</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* VIEW MODE 2: ROSTER BY TEAM WITH STUDENT ACHIEVEMENT STORAGE */
        <div className="space-y-6">
          {teamStats
            .filter((t) => selectedTeam === 'all' || t.team === selectedTeam)
            .map((stat) => {
              const style = TEAM_STYLES[stat.team];
              const filteredMembers = stat.students.filter((s) =>
                s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.code.toLowerCase().includes(searchTerm.toLowerCase())
              );

              return (
                <div key={stat.team} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                  {/* Team Section Header */}
                  <div className={`bg-gradient-to-r ${style.headerBg} px-5 py-4 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3`}>
                    <div>
                      <div className="flex items-center gap-2.5">
                        <span className="px-3 py-1 rounded-lg bg-white/20 text-white font-extrabold text-sm">
                          {stat.team}
                        </span>
                        <h3 className="font-bold text-base sm:text-lg">
                          Tổ trưởng: {stat.leader}
                        </h3>
                      </div>
                      <p className="text-xs text-white/85 mt-1">
                        Sĩ số tổ: {stat.studentCount} học sinh • Tổng thành tích: {stat.activityCount} lượt • Tổng điểm cộng: +{stat.totalPoints} điểm
                      </p>
                    </div>

                    <button
                      onClick={() => handleOpenAdd(stat.team)}
                      className="px-3.5 py-2 rounded-xl bg-white text-slate-900 hover:bg-amber-50 text-xs font-extrabold transition shadow-xs flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                    >
                      <Plus className="w-4 h-4 text-indigo-600" />
                      <span>Ghi nhận hoạt động cho {stat.team}</span>
                    </button>
                  </div>

                  {/* Table of Students in this Team & Their Stored Achievements */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                          <th className="py-3 px-4 w-12">STT</th>
                          <th className="py-3 px-4">Họ và tên học sinh</th>
                          <th className="py-3 px-4">Chức vụ</th>
                          <th className="py-3 px-4">Tổ hiện tại</th>
                          <th className="py-3 px-4">Thành tích hoạt động đã lưu trữ</th>
                          <th className="py-3 px-4 text-center">Tổng điểm cộng</th>
                          <th className="py-3 px-4 text-right">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {filteredMembers.map((st, idx) => {
                          const stRewards = enrichedRewards.filter((r) => r.studentId === st.id);
                          const stPoints = stRewards.reduce((sum, r) => sum + (r.points || 15), 0);

                          return (
                            <tr key={st.id} className="hover:bg-slate-50/80 transition">
                              <td className="py-3.5 px-4 font-semibold text-slate-500">{idx + 1}</td>
                              <td className="py-3.5 px-4">
                                <div className="font-bold text-slate-900">{st.fullName}</div>
                                <div className="text-[11px] text-slate-500">{st.code} • Dân tộc: {st.ethnicity}</div>
                              </td>
                              <td className="py-3.5 px-4">
                                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                                  st.role && st.role !== 'Học sinh'
                                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                    : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {st.role || 'Học sinh'}
                                </span>
                              </td>
                              <td className="py-3.5 px-4">
                                <select
                                  value={getStudentTeam(st)}
                                  onChange={(e) => handleChangeStudentTeam(st, e.target.value as TeamGroup)}
                                  className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-hidden"
                                >
                                  {TEAMS.map((t) => (
                                    <option key={t} value={t}>
                                      {t}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="py-3.5 px-4 max-w-md">
                                {stRewards.length === 0 ? (
                                  <span className="text-slate-400 italic text-[11px]">
                                    Chưa có ghi nhận hoạt động cá nhân
                                  </span>
                                ) : (
                                  <div className="space-y-1.5">
                                    {stRewards.map((rw) => (
                                      <div
                                        key={rw.id}
                                        className="p-2 rounded-lg bg-indigo-50/60 border border-indigo-100 flex items-start justify-between gap-2"
                                      >
                                        <div>
                                          <span className="font-bold text-indigo-900 block">
                                            ★ {rw.achievement}
                                          </span>
                                          <span className="text-[11px] text-slate-600">
                                            {rw.activityName ? `${rw.activityName} • ` : ''}Ngày {rw.date} (+{rw.points || 15}đ)
                                          </span>
                                        </div>
                                        <button
                                          onClick={() => handleOpenEdit(rw)}
                                          className="text-indigo-600 hover:text-indigo-800 p-1 shrink-0"
                                          title="Sửa thành tích này"
                                        >
                                          <Edit3 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </td>
                              <td className="py-3.5 px-4 text-center">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg font-extrabold text-xs ${
                                  stPoints > 0
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-slate-100 text-slate-500'
                                }`}>
                                  +{stPoints} điểm
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <button
                                  onClick={() => handleOpenAdd(stat.team, st)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition cursor-pointer"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Thêm thành tích</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Modal Add / Edit Team Activity Achievement */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <PartyPopper className="w-5 h-5 text-indigo-600" />
                {editingReward ? 'Cập nhật thành tích hoạt động trong tổ' : 'Lưu trữ thành tích hoạt động của học sinh theo Tổ'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Chọn Tổ <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.team}
                    onChange={(e) => {
                      const newTeam = e.target.value as TeamGroup;
                      const members = students.filter((s) => getStudentTeam(s) === newTeam);
                      setFormData({
                        ...formData,
                        team: newTeam,
                        studentId: members[0]?.id || formData.studentId,
                        studentName: members[0]?.fullName || formData.studentName
                      });
                    }}
                    className="w-full px-3 py-2 bg-indigo-50/60 border border-indigo-200 rounded-xl text-xs sm:text-sm font-bold text-indigo-900 focus:ring-2 focus:ring-indigo-500/20"
                  >
                    {TEAMS.map((t) => (
                      <option key={t} value={t}>
                        {t} (Tổ trưởng: {getTeamLeaderName(t)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Học sinh trong {formData.team} <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.studentId}
                    onChange={(e) => {
                      const st = students.find((s) => s.id === e.target.value);
                      setFormData({
                        ...formData,
                        studentId: e.target.value,
                        studentName: st?.fullName || ''
                      });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-indigo-500/20"
                  >
                    {modalTeamStudents.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.fullName} ({s.role && s.role !== 'Học sinh' ? s.role : s.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ngày ghi nhận</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tuần học</label>
                  <select
                    value={formData.week}
                    onChange={(e) => setFormData({ ...formData, week: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((w) => (
                      <option key={w} value={w}>
                        Tuần {w}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Điểm cộng thi đua tổ</label>
                  <select
                    value={formData.points}
                    onChange={(e) => setFormData({ ...formData, points: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800"
                  >
                    <option value={5}>+5 điểm (Khuyến khích)</option>
                    <option value={10}>+10 điểm (Tốt)</option>
                    <option value={15}>+15 điểm (Xuất sắc)</option>
                    <option value={20}>+20 điểm (Giải cao / Tiêu biểu)</option>
                    <option value={30}>+30 điểm (Đặc biệt xuất sắc)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Lĩnh vực hoạt động</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as RewardCategory })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                    <option value="Hoạt động tổ">Hoạt động tổ & Trực nhật</option>
                    <option value="Học tập">Học tập & Hoa điểm 10</option>
                    <option value="Phong trào">Phong trào Đoàn - Đội</option>
                    <option value="Thể thao - Văn nghệ">Thể thao - Văn nghệ</option>
                    <option value="Việc tốt">Người tốt việc tốt</option>
                    <option value="Kỷ luật">Nề nếp & Nội trú</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tên hoạt động / Phong trào</label>
                  <input
                    type="text"
                    placeholder="VD: Trực nhật lớp, Đôi bạn cùng tiến, Hội thao..."
                    value={formData.activityName}
                    onChange={(e) => setFormData({ ...formData, activityName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Thành tích / Danh hiệu đạt được <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Đạt 3 điểm 10 tuần 4, Hoàn thành xuất sắc trực nhật Tổ 1..."
                  value={formData.achievement}
                  onChange={(e) => setFormData({ ...formData, achievement: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Mô tả chi tiết hoạt động & Hình thức khen thưởng
                </label>
                <textarea
                  rows={3}
                  placeholder="VD: Nhiệt tình hướng dẫn các bạn trong tổ giải bài tập Toán, được GVCN và Tổ trưởng tuyên dương trong giờ sinh hoạt lớp..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Ghi chú của GVCN / Tổ trưởng
                </label>
                <input
                  type="text"
                  placeholder="VD: Cộng điểm vào xếp loại thi đua tháng 10..."
                  value={formData.notes}
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
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingReward ? 'Lưu cập nhật' : 'Lưu thành tích vào Tổ'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

