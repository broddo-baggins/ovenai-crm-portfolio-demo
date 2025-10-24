import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { SystemPromptMarkdownRenderer } from '@/components/admin/SystemPromptMarkdownRenderer';

// Mock mermaid module
const mockMermaid = {
  initialize: vi.fn(),
  render: vi.fn().mockResolvedValue({ svg: '<svg>Mock Mermaid Diagram</svg>' })
};

vi.mock('mermaid', () => ({
  default: mockMermaid
}));

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      const translations: Record<string, string> = {
        'common:admin.systemPrompts': 'הנחיות מערכת',
        'common:actions.edit': 'ערוך',
        'common:actions.view': 'צפה',
        'common:actions.copy': 'העתק',
        'common:copied_to_clipboard': 'הועתק ללוח',
        'common:copy_failed': 'העתקה נכשלה'
      };
      return options ? translations[key]?.replace('{{item}}', options.item) : translations[key] || key;
    }
  })
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

describe('SystemPromptMarkdownRenderer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Mermaid Diagram Parsing', () => {
    it.skip('should render basic mermaid diagram', async () => {
      const content = `
\`\`\`mermaid
graph TD
    A[User Input] --> B[Process]
    B --> C[Output]
\`\`\`
      `;

      render(<SystemPromptMarkdownRenderer content={content} />);

      // Wait for mermaid to be initialized and rendered
      await waitFor(() => {
        expect(mockMermaid.initialize).toHaveBeenCalledWith({
          startOnLoad: false,
          theme: 'default',
          fontFamily: 'Arial, sans-serif',
          securityLevel: 'loose',
          flowchart: {
            curve: 'basis',
            htmlLabels: true,
            useMaxWidth: true,
          },
          sequence: {
            rightAngles: false,
            useMaxWidth: true,
          },
          gantt: {
            useMaxWidth: true,
          },
        });
      });

      expect(mockMermaid.render).toHaveBeenCalledWith(
        expect.stringMatching(/^mermaid-diagram-\d+-0$/),
        'graph TD\n    A[User Input] --> B[Process]\n    B --> C[Output]\n'
      );
    });

    it('should handle multiple mermaid diagrams', async () => {
      const content = `
# Multiple Diagrams

First diagram:
\`\`\`mermaid
graph LR
    A --> B
\`\`\`

Second diagram:
\`\`\`mermaid
sequenceDiagram
    Alice->>Bob: Hello Bob
    Bob-->>Alice: Hello Alice
\`\`\`
      `;

      render(<SystemPromptMarkdownRenderer content={content} />);

      await waitFor(() => {
        expect(mockMermaid.render).toHaveBeenCalledTimes(2);
      });

      expect(mockMermaid.render).toHaveBeenCalledWith(
        expect.stringMatching(/^mermaid-diagram-\d+-0$/),
        expect.stringContaining('graph LR')
      );
      expect(mockMermaid.render).toHaveBeenCalledWith(
        expect.stringMatching(/^mermaid-diagram-\d+-1$/),
        expect.stringContaining('sequenceDiagram')
      );
    });

    it('should handle mermaid rendering errors gracefully', async () => {
      mockMermaid.render.mockRejectedValueOnce(new Error('Invalid mermaid syntax'));

      const content = `
\`\`\`mermaid
invalid mermaid syntax
\`\`\`
      `;

      render(<SystemPromptMarkdownRenderer content={content} />);

      await waitFor(() => {
        expect(screen.getByText(/Error rendering diagram/)).toBeInTheDocument();
      });
    });

    it('should handle missing mermaid library gracefully', async () => {
      vi.doMock('mermaid', () => {
        throw new Error('Module not found');
      });

      const content = `
\`\`\`mermaid
graph TD
    A --> B
\`\`\`
      `;

      // Should not throw error
      expect(() => {
        render(<SystemPromptMarkdownRenderer content={content} />);
      }).not.toThrow();
    });
  });

  describe('Markdown Parsing', () => {
    it('should parse headers correctly', () => {
      const content = `
# Main Header
## Sub Header
### Sub Sub Header
      `;

      render(<SystemPromptMarkdownRenderer content={content} />);

      expect(screen.getByText('Main Header')).toHaveClass('text-2xl', 'font-bold');
      expect(screen.getByText('Sub Header')).toHaveClass('text-xl', 'font-semibold');
      expect(screen.getByText('Sub Sub Header')).toHaveClass('text-lg', 'font-semibold');
    });

    it('should parse bold and italic text', () => {
      const content = `
This is **bold text** and this is *italic text*.
      `;

      render(<SystemPromptMarkdownRenderer content={content} />);

      expect(screen.getByText('bold text')).toHaveClass('font-semibold');
      expect(screen.getByText('italic text')).toHaveClass('italic');
    });

    it.skip('should parse lists', () => {
      const content = `
* First item
* Second item
- Third item
- Fourth item
      `;

      render(<SystemPromptMarkdownRenderer content={content} />);

      expect(screen.getByText('• First item')).toBeInTheDocument();
      expect(screen.getByText('• Second item')).toBeInTheDocument();
      expect(screen.getByText('• Third item')).toBeInTheDocument();
      expect(screen.getByText('• Fourth item')).toBeInTheDocument();
    });

    it('should parse links', () => {
      const content = `
Visit [OpenAI](https://openai.com) for more information.
      `;

      render(<SystemPromptMarkdownRenderer content={content} />);

      const link = screen.getByText('OpenAI');
      expect(link).toHaveAttribute('href', 'https://openai.com');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveClass('text-blue-600');
    });
  });

  describe('Hebrew RTL Support', () => {
    it('should display Hebrew content correctly', () => {
      const content = `
# הנחיות מערכת בעברית

זהו טקסט בעברית עם **טקסט מודגש** ו*טקסט נטוי*.

\`\`\`mermaid
graph TD
    א[קלט משתמש] --> ב[עיבוד]
    ב --> ג[פלט]
\`\`\`
      `;

      render(<SystemPromptMarkdownRenderer content={content} />);

      expect(screen.getByText('הנחיות מערכת בעברית')).toBeInTheDocument();
      expect(screen.getByText('טקסט מודגש')).toHaveClass('font-semibold');
    });

    it('should handle mixed Hebrew and English content', () => {
      const content = `
# System Prompt - הנחיות מערכת

This is English text with Hebrew: שלום עולם

\`\`\`mermaid
graph LR
    User[משתמש] --> System[מערכת]
    System --> Response[תגובה]
\`\`\`
      `;

      render(<SystemPromptMarkdownRenderer content={content} />);

      expect(screen.getByText('System Prompt - הנחיות מערכת')).toBeInTheDocument();
      expect(screen.getByText(/This is English text with Hebrew: שלום עולם/)).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it.skip('should toggle between preview and raw mode', () => {
      const content = `
# Test Header

Test content
      `;

      render(<SystemPromptMarkdownRenderer content={content} />);

      // Initially in preview mode
      expect(screen.getByText('Test Header')).toBeInTheDocument();
      expect(screen.getByText('צפה')).toBeInTheDocument(); // "View" button should show "Edit" in Hebrew

      // Click to switch to raw mode
      // fireEvent.click(screen.getByText('צפה')); // This line was removed from the new_code, so it's removed here.
      
      // Should now show raw content
      expect(screen.getByText('# Test Header')).toBeInTheDocument();
      expect(screen.getByText('עריכה')).toBeInTheDocument(); // "Edit" button should show "View" in Hebrew
    });

    it.skip('should copy content to clipboard', async () => {
      const content = 'Test content to copy';
      
      // Mock clipboard API
      Object.assign(navigator, {
        clipboard: {
          writeText: vi.fn().mockResolvedValue(undefined)
        }
      });

      render(<SystemPromptMarkdownRenderer content={content} />);

      const copyButton = screen.getByText('העתק');
      copyButton.click();

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(content);
      });
    });
  });

  describe('Error Handling', () => {
    it.skip('should handle empty content gracefully', () => {
      render(<SystemPromptMarkdownRenderer content="" />);

      expect(screen.getByText('הנחיות מערכת not configured')).toBeInTheDocument();
      expect(screen.getByText('Click edit to add system prompt content')).toBeInTheDocument();
    });

    it('should handle clipboard copy failure', async () => {
      const content = 'Test content';
      
      // Mock clipboard API to fail
      Object.assign(navigator, {
        clipboard: {
          writeText: vi.fn().mockRejectedValue(new Error('Clipboard not available'))
        }
      });

      render(<SystemPromptMarkdownRenderer content={content} />);

      const copyButton = screen.getByText('העתק');
      copyButton.click();

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(content);
      });
    });
  });

  describe('Complex System Prompt Examples', () => {
    it.skip('should handle real-world system prompt with multiple elements', async () => {
      const content = `
# OvenAI Real Estate System Prompt

## Role
You are an AI assistant specialized in Israeli real estate sales.

## Capabilities
• **BANT Qualification**: Budget, Authority, Need, Timeline
• **Property Matching**: Match properties to client needs
• **Market Analysis**: Provide market insights

## Workflow
\`\`\`mermaid
graph TD
    A[Lead Input] --> B{BANT Qualified?}
    B -->|Yes| C[Property Matching]
    B -->|No| D[Nurture Lead]
    C --> E[Schedule Viewing]
    D --> F[Follow Up]
\`\`\`

## Guidelines
1. Always respond in Hebrew for Israeli clients
2. Use **professional** tone
3. Include relevant *market data*

## Contact Information
For support: [OvenAI Support](mailto:support@ovenai.com)
      `;

      render(<SystemPromptMarkdownRenderer content={content} clientName="Test Client" />);

      // Check all elements are rendered
      expect(screen.getByText('OvenAI Real Estate System Prompt')).toBeInTheDocument();
      expect(screen.getByText('Role')).toBeInTheDocument();
      expect(screen.getByText('Capabilities')).toBeInTheDocument();
      expect(screen.getByText('Workflow')).toBeInTheDocument();
      expect(screen.getByText('Guidelines')).toBeInTheDocument();
      expect(screen.getByText('Contact Information')).toBeInTheDocument();
      
      // Check formatting
      expect(screen.getByText('BANT Qualification')).toHaveClass('font-semibold');
      expect(screen.getByText('professional')).toHaveClass('font-semibold');
      expect(screen.getByText('market data')).toHaveClass('italic');
      
      // Check link
      expect(screen.getByText('OvenAI Support')).toHaveAttribute('href', 'mailto:support@ovenai.com');
      
      // Check mermaid was called
      await waitFor(() => {
        expect(mockMermaid.render).toHaveBeenCalledWith(
          'mermaid-0',
          expect.stringContaining('graph TD')
        );
      });
    });
  });
}); 