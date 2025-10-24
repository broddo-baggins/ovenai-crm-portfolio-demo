import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X, Sparkles, Mail, User, Building, Calendar, Phone, ArrowLeft, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { handleEarlyAccessSubmission } from "../../../functions/api/early-access-submit";

interface EarlyAccessFormProps {
  isOpen: boolean;
  onClose: () => void;
  language?: 'he' | 'en';
}

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  company: string;
  message?: string;
}

// Google Form Configuration
// HOW TO USE:
// 1. Create a Google Form and get the shareable URL
// 2. Replace the URLs below with your actual form URLs
// 3. Set useGoogleForm to true
// 4. Choose preferEmbed (true = embed in modal, false = redirect to new tab)
const GOOGLE_FORM_CONFIG = {
  // Your actual Google Form URLs
  formUrl: 'https://docs.google.com/forms/d/1ZX2b4UjtrZv12ubZIXPII1KAvG4jeYCkvB3THza5POU/prefill', // Regular form URL
  embedUrl: 'https://docs.google.com/forms/d/e/1FAIpQLScl9iPmscesYj0Yr8r77nl-ayaCnmFOJpmVsHElFY8Slum1Rg/viewform?embedded=true', // Embed URL
  useGoogleForm: true, // SUCCESS ENABLED - Uses Google Form
  preferEmbed: true // SUCCESS EMBED - Shows form in modal (set to false for redirect)
};

const translations = {
  he: {
    title: "בקשת גישה מוקדמת",
    subtitle: "אנא בחרו את הדרך המועדפת עליכם:",
    scheduleTitle: "תיאום פגישה עם ולד",
    scheduleSubtitle: "קבעו פגישה ישירה עם ולד, מנכ\"ל OvenAI",
    scheduleButton: "קביעת פגישה",
    detailsTitle: "השארת פרטים",
    detailsSubtitle: "השאירו פרטים ונחזור אליכם בהקדם",
    detailsButton: "השארת פרטים",
    fullName: "שם מלא",
    email: "כתובת מייל",
    phone: "מספר טלפון",
    company: "שם החברה",
    message: "הודעה נוספת (אופציונלי)",
    submit: "שליחת בקשה",
    back: "חזרה",
    close: "סגירה",
    success: "הבקשה נשלחה בהצלחה! נחזור אליכם בהקדם",
    error: "שגיאה בשליחת הבקשה. נסו שוב מאוחר יותר",
    required: "שדה חובה",
    invalidEmail: "כתובת מייל לא תקינה",
    invalidPhone: "מספר טלפון לא תקין",
    placeholders: {
      fullName: "לדוגמה: יוסי כהן",
      email: "your.email@company.com",
      phone: "050-1234567",
      company: "לדוגמה: חברת השקעות ABC",
      message: "ספרו לנו על הצרכים שלכם..."
    }
  },
  en: {
    title: "Early Access Request",
    subtitle: "Please choose your preferred option:",
    scheduleTitle: "Schedule Meeting with Vlad",
    scheduleSubtitle: "Book a direct meeting with Vlad, CEO of OvenAI",
    scheduleButton: "Schedule Meeting",
    detailsTitle: "Leave Details",
    detailsSubtitle: "Leave your details and we'll get back to you soon",
    detailsButton: "Leave Details",
    fullName: "Full Name",
    email: "Email Address",
    phone: "Phone Number",
    company: "Company Name",
    message: "Additional Message (Optional)",
    submit: "Submit Request",
    back: "Back",
    close: "Close",
    success: "Request submitted successfully! We'll get back to you soon",
    error: "Error submitting request. Please try again later",
    required: "Required field",
    invalidEmail: "Invalid email address",
    invalidPhone: "Invalid phone number",
    placeholders: {
      fullName: "e.g. John Doe",
      email: "your.email@company.com",
      phone: "+1-555-0123",
      company: "e.g. ABC Investments",
      message: "Tell us about your needs..."
    }
  }
};

type FlowType = 'choice' | 'schedule' | 'details' | 'googleForm';

export const EarlyAccessForm: React.FC<EarlyAccessFormProps> = ({
  isOpen,
  onClose,
  language = 'he'
}) => {
  const [currentFlow, setCurrentFlow] = useState<FlowType>('choice');
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    phone: '',
    company: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  
  const t = translations[language];
  const isRTL = language === 'he';

  const handleClose = () => {
    setCurrentFlow('choice');
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      company: '',
      message: ''
    });
    setErrors({});
    onClose();
  };

  const handleScheduleMeeting = () => {
    // Open Vlad's Calendly in a new tab
    window.open('https://calendly.com/vladtzadik', '_blank');
    handleClose();
  };

  const handleLeaveDetails = () => {
    if (GOOGLE_FORM_CONFIG.useGoogleForm) {
      if (GOOGLE_FORM_CONFIG.preferEmbed) {
        // Show embedded Google Form
        setCurrentFlow('googleForm');
      } else {
        // Redirect to Google Form
        window.open(GOOGLE_FORM_CONFIG.formUrl, '_blank');
        handleClose();
      }
    } else {
      // Use the original form flow
      setCurrentFlow('details');
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = t.required;
    }
    
    if (!formData.email.trim()) {
      newErrors.email = t.required;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t.invalidEmail;
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = t.required;
    } else if (!/^[+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/[-\s()]/g, ''))) {
      newErrors.phone = t.invalidPhone;
    }
    
    if (!formData.company.trim()) {
      newErrors.company = t.required;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const result = await handleEarlyAccessSubmission({
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        company: formData.company,
        message: formData.message,
        language,
        submittedAt: new Date().toISOString()
      });

      if (result.success) {
        toast.success(t.success);
        handleClose();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error(t.error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const renderChoiceFlow = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Schedule Meeting Option */}
        <div className={`p-6 border rounded-lg hover:shadow-md transition-shadow ${isRTL ? 'text-right' : 'text-left'}`}>
          <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} gap-3 mb-3`}>
            <Calendar className="h-8 w-8 text-blue-600" />
            <h4 className="font-semibold text-lg">{t.scheduleTitle}</h4>
          </div>
          <p className="text-gray-600 mb-4">{t.scheduleSubtitle}</p>
          <Button 
            onClick={handleScheduleMeeting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} gap-2`}>
              <Calendar className="h-4 w-4" />
              {t.scheduleButton}
              <ExternalLink className="h-4 w-4" />
            </div>
          </Button>
        </div>

        {/* Leave Details Option */}
        <div className={`p-6 border rounded-lg hover:shadow-md transition-shadow ${isRTL ? 'text-right' : 'text-left'}`}>
          <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} gap-3 mb-3`}>
            <User className="h-8 w-8 text-green-600" />
            <h4 className="font-semibold text-lg">{t.detailsTitle}</h4>
          </div>
          <p className="text-gray-600 mb-4">{t.detailsSubtitle}</p>
          <Button 
            onClick={handleLeaveDetails}
            variant="outline"
            className="w-full border-green-600 text-green-600 hover:bg-green-50"
          >
            <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} gap-2`}>
              <User className="h-4 w-4" />
              {t.detailsButton}
            </div>
          </Button>
        </div>
      </div>
    </div>
  );

  const renderGoogleForm = () => (
    <div className="space-y-4">
      <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} gap-2 mb-4`}>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setCurrentFlow('choice')}
          className={`${isRTL ? 'ml-auto' : 'mr-auto'}`}
        >
          <ArrowLeft className="h-4 w-4" />
          {t.back}
        </Button>
      </div>
      
      <div className="space-y-2">
        <h3 className={`text-lg font-semibold ${isRTL ? 'text-right' : 'text-left'}`}>
          {t.detailsTitle}
        </h3>
        <p className={`text-gray-600 ${isRTL ? 'text-right' : 'text-left'}`}>
          {t.detailsSubtitle}
        </p>
      </div>
      
      <div className="w-full h-[500px] border rounded-lg overflow-hidden">
        <iframe
          src={GOOGLE_FORM_CONFIG.embedUrl}
          width="100%"
          height="100%"
          frameBorder="0"
          marginHeight={0}
          marginWidth={0}
          className="bg-white"
        >
          Loading...
        </iframe>
      </div>
      
      <div className={`text-center ${isRTL ? 'text-right' : 'text-left'}`}>
        <p className="text-sm text-gray-500">
          {language === 'he' ? 'לא רואים את הטופס?' : 'Can\'t see the form?'}{' '}
          <a
            href={GOOGLE_FORM_CONFIG.formUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            {language === 'he' ? 'לחצו כאן' : 'Click here'}
          </a>
        </p>
      </div>
    </div>
  );

  const renderDetailsFlow = () => (
    <div className="space-y-4">
      <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} gap-2 mb-4`}>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setCurrentFlow('choice')}
          className={`${isRTL ? 'ml-auto' : 'mr-auto'}`}
        >
          <ArrowLeft className="h-4 w-4" />
          {t.back}
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name */}
        <div className="space-y-2">
          <Label htmlFor="fullName" className={`text-sm font-medium flex items-center ${isRTL ? 'flex-row-reverse' : ''} gap-2`}>
            <User className="h-4 w-4" />
            {t.fullName}
          </Label>
          <Input
            id="fullName"
            type="text"
            value={formData.fullName}
            onChange={(e) => handleInputChange('fullName', e.target.value)}
            placeholder={t.placeholders.fullName}
            className={`${isRTL ? 'text-right' : 'text-left'} ${errors.fullName ? 'border-red-500' : ''}`}
            dir={isRTL ? 'rtl' : 'ltr'}
          />
          {errors.fullName && (
            <p className="text-sm text-red-500">{errors.fullName}</p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email" className={`text-sm font-medium flex items-center ${isRTL ? 'flex-row-reverse' : ''} gap-2`}>
            <Mail className="h-4 w-4" />
            {t.email}
          </Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder={t.placeholders.email}
            className={`${isRTL ? 'text-right' : 'text-left'} ${errors.email ? 'border-red-500' : ''}`}
            dir="ltr" // Email is always LTR
          />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email}</p>
          )}
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <Label htmlFor="phone" className={`text-sm font-medium flex items-center ${isRTL ? 'flex-row-reverse' : ''} gap-2`}>
            <Phone className="h-4 w-4" />
            {t.phone}
          </Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            placeholder={t.placeholders.phone}
            className={`${isRTL ? 'text-right' : 'text-left'} ${errors.phone ? 'border-red-500' : ''}`}
            dir="ltr" // Phone is always LTR
          />
          {errors.phone && (
            <p className="text-sm text-red-500">{errors.phone}</p>
          )}
        </div>

        {/* Company */}
        <div className="space-y-2">
          <Label htmlFor="company" className={`text-sm font-medium flex items-center ${isRTL ? 'flex-row-reverse' : ''} gap-2`}>
            <Building className="h-4 w-4" />
            {t.company}
          </Label>
          <Input
            id="company"
            type="text"
            value={formData.company}
            onChange={(e) => handleInputChange('company', e.target.value)}
            placeholder={t.placeholders.company}
            className={`${isRTL ? 'text-right' : 'text-left'} ${errors.company ? 'border-red-500' : ''}`}
            dir={isRTL ? 'rtl' : 'ltr'}
          />
          {errors.company && (
            <p className="text-sm text-red-500">{errors.company}</p>
          )}
        </div>

        {/* Message */}
        <div className="space-y-2">
          <Label htmlFor="message" className={`text-sm font-medium flex items-center ${isRTL ? 'flex-row-reverse' : ''} gap-2`}>
            <Mail className="h-4 w-4" />
            {t.message}
          </Label>
          <Textarea
            id="message"
            value={formData.message}
            onChange={(e) => handleInputChange('message', e.target.value)}
            placeholder={t.placeholders.message}
            rows={3}
            className={`${isRTL ? 'text-right' : 'text-left'} resize-none`}
            dir={isRTL ? 'rtl' : 'ltr'}
          />
        </div>

        {/* Submit Button */}
        <div className={`flex gap-3 pt-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                {isRTL ? 'שולח...' : 'Submitting...'}
              </div>
            ) : (
              t.submit
            )}
          </Button>
        </div>
      </form>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={`max-w-2xl mx-auto ${isRTL ? 'text-right' : 'text-left'}`}>
        <DialogHeader>
          <DialogTitle className={`text-2xl font-bold text-gray-900 dark:text-gray-100 ${isRTL ? 'text-right' : 'text-left'}`}>
            <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} gap-2`}>
              <Sparkles className="h-6 w-6 text-blue-600" />
              {t.title}
            </div>
          </DialogTitle>
          {currentFlow === 'choice' && (
            <DialogDescription className={`text-gray-600 dark:text-gray-400 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t.subtitle}
            </DialogDescription>
          )}
        </DialogHeader>
        
        {currentFlow === 'choice' && renderChoiceFlow()}
        {currentFlow === 'details' && renderDetailsFlow()}
        {currentFlow === 'googleForm' && renderGoogleForm()}
      </DialogContent>
    </Dialog>
  );
}; 