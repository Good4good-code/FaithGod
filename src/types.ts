export interface DailyVerse {
  id: string;
  reference: string;
  verse: string;
  theme: string;
  date: string;
}

export interface PrayerItem {
  id: string;
  title: string;
  request: string;
  date: string;
  answered: boolean;
  answerNote?: string;
}

export interface FavoriteVerse {
  id: string;
  bookId: string;
  bookName: string;
  chapter: number;
  verse: number;
  text: string;
  dateAdded: string;
  notes?: string;
}

export interface ReadingPlanDay {
  day: number;
  title: string;
  references: string[];
  completed: boolean;
}

export interface ReadingPlan {
  id: string;
  title: string;
  description: string;
  durationDays: number;
  category: string;
  days: ReadingPlanDay[];
  currentDay: number;
  active: boolean;
  startDate?: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

export interface Highlight {
  id: string;
  userId: string;
  bookId: string;
  bookName: string;
  chapter: number;
  verse: number;
  color: 'yellow' | 'green' | 'blue' | 'pink';
  createdAt: string;
}
