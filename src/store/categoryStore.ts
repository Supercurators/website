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
        { id: 'tech-politique', name: 'Tech & Politique', color: '#7c3aed', createdAt: new Date().toISOString() },
        { id: 'tech-social', name: 'Tech & Social', color: '#db2777', createdAt: new Date().toISOString() },
        { id: 'tech-retail', name: 'Tech & Retail', color: '#ea580c', createdAt: new Date().toISOString() },
        { id: 'silicon-valley', name: 'Silicon Valley', color: '#ca8a04', createdAt: new Date().toISOString() },
        { id: 'ia-audio-video', name: 'IA Audio/Video', color: '#4f46e5', createdAt: new Date().toISOString() },
        { id: 'strategie-innovation', name: 'Stratégie & Innovation', color: '#0891b2', createdAt: new Date().toISOString() },
        { id: 'creator-economy', name: 'Creator Economy', color: '#be123c', createdAt: new Date().toISOString() },
        { id: 'marketing', name: 'Marketing', color: '#15803d', createdAt: new Date().toISOString() },
        { id: 'tourisme', name: 'Tourisme', color: '#86198f', createdAt: new Date().toISOString() },
        { id: 'product-management', name: 'Product Management', color: '#0f766e', createdAt: new Date().toISOString() },
        { id: 'growth', name: 'Growth', color: '#b45309', createdAt: new Date().toISOString() },
        { id: 'medias', name: 'Médias', color: '#9333ea', createdAt: new Date().toISOString() },
        { id: 'dystopie', name: 'Dystopie', color: '#e11d48', createdAt: new Date().toISOString() },
        { id: 'culturetech', name: 'CultureTech', color: '#0369a1', createdAt: new Date().toISOString() },
        { id: 'chine', name: 'Chine', color: '#b91c1c', createdAt: new Date().toISOString() },
        { id: 'us', name: 'US', color: '#1d4ed8', createdAt: new Date().toISOString() },
        { id: 'neuroscience', name: 'Neuroscience', color: '#4338ca', createdAt: new Date().toISOString() }
      ],

      addTopic: (name: string, color: string) => {
        const newTopic: TopicCategory = {
          id: name.toLowerCase().replace(/\s+/g, '-'),
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