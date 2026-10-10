export type Gender = 'Nam' | 'Nữ' | 'Chưa cập nhật';

export type Ethnicity = 
  | 'Chăm'
  | 'Ba-na'
  | 'Kinh'
  | 'Tày' 
  | 'Thái' 
  | 'Mường' 
  | 'H\'Mông' 
  | 'Dao' 
  | 'Khmer' 
  | 'Nùng' 
  | 'Hoa' 
  | 'Gia Rai' 
  | 'Ê Đê' 
  | 'Ba Na' 
  | 'Pa Cô'
  | 'Khác';

export type FamilyBackground = 
  | 'Bình thường'
  | 'Hộ nghèo'
  | 'Hộ cận nghèo'
  | 'Mồ côi cha/mẹ'
  | 'Cha mẹ ly hôn'
  | 'Sống cùng ông bà'
  | 'Khó khăn đặc biệt';

export type PolicyType = 
  | 'Không'
  | 'Miễn giảm 100% học phí'
  | 'Miễn giảm 70% học phí'
  | 'Miễn giảm 50% học phí'
  | 'Hỗ trợ chi phí học tập (NĐ 81)'
  | 'Học sinh Dân tộc thiểu số khó khăn'
  | 'Con Thương binh / Liệt sĩ'
  | 'Học sinh Khuyết tật';

export type ClassRole = 
  | 'Học sinh'
  | 'Lớp trưởng'
  | 'Lớp phó học tập'
  | 'Lớp phó phong trào'
  | 'Lớp phó lao động'
  | 'Tổ trưởng tổ 1'
  | 'Tổ trưởng tổ 2'
  | 'Tổ trưởng tổ 3'
  | 'Tổ trưởng tổ 4'
  | 'Bí thư chi đoàn'
  | 'Phó Bí thư chi đoàn'
  | 'Thủ quỹ';

export type AcademicRating = 'Tốt' | 'Khá' | 'Đạt' | 'Chưa đạt' | 'Chưa cập nhật';
export type ConductRating = 'Tốt' | 'Khá' | 'Đạt' | 'Chưa đạt' | 'Chưa cập nhật';

export type TeamGroup = 'Tổ 1' | 'Tổ 2' | 'Tổ 3' | 'Tổ 4';

export interface SubjectScore {
  subjectName: string;
  tx1?: number; // Thường xuyên 1
  tx2?: number; // Thường xuyên 2
  tx3?: number; // Thường xuyên 3
  gk?: number;  // Giữa kỳ
  ck?: number;  // Cuối kỳ
  avg?: number; // Điểm trung bình môn
}

export interface Student {
  id: string;
  code: string; // Mã học sinh
  fullName: string;
  dob: string; // YYYY-MM-DD
  gender: Gender;
  ethnicity: Ethnicity;
  address: string;
  phone: string;
  fatherName: string;
  fatherPhone: string;
  fatherJob?: string;
  motherName: string;
  motherPhone: string;
  motherJob?: string;
  familyBackground: FamilyBackground;
  policyType: PolicyType;
  role?: ClassRole;
  team?: TeamGroup;
  academicRating?: AcademicRating;
  conductRating?: ConductRating;
  subjectScores?: SubjectScore[];
  weeklyEmulation?: { [week: number]: 'Tốt' | 'Khá' | 'Đạt' | 'Chưa đạt' };
  notes: string;
  needsAttention: boolean;
  attentionReason?: string;
  isProgressing: boolean;
  progressNote?: string;
  avatarColor?: string;
}

export type AttendanceStatus = 'present' | 'excused' | 'unexcused' | 'late';

export interface DailyAttendance {
  studentId: string;
  status: AttendanceStatus;
  note?: string;
}

export interface AttendanceRecord {
  date: string; // YYYY-MM-DD
  records: DailyAttendance[];
}

export type ViolationSeverity = 'Nhẹ' | 'Vừa' | 'Nghiêm trọng';

export interface ViolationRecord {
  id: string;
  studentId: string;
  studentName: string;
  date: string; // YYYY-MM-DD
  content: string;
  severity: ViolationSeverity;
  disciplinaryAction: string;
  notes?: string;
  resolved: boolean;
}

export type RewardCategory = 'Học tập' | 'Phong trào' | 'Kỷ luật' | 'Việc tốt' | 'Thể thao - Văn nghệ' | 'Hoạt động tổ';

export interface RewardRecord {
  id: string;
  studentId: string;
  studentName: string;
  team?: TeamGroup;
  date: string; // YYYY-MM-DD
  week?: number;
  activityName?: string;
  achievement: string;
  content: string;
  category: RewardCategory;
  points?: number; // Điểm cộng thi đua tổ (+5, +10, +15, +20...)
  notes?: string;
}

export type EvaluationGrade = 'Tốt' | 'Khá' | 'Đạt' | 'Cần cố gắng';

export interface ConductEvaluation {
  studentId: string;
  studentName: string;
  studyAttitude: EvaluationGrade;
  ruleCompliance: EvaluationGrade;
  attendanceRate: EvaluationGrade;
  hygiene: EvaluationGrade;
  teamwork: EvaluationGrade;
  activityParticipation: EvaluationGrade;
  overallGrade: 'Tốt' | 'Khá' | 'Đạt' | 'Chưa đạt';
  teacherFeedback: string;
  lastUpdated: string;
}

export type ParentRelationship = 'Bố' | 'Mẹ' | 'Người giám hộ' | 'Ông/Bà';
export type ContactResult = 'Đã thống nhất' | 'Gia đình cam kết phối hợp' | 'Chưa liên lạc được' | 'Hẹn gặp trực tiếp' | 'Đang theo dõi thêm';

export interface ParentContact {
  id: string;
  studentId: string;
  studentName: string;
  parentName: string;
  relationship: ParentRelationship;
  phone: string;
  date: string; // YYYY-MM-DD
  content: string;
  result: ContactResult;
  notes?: string;
}

export type SubmissionStatus = 'Đã hoàn thành' | 'Đang xử lý' | 'Chưa nộp';

export interface PolicyDocumentItem {
  id: string;
  studentId: string;
  studentName: string;
  policyType: PolicyType;
  requiredDocs: string;
  submitted: boolean;
  submissionDate?: string;
  status: SubmissionStatus;
  notes?: string;
}

export interface ClassInfo {
  className: string;
  grade: string;
  schoolName: string;
  schoolYear: string;
  homeroomTeacher: string;
  teacherPhone: string;
  teacherEmail: string;
  roomNumber: string;
  classMonitor: string;
  viceMonitor: string;
  leaderTeam1?: string;
  leaderTeam2?: string;
  leaderTeam3?: string;
  leaderTeam4?: string;
  totalStudents?: number;
  maleCount?: number;
  femaleCount?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  source?: string;
}

export type ActiveTab = 
  | 'dashboard'
  | 'students'
  | 'attendance'
  | 'violations'
  | 'rewards'
  | 'conduct'
  | 'parents'
  | 'policies'
  | 'reports'
  | 'ai-assistant'
  | 'settings';
