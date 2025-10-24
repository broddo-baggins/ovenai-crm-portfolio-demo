import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useLang } from '@/hooks/useLang';
import { useRTL } from '@/contexts/RTLContext';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Globe } from 'lucide-react';

export const LanguageToggle: React.FC = () => {
  const { language, setLang, isRTL, textStart } = useLang();
  const { setIsRTL } = useRTL();
  const { t } = useTranslation('common');
  const [isChanging, setIsChanging] = useState(false);

  const toggleLanguage = async () => {
    if (isChanging) return;
    
    setIsChanging(true);
    try {
      const newLang = language === 'en' ? 'he' : 'en';
      const newIsRTL = newLang === 'he';
      
      console.log(`WEB Language toggle: Switching from ${language} to ${newLang}`);
      
      // Update both i18n language and RTL context
      await setLang(newLang as 'en' | 'he');
      setIsRTL(newIsRTL);
      
      
    } catch (error) {
      console.error('ERROR Language toggle: Failed to switch language:', error);
    } finally {
      setIsChanging(false);
    }
  };

  const getCurrentLanguageLabel = () => {
    if (isChanging) return '...';
    return language === 'en' 
      ? t('language.switchToHebrew', 'עברית') 
      : t('language.switchToEnglish', 'English');
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      disabled={isChanging}
      className={cn(
        "font-medium gap-2 transition-all duration-200",
        isRTL && "flex-row-reverse font-hebrew",
        textStart(),
        isChanging && "opacity-50 cursor-not-allowed"
      )}
      dir={isRTL ? 'rtl' : 'ltr'}
      title={isChanging ? 'Switching language...' : t('language.toggleTooltip', 'Switch language')}
    >
      <Globe className="h-4 w-4" />
      <span className={cn(
        "transition-all duration-200",
        language === 'he' && "font-hebrew"
      )}>
        {getCurrentLanguageLabel()}
      </span>
    </Button>
  );
}; 
