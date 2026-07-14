import { ReadingPlan } from '../types';

export const INITIAL_READING_PLANS: ReadingPlan[] = [
  {
    id: 'john-gospel',
    title: 'Gospel of John Walkthrough',
    description: 'Explore the life, miracles, and profound teachings of Jesus through the eyes of the disciple whom Jesus loved.',
    durationDays: 7,
    category: 'Gospels',
    currentDay: 1,
    active: false,
    days: [
      { day: 1, title: 'The Word Became Flesh', references: ['John 1'], completed: false },
      { day: 2, title: 'Born of the Spirit', references: ['John 3'], completed: false },
      { day: 3, title: 'The Living Water', references: ['John 4'], completed: false },
      { day: 4, title: 'The Good Shepherd', references: ['John 10'], completed: false },
      { day: 5, title: 'The Way, the Truth, and the Life', references: ['John 14'], completed: false },
      { day: 6, title: 'Abide in the True Vine', references: ['John 15'], completed: false },
      { day: 7, title: 'He Has Risen', references: ['John 20'], completed: false }
    ]
  },
  {
    id: 'strength-storms',
    title: 'Finding Strength in Storms',
    description: 'Comfort, peace, and spiritual fortitude during periods of anxiety, trial, or difficulty.',
    durationDays: 5,
    category: 'Encouragement',
    currentDay: 1,
    active: false,
    days: [
      { day: 1, title: 'The Shepherd\'s Presence', references: ['Psalms 23'], completed: false },
      { day: 2, title: 'Overcoming Anxiety', references: ['Matthew 6:25-34'], completed: false },
      { day: 3, title: 'Power for the Faint', references: ['Isaiah 40:27-31'], completed: false },
      { day: 4, title: 'Perfect Peace', references: ['Philippians 4:4-9'], completed: false },
      { day: 5, title: 'More Than Conquerors', references: ['Romans 8:31-39'], completed: false }
    ]
  },
  {
    id: 'daily-wisdom',
    title: 'Wisdom for Daily Walk',
    description: 'Practical biblical principles for decision-making, speech, relations, and guarding your heart.',
    durationDays: 5,
    category: 'Wisdom',
    currentDay: 1,
    active: false,
    days: [
      { day: 1, title: 'Trusting with All Your Heart', references: ['Proverbs 3'], completed: false },
      { day: 2, title: 'Asking for Wisdom in Trials', references: ['James 1'], completed: false },
      { day: 3, title: 'The Path of Wisdom', references: ['Proverbs 4'], completed: false },
      { day: 4, title: 'The Wise Builder', references: ['Matthew 7'], completed: false },
      { day: 5, title: 'A Season for Everything', references: ['Ecclesiastes 3'], completed: false }
    ]
  }
];
