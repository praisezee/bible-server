export interface JWTPayload {
  userId: string;
  username: string;
  type: "access" | "refresh";
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface VerseData {
  number: number;
  text: string;
}

export interface ChapterData {
  number: number;
  verses: VerseData[];
}

export interface BookData {
  name: string;
  testament: string;
  chapters: ChapterData[];
}

export interface BibleData {
  version: string;
  books: BookData[];
}
