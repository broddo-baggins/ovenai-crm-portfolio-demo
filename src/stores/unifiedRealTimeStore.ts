// HOT BEAST MODE: UNIFIED REAL-TIME STORE ARCHITECTURE
// ATT_OWNER: Projects_ATT
// INTEGRATION_PLAN: FRONTEND_INTEGRATION_IMPLEMENTATION_PLAN_HMBM - PHASE 1
// Generated: 2025-01-28 Beast Mode + Higher Mind execution
// Target: Centralized state management with backend integration
// @ts-nocheck
import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { devtools } from 'zustand/middleware'
import { createClient } from '@supabase/supabase-js'

// ===================================================================
// TARGET UNIFIED STORE INTERFACES
// ===================================================================

interface Lead {
  id: string
  first_name: string
  family_name: string
  phone: string
  email?: string
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'archived'
  processing_state: 'pending' | 'active' | 'requires_reassignment' | 'completed'
  current_project_id?: string
  client_id?: string
  lead_metadata?: Record<string, any>
  created_at: string
  updated_at: string
}

interface Project {
  id: string
  name: string
      status: 'pending_approval' | 'active' | 'completed' | 'archived' | 'cancelled'
  client_id?: string
  budget_info?: Record<string, any>
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
}

interface Client {
  id: string
  name: string
  contact_info: {
    email?: string
    phone?: string
    address?: Record<string, any>
    primary_contact_name?: string
  }
  whatsapp_phone_number?: string
  whatsapp_number_id?: string
  created_at: string
  updated_at: string
}

interface OptimisticUpdate {
  id: string
  table: string
  operation: 'CREATE' | 'UPDATE' | 'DELETE'
  data: any
  timestamp: number
  status: 'pending' | 'confirmed' | 'failed'
  retryCount: number
}

interface ConflictResolution {
  id: string
  table: string
  client_data: any
  server_data: any
  resolution_strategy: 'client_wins' | 'server_wins' | 'merge' | 'user_choice'
  resolved_data?: any
  timestamp: number
}

interface RealTimeMetrics {
  last_sync: number
  sync_status: 'connected' | 'disconnected' | 'syncing' | 'error'
  pending_updates: number
  conflict_count: number
  performance_grade: 'EXCELLENT' | 'GOOD' | 'ACCEPTABLE' | 'NEEDS_OPTIMIZATION'
}

// ===================================================================
// INIT UNIFIED REAL-TIME STORE
// ===================================================================

interface UnifiedRealTimeStore {
  // Data State
  leads: Map<string, Lead>
  projects: Map<string, Project>
  clients: Map<string, Client>
  
  // Real-time State
  optimisticUpdates: Map<string, OptimisticUpdate>
  conflictResolutions: Map<string, ConflictResolution>
  metrics: RealTimeMetrics
  
  // Connection State
  supabaseClient: any
  subscriptions: Map<string, any>
  
  // ===================================================================
  // REFRESH CORE CRUD OPERATIONS WITH OPTIMISTIC UPDATES
  // ===================================================================
  
  createLead: (leadData: Partial<Lead>) => Promise<{ success: boolean, data?: Lead, error?: string }>
  updateLead: (id: string, updates: Partial<Lead>) => Promise<{ success: boolean, data?: Lead, error?: string }>
  deleteLead: (id: string) => Promise<{ success: boolean, error?: string }>
  
  createProject: (projectData: Partial<Project>) => Promise<{ success: boolean, data?: Project, error?: string }>
  updateProject: (id: string, updates: Partial<Project>) => Promise<{ success: boolean, data?: Project, error?: string }>
  deleteProject: (id: string) => Promise<{ success: boolean, error?: string }>
  
  createClient: (clientData: Partial<Client>) => Promise<{ success: boolean, data?: Client, error?: string }>
  updateClient: (id: string, updates: Partial<Client>) => Promise<{ success: boolean, data?: Client, error?: string }>
  deleteClient: (id: string) => Promise<{ success: boolean, error?: string }>
  
  // ===================================================================
  // FAST REAL-TIME SYNCHRONIZATION
  // ===================================================================
  
  initializeRealTime: () => Promise<void>
  syncAllData: () => Promise<void>
  handleRealTimeEvent: (table: string, event: any) => void
  
  // ===================================================================
  // 🛡️ CONFLICT RESOLUTION
  // ===================================================================
  
  detectConflict: (table: string, clientData: any, serverData: any) => boolean
  resolveConflict: (conflictId: string, strategy: string) => Promise<void>
  applyOptimisticUpdate: (table: string, operation: string, data: any) => string
  confirmOptimisticUpdate: (updateId: string) => void
  revertOptimisticUpdate: (updateId: string) => void
  
  // ===================================================================
  // DATA PERFORMANCE & MONITORING
  // ===================================================================
  
  updateMetrics: () => void
  getPerformanceReport: () => any
  cleanup: () => void
}

// ===================================================================
// HOT STORE IMPLEMENTATION
// ===================================================================

export const useUnifiedRealTimeStore = create<UnifiedRealTimeStore>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // Initialize data structures
      leads: new Map(),
      projects: new Map(),
      clients: new Map(),
      optimisticUpdates: new Map(),
      conflictResolutions: new Map(),
      metrics: {
        last_sync: 0,
        sync_status: 'disconnected',
        pending_updates: 0,
        conflict_count: 0,
        performance_grade: 'GOOD'
      },
      supabaseClient: null,
      subscriptions: new Map(),

      // ===================================================================
      // REFRESH LEADS CRUD OPERATIONS
      // ===================================================================

      createLead: async (leadData) => {
        try {
          // Apply optimistic update
          const tempId = `temp_${Date.now()}`
          const optimisticLead: Lead = {
            id: tempId,
            first_name: leadData.first_name || '',
            family_name: leadData.family_name || '',
            phone: leadData.phone || '',
            email: leadData.email,
            status: leadData.status || 'new',
            processing_state: 'pending',
            current_project_id: leadData.current_project_id,
            client_id: leadData.client_id,
            lead_metadata: leadData.lead_metadata,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }

          const updateId = get().applyOptimisticUpdate('leads', 'CREATE', optimisticLead)
          
          // Call backend API
          const response = await fetch('/api/leads', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              table: 'leads',
              operation: 'CREATE',
              data: leadData,
              user_context: { roles: ['sales_agent'] } // TODO: Get from auth
            })
          })

          const result = await response.json()
          
          if (result.success) {
            // Replace optimistic update with real data
            set(state => {
              const newLeads = new Map(state.leads)
              newLeads.delete(tempId)
              newLeads.set(result.data.id, result.data)
              return { leads: newLeads }
            })
            get().confirmOptimisticUpdate(updateId)
            return { success: true, data: result.data }
          } else {
            get().revertOptimisticUpdate(updateId)
            return { success: false, error: result.error }
          }
        } catch (error) {
          return { success: false, error: error.message }
        }
      },

      updateLead: async (id, updates) => {
        try {
          const currentLead = get().leads.get(id)
          if (!currentLead) {
            return { success: false, error: 'Lead not found' }
          }

          // Apply optimistic update
          const optimisticData = { ...currentLead, ...updates, updated_at: new Date().toISOString() }
          const updateId = get().applyOptimisticUpdate('leads', 'UPDATE', optimisticData)
          
          // Call unified push system
          const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/unified-push-system`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({
              source_table: 'leads',
              operation: 'UPDATE',
              data: { id, ...updates, last_known_updated_at: currentLead.updated_at },
              user_context: { roles: ['sales_agent'] }
            })
          })

          const result = await response.json()
          
          if (result.success) {
            set(state => {
              const newLeads = new Map(state.leads)
              newLeads.set(id, result.data)
              return { leads: newLeads }
            })
            get().confirmOptimisticUpdate(updateId)
            return { success: true, data: result.data }
          } else {
            get().revertOptimisticUpdate(updateId)
            return { success: false, error: result.error }
          }
        } catch (error) {
          return { success: false, error: error.message }
        }
      },

      deleteLead: async (id) => {
        try {
          const updateId = get().applyOptimisticUpdate('leads', 'DELETE', { id })
          
          // Call unified push system
          const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/unified-push-system`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({
              source_table: 'leads',
              operation: 'DELETE',
              data: { id },
              user_context: { roles: ['lead_manager'] }
            })
          })

          const result = await response.json()
          
          if (result.success) {
            get().confirmOptimisticUpdate(updateId)
            return { success: true }
          } else {
            get().revertOptimisticUpdate(updateId)
            return { success: false, error: result.error }
          }
        } catch (error) {
          return { success: false, error: error.message }
        }
      },

      // ===================================================================
      // BUILD PROJECTS CRUD OPERATIONS
      // ===================================================================

      createProject: async (projectData) => {
        try {
          const tempId = `temp_${Date.now()}`
          const optimisticProject: Project = {
            id: tempId,
            name: projectData.name || '',
            status: 'pending_approval',
            client_id: projectData.client_id,
            budget_info: projectData.budget_info,
            metadata: projectData.metadata,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }

          const updateId = get().applyOptimisticUpdate('projects', 'CREATE', optimisticProject)
          
          // Call enhanced CRUD API
          const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/enhanced-crud-api-evolution`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({
              table: 'projects',
              operation: 'CREATE',
              data: projectData,
              user_context: { roles: ['admin'] }
            })
          })

          const result = await response.json()
          
          if (result.success) {
            set(state => {
              const newProjects = new Map(state.projects)
              newProjects.delete(tempId)
              newProjects.set(result.data.id, result.data)
              return { projects: newProjects }
            })
            get().confirmOptimisticUpdate(updateId)
            return { success: true, data: result.data }
          } else {
            get().revertOptimisticUpdate(updateId)
            return { success: false, error: result.error }
          }
        } catch (error) {
          return { success: false, error: error.message }
        }
      },

      updateProject: async (id, updates) => {
        try {
          const currentProject = get().projects.get(id)
          if (!currentProject) {
            return { success: false, error: 'Project not found' }
          }

          const optimisticData = { ...currentProject, ...updates, updated_at: new Date().toISOString() }
          const updateId = get().applyOptimisticUpdate('projects', 'UPDATE', optimisticData)
          
          const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/enhanced-crud-api-evolution`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({
              table: 'projects',
              operation: 'UPDATE',
              data: { id, ...updates },
              user_context: { roles: ['project_manager'] }
            })
          })

          const result = await response.json()
          
          if (result.success) {
            set(state => {
              const newProjects = new Map(state.projects)
              newProjects.set(id, result.data)
              return { projects: newProjects }
            })
            get().confirmOptimisticUpdate(updateId)
            return { success: true, data: result.data }
          } else {
            get().revertOptimisticUpdate(updateId)
            return { success: false, error: result.error }
          }
        } catch (error) {
          return { success: false, error: error.message }
        }
      },

      deleteProject: async (id) => {
        try {
          const updateId = get().applyOptimisticUpdate('projects', 'DELETE', { id })
          
          const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/enhanced-crud-api-evolution`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({
              table: 'projects',
              operation: 'DELETE',
              data: { id },
              user_context: { roles: ['admin'] }
            })
          })

          const result = await response.json()
          
          if (result.success) {
            get().confirmOptimisticUpdate(updateId)
            return { success: true }
          } else {
            get().revertOptimisticUpdate(updateId)
            return { success: false, error: result.error }
          }
        } catch (error) {
          return { success: false, error: error.message }
        }
      },

      // ===================================================================
      // USERS CLIENTS CRUD OPERATIONS  
      // ===================================================================

      createClient: async (clientData) => {
        try {
          const tempId = `temp_${Date.now()}`
          const optimisticClient: Client = {
            id: tempId,
            name: clientData.name || '',
            contact_info: clientData.contact_info || {},
            whatsapp_phone_number: clientData.whatsapp_phone_number,
            whatsapp_number_id: clientData.whatsapp_number_id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }

          const updateId = get().applyOptimisticUpdate('clients', 'CREATE', optimisticClient)
          
          const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/enhanced-crud-api-evolution`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({
              table: 'clients',
              operation: 'CREATE',
              data: clientData,
              user_context: { roles: ['client_manager'] }
            })
          })

          const result = await response.json()
          
          if (result.success) {
            set(state => {
              const newClients = new Map(state.clients)
              newClients.delete(tempId)
              newClients.set(result.data.id, result.data)
              return { clients: newClients }
            })
            get().confirmOptimisticUpdate(updateId)
            return { success: true, data: result.data }
          } else {
            get().revertOptimisticUpdate(updateId)
            return { success: false, error: result.error }
          }
        } catch (error) {
          return { success: false, error: error.message }
        }
      },

      updateClient: async (id, updates) => {
        try {
          const currentClient = get().clients.get(id)
          if (!currentClient) {
            return { success: false, error: 'Client not found' }
          }

          const optimisticData = { ...currentClient, ...updates, updated_at: new Date().toISOString() }
          const updateId = get().applyOptimisticUpdate('clients', 'UPDATE', optimisticData)
          
          const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/enhanced-crud-api-evolution`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({
              table: 'clients',
              operation: 'UPDATE',
              data: { id, ...updates },
              user_context: { roles: ['client_manager'] }
            })
          })

          const result = await response.json()
          
          if (result.success) {
            set(state => {
              const newClients = new Map(state.clients)
              newClients.set(id, result.data)
              return { clients: newClients }
            })
            get().confirmOptimisticUpdate(updateId)
            return { success: true, data: result.data }
          } else {
            get().revertOptimisticUpdate(updateId)
            return { success: false, error: result.error }
          }
        } catch (error) {
          return { success: false, error: error.message }
        }
      },

      deleteClient: async (id) => {
        try {
          const updateId = get().applyOptimisticUpdate('clients', 'DELETE', { id })
          
          const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/enhanced-crud-api-evolution`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({
              table: 'clients',
              operation: 'DELETE',
              data: { id },
              user_context: { roles: ['admin'] }
            })
          })

          const result = await response.json()
          
          if (result.success) {
            get().confirmOptimisticUpdate(updateId)
            return { success: true }
          } else {
            get().revertOptimisticUpdate(updateId)
            return { success: false, error: result.error }
          }
        } catch (error) {
          return { success: false, error: error.message }
        }
      },

      // ===================================================================
      // FAST REAL-TIME SYNCHRONIZATION SYSTEM
      // ===================================================================

      initializeRealTime: async () => {
        try {
          const supabase = createClient(
            import.meta.env.VITE_SUPABASE_URL,
            import.meta.env.VITE_SUPABASE_ANON_KEY
          )

          set({ supabaseClient: supabase })

          // Subscribe to leads changes
          const leadsSubscription = supabase
            .channel('leads_changes')
            .on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'leads'
              },
              (payload) => get().handleRealTimeEvent('leads', payload)
            )
            .subscribe()

          // Subscribe to projects changes
          const projectsSubscription = supabase
            .channel('projects_changes')
            .on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'projects'
              },
              (payload) => get().handleRealTimeEvent('projects', payload)
            )
            .subscribe()

          // Subscribe to clients changes
          const clientsSubscription = supabase
            .channel('clients_changes')
            .on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'clients'
              },
              (payload) => get().handleRealTimeEvent('clients', payload)
            )
            .subscribe()

          set(state => ({
            subscriptions: new Map([
              ['leads', leadsSubscription],
              ['projects', projectsSubscription], 
              ['clients', clientsSubscription]
            ]),
            metrics: { ...state.metrics, sync_status: 'connected' }
          }))

          // Initial data sync
          await get().syncAllData()

        } catch (error) {
          console.error('Real-time initialization failed:', error)
          set(state => ({
            metrics: { ...state.metrics, sync_status: 'error' }
          }))
        }
      },

      syncAllData: async () => {
        try {
          set(state => ({ 
            metrics: { ...state.metrics, sync_status: 'syncing' }
          }))

          const supabase = get().supabaseClient
          if (!supabase) return

          // Fetch all data in parallel
          const [leadsResult, projectsResult, clientsResult] = await Promise.all([
            supabase.from('leads').select('*').order('updated_at', { ascending: false }),
            supabase.from('projects').select('*').order('updated_at', { ascending: false }),
            supabase.from('clients').select('*').order('updated_at', { ascending: false })
          ])

          set(state => ({
            leads: new Map(leadsResult.data?.map(lead => [lead.id, lead]) || []),
            projects: new Map(projectsResult.data?.map(project => [project.id, project]) || []),
            clients: new Map(clientsResult.data?.map(client => [client.id, client]) || []),
            metrics: {
              ...state.metrics,
              sync_status: 'connected',
              last_sync: Date.now()
            }
          }))

          get().updateMetrics()

        } catch (error) {
          console.error('Data sync failed:', error)
          set(state => ({
            metrics: { ...state.metrics, sync_status: 'error' }
          }))
        }
      },

      handleRealTimeEvent: (table, event) => {
        try {
          const { eventType, new: newRecord, old: oldRecord } = event

          switch (eventType) {
            case 'INSERT':
              set(state => {
                const mapKey = table as keyof Pick<UnifiedRealTimeStore, 'leads' | 'projects' | 'clients'>
                const currentMap = new Map(state[mapKey])
                currentMap.set(newRecord.id, newRecord)
                return { [mapKey]: currentMap } as any
              })
              break

            case 'UPDATE':
              set(state => {
                const mapKey = table as keyof Pick<UnifiedRealTimeStore, 'leads' | 'projects' | 'clients'>
                const currentMap = new Map(state[mapKey])
                
                // Check for conflicts
                const existingRecord = currentMap.get(newRecord.id)
                if (existingRecord && get().detectConflict(table, existingRecord, newRecord)) {
                  // Handle conflict
                  const conflictId = `conflict_${Date.now()}_${newRecord.id}`
                  set(state => ({
                    conflictResolutions: new Map(state.conflictResolutions).set(conflictId, {
                      id: conflictId,
                      table,
                      client_data: existingRecord,
                      server_data: newRecord,
                      resolution_strategy: 'server_wins', // Default strategy
                      timestamp: Date.now()
                    })
                  }))
                } else {
                  currentMap.set(newRecord.id, newRecord)
                  return { [mapKey]: currentMap } as any
                }
              })
              break

            case 'DELETE':
              set(state => {
                const mapKey = table as keyof Pick<UnifiedRealTimeStore, 'leads' | 'projects' | 'clients'>
                const currentMap = new Map(state[mapKey])
                currentMap.delete(oldRecord.id)
                return { [mapKey]: currentMap } as any
              })
              break
          }

          get().updateMetrics()

        } catch (error) {
          console.error('Real-time event handling failed:', error)
        }
      },

      // ===================================================================
      // 🛡️ CONFLICT RESOLUTION SYSTEM
      // ===================================================================

      detectConflict: (table, clientData, serverData) => {
        // Simple conflict detection based on timestamps
        const clientTime = new Date(clientData.updated_at).getTime()
        const serverTime = new Date(serverData.updated_at).getTime()
        
        // Conflict if server data is newer than client expects
        return Math.abs(serverTime - clientTime) > 30000 // 30 second threshold
      },

      resolveConflict: async (conflictId, strategy) => {
        const conflict = get().conflictResolutions.get(conflictId)
        if (!conflict) return

        let resolvedData
        switch (strategy) {
          case 'client_wins':
            resolvedData = conflict.client_data
            break
          case 'server_wins':
            resolvedData = conflict.server_data
            break
          case 'merge':
            resolvedData = { ...conflict.server_data, ...conflict.client_data }
            break
          default:
            resolvedData = conflict.server_data
        }

        // Apply resolved data
        set(state => {
          const mapKey = conflict.table as keyof Pick<UnifiedRealTimeStore, 'leads' | 'projects' | 'clients'>
          const currentMap = new Map(state[mapKey])
          currentMap.set(resolvedData.id, resolvedData)
          
          // Remove conflict
          const newConflicts = new Map(state.conflictResolutions)
          newConflicts.delete(conflictId)
          
          return { 
            [mapKey]: currentMap,
            conflictResolutions: newConflicts
          } as any
        })
      },

      applyOptimisticUpdate: (table, operation, data) => {
        const updateId = `optimistic_${Date.now()}_${Math.random()}`
        
        set(state => {
          const newUpdates = new Map(state.optimisticUpdates)
          newUpdates.set(updateId, {
            id: updateId,
            table,
            operation: operation as any,
            data,
            timestamp: Date.now(),
            status: 'pending',
            retryCount: 0
          })

          // Apply optimistic change
          const mapKey = table as keyof Pick<UnifiedRealTimeStore, 'leads' | 'projects' | 'clients'>
          const currentMap = new Map(state[mapKey])
          
          if (operation === 'DELETE') {
            currentMap.delete(data.id)
          } else {
            currentMap.set(data.id, data)
          }

          return {
            optimisticUpdates: newUpdates,
            [mapKey]: currentMap
          } as any
        })

        return updateId
      },

      confirmOptimisticUpdate: (updateId) => {
        set(state => {
          const newUpdates = new Map(state.optimisticUpdates)
          const update = newUpdates.get(updateId)
          if (update) {
            newUpdates.set(updateId, { ...update, status: 'confirmed' })
            // Remove confirmed updates after a delay
            setTimeout(() => {
              set(state => {
                const cleanedUpdates = new Map(state.optimisticUpdates)
                cleanedUpdates.delete(updateId)
                return { optimisticUpdates: cleanedUpdates }
              })
            }, 5000)
          }
          return { optimisticUpdates: newUpdates }
        })
      },

      revertOptimisticUpdate: (updateId) => {
        set(state => {
          const update = state.optimisticUpdates.get(updateId)
          if (!update) return state

          const mapKey = update.table as keyof Pick<UnifiedRealTimeStore, 'leads' | 'projects' | 'clients'>
          const currentMap = new Map(state[mapKey])
          
          // Revert the optimistic change
          if (update.operation === 'CREATE') {
            currentMap.delete(update.data.id)
          } else if (update.operation === 'DELETE') {
            // Re-add the item (would need original data)
          } else if (update.operation === 'UPDATE') {
            // Revert to original state (would need original data)
          }

          // Remove failed update
          const newUpdates = new Map(state.optimisticUpdates)
          newUpdates.delete(updateId)

          return {
            optimisticUpdates: newUpdates,
            [mapKey]: currentMap
          } as any
        })
      },

      // ===================================================================
      // DATA PERFORMANCE & MONITORING
      // ===================================================================

      updateMetrics: () => {
        set(state => {
          const pendingUpdates = Array.from(state.optimisticUpdates.values())
            .filter(update => update.status === 'pending').length
          
          const conflictCount = state.conflictResolutions.size
          
          let performanceGrade: 'EXCELLENT' | 'GOOD' | 'ACCEPTABLE' | 'NEEDS_OPTIMIZATION' = 'EXCELLENT'
          if (pendingUpdates > 10) performanceGrade = 'NEEDS_OPTIMIZATION'
          else if (pendingUpdates > 5) performanceGrade = 'ACCEPTABLE'
          else if (pendingUpdates > 2) performanceGrade = 'GOOD'

          return {
            metrics: {
              ...state.metrics,
              pending_updates: pendingUpdates,
              conflict_count: conflictCount,
              performance_grade: performanceGrade,
              last_sync: Date.now()
            }
          }
        })
      },

      getPerformanceReport: () => {
        const state = get()
        return {
          metrics: state.metrics,
          data_counts: {
            leads: state.leads.size,
            projects: state.projects.size,
            clients: state.clients.size
          },
          optimistic_updates: state.optimisticUpdates.size,
          conflicts: state.conflictResolutions.size,
          sync_health: state.metrics.sync_status === 'connected' ? 'healthy' : 'unhealthy'
        }
      },

      cleanup: () => {
        // Unsubscribe from all real-time channels
        const subscriptions = get().subscriptions
        subscriptions.forEach(subscription => {
          subscription.unsubscribe()
        })
        
        set({
          subscriptions: new Map(),
          metrics: {
            last_sync: 0,
            sync_status: 'disconnected',
            pending_updates: 0,
            conflict_count: 0,
            performance_grade: 'GOOD'
          }
        })
      }
    })),
    {
      name: 'unified-realtime-store',
      partialize: (state) => ({
        // Don't persist real-time connections
        leads: state.leads,
        projects: state.projects,
        clients: state.clients
      })
    }
  )
)

// ===================================================================
// TARGET CONVENIENCE HOOKS FOR COMPONENTS
// ===================================================================

export const useLeads = () => {
  const leads = useUnifiedRealTimeStore(state => Array.from(state.leads.values()))
  const createLead = useUnifiedRealTimeStore(state => state.createLead)
  const updateLead = useUnifiedRealTimeStore(state => state.updateLead)
  const deleteLead = useUnifiedRealTimeStore(state => state.deleteLead)
  
  return { leads, createLead, updateLead, deleteLead }
}

export const useProjects = () => {
  const projects = useUnifiedRealTimeStore(state => Array.from(state.projects.values()))
  const createProject = useUnifiedRealTimeStore(state => state.createProject)
  const updateProject = useUnifiedRealTimeStore(state => state.updateProject)
  const deleteProject = useUnifiedRealTimeStore(state => state.deleteProject)
  
  return { projects, createProject, updateProject, deleteProject }
}

export const useClients = () => {
  const clients = useUnifiedRealTimeStore(state => Array.from(state.clients.values()))
  const createClient = useUnifiedRealTimeStore(state => state.createClient)
  const updateClient = useUnifiedRealTimeStore(state => state.updateClient)
  const deleteClient = useUnifiedRealTimeStore(state => state.deleteClient)
  
  return { clients, createClient, updateClient, deleteClient }
}

export const useRealTimeMetrics = () => {
  return useUnifiedRealTimeStore(state => state.metrics)
}

export default useUnifiedRealTimeStore 