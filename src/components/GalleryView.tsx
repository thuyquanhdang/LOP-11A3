import React, { useState, useMemo, useRef } from 'react';
import {
  Camera,
  Image as ImageIcon,
  Upload,
  Plus,
  Search,
  Trash2,
  Edit3,
  X,
  Heart,
  Star,
  Users,
  Calendar,
  Download,
  Save,
  CheckCircle2,
  Eye,
  Filter,
  Sparkles,
  FolderHeart
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  Student,
  GalleryPhoto,
  GalleryTarget,
  GalleryCategory,
  TeamGroup,
  ClassInfo
} from '../types';
import { INITIAL_CLASS_INFO, getDefaultTeamForStudent } from '../mockData';

interface GalleryViewProps {
  students: Student[];
  photos: GalleryPhoto[];
  classInfo?: ClassInfo;
  onAddPhoto: (photo: GalleryPhoto) => void;
  onUpdatePhoto: (photo: GalleryPhoto) => void;
  onDeletePhoto: (photoId: string) => void;
  initialTargetFilter?: 'all' | GalleryTarget;
}

const TARGET_OPTIONS: GalleryTarget[] = ['Tập thể lớp', 'Tổ 1', 'Tổ 2', 'Tổ 3', 'Tổ 4'];
const TEAMS: TeamGroup[] = ['Tổ 1', 'Tổ 2', 'Tổ 3', 'Tổ 4'];

const CATEGORIES: GalleryCategory[] = [
  'Học tập & Giờ học tốt',
  'Lao động & Trực nhật',
  'Văn nghệ & Thể thao',
  'Sinh hoạt lớp & Đoàn - Đội',
  'Sinh hoạt nội trú',
  'Ngoại khóa & Dã ngoại',
  'Kỉ niệm đáng nhớ'
];

const TARGET_STYLES: Record<GalleryTarget, {
  badge: string;
  cardBorder: string;
  headerGradient: string;
  buttonBg: string;
  lightBg: string;
}> = {
  'Tập thể lớp': {
    badge: 'bg-amber-100 text-amber-800 border-amber-300',
    cardBorder: 'border-amber-200 hover:border-amber-400',
    headerGradient: 'from-amber-500 to-orange-600',
    buttonBg: 'bg-amber-600 hover:bg-amber-700 text-white',
    lightBg: 'bg-amber-50/70'
  },
  'Tổ 1': {
    badge: 'bg-blue-100 text-blue-700 border-blue-200',
    cardBorder: 'border-blue-200 hover:border-blue-400',
    headerGradient: 'from-blue-600 to-indigo-600',
    buttonBg: 'bg-blue-600 hover:bg-blue-700 text-white',
    lightBg: 'bg-blue-50/70'
  },
  'Tổ 2': {
    badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    cardBorder: 'border-emerald-200 hover:border-emerald-400',
    headerGradient: 'from-emerald-600 to-teal-600',
    buttonBg: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    lightBg: 'bg-emerald-50/70'
  },
  'Tổ 3': {
    badge: 'bg-rose-100 text-rose-700 border-rose-200',
    cardBorder: 'border-rose-200 hover:border-rose-400',
    headerGradient: 'from-rose-600 to-pink-600',
    buttonBg: 'bg-rose-600 hover:bg-rose-700 text-white',
    lightBg: 'bg-rose-50/70'
  },
  'Tổ 4': {
    badge: 'bg-purple-100 text-purple-700 border-purple-200',
    cardBorder: 'border-purple-200 hover:border-purple-400',
    headerGradient: 'from-purple-600 to-violet-600',
    buttonBg: 'bg-purple-600 hover:bg-purple-700 text-white',
    lightBg: 'bg-purple-50/70'
  }
};

/**
 * Nén ảnh tải lên bằng HTML5 Canvas để đảm bảo kích thước nhỏ gọn (~100KB-220KB),
 * giúp lưu trữ bền vững rất nhiều ảnh trong localStorage mà không bao giờ bị tràn bộ nhớ.
 */
const compressImageFile = (file: File, maxWidth = 1100, quality = 0.78): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      img.onerror = () => reject(new Error('Không thể đọc định dạng ảnh này.'));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Lỗi khi đọc tệp hình ảnh.'));
    reader.readAsDataURL(file);
  });
};

export const GalleryView: React.FC<GalleryViewProps> = ({
  students,
  photos,
  classInfo = INITIAL_CLASS_INFO,
  onAddPhoto,
  onUpdatePhoto,
  onDeletePhoto,
  initialTargetFilter = 'all'
}) => {
  const [selectedTarget, setSelectedTarget] = useState<'all' | GalleryTarget>(initialTargetFilter);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<GalleryPhoto | null>(null);
  const [lightboxPhoto, setLightboxPhoto] = useState<GalleryPhoto | null>(null);
  const [photoToDelete, setPhotoToDelete] = useState<GalleryPhoto | null>(null);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const getStudentTeam = (student: Student): TeamGroup => {
    return student.team || getDefaultTeamForStudent(student.id, student.role);
  };

  const getTargetLeaderLabel = (target: GalleryTarget): string => {
    if (target === 'Tập thể lớp') {
      return `GVCN: ${classInfo.homeroomTeacher} • Lớp trưởng: ${classInfo.classMonitor}`;
    }
    if (target === 'Tổ 1') return `Tổ trưởng: ${classInfo.leaderTeam1 || 'Nguyễn Lương Nhật Vỹ'}`;
    if (target === 'Tổ 2') return `Tổ trưởng: ${classInfo.leaderTeam2 || 'La O Thị Kim Thủy'}`;
    if (target === 'Tổ 3') return `Tổ trưởng: ${classInfo.leaderTeam3 || 'Đinh Thị Hường'}`;
    return `Tổ trưởng: ${classInfo.leaderTeam4 || 'Nguyễn Vũ Thị Phương Trâm'}`;
  };

  const getDefaultUploaderForTarget = (target: GalleryTarget): string => {
    if (target === 'Tập thể lớp') return `GVCN ${classInfo.homeroomTeacher}`;
    if (target === 'Tổ 1') return `${classInfo.leaderTeam1 || 'Nguyễn Lương Nhật Vỹ'} (Tổ trưởng Tổ 1)`;
    if (target === 'Tổ 2') return `${classInfo.leaderTeam2 || 'La O Thị Kim Thủy'} (Tổ trưởng Tổ 2)`;
    if (target === 'Tổ 3') return `${classInfo.leaderTeam3 || 'Đinh Thị Hường'} (Tổ trưởng Tổ 3)`;
    return `${classInfo.leaderTeam4 || 'Nguyễn Vũ Thị Phương Trâm'} (Tổ trưởng Tổ 4)`;
  };

  const [formData, setFormData] = useState<{
    target: GalleryTarget;
    title: string;
    description: string;
    imageUrl: string;
    category: GalleryCategory;
    date: string;
    week: number;
    uploadedBy: string;
    studentNamesText: string;
    isFeatured: boolean;
  }>({
    target: 'Tập thể lớp',
    title: '',
    description: '',
    imageUrl: '',
    category: 'Kỉ niệm đáng nhớ',
    date: new Date().toISOString().split('T')[0],
    week: 4,
    uploadedBy: `GVCN ${classInfo.homeroomTeacher}`,
    studentNamesText: '',
    isFeatured: false
  });

  // Statistics for Class & 4 Teams
  const albumStats = useMemo(() => {
    return TARGET_OPTIONS.map((target) => {
      const targetPhotos = photos.filter((p) => p.target === target);
      const totalLikes = targetPhotos.reduce((sum, p) => sum + (p.likes || 0), 0);
      const memberCount =
        target === 'Tập thể lớp'
          ? students.length
          : students.filter((s) => getStudentTeam(s) === target).length;

      return {
        target,
        photoCount: targetPhotos.length,
        totalLikes,
        memberCount,
        leaderLabel: getTargetLeaderLabel(target),
        latestPhoto: targetPhotos[0] || null
      };
    });
  }, [photos, students, classInfo]);

  const filteredPhotos = useMemo(() => {
    return photos.filter((p) => {
      const matchTarget = selectedTarget === 'all' || p.target === selectedTarget;
      const matchCategory = selectedCategory === 'all' || p.category === selectedCategory;
      const q = searchTerm.trim().toLowerCase();
      const matchSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.uploadedBy.toLowerCase().includes(q) ||
        p.target.toLowerCase().includes(q) ||
        (p.studentNames || []).some((n) => n.toLowerCase().includes(q));

      return matchTarget && matchCategory && matchSearch;
    });
  }, [photos, selectedTarget, selectedCategory, searchTerm]);

  // Quick student suggestions for current target in modal
  const targetMemberSuggestions = useMemo(() => {
    if (formData.target === 'Tập thể lớp') {
      return students.slice(0, 12);
    }
    return students.filter((s) => getStudentTeam(s) === formData.target);
  }, [students, formData.target]);

  const handleOpenUploadModal = (defaultTarget?: GalleryTarget) => {
    const chosenTarget =
      defaultTarget || (selectedTarget !== 'all' ? selectedTarget : 'Tập thể lớp');
    setEditingPhoto(null);
    setFormData({
      target: chosenTarget,
      title: '',
      description: '',
      imageUrl: '',
      category: chosenTarget === 'Tập thể lớp' ? 'Kỉ niệm đáng nhớ' : 'Sinh hoạt lớp & Đoàn - Đội',
      date: new Date().toISOString().split('T')[0],
      week: 4,
      uploadedBy: getDefaultUploaderForTarget(chosenTarget),
      studentNamesText: '',
      isFeatured: false
    });
    setIsUploadModalOpen(true);
  };

  const handleOpenEditModal = (photo: GalleryPhoto) => {
    setEditingPhoto(photo);
    setFormData({
      target: photo.target,
      title: photo.title,
      description: photo.description || '',
      imageUrl: photo.imageUrl,
      category: photo.category,
      date: photo.date || new Date().toISOString().split('T')[0],
      week: photo.week || 4,
      uploadedBy: photo.uploadedBy || getDefaultUploaderForTarget(photo.target),
      studentNamesText: (photo.studentNames || []).join(', '),
      isFeatured: Boolean(photo.isFeatured)
    });
    setIsUploadModalOpen(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessingImage(true);
    try {
      const compressed = await compressImageFile(file);
      setFormData((prev) => ({
        ...prev,
        imageUrl: compressed,
        title: prev.title || file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleAddStudentTag = (fullName: string) => {
    const currentList = formData.studentNamesText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (!currentList.includes(fullName)) {
      const next = [...currentList, fullName].join(', ');
      setFormData({ ...formData, studentNamesText: next });
    }
  };

  const handleSavePhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.imageUrl.trim()) return;

    const studentNames = formData.studentNamesText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (editingPhoto) {
      const updated: GalleryPhoto = {
        ...editingPhoto,
        target: formData.target,
        title: formData.title.trim(),
        description: formData.description.trim(),
        imageUrl: formData.imageUrl,
        category: formData.category,
        date: formData.date,
        week: Number(formData.week) || 4,
        uploadedBy: formData.uploadedBy.trim() || getDefaultUploaderForTarget(formData.target),
        studentNames,
        isFeatured: formData.isFeatured
      };
      onUpdatePhoto(updated);
      setSaveToast(`Đã cập nhật hình ảnh kỉ niệm của ${formData.target}!`);
    } else {
      const newPhoto: GalleryPhoto = {
        id: `photo-${Date.now()}`,
        target: formData.target,
        title: formData.title.trim(),
        description: formData.description.trim(),
        imageUrl: formData.imageUrl,
        category: formData.category,
        date: formData.date,
        week: Number(formData.week) || 4,
        uploadedBy: formData.uploadedBy.trim() || getDefaultUploaderForTarget(formData.target),
        studentNames,
        likes: 1,
        isFeatured: formData.isFeatured
      };
      onAddPhoto(newPhoto);
      setSaveToast(`Đã tải lên và lưu trữ hình ảnh mới vào Album ${formData.target}!`);
      try {
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.65 }
        });
      } catch {
        // ignore
      }
    }

    setTimeout(() => setSaveToast(null), 3500);
    setIsUploadModalOpen(false);
    setEditingPhoto(null);
  };

  const handleToggleLike = (photo: GalleryPhoto, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated: GalleryPhoto = {
      ...photo,
      likes: (photo.likes || 0) + 1
    };
    onUpdatePhoto(updated);
    if (lightboxPhoto && lightboxPhoto.id === photo.id) {
      setLightboxPhoto(updated);
    }
  };

  const handleDownloadPhoto = (photo: GalleryPhoto, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const link = document.createElement('a');
    link.href = photo.imageUrl;
    const safeTitle = photo.title.replace(/[^a-zA-Z0-9-_]/g, '_').slice(0, 40);
    link.download = `Anh_Ki_Niem_${photo.target}_${safeTitle || photo.id}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-blue-900 to-violet-900 rounded-2xl p-5 sm:p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-300/30 text-amber-200 text-xs font-bold mb-2">
              <Camera className="w-3.5 h-3.5 text-amber-300" />
              THƯ VIỆN HÌNH ẢNH LỚP {classInfo.className} & KỈ NIỆM HOẠT ĐỘNG 4 TỔ
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight flex items-center gap-2">
              Album Kỉ Niệm Lớp Học & Hoạt Động Của Từng Tổ (Tổ 1 – Tổ 4)
            </h2>
            <p className="text-xs sm:text-sm text-blue-100/90 mt-1">
              GVCN: <span className="font-bold text-white">{classInfo.homeroomTeacher}</span> • Nơi mỗi tổ (Tổ 1, Tổ 2, Tổ 3, Tổ 4) và tập thể lớp 11A3 tải hình ảnh hoạt động, lao động, học tập, văn nghệ lên lưu trữ lâu dài.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => {
                setSaveToast('Đã lưu an toàn toàn bộ kho ảnh kỉ niệm lớp 11A3 và 4 tổ!');
                setTimeout(() => setSaveToast(null), 3000);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold transition shadow-md cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Lưu kho ảnh</span>
            </button>

            <button
              id="open-upload-photo-btn"
              onClick={() => handleOpenUploadModal()}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs sm:text-sm font-extrabold transition shadow-md cursor-pointer"
            >
              <Upload className="w-4 h-4 stroke-[2.5]" />
              <span>+ Tải hình ảnh kỉ niệm lên</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5 Album Cards: Tập thể lớp + Tổ 1, Tổ 2, Tổ 3, Tổ 4 with direct Upload button for each Team */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {albumStats.map((album) => {
          const style = TARGET_STYLES[album.target];
          const isSelected = selectedTarget === album.target;
          return (
            <div
              key={album.target}
              onClick={() => setSelectedTarget(isSelected ? 'all' : album.target)}
              className={`bg-white rounded-2xl p-4 border-2 transition cursor-pointer shadow-xs hover:shadow-md flex flex-col justify-between ${
                isSelected ? 'border-indigo-600 ring-2 ring-indigo-500/20' : style.cardBorder
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1.5 mb-2.5">
                  <span className={`px-2.5 py-1 rounded-xl text-xs font-extrabold border ${style.badge}`}>
                    {album.target === 'Tập thể lớp' ? `Lớp ${classInfo.className}` : album.target}
                  </span>
                  <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg flex items-center gap-1">
                    <ImageIcon className="w-3 h-3 text-indigo-600" />
                    {album.photoCount} ảnh
                  </span>
                </div>

                <p className="text-xs font-bold text-slate-800 line-clamp-1">
                  {album.target === 'Tập thể lớp' ? 'Album Chung Tập Thể Lớp' : `Album Kỉ Niệm ${album.target}`}
                </p>
                <p className="text-[11px] text-slate-500 truncate mt-0.5" title={album.leaderLabel}>
                  {album.leaderLabel}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>{album.memberCount} thành viên</span>
                <span className="flex items-center gap-1 text-rose-600 font-semibold">
                  <Heart className="w-3 h-3 fill-rose-500 text-rose-500" />
                  {album.totalLikes}
                </span>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenUploadModal(album.target);
                }}
                className={`mt-3 w-full py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer ${style.buttonBg}`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>
                  {album.target === 'Tập thể lớp'
                    ? 'Tải ảnh Lớp 11A3'
                    : `${album.target} tải ảnh lên`}
                </span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Filter Bar & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setSelectedTarget('all')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                selectedTarget === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Tất cả Album ({photos.length} ảnh)
            </button>

            {TARGET_OPTIONS.map((target) => {
              const count = photos.filter((p) => p.target === target).length;
              return (
                <button
                  key={target}
                  onClick={() => setSelectedTarget(target)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    selectedTarget === target
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span>{target}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      selectedTarget === target
                        ? 'bg-indigo-800 text-white'
                        : 'bg-white text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <span className="text-xs text-slate-500 font-medium">
            Hiển thị <strong className="text-slate-800">{filteredPhotos.length}</strong> hình ảnh kỉ niệm
          </span>
        </div>

        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm hình ảnh theo tiêu đề, hoạt động, tên học sinh, tổ hoặc người đăng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-hidden"
              >
                <option value="all">Tất cả chủ đề hoạt động</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Photo Grid */}
      {filteredPhotos.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-3">
          <FolderHeart className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="text-base font-bold text-slate-700">
            Chưa có hình ảnh nào trong mục đang chọn
          </p>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Hãy bấm nút bên dưới để Tổ trưởng, học sinh hoặc Giáo viên chủ nhiệm tải những bức ảnh kỉ niệm hoạt động của lớp và từng tổ lên hệ thống.
          </p>
          <button
            onClick={() =>
              handleOpenUploadModal(selectedTarget !== 'all' ? selectedTarget : 'Tập thể lớp')
            }
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-xs sm:text-sm font-bold hover:bg-indigo-700 transition cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>
              Tải hình ảnh đầu tiên cho{' '}
              {selectedTarget !== 'all' ? selectedTarget : `Lớp ${classInfo.className}`}
            </span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPhotos.map((photo) => {
            const targetStyle = TARGET_STYLES[photo.target] || TARGET_STYLES['Tập thể lớp'];
            return (
              <div
                key={photo.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-xl transition-all duration-200 overflow-hidden flex flex-col justify-between group"
              >
                <div>
                  {/* Image Container */}
                  <div
                    onClick={() => setLightboxPhoto(photo)}
                    className="relative h-56 w-full bg-slate-900 overflow-hidden cursor-pointer"
                  >
                    <img
                      src={photo.imageUrl}
                      alt={photo.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-slate-950/30 opacity-85" />

                    {/* Top Overlay Badges */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                      <span
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-extrabold border shadow-xs ${targetStyle.badge}`}
                      >
                        {photo.target}
                      </span>

                      <span className="px-2.5 py-1 rounded-full bg-slate-900/75 text-white backdrop-blur-xs text-[10px] font-semibold border border-white/15">
                        {photo.category}
                      </span>
                    </div>

                    {/* Bottom Overlay Quick Actions */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
                      <span className="text-[11px] font-medium text-slate-200 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-amber-400" />
                        {photo.date} {photo.week ? `• Tuần ${photo.week}` : ''}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => handleToggleLike(photo, e)}
                          className="px-2.5 py-1 rounded-lg bg-rose-500/90 hover:bg-rose-600 text-white text-xs font-bold flex items-center gap-1 shadow-xs transition cursor-pointer"
                          title="Thả tim yêu thích kỉ niệm này"
                        >
                          <Heart className="w-3.5 h-3.5 fill-white" />
                          <span>{photo.likes || 0}</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setLightboxPhoto(photo);
                          }}
                          className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white backdrop-blur-xs transition"
                          title="Phóng to xem ảnh"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 space-y-2.5">
                    <h3
                      onClick={() => setLightboxPhoto(photo)}
                      className="font-bold text-slate-900 text-sm sm:text-base line-clamp-2 hover:text-indigo-600 cursor-pointer leading-snug"
                    >
                      {photo.title}
                    </h3>

                    {photo.description && (
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {photo.description}
                      </p>
                    )}

                    {photo.studentNames && photo.studentNames.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {photo.studentNames.slice(0, 4).map((name, i) => (
                          <span
                            key={i}
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100"
                          >
                            {name}
                          </span>
                        ))}
                        {photo.studentNames.length > 4 && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                            +{photo.studentNames.length - 4} bạn khác
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer */}
                <div className="px-4 py-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="truncate max-w-[180px]" title={photo.uploadedBy}>
                    Đăng bởi: <strong className="text-slate-700">{photo.uploadedBy}</strong>
                  </span>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => handleDownloadPhoto(photo, e)}
                      className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                      title="Tải ảnh về máy"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(photo)}
                      className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                      title="Chỉnh sửa thông tin ảnh"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhotoToDelete(photo)}
                      className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      title="Xóa ảnh"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* UPLOAD / EDIT PHOTO MODAL */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 my-8 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <h3 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
                <Camera className="w-5 h-5 text-indigo-600" />
                {editingPhoto
                  ? 'Chỉnh sửa thông tin hình ảnh kỉ niệm'
                  : 'Tải Hình Ảnh Kỉ Niệm Lớp Học / Hoạt Động Tổ Lên'}
              </h3>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePhoto} className="mt-4 space-y-4 text-xs">
              {/* Target selector: Tập thể lớp / Tổ 1 / Tổ 2 / Tổ 3 / Tổ 4 */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Chọn Album lưu trữ (Tập thể lớp hoặc từng Tổ) <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {TARGET_OPTIONS.map((t) => {
                    const active = formData.target === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            target: t,
                            uploadedBy: editingPhoto
                              ? formData.uploadedBy
                              : getDefaultUploaderForTarget(t)
                          })
                        }
                        className={`py-2 px-3 rounded-xl font-extrabold text-xs border transition cursor-pointer ${
                          active
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Image Upload Dropzone */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Chọn ảnh từ máy tính / điện thoại <span className="text-rose-500">*</span>
                </label>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {formData.imageUrl ? (
                  <div className="relative rounded-2xl overflow-hidden border-2 border-indigo-200 bg-slate-900 h-56 group">
                    <img
                      src={formData.imageUrl}
                      alt="Xem trước"
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute bottom-3 right-3 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-xl bg-white/90 hover:bg-white text-slate-900 font-bold text-xs shadow-md flex items-center gap-1.5 cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Đổi hình ảnh khác</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-indigo-300 hover:border-indigo-500 bg-indigo-50/40 hover:bg-indigo-50/70 rounded-2xl p-6 text-center cursor-pointer transition space-y-2"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto">
                      <Upload className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-indigo-950">
                      {isProcessingImage
                        ? 'Đang xử lý & tối ưu hóa hình ảnh...'
                        : `Bấm vào đây để chọn hình ảnh của ${formData.target} tải lên`}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Hỗ trợ ảnh chụp từ điện thoại iPhone, Android, máy tính (JPG, PNG, WEBP). Tự động tối ưu dung lượng để lưu trữ bền vững.
                    </p>
                  </div>
                )}
              </div>

              {/* Title & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Tiêu đề bức ảnh / Kỉ niệm hoạt động <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={`VD: ${formData.target} tham gia văn nghệ chào mừng 20/11...`}
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Chủ đề hoạt động</label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value as GalleryCategory })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date, Week & UploadedBy */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ngày chụp / Hoạt động</label>
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
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map((w) => (
                      <option key={w} value={w}>
                        Tuần {w}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Người tải ảnh lên</label>
                  <input
                    type="text"
                    placeholder="Tên Tổ trưởng, học sinh hoặc GVCN..."
                    value={formData.uploadedBy}
                    onChange={(e) => setFormData({ ...formData, uploadedBy: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Câu chuyện / Mô tả kỉ niệm của hoạt động
                </label>
                <textarea
                  rows={2}
                  placeholder="Ghi lại cảm xúc, ý nghĩa hoặc kết quả đạt được trong hoạt động của tổ/lớp..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              {/* Tag Students in the Team */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Học sinh tham gia trong ảnh (Bấm chọn nhanh thành viên {formData.target})
                </label>
                <input
                  type="text"
                  placeholder="Nhập tên các bạn trong ảnh (cách nhau bởi dấu phẩy)..."
                  value={formData.studentNamesText}
                  onChange={(e) => setFormData({ ...formData, studentNamesText: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs mb-2"
                />
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-100">
                  {targetMemberSuggestions.map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => handleAddStudentTag(st.fullName)}
                      className="px-2 py-1 rounded-lg bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 text-[11px] font-medium transition cursor-pointer"
                    >
                      + {st.fullName}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={!formData.imageUrl || !formData.title.trim()}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingPhoto ? 'Lưu cập nhật ảnh' : `Lưu vào Album ${formData.target}`}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LIGHTBOX FULLSCREEN PREVIEW MODAL */}
      {lightboxPhoto && (
        <div
          onClick={() => setLightboxPhoto(null)}
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 text-white rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl border border-slate-800 flex flex-col lg:flex-row max-h-[90vh]"
          >
            {/* Image Viewer */}
            <div className="lg:w-2/3 bg-black flex items-center justify-center p-2 relative min-h-[280px] sm:min-h-[420px]">
              <img
                src={lightboxPhoto.imageUrl}
                alt={lightboxPhoto.title}
                className="max-h-[75vh] w-auto object-contain rounded-lg"
              />
            </div>

            {/* Details Sidebar */}
            <div className="lg:w-1/3 p-5 flex flex-col justify-between bg-slate-900 overflow-y-auto space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span
                    className={`px-3 py-1 rounded-xl text-xs font-extrabold border ${
                      TARGET_STYLES[lightboxPhoto.target]?.badge || ''
                    }`}
                  >
                    {lightboxPhoto.target}
                  </span>
                  <button
                    onClick={() => setLightboxPhoto(null)}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
                  {lightboxPhoto.title}
                </h3>

                <div className="text-xs text-slate-400 space-y-1">
                  <p>
                    Chủ đề: <span className="text-amber-300 font-semibold">{lightboxPhoto.category}</span>
                  </p>
                  <p>
                    Thời gian: <span className="text-slate-200">{lightboxPhoto.date}</span>{' '}
                    {lightboxPhoto.week ? `(Tuần ${lightboxPhoto.week})` : ''}
                  </p>
                  <p>
                    Người tải lên: <span className="text-emerald-300 font-semibold">{lightboxPhoto.uploadedBy}</span>
                  </p>
                </div>

                {lightboxPhoto.description && (
                  <p className="text-xs text-slate-200 bg-slate-800/90 p-3.5 rounded-xl border border-slate-700 leading-relaxed">
                    {lightboxPhoto.description}
                  </p>
                )}

                {lightboxPhoto.studentNames && lightboxPhoto.studentNames.length > 0 && (
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase mb-1.5">
                      Thành viên trong ảnh:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {lightboxPhoto.studentNames.map((name, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 text-xs font-semibold"
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleToggleLike(lightboxPhoto)}
                  className="flex-1 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Heart className="w-4 h-4 fill-white" />
                  <span>Yêu thích ({lightboxPhoto.likes || 0})</span>
                </button>
                <button
                  onClick={() => handleDownloadPhoto(lightboxPhoto)}
                  className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Tải về</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE PHOTO MODAL */}
      {photoToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Xác nhận xóa hình ảnh kỉ niệm?
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Bạn có chắc chắn muốn xóa bức ảnh <strong>"{photoToDelete.title}"</strong> khỏi Album{' '}
              <strong>{photoToDelete.target}</strong> không?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setPhotoToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  onDeletePhoto(photoToDelete.id);
                  setPhotoToDelete(null);
                  setSaveToast('Đã xóa hình ảnh khỏi thư viện!');
                  setTimeout(() => setSaveToast(null), 2500);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer"
              >
                Xóa ảnh
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
