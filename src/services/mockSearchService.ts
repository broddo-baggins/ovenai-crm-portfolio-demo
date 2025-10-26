/**
 * Mock Search Service
 * 
 * Provides global search functionality across leads, projects, and users
 * using mock data for demonstration purposes.
 */

import { mockLeads, mockProjects } from '@/data/mockData';
import { ReactNode } from 'react';
import { Users, Target, TrendingUp, Building2, Mail } from 'lucide-react';

export interface SearchResult {
  type: 'lead' | 'project' | 'user' | 'company';
  id: string;
  title: string;
  subtitle: string;
  relevance: number;
  path: string;
  meta?: string;
}

/**
 * Calculate relevance score for a search term against a text
 */
function calculateRelevance(searchTerm: string, text: string): number {
  const term = searchTerm.toLowerCase().trim();
  const target = text.toLowerCase();
  
  // Exact match = 100
  if (target === term) return 100;
  
  // Starts with = 80
  if (target.startsWith(term)) return 80;
  
  // Contains as whole word = 60
  const wordBoundary = new RegExp(`\\b${term}\\b`, 'i');
  if (wordBoundary.test(target)) return 60;
  
  // Contains anywhere = 40
  if (target.includes(term)) return 40;
  
  // Fuzzy match (each character appears in order) = 20
  let lastIndex = -1;
  let matches = 0;
  for (const char of term) {
    const index = target.indexOf(char, lastIndex + 1);
    if (index > lastIndex) {
      matches++;
      lastIndex = index;
    }
  }
  if (matches === term.length) return 20;
  
  return 0;
}

/**
 * Mock users for search (same as in Users page)
 */
const mockUsers = [
  {
    id: 'pending-user-1',
    email: 'sarah.johnson@techstart.demo',
    name: 'Sarah Johnson',
    role: 'USER',
    status: 'PENDING_APPROVAL',
    company: 'TechStart Solutions'
  },
  {
    id: 'pending-user-2',
    email: 'michael.chen@growth.demo',
    name: 'Michael Chen',
    role: 'USER',
    status: 'PENDING_APPROVAL',
    company: 'Growth Marketing Co'
  },
  {
    id: 'pending-user-3',
    email: 'david.park@enterprise.demo',
    name: 'David Park',
    role: 'USER',
    status: 'PENDING_APPROVAL',
    company: 'Enterprise Systems Inc'
  },
  {
    id: 'pending-user-4',
    email: 'lisa.thompson@smallbiz.demo',
    name: 'Lisa Thompson',
    role: 'USER',
    status: 'PENDING_APPROVAL',
    company: 'Small Biz Consulting'
  },
  {
    id: 'pending-user-5',
    email: 'emily.rodriguez@innovate.demo',
    name: 'Emily Rodriguez',
    role: 'USER',
    status: 'PENDING_APPROVAL',
    company: 'Innovate Labs'
  },
  {
    id: 'active-user-1',
    email: 'honored.guest@crm.demo',
    name: 'Honored Guest',
    role: 'ADMIN',
    status: 'ACTIVE',
    company: 'Demo Company'
  },
  {
    id: 'active-user-2',
    email: 'james.wilson@cloudtech.demo',
    name: 'James Wilson',
    role: 'STAFF',
    status: 'ACTIVE',
    company: 'CloudTech Partners'
  },
  {
    id: 'active-user-3',
    email: 'maria.garcia@smartbiz.demo',
    name: 'Maria Garcia',
    role: 'USER',
    status: 'ACTIVE',
    company: 'SmartBiz Solutions'
  }
];

/**
 * Search leads by name, company, email, tags, or notes
 */
function searchLeads(query: string): SearchResult[] {
  return mockLeads
    .map(lead => {
      const nameRelevance = calculateRelevance(query, lead.name || '');
      const companyRelevance = calculateRelevance(query, lead.company || '');
      const emailRelevance = calculateRelevance(query, lead.email || '');
      const tagsRelevance = lead.tags 
        ? Math.max(...lead.tags.map(tag => calculateRelevance(query, tag)))
        : 0;
      
      const maxRelevance = Math.max(
        nameRelevance, 
        companyRelevance, 
        emailRelevance,
        tagsRelevance
      );
      
      if (maxRelevance === 0) return null;
      
      return {
        type: 'lead' as const,
        id: lead.id,
        title: lead.name,
        subtitle: lead.company || 'Unknown Company',
        relevance: maxRelevance,
        path: `/leads?id=${lead.id}`,
        meta: lead.status || 'unknown'
      };
    })
    .filter((result): result is NonNullable<typeof result> => result !== null);
}

/**
 * Search projects by name, client, description, or tags
 */
function searchProjects(query: string): SearchResult[] {
  return mockProjects
    .map(project => {
      const nameRelevance = calculateRelevance(query, project.name || '');
      const clientRelevance = calculateRelevance(query, project.client || '');
      const descRelevance = calculateRelevance(query, project.description || '');
      const tagsRelevance = project.tags 
        ? Math.max(...project.tags.map(tag => calculateRelevance(query, tag)))
        : 0;
      
      const maxRelevance = Math.max(
        nameRelevance, 
        clientRelevance, 
        descRelevance,
        tagsRelevance
      );
      
      if (maxRelevance === 0) return null;
      
      return {
        type: 'project' as const,
        id: project.id,
        title: project.name,
        subtitle: project.client || 'Unknown Client',
        relevance: maxRelevance,
        path: `/projects?id=${project.id}`,
        meta: project.status || 'unknown'
      };
    })
    .filter((result): result is NonNullable<typeof result> => result !== null);
}

/**
 * Search users by name, email, or company
 */
function searchUsers(query: string): SearchResult[] {
  return mockUsers
    .map(user => {
      const nameRelevance = calculateRelevance(query, user.name || '');
      const emailRelevance = calculateRelevance(query, user.email || '');
      const companyRelevance = calculateRelevance(query, user.company || '');
      
      const maxRelevance = Math.max(
        nameRelevance, 
        emailRelevance,
        companyRelevance
      );
      
      if (maxRelevance === 0) return null;
      
      return {
        type: 'user' as const,
        id: user.id,
        title: user.name,
        subtitle: user.email,
        relevance: maxRelevance,
        path: `/dashboard/users?id=${user.id}`,
        meta: user.role
      };
    })
    .filter((result): result is NonNullable<typeof result> => result !== null);
}

/**
 * Extract unique companies from leads and projects
 */
function searchCompanies(query: string): SearchResult[] {
  const companies = new Set<string>();
  
  // Add companies from leads
  mockLeads.forEach(lead => {
    if (lead.company) companies.add(lead.company);
  });
  
  // Add clients from projects
  mockProjects.forEach(project => {
    if (project.client) companies.add(project.client);
  });
  
  return Array.from(companies)
    .map(company => {
      const relevance = calculateRelevance(query, company);
      if (relevance === 0) return null;
      
      return {
        type: 'company' as const,
        id: `company-${company.toLowerCase().replace(/\s+/g, '-')}`,
        title: company,
        subtitle: 'Company',
        relevance,
        path: `/leads?company=${encodeURIComponent(company)}`,
        meta: 'company'
      };
    })
    .filter((result): result is NonNullable<typeof result> => result !== null);
}

/**
 * Main search function - searches across all data sources
 */
export function searchMockData(query: string, maxResults: number = 10): SearchResult[] {
  if (!query || query.trim().length < 2) {
    return [];
  }
  
  const normalizedQuery = query.trim();
  
  // Search all data sources
  const leadResults = searchLeads(normalizedQuery);
  const projectResults = searchProjects(normalizedQuery);
  const userResults = searchUsers(normalizedQuery);
  const companyResults = searchCompanies(normalizedQuery);
  
  // Combine all results
  const allResults = [
    ...leadResults,
    ...projectResults,
    ...userResults,
    ...companyResults
  ];
  
  // Sort by relevance (highest first)
  allResults.sort((a, b) => b.relevance - a.relevance);
  
  // Return top N results
  return allResults.slice(0, maxResults);
}

/**
 * Get search results categorized by type
 */
export interface CategorizedResults {
  leads: SearchResult[];
  projects: SearchResult[];
  users: SearchResult[];
  companies: SearchResult[];
  total: number;
}

export function searchMockDataCategorized(query: string, maxPerCategory: number = 5): CategorizedResults {
  if (!query || query.trim().length < 2) {
    return {
      leads: [],
      projects: [],
      users: [],
      companies: [],
      total: 0
    };
  }
  
  const normalizedQuery = query.trim();
  
  const leads = searchLeads(normalizedQuery)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, maxPerCategory);
    
  const projects = searchProjects(normalizedQuery)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, maxPerCategory);
    
  const users = searchUsers(normalizedQuery)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, maxPerCategory);
    
  const companies = searchCompanies(normalizedQuery)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, maxPerCategory);
  
  return {
    leads,
    projects,
    users,
    companies,
    total: leads.length + projects.length + users.length + companies.length
  };
}

export const mockSearchService = {
  search: searchMockData,
  searchCategorized: searchMockDataCategorized,
  searchLeads,
  searchProjects,
  searchUsers,
  searchCompanies
};

export default mockSearchService;

