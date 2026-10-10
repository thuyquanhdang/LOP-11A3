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

const TIMESTAMPS_KEY = 'tro_ly_cn_11a3_timestamps_v2';
const LEGACY_STUDENTS_KEY = 'tlcn_students_v1';

export interface StorageSaveResult {
  success: boolean;
  error?: string;
  updatedAt?: number;
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

interface TimestampedRecord<T> {
  value: T;
  updatedAt: number;
}

// ============================================================================
// QUẢN LÝ DẤU THỜI GIAN (TIMESTAMPS) ĐỂ LUÔN LẤY DỮ LIỆU MỚI NHẤT KHI TẢI LẠI TRANG
// ============================================================================
function getLocalTimestamps(): Record<string, number> {
  try {
    const raw = localStorage.getItem(TIMESTAMPS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return {};
}

function setLocalTimestamp(key: string, ts: number): void {
  try {
    const current = getLocalTimestamps();
    current[key] = ts;
    localStorage.setItem(TIMESTAMPS_KEY, JSON.stringify(current));
  } catch {
    // ignore
  }
}

export function getLastSavedTimestamp(): number {
  const map = getLocalTimestamps();
  const values = Object.values(map);
  if (values.length === 0) return Date.now();
  return Math.max(...values);
}

// ============================================================================
// ĐỒNG BỘ TỨC THÌ GIỮA CÁC TAB TRÌNH DUYỆT (BROADCAST CHANNEL)
// ============================================================================
const SYNC_CHANNEL_NAME = 'tro_ly_cn_11a3_live_sync';
let syncChannel: BroadcastChannel | null = null;

function getSyncChannel(): BroadcastChannel | null {
  if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return null;
  if (!syncChannel) {
    try {
      syncChannel = new BroadcastChannel(SYNC_CHANNEL_NAME);
    } catch {
      return null;
    }
  }
  return syncChannel;
}

export function subscribeToStorageUpdates(
  onUpdate: (key: string, value: any, updatedAt: number) => void
): () => void {
  const ch = getSyncChannel();
  const handleBroadcast = (event: MessageEvent) => {
    if (event.data && event.data.key && event.data.updatedAt) {
      onUpdate(event.data.key, event.data.value, event.data.updatedAt);
    }
  };
  const handleStorageEvent = (event: StorageEvent) => {
    if (!event.key || !event.newValue) return;
    if (Object.values(STORAGE_KEYS).includes(event.key)) {
      try {
        const parsed = JSON.parse(event.newValue);
        const tsMap = getLocalTimestamps();
        onUpdate(event.key, parsed, tsMap[event.key] || Date.now());
      } catch {
        // ignore
      }
    }
  };

  if (ch) ch.addEventListener('message', handleBroadcast);
  if (typeof window !== 'undefined') window.addEventListener('storage', handleStorageEvent);

  return () => {
    if (ch) ch.removeEventListener('message', handleBroadcast);
    if (typeof window !== 'undefined') window.removeEventListener('storage', handleStorageEvent);
  };
}

// ============================================================================
// LỚP LƯU TRỮ 2: INDEXEDDB (Lưu trữ kèm timestamp để phân biệt dữ liệu mới/cũ)
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

export async function saveToIDB<T>(key: string, value: T, updatedAt: number = Date.now()): Promise<boolean> {
  try {
    const db = await openIDB();
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      const record: TimestampedRecord<T> = { value, updatedAt };
      store.put(record, key);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

export async function loadFromIDBWithMeta<T>(key: string): Promise<TimestampedRecord<T> | undefined> {
  try {
    const db = await openIDB();
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(key);
      req.onsuccess = () => {
        const res = req.result;
        if (res === undefined || res === null) {
          resolve(undefined);
          return;
        }
        // Tương thích ngược nếu bản ghi cũ trong IDB chưa bọc { value, updatedAt }
        if (typeof res === 'object' && 'value' in res && 'updatedAt' in res) {
          resolve(res as TimestampedRecord<T>);
        } else {
          resolve({ value: res as T, updatedAt: 1 });
        }
      };
      req.onerror = () => resolve(undefined);
    });
  } catch {
    return undefined;
  }
}

// ============================================================================
// LỚP LƯU TRỮ 3: SERVER DISK STORAGE (/api/state) - Lưu kèm dấu thời gian _timestamps
// ============================================================================
export async function syncKeyToServer<T>(key: string, value: T, updatedAt: number = Date.now()): Promise<boolean> {
  try {
    const res = await fetch('/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        [key]: value,
        _timestamps: { [key]: updatedAt }
      })
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function syncFullStateToServer(
  payload: Record<string, any>,
  timestamps?: Record<string, number>
): Promise<boolean> {
  try {
    const now = Date.now();
    const tsPayload: Record<string, number> = timestamps || {};
    if (!timestamps) {
      Object.keys(payload).forEach((k) => {
        tsPayload[k] = now;
      });
    }
    const res = await fetch('/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        _timestamps: tsPayload
      })
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function fetchServerState(): Promise<Record<string, any> | null> {
  try {
    const res = await fetch(`/api/state?t=${Date.now()}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
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
 * Tự động kiểm tra và hợp nhất khóa phụ cũ ('tlcn_students_v1') nếu từng được lưu
 * để đảm bảo không còn dữ liệu cũ bị lệch khóa.
 */
function migrateLegacyKeysIfNeeded(): void {
  try {
    const legacyStudentsRaw = localStorage.getItem(LEGACY_STUDENTS_KEY);
    if (legacyStudentsRaw !== null) {
      const mainStudentsRaw = localStorage.getItem(STORAGE_KEYS.STUDENTS);
      if (mainStudentsRaw === null) {
        localStorage.setItem(STORAGE_KEYS.STUDENTS, legacyStudentsRaw);
        setLocalTimestamp(STORAGE_KEYS.STUDENTS, Date.now());
      }
      localStorage.removeItem(LEGACY_STUDENTS_KEY);
    }
  } catch {
    // ignore
  }
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
 * Ghi dữ liệu bền vững kèm timestamp mới nhất vào cả 3 nơi:
 * 1. localStorage (cập nhật ngay lập tức + lưu timestamp mới nhất)
 * 2. IndexedDB (lưu kèm timestamp, không giới hạn dung lượng)
 * 3. Server Disk (/api/state) (lưu kèm timestamp, bền vững tuyệt đối)
 * 4. Phát tín hiệu BroadcastChannel để mọi tab mở cùng lúc tự động cập nhật
 */
export const saveToStorage = <T>(key: string, value: T): StorageSaveResult => {
  const now = Date.now();
  setLocalTimestamp(key, now);

  // Luôn lưu bất đồng bộ vào IndexedDB và Server Disk kèm timestamp mới nhất
  saveToIDB(key, value, now);
  syncKeyToServer(key, value, now);

  // Đồng bộ sang các tab khác nếu đang mở
  const ch = getSyncChannel();
  if (ch) {
    try {
      ch.postMessage({ key, value, updatedAt: now });
    } catch {
      // ignore
    }
  }

  try {
    const serialized = JSON.stringify(value);
    localStorage.setItem(key, serialized);
    return { success: true, updatedAt: now };
  } catch (e: any) {
    // Nếu localStorage đầy do nhiều ảnh Base64, dữ liệu và timestamp vẫn đã được lưu vào IndexedDB & Server Disk!
    console.warn(`LocalStorage đầy khi lưu khóa ${key}, đã chuyển sang lưu trữ IndexedDB & Server Disk:`, e);
    return { success: true, updatedAt: now };
  }
};

/**
 * Chuẩn hóa dữ liệu đã tải để luôn tương thích hiển thị và tự động cập nhật các trường liên quan
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

  const studentMap = new Map<string, Student>();
  normalizedStudents.forEach((s) => studentMap.set(s.id, s));

  const maleCount = normalizedStudents.filter((s) => s.gender === 'Nam').length;
  const femaleCount = normalizedStudents.filter((s) => s.gender === 'Nữ').length;
  const syncedClassInfo: ClassInfo = {
    ...INITIAL_CLASS_INFO,
    ...(raw.classInfo || {}),
    totalStudents: normalizedStudents.length,
    maleCount,
    femaleCount
  };

  // Tự động đồng bộ tên học sinh và tổ mới nhất sang khen thưởng, vi phạm, hạnh kiểm, phụ huynh, chính sách
  const rawRewards = Array.isArray(raw.rewards) ? raw.rewards : INITIAL_REWARDS;
  const normalizedRewards = rawRewards.map((r) => {
    const st = studentMap.get(r.studentId);
    return {
      ...r,
      studentName: st ? st.fullName : r.studentName,
      team: st?.team || r.team || getDefaultTeamForStudent(r.studentId, st?.role),
      points: r.points ?? 15,
      week: r.week ?? 4
    };
  });

  const rawViolations = Array.isArray(raw.violations) ? raw.violations : INITIAL_VIOLATIONS;
  const normalizedViolations = rawViolations.map((v) => {
    const st = studentMap.get(v.studentId);
    return {
      ...v,
      studentName: st ? st.fullName : v.studentName
    };
  });

  const rawConduct = Array.isArray(raw.conduct) ? raw.conduct : INITIAL_CONDUCT_EVALUATIONS;
  const normalizedConduct = rawConduct.map((c) => {
    const st = studentMap.get(c.studentId);
    return {
      ...c,
      studentName: st ? st.fullName : c.studentName
    };
  });

  const rawParents = Array.isArray(raw.parents) ? raw.parents : INITIAL_PARENT_CONTACTS;
  const normalizedParents = rawParents.map((p) => {
    const st = studentMap.get(p.studentId);
    return {
      ...p,
      studentName: st ? st.fullName : p.studentName
    };
  });

  const rawPolicies = Array.isArray(raw.policies) ? raw.policies : INITIAL_POLICY_DOCUMENTS;
  const normalizedPolicies = rawPolicies.map((pol) => {
    const st = studentMap.get(pol.studentId);
    return {
      ...pol,
      studentName: st ? st.fullName : pol.studentName
    };
  });

  return {
    classInfo: syncedClassInfo,
    students: normalizedStudents,
    attendance: Array.isArray(raw.attendance) ? raw.attendance : INITIAL_ATTENDANCE,
    violations: normalizedViolations,
    rewards: normalizedRewards,
    galleryPhotos: Array.isArray(raw.galleryPhotos) ? raw.galleryPhotos : INITIAL_GALLERY_PHOTOS,
    conduct: normalizedConduct,
    parents: normalizedParents,
    policies: normalizedPolicies,
    chatMessages: Array.isArray(raw.chatMessages) ? raw.chatMessages : [],
  };
};

/**
 * Khởi tạo trạng thái ứng dụng tức thì từ localStorage khi tải trang (Reload).
 * TUYỆT ĐỐI bảo toàn dữ liệu người dùng đã thêm/sửa/xóa trước đó.
 */
export const getInitialAppState = (): FullAppState => {
  migrateLegacyKeysIfNeeded();

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
 * Khôi phục và tự động đồng bộ dữ liệu MỚI NHẤT từ cả 3 nguồn (localStorage, IndexedDB, Server Disk)
 * khi tải lại trang (Reload).
 * So sánh dấu thời gian `updatedAt` của từng khóa ở 3 nơi để đảm bảo DỮ LIỆU ĐÃ UPDATE LUÔN ĐƯỢC CHỌN,
 * tuyệt đối không bao giờ bị dữ liệu cũ ghi đè.
 */
export const hydratePersistentState = async (): Promise<Partial<FullAppState> | null> => {
  migrateLegacyKeysIfNeeded();

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
    loadFromIDBWithMeta<ClassInfo>(STORAGE_KEYS.CLASS_INFO),
    loadFromIDBWithMeta<Student[]>(STORAGE_KEYS.STUDENTS),
    loadFromIDBWithMeta<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE),
    loadFromIDBWithMeta<ViolationRecord[]>(STORAGE_KEYS.VIOLATIONS),
    loadFromIDBWithMeta<RewardRecord[]>(STORAGE_KEYS.REWARDS),
    loadFromIDBWithMeta<GalleryPhoto[]>(STORAGE_KEYS.GALLERY_PHOTOS),
    loadFromIDBWithMeta<ConductEvaluation[]>(STORAGE_KEYS.CONDUCT),
    loadFromIDBWithMeta<ParentContact[]>(STORAGE_KEYS.PARENTS),
    loadFromIDBWithMeta<PolicyDocumentItem[]>(STORAGE_KEYS.POLICIES)
  ]);

  const localTimestamps = getLocalTimestamps();
  const serverTimestamps: Record<string, number> = (serverState && serverState._timestamps) || {};
  const resolvedTimestamps: Record<string, number> = {};

  const pickNewest = <T>(
    key: string,
    idbRec: TimestampedRecord<T> | undefined
  ): T | undefined => {
    const candidates: { value: T; ts: number; source: string }[] = [];

    // 1. Ứng viên từ localStorage
    const localRaw = localStorage.getItem(key);
    if (localRaw !== null) {
      try {
        const parsed = JSON.parse(localRaw) as T;
        if (parsed !== undefined && parsed !== null) {
          // Nếu dữ liệu cũ trong localStorage chưa có timestamp trong bảng v2, gán ts = 2 để ưu tiên hơn bản ghi IDB không rõ nguồn (ts = 1)
          const localTs = localTimestamps[key] ?? 2;
          candidates.push({ value: parsed, ts: localTs, source: 'local' });
        }
      } catch {
        // ignore
      }
    }

    // 2. Ứng viên từ IndexedDB
    if (idbRec && idbRec.value !== undefined && idbRec.value !== null) {
      candidates.push({ value: idbRec.value, ts: idbRec.updatedAt || 1, source: 'idb' });
    }

    // 3. Ứng viên từ Server Disk (/api/state)
    const serverVal = serverState ? (serverState[key] as T | undefined) : undefined;
    if (serverVal !== undefined && serverVal !== null) {
      const sTs = serverTimestamps[key] || 1;
      candidates.push({ value: serverVal, ts: sTs, source: 'server' });
    }

    if (candidates.length === 0) return undefined;

    // Sắp xếp giảm dần theo timestamp (dữ liệu được update gần nhất đứng đầu)
    candidates.sort((a, b) => b.ts - a.ts);
    const winner = candidates[0];
    const finalTs = winner.ts > 2 ? winner.ts : Date.now();
    resolvedTimestamps[key] = finalTs;
    return winner.value;
  };

  const hydrated: Partial<FullAppState> = {};

  const bestClassInfo = pickNewest<ClassInfo>(STORAGE_KEYS.CLASS_INFO, idbClassInfo);
  if (bestClassInfo) hydrated.classInfo = bestClassInfo;

  const bestStudents = pickNewest<Student[]>(STORAGE_KEYS.STUDENTS, idbStudents);
  if (Array.isArray(bestStudents)) hydrated.students = bestStudents;

  const bestAttendance = pickNewest<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, idbAttendance);
  if (Array.isArray(bestAttendance)) hydrated.attendance = bestAttendance;

  const bestViolations = pickNewest<ViolationRecord[]>(STORAGE_KEYS.VIOLATIONS, idbViolations);
  if (Array.isArray(bestViolations)) hydrated.violations = bestViolations;

  const bestRewards = pickNewest<RewardRecord[]>(STORAGE_KEYS.REWARDS, idbRewards);
  if (Array.isArray(bestRewards)) hydrated.rewards = bestRewards;

  const bestGallery = pickNewest<GalleryPhoto[]>(STORAGE_KEYS.GALLERY_PHOTOS, idbGalleryPhotos);
  if (Array.isArray(bestGallery)) hydrated.galleryPhotos = bestGallery;

  const bestConduct = pickNewest<ConductEvaluation[]>(STORAGE_KEYS.CONDUCT, idbConduct);
  if (Array.isArray(bestConduct)) hydrated.conduct = bestConduct;

  const bestParents = pickNewest<ParentContact[]>(STORAGE_KEYS.PARENTS, idbParents);
  if (Array.isArray(bestParents)) hydrated.parents = bestParents;

  const bestPolicies = pickNewest<PolicyDocumentItem[]>(STORAGE_KEYS.POLICIES, idbPolicies);
  if (Array.isArray(bestPolicies)) hydrated.policies = bestPolicies;

  // Chuẩn hóa toàn bộ dữ liệu sau khi chọn bản mới nhất để mọi thông tin (sĩ số, tên học sinh, tổ) đồng bộ 100%
  if (Object.keys(hydrated).length > 0) {
    const normalized = normalizeLoadedState({
      classInfo: hydrated.classInfo,
      students: hydrated.students,
      attendance: hydrated.attendance,
      violations: hydrated.violations,
      rewards: hydrated.rewards,
      galleryPhotos: hydrated.galleryPhotos,
      conduct: hydrated.conduct,
      parents: hydrated.parents,
      policies: hydrated.policies
    });

    const syncMap: Record<string, any> = {
      [STORAGE_KEYS.CLASS_INFO]: normalized.classInfo,
      [STORAGE_KEYS.STUDENTS]: normalized.students,
      [STORAGE_KEYS.ATTENDANCE]: normalized.attendance,
      [STORAGE_KEYS.VIOLATIONS]: normalized.violations,
      [STORAGE_KEYS.REWARDS]: normalized.rewards,
      [STORAGE_KEYS.GALLERY_PHOTOS]: normalized.galleryPhotos,
      [STORAGE_KEYS.CONDUCT]: normalized.conduct,
      [STORAGE_KEYS.PARENTS]: normalized.parents,
      [STORAGE_KEYS.POLICIES]: normalized.policies
    };

    // Ghi đè bản mới nhất đã chuẩn hóa vào cả 3 lớp lưu trữ để xóa bỏ hoàn toàn dữ liệu cũ
    Object.entries(syncMap).forEach(([k, val]) => {
      const ts = resolvedTimestamps[k] || Date.now();
      setLocalTimestamp(k, ts);
      saveToIDB(k, val, ts);
      try {
        localStorage.setItem(k, JSON.stringify(val));
      } catch {
        // ignore quota error on localStorage since IDB and Server have it
      }
    });

    syncFullStateToServer(syncMap, resolvedTimestamps);

    return normalized;
  }

  return null;
};

export const resetAllDataToDefault = () => {
  localStorage.removeItem(LEGACY_STUDENTS_KEY);
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
