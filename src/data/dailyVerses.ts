import { DailyVerse } from '../types';

export const DAILY_VERSES: DailyVerse[] = [
  {
    id: '1',
    reference: 'Jeremiah 29:11',
    verse: 'For I know the thoughts that I think toward you, says the Lord, thoughts of peace and not of evil, to give you a future and a hope.',
    theme: 'Hope & Future',
    date: 'July 14'
  },
  {
    id: '2',
    reference: 'Philippians 4:13',
    verse: 'I can do all things through Christ who strengthens me.',
    theme: 'Strength & Courage',
    date: 'July 15'
  },
  {
    id: '3',
    reference: 'Proverbs 3:5-6',
    verse: 'Trust in the Lord with all your heart, and lean not on your own understanding; in all your ways acknowledge Him, and He shall direct your paths.',
    theme: 'Trust & Guidance',
    date: 'July 16'
  },
  {
    id: '4',
    reference: 'Isaiah 40:31',
    verse: 'But those who wait on the Lord shall renew their strength; they shall mount up with wings like eagles, they shall run and not be weary, they shall walk and not faint.',
    theme: 'Perseverance & Renewed Hope',
    date: 'July 17'
  },
  {
    id: '5',
    reference: 'Joshua 1:9',
    verse: 'Have I not commanded you? Be strong and of good courage; do not be afraid, nor be dismayed, for the Lord your God is with you wherever you go.',
    theme: 'Courage & Presence',
    date: 'July 18'
  },
  {
    id: '6',
    reference: 'Romans 8:28',
    verse: 'And we know that all things work together for good to those who love God, to those who are the called according to His purpose.',
    theme: 'Providence & Love',
    date: 'July 19'
  },
  {
    id: '7',
    reference: 'Matthew 6:33',
    verse: 'But seek first the kingdom of God and His righteousness, and all these things shall be added to you.',
    theme: 'Priority & Provision',
    date: 'July 20'
  }
];

export function getTodayVerse(): DailyVerse {
  const day = new Date().getDate();
  const index = day % DAILY_VERSES.length;
  return DAILY_VERSES[index];
}
