/**
 * useFakeEdit Hook
 * 
 * Provides fake editing functionality with session-only persistence.
 * All changes are stored in React state and reset on page refresh.
 * Perfect for portfolio demonstration.
 */

import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';

export type EntityType = 'project' | 'user' | 'lead' | 'connection';

interface FakeEditState {
  projects: Record<string, any>;
  users: Record<string, any>;
  leads: Record<string, any>;
  connections: Record<string, any>;
}

const STORAGE_KEY = 'crm-demo-fake-edits';

/**
 * Load fake edits from sessionStorage
 */
function loadFakeEdits(): FakeEditState {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.warn('Failed to load fake edits from sessionStorage:', error);
  }
  
  return {
    projects: {},
    users: {},
    leads: {},
    connections: {},
  };
}

/**
 * Save fake edits to sessionStorage
 */
function saveFakeEdits(state: FakeEditState): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('Failed to save fake edits to sessionStorage:', error);
  }
}

export function useFakeEdit() {
  const [fakeEdits, setFakeEdits] = useState<FakeEditState>(loadFakeEdits);

  // Save to sessionStorage whenever state changes
  useEffect(() => {
    saveFakeEdits(fakeEdits);
  }, [fakeEdits]);

  /**
   * Apply fake edits to an entity
   */
  const applyFakeEdit = useCallback((
    type: EntityType,
    id: string,
    changes: any
  ) => {
    setFakeEdits(prev => {
      const typeEdits = prev[type];
      return {
        ...prev,
        [type]: {
          ...typeEdits,
          [id]: {
            ...typeEdits[id],
            ...changes,
            _edited: true,
            _editedAt: new Date().toISOString(),
          },
        },
      };
    });

    toast.success('Changes saved (demo mode - session only)', {
      description: 'Refresh page to reset to original data',
    });
  }, []);

  /**
   * Get fake edits for a specific entity
   */
  const getFakeEdits = useCallback((
    type: EntityType,
    id: string
  ): any => {
    return fakeEdits[type][id] || {};
  }, [fakeEdits]);

  /**
   * Check if entity has been edited
   */
  const hasBeenEdited = useCallback((
    type: EntityType,
    id: string
  ): boolean => {
    return Boolean(fakeEdits[type][id]?._edited);
  }, [fakeEdits]);

  /**
   * Merge entity with fake edits
   */
  const mergeWithFakeEdits = useCallback((
    type: EntityType,
    entity: any
  ): any => {
    const id = entity.id;
    const edits = fakeEdits[type][id];
    
    if (!edits) return entity;
    
    return {
      ...entity,
      ...edits,
    };
  }, [fakeEdits]);

  /**
   * Merge array of entities with fake edits
   */
  const mergeArrayWithFakeEdits = useCallback((
    type: EntityType,
    entities: any[]
  ): any[] => {
    return entities.map(entity => mergeWithFakeEdits(type, entity));
  }, [mergeWithFakeEdits]);

  /**
   * Reset all fake edits (back to original data)
   */
  const resetAllEdits = useCallback(() => {
    setFakeEdits({
      projects: {},
      users: {},
      leads: {},
      connections: {},
    });
    
    sessionStorage.removeItem(STORAGE_KEY);
    
    toast.success('Reset to original data', {
      description: 'All demo edits have been cleared',
    });
  }, []);

  /**
   * Reset edits for specific entity type
   */
  const resetTypeEdits = useCallback((type: EntityType) => {
    setFakeEdits(prev => ({
      ...prev,
      [type]: {},
    }));
    
    toast.success(`Reset ${type} edits`, {
      description: 'Restored to original data',
    });
  }, []);

  /**
   * Delete entity (fake deletion - just marks as deleted)
   */
  const fakeDelete = useCallback((
    type: EntityType,
    id: string
  ) => {
    setFakeEdits(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [id]: {
          ...prev[type][id],
          _deleted: true,
          _deletedAt: new Date().toISOString(),
        },
      },
    }));

    toast.success('Deleted (demo mode)', {
      description: 'Refresh page to restore',
    });
  }, []);

  /**
   * Check if entity is deleted
   */
  const isDeleted = useCallback((
    type: EntityType,
    id: string
  ): boolean => {
    return Boolean(fakeEdits[type][id]?._deleted);
  }, [fakeEdits]);

  /**
   * Filter out deleted entities from array
   */
  const filterDeleted = useCallback((
    type: EntityType,
    entities: any[]
  ): any[] => {
    return entities.filter(entity => !isDeleted(type, entity.id));
  }, [isDeleted]);

  /**
   * Get stats about fake edits
   */
  const getEditStats = useCallback(() => {
    const projects = Object.keys(fakeEdits.projects).length;
    const users = Object.keys(fakeEdits.users).length;
    const leads = Object.keys(fakeEdits.leads).length;
    const connections = Object.keys(fakeEdits.connections).length;
    
    const deletedProjects = Object.values(fakeEdits.projects).filter((e: any) => e._deleted).length;
    const deletedUsers = Object.values(fakeEdits.users).filter((e: any) => e._deleted).length;
    const deletedLeads = Object.values(fakeEdits.leads).filter((e: any) => e._deleted).length;
    const deletedConnections = Object.values(fakeEdits.connections).filter((e: any) => e._deleted).length;
    
    return {
      total: projects + users + leads + connections,
      byType: { projects, users, leads, connections },
      deleted: deletedProjects + deletedUsers + deletedLeads + deletedConnections,
      deletedByType: {
        projects: deletedProjects,
        users: deletedUsers,
        leads: deletedLeads,
        connections: deletedConnections,
      },
    };
  }, [fakeEdits]);

  return {
    // Edit operations
    applyFakeEdit,
    getFakeEdits,
    hasBeenEdited,
    mergeWithFakeEdits,
    mergeArrayWithFakeEdits,
    
    // Reset operations
    resetAllEdits,
    resetTypeEdits,
    
    // Delete operations
    fakeDelete,
    isDeleted,
    filterDeleted,
    
    // Stats
    getEditStats,
    
    // Raw state (for debugging)
    _fakeEdits: fakeEdits,
  };
}

export default useFakeEdit;

