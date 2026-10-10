import { 
  Student, 
  AttendanceRecord, 
  ViolationRecord, 
  RewardRecord, 
  ConductEvaluation, 
  ParentContact, 
  PolicyDocumentItem, 
  ClassInfo,
  ChatMessage
} from '../types';

import { 
  INITIAL_CLASS_INFO, 
  INITIAL_STUDENTS, 
  INITIAL_ATTENDANCE, 
  INITIAL_VIOLATIONS, 
  INITIAL_REWARDS, 
  INITIAL_CONDUCT_EVALUATIONS, 
  INITIAL_PARENT_CONTACTS, 
  INITIAL_POLICY_DOCUMENTS,
  getDefaultTeamForStudent
} from '../mockData';

const STORAGE_KEYS = {
  CLASS_INFO: 'tro_ly_cn_11a3_class_info',
  STUDENTS: 'tro_ly_cn_11a3_students',
  ATTENDANCE: 'tro_ly_cn_11a3_attendance',
  VIOLATIONS: 'tro_ly_cn_11a3_violations',
  REWARDS: 'tro_ly_cn_11a3_rewards',
  CONDUCT: 'tro_ly_cn_11a3_conduct',
  PARENTS: 'tro_ly_cn_11a3_parents',
  POLICIES: 'tro_ly_cn_11a3_policies',
  AI_CHAT: 'tro_ly_cn_11a3_ai_chat',
  ACTIVE_TAB: 'tro_ly_cn_11a3_active_tab',
};

export interface StorageSaveResult {
  success: boolean;
  error?: string;
}

/**
 * Đọc dữ liệu từ localStorage.
 * Phân biệt rõ trường hợp chưa từng có khóa (saved === null -> trả về defaultValue)
 * với trường hợp đã lưu dữ liệu (kể cả mảng rỗng [] -> trả về đúng dữ liệu đã lưu).
 */
export const loadFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const saved = localStorage.getItem(key);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (parsed !== undefined && parsed !== null) {
        return parsed as T;
      }
    }
  } catch (e) {
    console.error(`Lỗi đọc dữ liệu khóa ${key} từ localStorage:`, e);
  }
  return defaultValue;
};

/**
 * Ghi dữ liệu bền vững vào localStorage và trả về trạng thái thành công/thất bại rõ ràng.
 */
export const saveToStorage = <T>(key: string, value: T): StorageSaveResult => {
  try {
    const serialized = JSON.stringify(value);
    localStorage.setItem(key, serialized);
    return { success: true };
  } catch (e: any) {
    const errorMsg = e instanceof Error ? e.message : String(e);
    console.error(`Lỗi lưu dữ liệu khóa ${key} vào localStorage:`, e);
    return {
      success: false,
      error: `Không thể lưu dữ liệu (${key}): ${errorMsg}`
    };
  }
};

/**
 * Khởi tạo trạng thái ứng dụng khi tải trang (Reload / Mở lại trình duyệt).
 * TUYỆT ĐỐI bảo toàn dữ liệu người dùng đã thêm/sửa/xóa trước đó.
 * Chỉ khởi tạo dữ liệu mẫu cho từng khóa khi khóa đó thực sự chưa tồn tại trong localStorage (null).
 */
export const getInitialAppState = () => {
  const hasSavedClassInfo = localStorage.getItem(STORAGE_KEYS.CLASS_INFO) !== null;
  const hasSavedStudents = localStorage.getItem(STORAGE_KEYS.STUDENTS) !== null;
  const hasSavedAttendance = localStorage.getItem(STORAGE_KEYS.ATTENDANCE) !== null;
  const hasSavedViolations = localStorage.getItem(STORAGE_KEYS.VIOLATIONS) !== null;
  const hasSavedRewards = localStorage.getItem(STORAGE_KEYS.REWARDS) !== null;
  const hasSavedConduct = localStorage.getItem(STORAGE_KEYS.CONDUCT) !== null;
  const hasSavedParents = localStorage.getItem(STORAGE_KEYS.PARENTS) !== null;
  const hasSavedPolicies = localStorage.getItem(STORAGE_KEYS.POLICIES) !== null;

  // 1. ClassInfo: đọc từ localStorage nếu đã có, ngược lại dùng INITIAL_CLASS_INFO
  const loadedClass = hasSavedClassInfo
    ? loadFromStorage<ClassInfo>(STORAGE_KEYS.CLASS_INFO, INITIAL_CLASS_INFO)
    : INITIAL_CLASS_INFO;

  // 2. Students: đọc từ localStorage nếu đã có (kể cả khi đã thêm/xóa làm sĩ số khác 38 hoặc mảng rỗng)
  const rawStudents = hasSavedStudents
    ? loadFromStorage<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS)
    : INITIAL_STUDENTS;

  // Chuẩn hóa nhẹ nhàng các trường phụ trợ mà KHÔNG làm mất hay ghi đè bất kỳ thông tin nào của học sinh
  const normalizedStudents = (Array.isArray(rawStudents) ? rawStudents : INITIAL_STUDENTS).map((s) => ({
    ...s,
    team: s.team || getDefaultTeamForStudent(s.id, s.role)
  }));

  // Đồng bộ lại sĩ số thực tế trên ClassInfo nhưng giữ nguyên tên lớp, GVCN và mọi chỉnh sửa khác
  const maleCount = normalizedStudents.filter((s) => s.gender === 'Nam').length;
  const femaleCount = normalizedStudents.filter((s) => s.gender === 'Nữ').length;
  const syncedClassInfo: ClassInfo = {
    ...INITIAL_CLASS_INFO,
    ...loadedClass,
    totalStudents: normalizedStudents.length,
    maleCount,
    femaleCount
  };

  // 3. Rewards: chỉ nạp INITIAL_REWARDS khi chưa từng lưu khóa REWARDS trong localStorage
  const rawRewards = hasSavedRewards
    ? loadFromStorage<RewardRecord[]>(STORAGE_KEYS.REWARDS, INITIAL_REWARDS)
    : INITIAL_REWARDS;

  const normalizedRewards = (Array.isArray(rawRewards) ? rawRewards : INITIAL_REWARDS).map((r) => {
    const st = normalizedStudents.find((s) => s.id === r.studentId);
    return {
      ...r,
      team: r.team || st?.team || getDefaultTeamForStudent(r.studentId, st?.role),
      points: r.points ?? 15,
      week: r.week ?? 4
    };
  });

  // 4. Các danh sách khác: bảo toàn tuyệt đối dữ liệu đã lưu
  const loadedAttendance = hasSavedAttendance
    ? loadFromStorage<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, INITIAL_ATTENDANCE)
    : INITIAL_ATTENDANCE;

  const loadedViolations = hasSavedViolations
    ? loadFromStorage<ViolationRecord[]>(STORAGE_KEYS.VIOLATIONS, INITIAL_VIOLATIONS)
    : INITIAL_VIOLATIONS;

  const loadedConduct = hasSavedConduct
    ? loadFromStorage<ConductEvaluation[]>(STORAGE_KEYS.CONDUCT, INITIAL_CONDUCT_EVALUATIONS)
    : INITIAL_CONDUCT_EVALUATIONS;

  const loadedParents = hasSavedParents
    ? loadFromStorage<ParentContact[]>(STORAGE_KEYS.PARENTS, INITIAL_PARENT_CONTACTS)
    : INITIAL_PARENT_CONTACTS;

  const loadedPolicies = hasSavedPolicies
    ? loadFromStorage<PolicyDocumentItem[]>(STORAGE_KEYS.POLICIES, INITIAL_POLICY_DOCUMENTS)
    : INITIAL_POLICY_DOCUMENTS;

  const loadedChat = loadFromStorage<ChatMessage[]>(STORAGE_KEYS.AI_CHAT, []);

  // Nếu lần đầu tiên mở ứng dụng chưa có khóa nào trong localStorage, ghi ngay trạng thái khởi tạo
  if (!hasSavedClassInfo) saveToStorage(STORAGE_KEYS.CLASS_INFO, syncedClassInfo);
  if (!hasSavedStudents) saveToStorage(STORAGE_KEYS.STUDENTS, normalizedStudents);
  if (!hasSavedAttendance) saveToStorage(STORAGE_KEYS.ATTENDANCE, loadedAttendance);
  if (!hasSavedViolations) saveToStorage(STORAGE_KEYS.VIOLATIONS, loadedViolations);
  if (!hasSavedRewards) saveToStorage(STORAGE_KEYS.REWARDS, normalizedRewards);
  if (!hasSavedConduct) saveToStorage(STORAGE_KEYS.CONDUCT, loadedConduct);
  if (!hasSavedParents) saveToStorage(STORAGE_KEYS.PARENTS, loadedParents);
  if (!hasSavedPolicies) saveToStorage(STORAGE_KEYS.POLICIES, loadedPolicies);

  return {
    classInfo: syncedClassInfo,
    students: normalizedStudents,
    attendance: Array.isArray(loadedAttendance) ? loadedAttendance : INITIAL_ATTENDANCE,
    violations: Array.isArray(loadedViolations) ? loadedViolations : INITIAL_VIOLATIONS,
    rewards: normalizedRewards,
    conduct: Array.isArray(loadedConduct) ? loadedConduct : INITIAL_CONDUCT_EVALUATIONS,
    parents: Array.isArray(loadedParents) ? loadedParents : INITIAL_PARENT_CONTACTS,
    policies: Array.isArray(loadedPolicies) ? loadedPolicies : INITIAL_POLICY_DOCUMENTS,
    chatMessages: Array.isArray(loadedChat) ? loadedChat : [],
  };
};

export const resetAllDataToDefault = () => {
  saveToStorage(STORAGE_KEYS.CLASS_INFO, INITIAL_CLASS_INFO);
  saveToStorage(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
  saveToStorage(STORAGE_KEYS.ATTENDANCE, INITIAL_ATTENDANCE);
  saveToStorage(STORAGE_KEYS.VIOLATIONS, INITIAL_VIOLATIONS);
  saveToStorage(STORAGE_KEYS.REWARDS, INITIAL_REWARDS);
  saveToStorage(STORAGE_KEYS.CONDUCT, INITIAL_CONDUCT_EVALUATIONS);
  saveToStorage(STORAGE_KEYS.PARENTS, INITIAL_PARENT_CONTACTS);
  saveToStorage(STORAGE_KEYS.POLICIES, INITIAL_POLICY_DOCUMENTS);
  localStorage.removeItem(STORAGE_KEYS.AI_CHAT);
  
  return {
    classInfo: INITIAL_CLASS_INFO,
    students: INITIAL_STUDENTS,
    attendance: INITIAL_ATTENDANCE,
    violations: INITIAL_VIOLATIONS,
    rewards: INITIAL_REWARDS,
    conduct: INITIAL_CONDUCT_EVALUATIONS,
    parents: INITIAL_PARENT_CONTACTS,
    policies: INITIAL_POLICY_DOCUMENTS,
    chatMessages: [],
  };
};

export { STORAGE_KEYS };

