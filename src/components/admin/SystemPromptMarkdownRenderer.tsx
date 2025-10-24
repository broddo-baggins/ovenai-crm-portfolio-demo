import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Edit, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLang } from '@/hooks/useLang';
import { toast } from 'sonner';

interface SystemPromptMarkdownRendererProps {
  content: string;
  title?: string;
  clientName?: string;
  onEdit?: () => void;
  className?: string;
}

export const SystemPromptMarkdownRenderer: React.FC<SystemPromptMarkdownRendererProps> = ({
  content,
  title,
  clientName,
  onEdit,
  className
}) => {
  const { t } = useTranslation(['common', 'pages']);
  const { isRTL, textStart, textEnd } = useLang();
  const contentRef = useRef<HTMLDivElement>(null);
  const [isPreviewMode, setIsPreviewMode] = React.useState(true);
  const [processedContent, setProcessedContent] = React.useState('');
  const [mermaidInitialized, setMermaidInitialized] = React.useState(false);

  // Enhanced markdown-to-HTML converter with better RTL support
  const parseMarkdown = (markdown: string): string => {
    if (!markdown) return '';
    
    let html = markdown
      // Headers with RTL support
      .replace(/^### (.*$)/gm, `<h3 class="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200 ${textStart()}">$1</h3>`)
      .replace(/^## (.*$)/gm, `<h2 class="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200 ${textStart()}">$1</h2>`)
      .replace(/^# (.*$)/gm, `<h1 class="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200 ${textStart()}">$1</h1>`)
      
      // Bold and italic
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
      
      // Mermaid diagrams - create containers for dynamic rendering
      .replace(/```mermaid\n([\s\S]*?)```/g, '<div class="mermaid-container bg-gray-50 dark:bg-gray-800 p-4 rounded-md border my-4 text-center" data-mermaid="$1"><div class="mermaid-diagram">$1</div></div>')
      
      // Code blocks
      .replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-100 dark:bg-gray-800 p-3 rounded-md overflow-x-auto my-2"><code class="text-sm">$1</code></pre>')
      .replace(/`([^`]+)`/g, '<code class="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm">$1</code>')
      
      // Lists with RTL support - convert to proper HTML lists
      .replace(/^\* (.*$)/gm, `<li class="mb-1 ${isRTL ? 'mr-4' : 'ml-4'}">$1</li>`)
      .replace(/^- (.*$)/gm, `<li class="mb-1 ${isRTL ? 'mr-4' : 'ml-4'}">$1</li>`)
      
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">$1</a>')
      
      // Line breaks
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n/g, '<br>');

    // Wrap consecutive list items in ul tags
    html = html.replace(/(<li[^>]*>.*?<\/li>(?:\s*<li[^>]*>.*?<\/li>)*)/gs, `<ul class="list-none space-y-1 mb-4 ${isRTL ? 'text-right' : 'text-left'}">$1</ul>`);

    return html;
  };

  // Initialize Mermaid diagrams
  const initializeMermaid = async () => {
    if (mermaidInitialized) return;
    
    try {
      // Import Mermaid dynamically
      const mermaid = await import('mermaid');
      
      // Initialize Mermaid with RTL-aware configuration
      mermaid.default.initialize({
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'loose',
        fontFamily: isRTL ? 'Arial, sans-serif' : 'Arial, sans-serif',
        flowchart: {
          useMaxWidth: true,
          htmlLabels: true,
          curve: 'basis'
        },
        sequence: {
          useMaxWidth: true,
          rightAngles: false
        },
        gantt: {
          useMaxWidth: true
        }
      });

      setMermaidInitialized(true);

      // Find and render mermaid diagrams
      const containers = contentRef.current?.querySelectorAll('.mermaid-container');
      if (containers) {
        containers.forEach(async (container, index) => {
          const mermaidContent = container.getAttribute('data-mermaid');
          const diagramDiv = container.querySelector('.mermaid-diagram');
          
          if (mermaidContent && diagramDiv) {
            try {
              // Generate unique ID for each diagram
              const diagramId = `mermaid-diagram-${Date.now()}-${index}`;
              
              // Render the diagram
              const { svg } = await mermaid.default.render(diagramId, mermaidContent.trim());
              
              // Replace content with rendered SVG
              diagramDiv.innerHTML = svg;
              
              // Add RTL support to SVG if needed
              if (isRTL) {
                const svgElement = diagramDiv.querySelector('svg');
                if (svgElement) {
                  svgElement.setAttribute('dir', 'ltr'); // Keep diagrams LTR for readability
                  svgElement.style.direction = 'ltr';
                }
              }
              
            } catch (error) {
              console.error('Mermaid rendering error:', error);
              diagramDiv.innerHTML = `
                <div class="text-red-500 text-sm p-4 border border-red-200 rounded">
                  <strong>Error rendering diagram:</strong><br/>
                  ${error.message || 'Unknown error'}
                  <details class="mt-2">
                    <summary class="cursor-pointer">Show diagram code</summary>
                    <pre class="mt-2 text-xs bg-gray-100 p-2 rounded">${mermaidContent}</pre>
                  </details>
                </div>
              `;
            }
          }
        });
      }
    } catch (error) {
      console.warn('Mermaid not available, skipping diagram rendering:', error);
      
      // Fallback: Show code blocks instead of diagrams
      const containers = contentRef.current?.querySelectorAll('.mermaid-container');
      if (containers) {
        containers.forEach((container) => {
          const mermaidContent = container.getAttribute('data-mermaid');
          const diagramDiv = container.querySelector('.mermaid-diagram');
          
          if (mermaidContent && diagramDiv) {
            diagramDiv.innerHTML = `
              <div class="text-gray-600 text-sm p-4 border border-gray-200 rounded">
                <strong>Mermaid Diagram:</strong>
                <pre class="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto">${mermaidContent}</pre>
              </div>
            `;
          }
        });
      }
    }
  };

  useEffect(() => {
    const processed = parseMarkdown(content);
    setProcessedContent(processed);
  }, [content, isRTL]);

  useEffect(() => {
    if (isPreviewMode && processedContent && contentRef.current) {
      // Small delay to ensure DOM is updated
      setTimeout(initializeMermaid, 100);
    }
  }, [isPreviewMode, processedContent, mermaidInitialized]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success(t('common:notifications.success.copied', 'Copied to clipboard'));
    } catch (error) {
      toast.error(t('common:notifications.error.copyFailed', 'Failed to copy'));
    }
  };

  const togglePreview = () => {
    setIsPreviewMode(!isPreviewMode);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={textStart()}>
            <CardTitle className="flex items-center gap-2">
              {title || t('common:admin.systemPrompt', 'System Prompt')}
              {clientName && (
                <Badge variant="secondary" className="text-xs">
                  {clientName}
                </Badge>
              )}
            </CardTitle>
          </div>
          
          <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Button
              variant="outline"
              size="sm"
              onClick={togglePreview}
              className="h-8"
            >
              {isPreviewMode ? (
                <>
                  <EyeOff className="h-4 w-4 mr-1" />
                  {t('common:actions.showRaw', 'Raw')}
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-1" />
                  {t('common:actions.showPreview', 'Preview')}
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="h-8"
            >
              <Copy className="h-4 w-4 mr-1" />
              {t('common:actions.copy', 'Copy')}
            </Button>
            
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={onEdit}
                className="h-8"
              >
                <Edit className="h-4 w-4 mr-1" />
                {t('common:actions.edit', 'Edit')}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isPreviewMode ? (
          <div
            ref={contentRef}
            className={`prose prose-sm max-w-none dark:prose-invert ${isRTL ? 'prose-rtl' : ''}`}
            dir={isRTL ? "rtl" : "ltr"}
            dangerouslySetInnerHTML={{ __html: processedContent }}
          />
        ) : (
          <pre className={`whitespace-pre-wrap text-sm bg-gray-50 dark:bg-gray-800 p-4 rounded-md overflow-x-auto ${textStart()}`}>
            {content}
          </pre>
        )}
        
        {!content && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>{t('common:admin.noSystemPrompt', 'No system prompt configured')}</p>
            <p className="text-sm mt-2">
              {t('common:admin.clickEditToAdd', 'Click edit to add system prompt content')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 