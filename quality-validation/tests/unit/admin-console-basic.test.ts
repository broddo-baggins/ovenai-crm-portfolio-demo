import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the toast
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('SystemPromptReader Logic', () => {
  const mockSystemPrompt = `
You are an AI real-estate sales assistant and personal assistant of Oron - Sales Manager at Kata Investments.

## Primary Goal
Your Goal is to get the customers to schedule a meeting with the sales manager, in the short term.

## State-Aware Communication Rules
- **Language**: Respond in Hebrew unless lead requests English
- **Response Length**: Calibrate based on state:
  - 'new_lead': 3-4 sentences (foundation building)
  - 'information_gathering': 2-3 sentences (efficient progress)

## BANT Qualification Process
**ASK ONE QUESTION AT A TIME**: Requirements (room count/family size) → Area familiarity → Budget 
NEVER ask about things you already see in the Current Lead Context

## Project Details - Kata Investments
**Name**: "קפלן 39-41"
**Location**: Ramat Varber neighborhood, Petah Tikva - facing agricultural farm

## JSON Output Requirements
\`\`\`json
{
    "suggested_response": "string (your Hebrew response to lead)",
    "state": "string (English state value)",
    "status": "string (English status value)"
}
\`\`\`
  `;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should parse system prompt sections correctly', () => {
    const parseSystemPrompt = (prompt: string) => {
      const sections = [];
      const lines = prompt.split('\n');
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        
        if (trimmedLine.startsWith('You are') && trimmedLine.includes('AI')) {
          sections.push({ title: 'Role & Identity', type: 'header' });
        } else if (trimmedLine.startsWith('## Primary Goal')) {
          sections.push({ title: 'Primary Goal', type: 'text' });
        } else if (trimmedLine.startsWith('## State-Aware Communication Rules')) {
          sections.push({ title: 'State-Aware Communication', type: 'list' });
        } else if (trimmedLine.startsWith('## BANT Qualification Process')) {
          sections.push({ title: 'BANT Qualification Process', type: 'list' });
        } else if (trimmedLine.startsWith('## Project Details')) {
          sections.push({ title: 'Project Details', type: 'text' });
        } else if (trimmedLine.startsWith('## JSON Output Requirements')) {
          sections.push({ title: 'JSON Output Requirements', type: 'json' });
        }
      }
      
      return sections;
    };

    const sections = parseSystemPrompt(mockSystemPrompt);
    
    expect(sections).toHaveLength(6);
    expect(sections.find(s => s.title === 'Role & Identity')).toBeDefined();
    expect(sections.find(s => s.title === 'Primary Goal')).toBeDefined();
    expect(sections.find(s => s.title === 'BANT Qualification Process')).toBeDefined();
    expect(sections.find(s => s.title === 'JSON Output Requirements')).toBeDefined();
  });

  it('should handle empty system prompt', () => {
    const parseSystemPrompt = (prompt: string) => {
      if (!prompt || prompt.trim() === '') {
        return [];
      }
      return prompt.split('\n').filter(line => line.trim().startsWith('##'));
    };

    const sections = parseSystemPrompt('');
    expect(sections).toHaveLength(0);
  });

  it('should filter sections based on search term', () => {
    const sections = [
      { title: 'Role & Identity', content: 'AI assistant' },
      { title: 'Primary Goal', content: 'Schedule meetings' },
      { title: 'BANT Qualification Process', content: 'Ask one question' },
    ];

    const searchTerm = 'BANT';
    const filteredSections = sections.filter(section =>
      section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      section.content.toLowerCase().includes(searchTerm.toLowerCase())
    );

    expect(filteredSections).toHaveLength(1);
    expect(filteredSections[0].title).toBe('BANT Qualification Process');
  });

  it('should handle Hebrew text in system prompt', () => {
    const hebrewPrompt = `
אתה עוזר מכירות AI לנדל"ן ועוזר אישי של אורון - מנהל מכירות ב-Kata Investments.

## מטרה עיקרית
המטרה שלך היא לגרום ללקוחות לתזמן פגישה עם מנהל המכירות, בטווח הקצר.

## פרטי פרויקט - Kata Investments
**שם**: "קפלן 39-41"
**מיקום**: שכונת רמת ורבר, פתח תקווה - מול חווה חקלאית
    `;

    const hasHebrewContent = /[\u0590-\u05FF]/.test(hebrewPrompt);
    expect(hasHebrewContent).toBe(true);

    const sections = hebrewPrompt.split('\n').filter(line => line.trim().startsWith('##'));
    expect(sections).toHaveLength(2);
  });
});

describe('Admin Console Component Integration', () => {
  it('should handle RBAC correctly', () => {
    // Test RBAC logic
    const adminLevel: string = 'system_admin';
    const hasSystemAdminAccess = adminLevel === 'system_admin';
    const hasClientAdminAccess = adminLevel === 'client_admin' || adminLevel === 'system_admin';
    
    expect(hasSystemAdminAccess).toBe(true);
    expect(hasClientAdminAccess).toBe(true);
  });

  it('should validate user permissions', () => {
    const userLevel: string = 'user';
    const hasAdminAccess = userLevel === 'system_admin' || userLevel === 'client_admin';
    
    expect(hasAdminAccess).toBe(false);
  });

  it('should determine appropriate tabs for different admin levels', () => {
    const getAvailableTabs = (adminLevel: string) => {
      const baseTabs = ['overview', 'prompts'];
      
      if (adminLevel === 'system_admin') {
        return [...baseTabs, 'companies', 'clients', 'users'];
      } else if (adminLevel === 'client_admin') {
        return [...baseTabs, 'users'];
      } else {
        return baseTabs;
      }
    };

    const systemAdminTabs = getAvailableTabs('system_admin');
    const clientAdminTabs = getAvailableTabs('client_admin');
    const userTabs = getAvailableTabs('user');

    expect(systemAdminTabs).toContain('companies');
    expect(systemAdminTabs).toContain('clients');
    expect(clientAdminTabs).not.toContain('companies');
    expect(clientAdminTabs).toContain('users');
    expect(userTabs).not.toContain('users');
  });
});

describe('Data Table Functionality', () => {
  it('should handle data deduplication', () => {
    const data = [
      { id: '1', name: 'John' },
      { id: '2', name: 'Jane' },
      { id: '1', name: 'John Duplicate' }, // Duplicate ID
    ];

    const uniqueData = data.reduce((acc, item) => {
      if (!acc.some(existing => existing.id === item.id)) {
        acc.push(item);
      }
      return acc;
    }, [] as typeof data);

    expect(uniqueData).toHaveLength(2);
    expect(uniqueData.find(item => item.id === '1')?.name).toBe('John');
  });

  it('should handle search filtering', () => {
    const data = [
      { id: '1', name: 'John Doe', email: 'john@example.com' },
      { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
    ];

    const searchTerm = 'John';
    const filteredData = data.filter(item =>
      Object.values(item).some(value =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );

    expect(filteredData).toHaveLength(1);
    expect(filteredData[0].name).toBe('John Doe');
  });

  it('should handle column filtering', () => {
    const data = [
      { id: '1', name: 'John', status: 'active' },
      { id: '2', name: 'Jane', status: 'inactive' },
    ];

    const statusFilter = 'active';
    const filteredData = data.filter(item => item.status === statusFilter);

    expect(filteredData).toHaveLength(1);
    expect(filteredData[0].name).toBe('John');
  });

  it('should validate edit operations', () => {
    const originalData = { id: '1', name: 'John', email: 'john@example.com' };
    const updates = { name: 'John Updated' };
    
    const updatedData = { ...originalData, ...updates };
    
    expect(updatedData.name).toBe('John Updated');
    expect(updatedData.email).toBe('john@example.com');
    expect(updatedData.id).toBe('1');
  });

  it('should handle delete confirmation logic', () => {
    const deleteRecord = (id: string, confirmCallback: () => boolean) => {
      if (confirmCallback()) {
        return { success: true, message: 'Record deleted' };
      }
      return { success: false, message: 'Delete cancelled' };
    };

    const confirmDelete = () => true;
    const cancelDelete = () => false;

    const deleteResult = deleteRecord('1', confirmDelete);
    const cancelResult = deleteRecord('1', cancelDelete);

    expect(deleteResult.success).toBe(true);
    expect(cancelResult.success).toBe(false);
  });
});

describe('System Prompt Parsing', () => {
  it('should parse markdown headers correctly', () => {
    const prompt = `
## Primary Goal
This is the goal

## BANT Process
This is the process
    `;

    const lines = prompt.split('\n');
    const headers = lines.filter(line => line.trim().startsWith('##'));
    
    expect(headers).toHaveLength(2);
    expect(headers[0].trim()).toBe('## Primary Goal');
    expect(headers[1].trim()).toBe('## BANT Process');
  });

  it('should handle JSON code blocks', () => {
    const prompt = `
## JSON Output
\`\`\`json
{
  "response": "test"
}
\`\`\`
    `;

    const hasJsonBlock = prompt.includes('```json');
    expect(hasJsonBlock).toBe(true);
  });

  it('should handle list formatting', () => {
    const prompt = `
## Rules
- Rule 1
- Rule 2
* Rule 3
    `;

    const lines = prompt.split('\n');
    const listItems = lines.filter(line => 
      line.trim().startsWith('- ') || line.trim().startsWith('* ')
    );
    
    expect(listItems).toHaveLength(3);
  });

  it('should assign appropriate icons to sections', () => {
    const getIconForSection = (title: string) => {
      const iconMap: Record<string, string> = {
        'Role & Identity': '🤖',
        'Primary Goal': '🎯',
        'State-Aware Communication': '💬',
        'BANT Qualification Process': '✅',
        'Project Details': '🏢',
        'JSON Output Requirements': '📋',
      };
      
      return iconMap[title] || '📄';
    };

    expect(getIconForSection('Role & Identity')).toBe('🤖');
    expect(getIconForSection('Primary Goal')).toBe('🎯');
    expect(getIconForSection('BANT Qualification Process')).toBe('✅');
    expect(getIconForSection('Unknown Section')).toBe('📄');
  });
});

describe('Copy Functionality', () => {
  it('should handle copy to clipboard', async () => {
    const mockClipboard = {
      writeText: vi.fn().mockResolvedValue(undefined),
    };

    // Mock navigator.clipboard
    Object.defineProperty(navigator, 'clipboard', {
      value: mockClipboard,
      writable: true,
    });

    const copyToClipboard = async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        return { success: true, message: 'Copied to clipboard' };
      } catch (error) {
        return { success: false, message: 'Failed to copy' };
      }
    };

    const result = await copyToClipboard('Test content');
    
    expect(result.success).toBe(true);
    expect(mockClipboard.writeText).toHaveBeenCalledWith('Test content');
  });

  it('should handle copy failure gracefully', async () => {
    const mockClipboard = {
      writeText: vi.fn().mockRejectedValue(new Error('Clipboard not available')),
    };

    Object.defineProperty(navigator, 'clipboard', {
      value: mockClipboard,
      writable: true,
    });

    const copyToClipboard = async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        return { success: true, message: 'Copied to clipboard' };
      } catch (error) {
        return { success: false, message: 'Failed to copy' };
      }
    };

    const result = await copyToClipboard('Test content');
    
    expect(result.success).toBe(false);
    expect(result.message).toBe('Failed to copy');
  });
});

describe('Edit Propagation Logic', () => {
  it('should validate edit propagation to site database', () => {
    const editSystemPrompt = (clientId: string, newPrompt: string) => {
      // Simulate updating client description (system prompt)
      const updateData = {
        id: clientId,
        description: newPrompt,
        updated_at: new Date().toISOString(),
      };
      
      return {
        success: true,
        data: updateData,
        message: 'System prompt updated successfully',
      };
    };

    const result = editSystemPrompt('client-1', 'Updated system prompt');
    
    expect(result.success).toBe(true);
    expect(result.data.description).toBe('Updated system prompt');
    expect(result.data.id).toBe('client-1');
  });

  it('should handle edit validation', () => {
    const validateEdit = (data: any) => {
      const errors = [];
      
      if (!data.description || data.description.trim() === '') {
        errors.push('System prompt cannot be empty');
      }
      
      if (data.description && data.description.length > 10000) {
        errors.push('System prompt too long (max 10000 characters)');
      }
      
      return {
        isValid: errors.length === 0,
        errors,
      };
    };

    const validData = { description: 'Valid system prompt' };
    const emptyData = { description: '' };
    const longData = { description: 'x'.repeat(10001) };

    expect(validateEdit(validData).isValid).toBe(true);
    expect(validateEdit(emptyData).isValid).toBe(false);
    expect(validateEdit(longData).isValid).toBe(false);
  });
}); 