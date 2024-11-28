import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TopicCategory {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

interface CategoryState {
  topics: TopicCategory[];
  addTopic: (name: string, color: string) => TopicCategory;
  removeTopic: (id: string) => void;
  updateTopic: (id: string, data: Partial<TopicCategory>) => void;
}

export const useCategoryStore = create<CategoryState>()(
  persist(
    (set) => ({
      topics: [
        { id: 'future-of-work', name: 'Future of Work', color: '#2563eb', createdAt: new Date().toISOString() },
        { id: 'productivity', name: 'Productivity', color: '#dc2626', createdAt: new Date().toISOString() },
        { id: 'ai', name: 'AI', color: '#059669', createdAt: new Date().toISOString() },
      ],

      addTopic: (name: string, color: string) => {
        const newTopic: TopicCategory = {
          id: Math.random().toString(36).substr(2, 9),
          name,
          color,
          createdAt: new Date().toISOString()
        };

        set((state) => ({
          topics: [...state.topics, newTopic]
        }));

        return newTopic;
      },

      removeTopic: (id: string) => {
        set((state) => ({
          topics: state.topics.filter(cat => cat.id !== id)
        }));
      },

      updateTopic: (id: string, data: Partial<TopicCategory>) => {
        set((state) => ({
          topics: state.topics.map(cat =>
            cat.id === id ? { ...cat, ...data } : cat
          )
        }));
      }
    }),
    {
      name: 'category-storage'
    }
  )
);