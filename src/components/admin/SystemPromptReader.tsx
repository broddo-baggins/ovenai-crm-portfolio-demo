import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Target, User, Zap, MessageSquare, Settings, FileText, Lightbulb, Shield, Calendar, TrendingUp, Database } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { SystemPromptMarkdownRenderer } from './SystemPromptMarkdownRenderer';

interface SystemPromptReaderProps {
  systemPrompt: string;
  clientName?: string;
  onEdit?: () => void;
}

interface SystemPromptSection {
  title: string;
  content: string;
  icon: React.ReactNode;
  collapsed: boolean;
}

export const SystemPromptReader: React.FC<SystemPromptReaderProps> = ({
  systemPrompt,
  clientName,
  onEdit
}) => {
  const { t, i18n } = useTranslation(['pages', 'common']);
  const isRTL = i18n.language === 'he';
  
  const [isClientCollapsed, setIsClientCollapsed] = useState(false);
  const [sectionStates, setSectionStates] = useState<Record<string, boolean>>({});

  // Parse system prompt into sections with improved patterns
  const sections = useMemo(() => {
    if (!systemPrompt || systemPrompt.trim() === '') {
      return [];
      }

    // Enhanced section patterns that match more variations
    const sectionPatterns = [
      { patterns: [/## Primary Goal\s*\n(.*?)(?=##|\n\n|$)/s, /Primary Goal:?\s*\n(.*?)(?=##|\n\n|$)/s], title: 'Primary Goal', icon: <Target className="h-4 w-4" /> },
      { patterns: [/## Current user state\s*\n(.*?)(?=##|\n\n|$)/s, /Current User State:?\s*\n(.*?)(?=##|\n\n|$)/s], title: 'Current User State', icon: <User className="h-4 w-4" /> },
      { patterns: [/## State-Aware Communication\s*\n(.*?)(?=##|\n\n|$)/s, /State-Aware Communication:?\s*\n(.*?)(?=##|\n\n|$)/s], title: 'State-Aware Communication', icon: <MessageSquare className="h-4 w-4" /> },
      { patterns: [/## Value Proposition\s*\n(.*?)(?=##|\n\n|$)/s, /Value Proposition:?\s*\n(.*?)(?=##|\n\n|$)/s], title: 'Value Proposition', icon: <TrendingUp className="h-4 w-4" /> },
      { patterns: [/## BANT Qualification Process\s*\n(.*?)(?=##|\n\n|$)/s, /BANT Qualification Process:?\s*\n(.*?)(?=##|\n\n|$)/s], title: 'BANT Qualification Process', icon: <Shield className="h-4 w-4" /> },
      { patterns: [/## Meeting Scheduling Protocol\s*\n(.*?)(?=##|\n\n|$)/s, /Meeting Scheduling Protocol:?\s*\n(.*?)(?=##|\n\n|$)/s], title: 'Meeting Scheduling Protocol', icon: <Calendar className="h-4 w-4" /> },
      { patterns: [/## Smart Escalation Triggers\s*\n(.*?)(?=##|\n\n|$)/s, /Smart Escalation Triggers:?\s*\n(.*?)(?=##|\n\n|$)/s], title: 'Smart Escalation Triggers', icon: <Zap className="h-4 w-4" /> },
      { patterns: [/## Project Details\s*\n(.*?)(?=##|\n\n|$)/s, /Project Details:?\s*\n(.*?)(?=##|\n\n|$)/s], title: 'Project Details', icon: <Database className="h-4 w-4" /> },
      { patterns: [/## Role\s*\n(.*?)(?=##|\n\n|$)/s, /Role:?\s*\n(.*?)(?=##|\n\n|$)/s], title: 'Role', icon: <User className="h-4 w-4" /> },
      { patterns: [/## Capabilities\s*\n(.*?)(?=##|\n\n|$)/s, /Capabilities:?\s*\n(.*?)(?=##|\n\n|$)/s], title: 'Capabilities', icon: <Zap className="h-4 w-4" /> },
      { patterns: [/## Communication Style\s*\n(.*?)(?=##|\n\n|$)/s, /Communication Style:?\s*\n(.*?)(?=##|\n\n|$)/s], title: 'Communication Style', icon: <MessageSquare className="h-4 w-4" /> },
      { patterns: [/## Guidelines\s*\n(.*?)(?=##|\n\n|$)/s, /Guidelines:?\s*\n(.*?)(?=##|\n\n|$)/s], title: 'Guidelines', icon: <Settings className="h-4 w-4" /> },
      { patterns: [/## Examples\s*\n(.*?)(?=##|\n\n|$)/s, /Examples:?\s*\n(.*?)(?=##|\n\n|$)/s], title: 'Examples', icon: <FileText className="h-4 w-4" /> },
      { patterns: [/## Instructions\s*\n(.*?)(?=##|\n\n|$)/s, /Instructions:?\s*\n(.*?)(?=##|\n\n|$)/s], title: 'Instructions', icon: <Lightbulb className="h-4 w-4" /> },
      { patterns: [/## Response Format\s*\n(.*?)(?=##|\n\n|$)/s, /Response Format:?\s*\n(.*?)(?=##|\n\n|$)/s], title: 'Response Format', icon: <FileText className="h-4 w-4" /> },
      { patterns: [/## Context\s*\n(.*?)(?=##|\n\n|$)/s, /Context:?\s*\n(.*?)(?=##|\n\n|$)/s], title: 'Context', icon: <MessageSquare className="h-4 w-4" /> },
    ];

    const foundSections: SystemPromptSection[] = [];
    let remainingContent = systemPrompt;

    // Find all sections with improved matching
    sectionPatterns.forEach(({ patterns, title, icon }) => {
      for (const pattern of patterns) {
        const match = remainingContent.match(pattern);
        if (match) {
          foundSections.push({
            title,
            content: match[1]?.trim() || '',
            icon,
            collapsed: false
          });
          // Remove this section from remaining content
          remainingContent = remainingContent.replace(pattern, '');
          break; // Stop after first match
      }
    }
    });

    // If no sections found, try to split by common patterns
    if (foundSections.length === 0) {
      const sections = systemPrompt.split(/\n\n(?=[A-Z])/);
      sections.forEach((section, index) => {
        if (section.trim()) {
          const title = section.split('\n')[0].replace(/^[#\s]*/, '').trim();
          const content = section.split('\n').slice(1).join('\n').trim();
          
          if (title && content) {
            foundSections.push({
              title: title.substring(0, 50), // Limit title length
              content,
              icon: <FileText className="h-4 w-4" />,
              collapsed: false
            });
    }
        }
      });
    }

    // Add any remaining content as a "General" section
    const cleanedRemainingContent = remainingContent
      .replace(/^#{1,6}\s*$/gm, '') // Remove empty headers
      .replace(/\n{3,}/g, '\n\n') // Reduce multiple newlines
      .trim();

    if (cleanedRemainingContent && cleanedRemainingContent.length > 50) {
      foundSections.push({
        title: 'Additional Information',
        content: cleanedRemainingContent,
        icon: <FileText className="h-4 w-4" />,
        collapsed: false
      });
    }

    return foundSections;
  }, [systemPrompt]);

  const toggleSection = (title: string) => {
    setSectionStates(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  const isSectionCollapsed = (title: string) => {
    return sectionStates[title] || false;
  };

  // If no sections found, fall back to full content rendering
  if (sections.length === 0) {
        return (
      <div className="space-y-4">
        <Card className="border-2 border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-3">
            <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className={`flex items-center space-x-3 ${isRTL ? 'space-x-reverse' : ''}`}>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {t('common:admin.systemPrompts')}
                  </h2>
                  {clientName && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t('pages:client')}: <span className="font-medium">{clientName}</span>
                    </p>
                  )}
                </div>
              </div>
              <div className={`flex items-center space-x-2 ${isRTL ? 'space-x-reverse' : ''}`}>
                <Badge variant="secondary">
                  System Prompt
                </Badge>
                {onEdit && (
                  <Button onClick={onEdit} variant="outline" size="sm">
                    {t('common:actions.edit')}
                  </Button>
                )}
              </div>
          </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <SystemPromptMarkdownRenderer 
              content={systemPrompt}
              clientName={clientName}
            />
          </CardContent>
        </Card>
          </div>
        );
    }

  return (
    <div className="space-y-4">
      {/* Main Client Card */}
      <Card className="border-2 border-blue-200 dark:border-blue-800">
        <CardHeader className="pb-3">
          <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className={`flex items-center space-x-3 ${isRTL ? 'space-x-reverse' : ''}`}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsClientCollapsed(!isClientCollapsed)}
                className="h-8 w-8 p-0"
              >
                {isClientCollapsed ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronUp className="w-4 h-4" />
                )}
              </Button>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {t('common:admin.systemPrompts')}
                </h2>
                {clientName && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('pages:client')}: <span className="font-medium">{clientName}</span>
                  </p>
                )}
              </div>
            </div>
            <div className={`flex items-center space-x-2 ${isRTL ? 'space-x-reverse' : ''}`}>
              <Badge variant="secondary">
                System Prompt
              </Badge>
              {onEdit && (
                <Button onClick={onEdit} variant="outline" size="sm">
                  {t('common:actions.edit')}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        {!isClientCollapsed && (
          <CardContent className="space-y-4">
            <div className="space-y-4">
              {sections.map((section, index) => (
                <Card key={index} className="border border-gray-200 dark:border-gray-700">
                  <CardHeader className="pb-2">
              <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div className={`flex items-center space-x-3 ${isRTL ? 'space-x-reverse' : ''}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleSection(section.title)}
                            className="h-8 w-8 p-0"
                          >
                          {isSectionCollapsed(section.title) ? (
                            <ChevronDown className="w-4 h-4" />
                            ) : (
                            <ChevronUp className="w-4 h-4" />
                            )}
                          </Button>
                        <div className={`flex items-center space-x-2 ${isRTL ? 'space-x-reverse' : ''}`}>
                          {section.icon}
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {section.title}
                          </h3>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {section.content.length} chars
                      </Badge>
                      </div>
                    </CardHeader>
                  
                  {!isSectionCollapsed(section.title) && (
                    <CardContent className="pt-2">
                      <SystemPromptMarkdownRenderer 
                        content={section.content}
                        clientName={clientName}
                      />
                      </CardContent>
                    )}
                  </Card>
              ))}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}; 