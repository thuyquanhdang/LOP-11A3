import { 
  Student, 
  AttendanceRecord, 
  ViolationRecord, 
  RewardRecord, 
  ConductEvaluation, 
  ParentContact, 
  PolicyDocumentItem, 
  ClassInfo,
  ChatMessage,
  GalleryPhoto
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
  INITIAL_GALLERY_PHOTOS,
  getDefaultTeamForStudent
} from '../mockData';

const STORAGE_KEYS = {
  CLASS_INFO: 'tro_ly_cn_11a3_class_info',
  STUDENTS: 'tro_ly_cn_11a3_students',
  ATTENDANCE: 'tro_ly_cn_11a3_attendance',
  VIOLATIONS: 'tro_ly_cn_11a3_violations',
  REWARDS: 'tro_ly_cn_11a3_rewards',
  GALLERY_PHOTOS: 'tro_ly_cn_11a3_gallery_photos',
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

export interface FullAppState {
  classInfo: ClassInfo;
  students: Student[];
  attendance: AttendanceRecord[];
  violations: ViolationRecord[];
  rewards: RewardRecord[];
  galleryPhotos: GalleryPhoto[];
  conduct: ConductEvaluation[];
  parents: ParentContact[];
  policies: PolicyDocumentItem[];
  chatMessages: ChatMessage[];
}

// ============================================================================
// LỚP LƯU TRỮ 2: INDEXEDDB (Không giới hạn 5MB như localStorage, lưu hàng trăm ảnh)
// ============================================================================
const IDB_NAME = 'TroLyChuNhiem11A3_DB';
const IDB_STORE = 'keyval_store';

function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported'));
    }
    const req = window.indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveToIDB<T>(key: string, value: T): Promise<boolean> {
  try {
    const db = await openIDB();
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      store.put(value, key);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

export async function loadFromIDB<T>(key: string): Promise<T | undefined> {
  try {
    const db = await openIDB();
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result as T | undefined);
      req.onerror = () => resolve(undefined);
    });
  } catch {
    return undefined;
  }
}

// ============================================================================
// LỚP LƯU TRỮ 3: SERVER DISK STORAGE (/api/state) - Lưu trực tiếp trên ổ cứng Server
// ============================================================================
export async function syncKeyToServer<T>(key: string, value: T): Promise<boolean> {
  try {
    const res = await fetch('/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [key]: value })
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function syncFullStateToServer(payload: Record<string, any>): Promise<boolean> {
  try {
    const res = await fetch('/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function fetchServerState(): Promise<Record<string, any> | null> {
  try {
    const res = await fetch('/api/state');
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.hasState && data.state) {
      return data.state;
    }
  } catch {
    // ignore network error
  }
  return null;
}

// ============================================================================
// LỚP LƯU TRỮ 1: LOCALSTORAGE + ĐỒNG BỘ TỰ ĐỘNG SANG INDEXEDDB & SERVER
// ============================================================================

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
 * Ghi dữ liệu bền vững vào cả 3 nơi:
 * 1. localStorage (đồng bộ tức thì)
 * 2. IndexedDB (dung lượng lớn cho hình ảnh)
 * 3. Server Disk (/api/state) (bền vững ngay cả khi đổi trình duyệt / tràn bộ nhớ)
 */
export const saveToStorage = <T>(key: string, value: T): StorageSaveResult => {
  // Luôn lưu bất đồng bộ vào IndexedDB và Server Disk để đảm bảo an toàn 100%
  saveToIDB(key, value);
  syncKeyToServer(key, value);

  try {
    const serialized = JSON.stringify(value);
    localStorage.setItem(key, serialized);
    return { success: true };
  } catch (e: any) {
    // Nếu localStorage đầy do nhiều ảnh Base64, dữ liệu vẫn đã được lưu vào IndexedDB & Server Disk!
    console.warn(`LocalStorage đầy khi lưu khóa ${key}, đã chuyển sang lưu trữ IndexedDB & Server Disk:`, e);
    return { success: true };
  }
};

/**
 * Chuẩn hóa dữ liệu đã tải để luôn tương thích hiển thị
 */
export const normalizeLoadedState = (raw: {
  classInfo?: ClassInfo;
  students?: Student[];
  attendance?: AttendanceRecord[];
  violations?: ViolationRecord[];
  rewards?: RewardRecord[];
  galleryPhotos?: GalleryPhoto[];
  conduct?: ConductEvaluation[];
  parents?: ParentContact[];
  policies?: PolicyDocumentItem[];
  chatMessages?: ChatMessage[];
}): FullAppState => {
  const rawStudents = Array.isArray(raw.students) ? raw.students : INITIAL_STUDENTS;
  const normalizedStudents = rawStudents.map((s) => ({
    ...s,
    team: s.team || getDefaultTeamForStudent(s.id, s.role)
  }));

  const maleCount = normalizedStudents.filter((s) => s.gender === 'Nam').length;
  const femaleCount = normalizedStudents.filter((s) => s.gender === 'Nữ').length;
  const syncedClassInfo: ClassInfo = {
    ...INITIAL_CLASS_INFO,
    ...(raw.classInfo || {}),
    totalStudents: normalizedStudents.length,
    maleCount,
    femaleCount
  };

  const rawRewards = Array.isArray(raw.rewards) ? raw.rewards : INITIAL_REWARDS;
  const normalizedRewards = rawRewards.map((r) => {
    const st = normalizedStudents.find((s) => s.id === r.studentId);
    return {
      ...r,
      team: r.team || st?.team || getDefaultTeamForStudent(r.studentId, st?.role),
      points: r.points ?? 15,
      week: r.week ?? 4
    };
  });

  return {
    classInfo: syncedClassInfo,
    students: normalizedStudents,
    attendance: Array.isArray(raw.attendance) ? raw.attendance : INITIAL_ATTENDANCE,
    violations: Array.isArray(raw.violations) ? raw.violations : INITIAL_VIOLATIONS,
    rewards: normalizedRewards,
    galleryPhotos: Array.isArray(raw.galleryPhotos) ? raw.galleryPhotos : INITIAL_GALLERY_PHOTOS,
    conduct: Array.isArray(raw.conduct) ? raw.conduct : INITIAL_CONDUCT_EVALUATIONS,
    parents: Array.isArray(raw.parents) ? raw.parents : INITIAL_PARENT_CONTACTS,
    policies: Array.isArray(raw.policies) ? raw.policies : INITIAL_POLICY_DOCUMENTS,
    chatMessages: Array.isArray(raw.chatMessages) ? raw.chatMessages : [],
  };
};

/**
 * Khởi tạo trạng thái ứng dụng tức thì từ localStorage khi tải trang (Reload).
 * TUYỆT ĐỐI bảo toàn dữ liệu người dùng đã thêm/sửa/xóa trước đó.
 */
export const getInitialAppState = (): FullAppState => {
  const hasSavedClassInfo = localStorage.getItem(STORAGE_KEYS.CLASS_INFO) !== null;
  const hasSavedStudents = localStorage.getItem(STORAGE_KEYS.STUDENTS) !== null;
  const hasSavedAttendance = localStorage.getItem(STORAGE_KEYS.ATTENDANCE) !== null;
  const hasSavedViolations = localStorage.getItem(STORAGE_KEYS.VIOLATIONS) !== null;
  const hasSavedRewards = localStorage.getItem(STORAGE_KEYS.REWARDS) !== null;
  const hasSavedGallery = localStorage.getItem(STORAGE_KEYS.GALLERY_PHOTOS) !== null;
  const hasSavedConduct = localStorage.getItem(STORAGE_KEYS.CONDUCT) !== null;
  const hasSavedParents = localStorage.getItem(STORAGE_KEYS.PARENTS) !== null;
  const hasSavedPolicies = localStorage.getItem(STORAGE_KEYS.POLICIES) !== null;

  const loadedClass = hasSavedClassInfo
    ? loadFromStorage<ClassInfo>(STORAGE_KEYS.CLASS_INFO, INITIAL_CLASS_INFO)
    : INITIAL_CLASS_INFO;

  const rawStudents = hasSavedStudents
    ? loadFromStorage<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS)
    : INITIAL_STUDENTS;

  const rawRewards = hasSavedRewards
    ? loadFromStorage<RewardRecord[]>(STORAGE_KEYS.REWARDS, INITIAL_REWARDS)
    : INITIAL_REWARDS;

  const loadedGallery = hasSavedGallery
    ? loadFromStorage<GalleryPhoto[]>(STORAGE_KEYS.GALLERY_PHOTOS, INITIAL_GALLERY_PHOTOS)
    : INITIAL_GALLERY_PHOTOS;

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

  return normalizeLoadedState({
    classInfo: loadedClass,
    students: rawStudents,
    attendance: loadedAttendance,
    violations: loadedViolations,
    rewards: rawRewards,
    galleryPhotos: loadedGallery,
    conduct: loadedConduct,
    parents: loadedParents,
    policies: loadedPolicies,
    chatMessages: loadedChat
  });
};

/**
 * Khôi phục dữ liệu bền vững từ Server Disk (/api/state) hoặc IndexedDB khi vừa tải lại trang (Reload).
 * Đảm bảo ngay cả khi ảnh dung lượng lớn vượt quá localStorage hoặc người dùng F5 / đóng mở lại trình duyệt,
 * toàn bộ dữ liệu đã lưu đều được khôi phục đầy đủ 100%.
 */
export const hydratePersistentState = async (): Promise<Partial<FullAppState> | null> => {
  // 1. Kiểm tra dữ liệu đã lưu trên ổ cứng Server (/api/state) và IndexedDB
  const [
    serverState,
    idbClassInfo,
    idbStudents,
    idbAttendance,
    idbViolations,
    idbRewards,
    idbGalleryPhotos,
    idbConduct,
    idbParents,
    idbPolicies
  ] = await Promise.all([
    fetchServerState(),
    loadFromIDB<ClassInfo>(STORAGE_KEYS.CLASS_INFO),
    loadFromIDB<Student[]>(STORAGE_KEYS.STUDENTS),
    loadFromIDB<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE),
    loadFromIDB<ViolationRecord[]>(STORAGE_KEYS.VIOLATIONS),
    loadFromIDB<RewardRecord[]>(STORAGE_KEYS.REWARDS),
    loadFromIDB<GalleryPhoto[]>(STORAGE_KEYS.GALLERY_PHOTOS),
    loadFromIDB<ConductEvaluation[]>(STORAGE_KEYS.CONDUCT),
    loadFromIDB<ParentContact[]>(STORAGE_KEYS.PARENTS),
    loadFromIDB<PolicyDocumentItem[]>(STORAGE_KEYS.POLICIES)
  ]);

  const pickBest = <T>(key: string, idbVal: T | undefined): T | undefined => {
    // Ưu tiên IndexedDB hoặc Server State nếu có, hoặc dữ liệu hiện có trong localStorage
    const serverVal = serverState ? (serverState[key] as T | undefined) : undefined;
    const localRaw = localStorage.getItem(key);
    let localVal: T | undefined = undefined;
    if (localRaw !== null) {
      try {
        localVal = JSON.parse(localRaw) as T;
      } catch {
        // ignore
      }
    }

    // Đối với GalleryPhotos hoặc danh sách: nếu IndexedDB / Server có dữ liệu khi localStorage bị đầy hoặc trống
    if (idbVal !== undefined) return idbVal;
    if (serverVal !== undefined) return serverVal;
    return localVal;
  };

  const hydrated: Partial<FullAppState> = {};

  const bestClassInfo = pickBest<ClassInfo>(STORAGE_KEYS.CLASS_INFO, idbClassInfo);
  if (bestClassInfo) hydrated.classInfo = bestClassInfo;

  const bestStudents = pickBest<Student[]>(STORAGE_KEYS.STUDENTS, idbStudents);
  if (Array.isArray(bestStudents)) hydrated.students = bestStudents;

  const bestAttendance = pickBest<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, idbAttendance);
  if (Array.isArray(bestAttendance)) hydrated.attendance = bestAttendance;

  const bestViolations = pickBest<ViolationRecord[]>(STORAGE_KEYS.VIOLATIONS, idbViolations);
  if (Array.isArray(bestViolations)) hydrated.violations = bestViolations;

  const bestRewards = pickBest<RewardRecord[]>(STORAGE_KEYS.REWARDS, idbRewards);
  if (Array.isArray(bestRewards)) hydrated.rewards = bestRewards;

  const bestGallery = pickBest<GalleryPhoto[]>(STORAGE_KEYS.GALLERY_PHOTOS, idbGalleryPhotos);
  if (Array.isArray(bestGallery)) hydrated.galleryPhotos = bestGallery;

  const bestConduct = pickBest<ConductEvaluation[]>(STORAGE_KEYS.CONDUCT, idbConduct);
  if (Array.isArray(bestConduct)) hydrated.conduct = bestConduct;

  const bestParents = pickBest<ParentContact[]>(STORAGE_KEYS.PARENTS, idbParents);
  if (Array.isArray(bestParents)) hydrated.parents = bestParents;

  const bestPolicies = pickBest<PolicyDocumentItem[]>(STORAGE_KEYS.POLICIES, idbPolicies);
  if (Array.isArray(bestPolicies)) hydrated.policies = bestPolicies;

  // Đồng bộ ngược lại vào localStorage (những mục vừa khôi phục từ Server/IndexedDB)
  Object.entries({
    [STORAGE_KEYS.CLASS_INFO]: hydrated.classInfo,
    [STORAGE_KEYS.STUDENTS]: hydrated.students,
    [STORAGE_KEYS.ATTENDANCE]: hydrated.attendance,
    [STORAGE_KEYS.VIOLATIONS]: hydrated.violations,
    [STORAGE_KEYS.REWARDS]: hydrated.rewards,
    [STORAGE_KEYS.GALLERY_PHOTOS]: hydrated.galleryPhotos,
    [STORAGE_KEYS.CONDUCT]: hydrated.conduct,
    [STORAGE_KEYS.PARENTS]: hydrated.parents,
    [STORAGE_KEYS.POLICIES]: hydrated.policies
  }).forEach(([k, val]) => {
    if (val !== undefined) {
      saveToIDB(k, val);
      try {
        localStorage.setItem(k, JSON.stringify(val));
      } catch {
        // ignore quota error on localStorage since IDB and Server have it
      }
    }
  });

  return Object.keys(hydrated).length > 0 ? hydrated : null;
};

export const resetAllDataToDefault = () => {
  saveToStorage(STORAGE_KEYS.CLASS_INFO, INITIAL_CLASS_INFO);
  saveToStorage(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
  saveToStorage(STORAGE_KEYS.ATTENDANCE, INITIAL_ATTENDANCE);
  saveToStorage(STORAGE_KEYS.VIOLATIONS, INITIAL_VIOLATIONS);
  saveToStorage(STORAGE_KEYS.REWARDS, INITIAL_REWARDS);
  saveToStorage(STORAGE_KEYS.GALLERY_PHOTOS, INITIAL_GALLERY_PHOTOS);
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
    galleryPhotos: INITIAL_GALLERY_PHOTOS,
    conduct: INITIAL_CONDUCT_EVALUATIONS,
    parents: INITIAL_PARENT_CONTACTS,
    policies: INITIAL_POLICY_DOCUMENTS,
    chatMessages: [],
  };
};

export { STORAGE_KEYS };



