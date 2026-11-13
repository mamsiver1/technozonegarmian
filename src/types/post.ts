import { Timestamp } from 'firebase/firestore';

export type PostCategory =
  | 'news'
  | 'article'
  | 'tutorial'
  | 'software'
  | 'media'
  | 'announcement';

export type PostStatus = 'published' | 'draft';

export interface PostRecord {
  id: string;
  title: string;
  summary?: string;
  content: string;
  category: PostCategory;
  status: PostStatus;
  featured: boolean;
  coverImage?: string;
  externalUrl?: string;
  codeSnippet?: string;
  fileMeta?: string;
  tags?: string[];
  authorUid: string;
  authorName: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export interface PostMediaItem {
  id: string;
  postId: string;
  imageUrl: string;
  caption?: string;
  orderIndex: number;
  status: PostStatus;
  authorUid: string;
  createdAt: Timestamp | null;
}

export interface CategoryInfo {
  id: PostCategory;
  labelKu: string;
  labelEn: string;
  descriptionKu: string;
  accentHex: string;
}

export const CATEGORIES: CategoryInfo[] = [
  {
    id: 'news',
    labelKu: 'هەواڵ',
    labelEn: 'Tech News',
    descriptionKu: 'نوێترین هەواڵە تەکنەلۆژی و جیهانییەکان',
    accentHex: '#38BDF8',
  },
  {
    id: 'article',
    labelKu: 'وتار و شیکاری',
    labelEn: 'Articles',
    descriptionKu: 'وتاری زانستی، تەکنیکی و شیکاری قووڵ',
    accentHex: '#60A5FA',
  },
  {
    id: 'tutorial',
    labelKu: 'فێرکاری',
    labelEn: 'Tutorials',
    descriptionKu: 'ڕێنمایی هەنگاو بە هەنگاو و کۆدسازی',
    accentHex: '#34D399',
  },
  {
    id: 'software',
    labelKu: 'بەرنامە و ئەپ',
    labelEn: 'Software',
    descriptionKu: 'بەرنامە، ئەپڵیکەیشن و ئامرازە بەسوودەکان',
    accentHex: '#FBBF24',
  },
  {
    id: 'media',
    labelKu: 'میدیا و وێنە',
    labelEn: 'Media',
    descriptionKu: 'وێنە، گەلەری و ڤیدیۆی تەکنەلۆژی',
    accentHex: '#F472B6',
  },
  {
    id: 'announcement',
    labelKu: 'ئاگاداری',
    labelEn: 'Announcements',
    descriptionKu: 'چالاکی، خول و ئاگادارییەکانی زۆنی گەرمیان',
    accentHex: '#FB923C',
  },
];

export const CATEGORY_MAP: Record<PostCategory, CategoryInfo> = CATEGORIES.reduce(
  (acc, item) => {
    acc[item.id] = item;
    return acc;
  },
  {} as Record<PostCategory, CategoryInfo>
);

export const SITE_ICON_PATH =
  '/assets/aistudio/Gemini_Generated_Image_ukck4mukck4mukck_b3491b76.jpg';
