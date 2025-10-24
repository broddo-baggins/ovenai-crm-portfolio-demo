import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EarlyAccessForm } from "@/components/ui/EarlyAccessForm";
import { 
  Sparkles, 
  Users, 
  Clock, 
  Target, 
  MessageSquare, 
  BarChart3, 
  Shield, 
  Globe, 
  Zap,
  Bot,
  User,
  Settings,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronUp
} from "lucide-react";

export const HebrewLandingPage: React.FC = () => {
  const [isEarlyAccessOpen, setIsEarlyAccessOpen] = useState(false);
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  const features = [
    {
      icon: <User className="h-8 w-8 text-blue-600" />,
      title: "סוכן ייעודי לכל פרויקט",
      description: "באמצעות איפיון מדויק ובהתאם לשפה ולאופי הפרויקט וכמובן לפי מתודולוגיית המכירה שלך"
    },
    {
      icon: <Bot className="h-8 w-8 text-green-600" />,
      title: "אנחנו לא צ'אט בוט",
      description: "AI חכם המדמה מסע שיחה אנושי וחותר למטרה - נקודות הקלדה, עיכובים טבעיים, זיכרון הקשרי"
    },
    {
      icon: <Clock className="h-8 w-8 text-purple-600" />,
      title: "פעיל וזמין 24/7",
      description: "תגובות מיידיות סביב השעון גם ב-02:00 כדי לא להחמיץ אף ליד"
    }
  ];

  const additionalFeatures = [
    {
      icon: <Settings className="h-6 w-6 text-blue-600" />,
      title: "אינטגרציה מלאה ל-CRM",
      description: "תיעוד אוטומטי של כל השיחות, עדכון סטטוס ויצירת משימות"
    },
    {
      icon: <BarChart3 className="h-6 w-6 text-green-600" />,
      title: "דשבורד מתקדם",
      description: "מעקב בזמן אמת, KPI'S, אנליטיקות A/B טסט"
    },
    {
      icon: <Globe className="h-6 w-6 text-purple-600" />,
      title: "תמיכה בשפות מרובות",
      description: "NLP מתקדם בלמעלה מ-50 שפות עם זיכרון הקשרי"
    },
    {
      icon: <Shield className="h-6 w-6 text-red-600" />,
      title: "אבטחה ופרטיות",
      description: "הצפנה, גיבויים וציות לתקנים בינלאומיים"
    }
  ];

  const processSteps = [
    {
      number: "1",
      title: "בחר פרויקט ואפיין סקריפטים",
      description: "העלה תבניות פתיחה, תסריטי שיחה, שאלות נפוצות ותמלולי שיחות"
    },
    {
      number: "2", 
      title: "טעינת לידים",
      description: "ייבא לידים מוכשרים (CSV או API מכל מקור) והגדר פרמטרי יצירת קשר"
    },
    {
      number: "3",
      title: "חימום ושיחה אוטומטית",
      description: "OvenAI מנהלת שיחות מותאמות אישית 24/7, מזהה כוונות ומחממת לידים"
    },
    {
      number: "4",
      title: "תיאום פגישות",
      description: "הלקוח קובע פגישה ביומן של מנהל המכירות – אינטגרציה מלאה, ללא מאמץ ידני"
    }
  ];

  const faqItems = [
    {
      question: "איך משתלבת המערכת עם מערכות קיימות?",
      answer: "חיבור בלחיצות פשוטות ל-CRM (Salesforce, HubSpot וכו'), API ו-Webhooks להזנה אוטומטית."
    },
    {
      question: "כמה זמן לוקח להטמיע?",
      answer: "הכנה ראשונית בתוך דקות, תוצאות ראשוניות כבר בשבוע הראשון לשימוש."
    },
    {
      question: "איך מבטיחים פרטיות ואבטחה?",
      answer: "הצפנה מקצה-לקצה, גיבויים, ציות לתקנים (GDPR, Meta, תקנות מקומיות)."
    },
    {
      question: "איך מתאימים לענף שלי?",
      answer: "Wizard חכם לבחירת טון ושאלות לפי פרופיל העסק; ניתן ליצור תסריטים ענפיים באופן דינמי."
    },
    {
      question: "כמה שפות נתמכות ומה זה זיכרון קשרי?",
      answer: "50+ שפות, NLP מתקדם; AI זוכר ומעדכן את מצב הליד בזמן אמת כדי לנהל שיחה המשכית יותר."
    },
    {
      question: "מהן העלויות ואיך משדרגים חבילות?",
      answer: "סימולציה חינמית ללא אשראי; חבילות סטנדרט, פרמיום וארגוני לפי נפח ושימוש."
    },
    {
      question: "עד כמה המערכת מתמודדת עם נפחי הודעות גדולים?",
      answer: "ארכיטקטורה עננית המותאמת להרחבה דינמית לפי דרישה."
    }
  ];

  const toggleFAQ = (index: number) => {
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800" dir="rtl">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              OvenAI
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-4">
              מערכת מבוססת בינה מלאכותית המתקדמת בעולם
            </p>
            <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 mb-8 max-w-4xl mx-auto leading-relaxed">
              מערכת AI אוטונומית המייעלת את מחלקות השירות והמכירות, מותאמת אישית עבור הצרכים שלך,
              משפרת את אחוזי הסגירה ומחממת לידים - ללא צורך בכח אדם נוסף
            </p>
            <Button 
              size="lg" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg"
              onClick={() => setIsEarlyAccessOpen(true)}
            >
              נסו עכשיו בחינם
            </Button>
          </div>
        </div>
      </section>

      {/* Why OvenAI Section */}
      <section className="py-20 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
              למה הבאז סביב OvenAI
            </h2>
            <div className="max-w-4xl mx-auto">
              <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
                פירקנו את מסע הלקוח המסורתי והטמענו טכנולוגיות AI מהפכניות כדי להאיץ חימום לידים ואנליזה מתקדמת.
              </p>
              <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
                OvenAI מנתחת כל שלב בשיחה ומשפרת כל אינטראקציה כך שמנהל המכירות מגיע מוכן לפגישה עם כל הנתונים הרלוונטיים.
              </p>
              <p className="text-xl font-semibold text-blue-600 dark:text-blue-400 mt-8">
                אנחנו לא צ'אטבוט. אנחנו צוות המכירות המסור שלך שאף פעם לא ישן
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {features.map((feature, index) => (
              <Card key={index} className="text-center p-8 hover:shadow-lg transition-shadow">
                <CardContent className="space-y-4">
                  <div className="flex justify-center">{feature.icon}</div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Additional Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {additionalFeatures.map((feature, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                <CardContent className="space-y-3">
                  <div className="flex justify-center">{feature.icon}</div>
                  <h4 className="font-semibold text-gray-900 dark:text-white text-center">
                    {feature.title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
              צאו לדרך בשלבים פשוטים
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {processSteps.map((step, index) => (
              <Card key={index} className="relative p-6 hover:shadow-lg transition-shadow">
                <CardContent className="space-y-4">
                  <div className="flex justify-center">
                    <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-lg font-bold">
                      {step.number}
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-center text-sm">
                    {step.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button 
              size="lg" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg"
              onClick={() => setIsEarlyAccessOpen(true)}
            >
              נסו עכשיו בחינם
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
              שאלות נפוצות
            </h2>
          </div>
          
          <div className="space-y-4">
            {faqItems.map((item, index) => (
              <Card key={index} className="overflow-hidden">
                <CardContent className="p-0">
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full p-6 text-right hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {expandedFAQ === index ? (
                          <ChevronUp className="h-5 w-5 text-gray-500" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-500" />
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {item.question}
                      </h3>
                    </div>
                  </button>
                  
                  {expandedFAQ === index && (
                    <div className="px-6 pb-6">
                      <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                        {item.answer}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            שדרגו את תהליך המכירה שלכם
          </h2>
          <p className="text-xl mb-8 leading-relaxed">
            העולם מתקדם ואנחנו פה כדי לעזור לכם להטמיע בינה מלאכותית בארגון שלכם כדי לקחת אותו לצעד הבא
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg"
            onClick={() => setIsEarlyAccessOpen(true)}
          >
            נסו עכשיו בחינם
          </Button>
        </div>
      </section>

      {/* Early Access Form */}
      <EarlyAccessForm 
        isOpen={isEarlyAccessOpen}
        onClose={() => setIsEarlyAccessOpen(false)}
        language="he"
      />
    </div>
  );
}; 