import React, { useState, useMemo } from 'react';
import { 
  Target, 
  Search, 
  CheckCircle2, 
  Sparkles, 
  Edit3, 
  Save, 
  HelpCircle, 
  BookOpen, 
  TrendingUp,
  Award,
  Filter
} from 'lucide-react';
import { Student, ConductEvaluation, EvaluationGrade } from '../types';

interface ConductViewProps {
  students: Student[];
  conduct: ConductEvaluation[];
  onUpdateConduct: (evaluations: ConductEvaluation[]) => void;
}

const EVALUATION_OPTIONS: EvaluationGrade[] = ['Tốt', 'Khá', 'Đạt', 'Cần cố gắng'];

export const ConductView: React.FC<ConductViewProps> = ({
  students,
  conduct,
  onUpdateConduct
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOverall, setFilterOverall] = useState<string>('all');
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  // Sync state with students to ensure every student has an evaluation record
  const currentConductList = useMemo(() => {
    return students.map(s => {
      const existing = conduct.find(c => c.studentId === s.id);
      if (existing) return existing;
      return {
        studentId: s.id,
        studentName: s.fullName,
        studyAttitude: 'Tốt' as EvaluationGrade,
        ruleCompliance: 'Tốt' as EvaluationGrade,
        attendanceRate: 'Tốt' as EvaluationGrade,
        hygiene: 'Tốt' as EvaluationGrade,
        teamwork: 'Tốt' as EvaluationGrade,
        activityParticipation: 'Tốt' as EvaluationGrade,
        overallGrade: 'Tốt' as const,
        teacherFeedback: 'Chăm ngoan, chấp hành tốt mọi quy định của nhà trường.',
        lastUpdated: new Date().toISOString().split('T')[0]
      };
    });
  }, [students, conduct]);

  const [localConduct, setLocalConduct] = useState<ConductEvaluation[]>(currentConductList);

  React.useEffect(() => {
    setLocalConduct(currentConductList);
  }, [currentConductList]);

  // Compute Overall rating automatically from criteria
  const calculateOverallGrade = (item: ConductEvaluation): 'Tốt' | 'Khá' | 'Đạt' | 'Chưa đạt' => {
    const grades = [
      item.studyAttitude,
      item.ruleCompliance,
      item.attendanceRate,
      item.hygiene,
      item.teamwork,
      item.activityParticipation
    ];

    const canCoGangCount = grades.filter(g => g === 'Cần cố gắng').length;
    const datCount = grades.filter(g => g === 'Đạt').length;
    const totCount = grades.filter(g => g === 'Tốt').length;

    if (canCoGangCount >= 2) return 'Chưa đạt';
    if (canCoGangCount === 1 || datCount >= 3) return 'Đạt';
    if (totCount >= 4 && !grades.includes('Cần cố gắng')) return 'Tốt';
    return 'Khá';
  };

  const handleGradeChange = (studentId: string, criterion: keyof ConductEvaluation, value: EvaluationGrade) => {
    setLocalConduct(prev => {
      const updated = prev.map(item => {
        if (item.studentId === studentId) {
          const newItem = { ...item, [criterion]: value };
          newItem.overallGrade = calculateOverallGrade(newItem);
          newItem.lastUpdated = new Date().toISOString().split('T')[0];
          return newItem;
        }
        return item;
      });
      onUpdateConduct(updated);
      return updated;
    });

    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 1500);
  };

  const handleFeedbackChange = (studentId: string, feedback: string) => {
    setLocalConduct(prev => {
      const updated = prev.map(item => {
        if (item.studentId === studentId) {
          return { ...item, teacherFeedback: feedback, lastUpdated: new Date().toISOString().split('T')[0] };
        }
        return item;
      });
      onUpdateConduct(updated);
      return updated;
    });
  };

  const filteredConduct = useMemo(() => {
    return localConduct.filter(c => {
      const matchSearch = c.studentName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchOverall = filterOverall === 'all' || c.overallGrade === filterOverall;
      return matchSearch && matchOverall;
    });
  }, [localConduct, searchTerm, filterOverall]);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            Đánh Giá & Theo Dõi Rèn Luyện
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
              Thông tư 22/BGDĐT
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Đánh giá 6 tiêu chí rèn luyện phẩm chất và năng lực của học sinh THPT
          </p>
        </div>

        {justSaved && (
          <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 animate-fade-in self-start sm:self-auto">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Đã lưu xếp loại
          </span>
        )}
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên học sinh..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <select
          value={filterOverall}
          onChange={(e) => setFilterOverall(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-hidden"
        >
          <option value="all">Tất cả xếp loại</option>
          <option value="Tốt">Loại Tốt</option>
          <option value="Khá">Loại Khá</option>
          <option value="Đạt">Loại Đạt</option>
          <option value="Chưa đạt">Cần cố gắng / Chưa đạt</option>
        </select>
      </div>

      {/* Matrix Evaluation Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-3 w-10 text-center">STT</th>
                <th className="py-3 px-3 min-w-[140px]">Học sinh</th>
                <th className="py-3 px-2 text-center">Ý thức học tập</th>
                <th className="py-3 px-2 text-center">Chấp hành nội quy</th>
                <th className="py-3 px-2 text-center">Chuyên cần</th>
                <th className="py-3 px-2 text-center">Vệ sinh lớp</th>
                <th className="py-3 px-2 text-center">Tinh thần tập thể</th>
                <th className="py-3 px-2 text-center">Tham gia HĐ</th>
                <th className="py-3 px-3 text-center">Xếp loại chung</th>
                <th className="py-3 px-3 min-w-[200px]">Lời nhận xét của GVCN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredConduct.map((c, idx) => (
                <tr key={c.studentId} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-3 text-center font-medium text-slate-400">
                    {idx + 1}
                  </td>

                  <td className="py-3 px-3">
                    <p className="font-bold text-slate-800">{c.studentName}</p>
                    <span className="text-[10px] text-slate-400">Cập nhật: {c.lastUpdated}</span>
                  </td>

                  {/* 1. Ý thức học tập */}
                  <td className="py-2 px-1 text-center">
                    <select
                      value={c.studyAttitude}
                      onChange={(e) => handleGradeChange(c.studentId, 'studyAttitude', e.target.value as EvaluationGrade)}
                      className={`text-[11px] font-semibold px-2 py-1 rounded-lg border border-slate-200 ${
                        c.studyAttitude === 'Tốt' ? 'text-emerald-700 bg-emerald-50' :
                        c.studyAttitude === 'Khá' ? 'text-blue-700 bg-blue-50' :
                        c.studyAttitude === 'Đạt' ? 'text-amber-700 bg-amber-50' : 'text-rose-700 bg-rose-50'
                      }`}
                    >
                      {EVALUATION_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </td>

                  {/* 2. Chấp hành nội quy */}
                  <td className="py-2 px-1 text-center">
                    <select
                      value={c.ruleCompliance}
                      onChange={(e) => handleGradeChange(c.studentId, 'ruleCompliance', e.target.value as EvaluationGrade)}
                      className={`text-[11px] font-semibold px-2 py-1 rounded-lg border border-slate-200 ${
                        c.ruleCompliance === 'Tốt' ? 'text-emerald-700 bg-emerald-50' :
                        c.ruleCompliance === 'Khá' ? 'text-blue-700 bg-blue-50' :
                        c.ruleCompliance === 'Đạt' ? 'text-amber-700 bg-amber-50' : 'text-rose-700 bg-rose-50'
                      }`}
                    >
                      {EVALUATION_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </td>

                  {/* 3. Chuyên cần */}
                  <td className="py-2 px-1 text-center">
                    <select
                      value={c.attendanceRate}
                      onChange={(e) => handleGradeChange(c.studentId, 'attendanceRate', e.target.value as EvaluationGrade)}
                      className={`text-[11px] font-semibold px-2 py-1 rounded-lg border border-slate-200 ${
                        c.attendanceRate === 'Tốt' ? 'text-emerald-700 bg-emerald-50' :
                        c.attendanceRate === 'Khá' ? 'text-blue-700 bg-blue-50' :
                        c.attendanceRate === 'Đạt' ? 'text-amber-700 bg-amber-50' : 'text-rose-700 bg-rose-50'
                      }`}
                    >
                      {EVALUATION_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </td>

                  {/* 4. Vệ sinh */}
                  <td className="py-2 px-1 text-center">
                    <select
                      value={c.hygiene}
                      onChange={(e) => handleGradeChange(c.studentId, 'hygiene', e.target.value as EvaluationGrade)}
                      className={`text-[11px] font-semibold px-2 py-1 rounded-lg border border-slate-200 ${
                        c.hygiene === 'Tốt' ? 'text-emerald-700 bg-emerald-50' :
                        c.hygiene === 'Khá' ? 'text-blue-700 bg-blue-50' :
                        c.hygiene === 'Đạt' ? 'text-amber-700 bg-amber-50' : 'text-rose-700 bg-rose-50'
                      }`}
                    >
                      {EVALUATION_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </td>

                  {/* 5. Tinh thần tập thể */}
                  <td className="py-2 px-1 text-center">
                    <select
                      value={c.teamwork}
                      onChange={(e) => handleGradeChange(c.studentId, 'teamwork', e.target.value as EvaluationGrade)}
                      className={`text-[11px] font-semibold px-2 py-1 rounded-lg border border-slate-200 ${
                        c.teamwork === 'Tốt' ? 'text-emerald-700 bg-emerald-50' :
                        c.teamwork === 'Khá' ? 'text-blue-700 bg-blue-50' :
                        c.teamwork === 'Đạt' ? 'text-amber-700 bg-amber-50' : 'text-rose-700 bg-rose-50'
                      }`}
                    >
                      {EVALUATION_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </td>

                  {/* 6. Tham gia hoạt động */}
                  <td className="py-2 px-1 text-center">
                    <select
                      value={c.activityParticipation}
                      onChange={(e) => handleGradeChange(c.studentId, 'activityParticipation', e.target.value as EvaluationGrade)}
                      className={`text-[11px] font-semibold px-2 py-1 rounded-lg border border-slate-200 ${
                        c.activityParticipation === 'Tốt' ? 'text-emerald-700 bg-emerald-50' :
                        c.activityParticipation === 'Khá' ? 'text-blue-700 bg-blue-50' :
                        c.activityParticipation === 'Đạt' ? 'text-amber-700 bg-amber-50' : 'text-rose-700 bg-rose-50'
                      }`}
                    >
                      {EVALUATION_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </td>

                  {/* Overall Result Pill */}
                  <td className="py-3 px-3 text-center">
                    <span className={`inline-block px-3 py-1 rounded-full font-bold text-[11px] shadow-2xs ${
                      c.overallGrade === 'Tốt' ? 'bg-emerald-600 text-white' :
                      c.overallGrade === 'Khá' ? 'bg-blue-600 text-white' :
                      c.overallGrade === 'Đạt' ? 'bg-amber-500 text-white' : 'bg-rose-600 text-white'
                    }`}>
                      {c.overallGrade}
                    </span>
                  </td>

                  {/* Feedback Text Input */}
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      placeholder="Nhận xét ngắn gọn..."
                      value={c.teacherFeedback || ''}
                      onChange={(e) => handleFeedbackChange(c.studentId, e.target.value)}
                      className="w-full px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:bg-white focus:border-blue-500"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
