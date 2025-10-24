import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: 'active' | 'archived' | 'completed';
  client_id: string;
  created_at: string;
  updated_at: string;
}

interface ProjectState {
  currentProject: Project | null;
  setCurrentProject: (project: Project | null) => void;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set) => ({
      currentProject: null,
      setCurrentProject: (project) => set({ currentProject: project }),
    }),
    {
      name: 'project-storage',
    }
  )
); 