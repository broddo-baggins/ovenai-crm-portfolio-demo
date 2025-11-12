import React, { useEffect, useMemo, useCallback, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet-async";
import CountUp from "react-countup";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { LanguageToggle } from "@/components/common/LanguageToggle";
import { TypingDots } from "@/components/common/TypingDots";
import { ChatMockup } from "@/components/common/ChatMockup";
import { AnimatedShinyText } from "@/components/ui/animated-shiny-text";
import IntegrationVisualization from "@/components/landing/IntegrationVisualization";
import FAQ from "@/components/landing/FAQ";
import { TextRevealByWord } from "@/components/ui/text-reveal";
import { RippleButton } from "@/components/ui/ripple-button";
import { Meteors } from "@/components/ui/meteors";
import { ShinyButton } from "@/components/ui/shiny-button";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { EarlyAccessForm } from "@/components/ui/EarlyAccessForm";
import { GeminiAgent } from "@/components/agent/GeminiAgent";
import { useAuth } from "@/context/ClientAuthContext";
import { requestDemo } from "@/utils/email-helper";
import {
  Building2,
  MessageSquare,
  Clock,
  BarChart3,
  Target,
  Zap,
  CheckCircle2,
  Calendar,
  TrendingUp,
  Timer,
  Languages,
  FileText,
  Palette,
  Rocket,
  Upload,
  MousePointer,
  Bot,
  Star,
  Eye,
  Crown,
  Shield,
  Sparkles,
} from "lucide-react";
import { ProgressWithLoading } from "@/components/ui/progress-with-loading";

const LandingPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { t, i18n, ready } = useTranslation("landing");
  const [error, setError] = useState<string | null>(null);
  const [isEarlyAccessOpen, setIsEarlyAccessOpen] = useState(false);
  const [isAgentOpen, setIsAgentOpen] = useState(false);
  const isHebrew = i18n?.language === "he";

  // Enhanced animation states
  const [typingText, setTypingText] = useState("");
  const [textIndex, setTextIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCursor, setShowCursor] = useState(true);

  // Scroll-based animations
  const { scrollY } = useScroll();
  const statsParallax = useTransform(scrollY, [0, 500], [0, -50]);

  // Typing animation texts - focused on "AI-powered business system"
  const heroTexts = useMemo(
    () =>
      isHebrew
        ? [
            "מחייה לידים קרים ומתעניינים ישנים ביעילות...",
            "מחמם לידים חדשים באמצעות תסריט שיחה עם מסע אנושי...",
            "הלקוח קובע פגישה ביומן של מנהל המכירות...",
            "מנהל המכירות מקבל בלייב סיכום שיחה...",
            "צוות המכירות המסור שלך שאף פעם לא ישן...",
          ]
        : [
            "Efficiently reviving your cold leads and old prospects...",
            "Warming new leads using conversation scripts with human journey...",
            "Client schedules meeting in sales manager's calendar...",
            "Sales manager receives live conversation summary...",
            "Your dedicated sales team that never sleeps...",
          ],
    [isHebrew],
  );

  // Removed auth redirect - allow viewing landing page even when authenticated
  // useEffect(() => {
  //   if (isAuthenticated) {
  //     navigate("/dashboard");
  //   }
  // }, [isAuthenticated, navigate]);

  // Enhanced typing animation effect
  useEffect(() => {
    const currentText = heroTexts[textIndex];
    const timeout = setTimeout(
      () => {
        if (!isDeleting) {
          if (charIndex < currentText.length) {
            setTypingText(currentText.substring(0, charIndex + 1));
            setCharIndex(charIndex + 1);
          } else {
            setTimeout(() => setIsDeleting(true), 2000);
          }
        } else {
          if (charIndex > 0) {
            setTypingText(currentText.substring(0, charIndex - 1));
            setCharIndex(charIndex - 1);
          } else {
            setIsDeleting(false);
            setTextIndex((textIndex + 1) % heroTexts.length);
          }
        }
      },
      isDeleting ? 50 : 100,
    );

    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, textIndex, heroTexts]);

  // Cursor blinking effect
  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Memoize animation variants
  const slideUpVariants = useMemo(
    () => ({
      hidden: { opacity: 0, y: 40 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, ease: "easeOut" as const },
      },
    }),
    [],
  );

  const staggerContainer = useMemo(
    () => ({
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: 0.2,
        },
      },
    }),
    [],
  );

  // Memoize static data
  const benefitIcons = useMemo(
    () => ({
      time: Timer,
      chart: TrendingUp,
      calendar: Calendar,
      language: Languages,
    }),
    [],
  );

  const processIcons = useMemo(
    () => [
      FileText, // Step 1: Gather Your Knowledge
      Palette, // Step 2: Design the Agent
      Rocket, // Step 3: Deploy & Optimize
    ],
    [],
  );

  const howItWorksIcons = useMemo(
    () => [
      Upload, // Step 1: Upload/Connect
      MousePointer, // Step 2: Configure/Click
      Zap, // Step 3: Launch/Go Live
    ],
    [],
  );

  // Memoize fallback data
  const fallbackData = useMemo(
    () => ({
      benefits: [
        {
          title: "Reduce manual follow-up work by 70%",
          description:
            "Let your team focus on closing deals while CRM Demo handles the outreach and qualification.",
          icon: "time",
        },
        {
          title: "70% average response rate from cold leads",
          description:
            "Our customers report dramatic increases in engagement from previously inactive prospects.",
          icon: "chart",
        },
        {
          title: "Book 2.5x more face-to-face meetings",
          description:
            "Intelligent scheduling and follow-up sequences that actually convert leads to appointments.",
          icon: "calendar",
        },
        {
          title: "Complete Hebrew conversation mastery",
          description:
            "Native Hebrew understanding with cultural context and real estate terminology.",
          icon: "language",
        },
      ],
      processSteps: [
        {
          title: "Gather Your Knowledge",
          description:
            "We collect your PR, FAQs, and real sales call transcripts to understand your unique value and customer needs.",
          details: [
            "Project brochures & marketing materials",
            "Frequently asked questions",
            "Successful sales call recordings",
            "Pricing strategies & objection handling",
          ],
        },
        {
          title: "Design the Agent",
          description:
            "Our team works with your Sales Agent Design documentation to ensure the AI agent matches your brand and sales style.",
          details: [
            "Custom personality & tone",
            "Project-specific knowledge base",
            "Hebrew language optimization",
            "Sales process mapping",
          ],
        },
        {
          title: "Deploy & Optimize",
          description:
            "We launch your AI sales agent, continuously learning and optimizing to deliver the best results for your business.",
          details: [
            "Live deployment & monitoring",
            "Performance optimization",
            "Continuous learning updates",
            "24/7 support & maintenance",
          ],
        },
      ],
      features: [
        "Real-time conversation analytics",
        "A/B testing for message optimization",
        "Lead temperature tracking",
        "Conversion funnel analysis",
        "ROI measurement per project",
      ],
      platforms: [
        "HubSpot",
        "Salesforce",
        "Monday.com",
        "Pipedrive",
        "Custom Webhooks",
        "WhatsApp Business*",
      ],
    }),
    [],
  );

  // Memoize data getters with error handling
  const getBenefitsItems = useCallback(() => {
    try {
      const items = t("benefits.items", { returnObjects: true });
      return Array.isArray(items) ? items : fallbackData.benefits;
    } catch (err) {
      console.error("Error loading benefits:", err);
      setError("Failed to load benefits data");
      return fallbackData.benefits;
    }
  }, [t, fallbackData.benefits]);

  const getProcessSteps = useCallback(() => {
    try {
      const steps = t("process.steps", { returnObjects: true });
      return Array.isArray(steps) ? steps : fallbackData.processSteps;
    } catch (err) {
      console.error("Error loading process steps:", err);
      setError("Failed to load process steps");
      return fallbackData.processSteps;
    }
  }, [t, fallbackData.processSteps]);

  const getIntegrationPlatforms = useCallback(() => {
    try {
      const platforms = t("integrations.platforms", { returnObjects: true });
      return Array.isArray(platforms) ? platforms : fallbackData.platforms;
    } catch (err) {
      console.error("Error loading integration platforms:", err);
      setError("Failed to load integration platforms");
      return fallbackData.platforms;
    }
  }, [t, fallbackData.platforms]);

  // Show loading state if translations aren't ready
  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="w-full max-w-md space-y-4 p-8">
          <ProgressWithLoading
            value={50}
            label="Loading application..."
            description="Preparing translations and content"
            animated
            showPercentage
          />
        </div>
      </div>
    );
  }

  // Show error state if there's an error
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg
              className="w-12 h-12 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <p className="text-gray-800 dark:text-slate-200 mb-2">
            Something went wrong
          </p>
          <p className="text-gray-600 dark:text-slate-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>
          {isHebrew
            ? "CRM Demo - מערכת AI המתקדמת למכירות ושירות | Amit Yogev"
                            : "CRM Demo - Advanced AI-Powered CRM System | Amit Yogev"}
        </title>
        <meta
          name="description"
          content={
            isHebrew
              ? "מערכת AI אוטונומית המייעלת את מחלקות השירות והמכירות, מותאמת אישית עבור הצרכים שלך, משפרת את אחוזי הסגירה ומחממת לידים - ללא צורך בכח אדם נוסף."
                : "Advanced AI-powered business system. Autonomous AI that optimizes sales and service departments, improves conversion rates, and warms leads 24/7 without additional human resources. Try free simulation."
          }
        />
        <meta
          name="keywords"
          content={
            isHebrew
              ? "AI למכירות, מערכת AI עסקית, אוטומציה למכירות, צ'אטבוט חכם, CRM אוטומטי, בינה מלאכותית עסקית, לידים חמים"
              : "AI sales automation, business AI system, sales chatbot, lead warming, CRM automation, conversational AI, sales optimization, 24/7 AI agent, multilingual AI"
          }
        />
        <meta name="author" content="Amit Yogev" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://crm-portfolio-demo.vercel.app" />

        {/* Enhanced SEO Meta Tags */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#0055FF" />
        <meta name="application-name" content="CRM Demo" />
        <meta name="apple-mobile-web-app-title" content="CRM Demo" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="format-detection" content="telephone=no" />

        {/* Structured Data - Software Application */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "CRM Demo",
            description: isHebrew
              ? "מערכת AI אוטונומית המייעלת את מחלקות השירות והמכירות"
                              : "Advanced AI-powered CRM system for sales and service optimization",
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web-based",
            url: "https://crm-portfolio-demo.vercel.app",
            author: {
              "@type": "Person",
              name: "Amit Yogev",
              url: "https://crm-portfolio-demo.vercel.app",
            },
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "USD",
              description: isHebrew
                ? "סימולציה חינמית ללא אשראי"
                : "Free simulation without credit card",
            },
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: "4.8",
              ratingCount: "127",
              bestRating: "5",
            },
            featureList: [
              isHebrew ? "אינטגרציה מלאה ל-CRM" : "Full CRM Integration",
              isHebrew ? "תמיכה ב-50+ שפות" : "50+ Language Support",
              isHebrew ? "זמין 24/7" : "24/7 Availability",
              isHebrew
                ? "AI חכם עם זיכרון קשרי"
                : "Smart AI with Contextual Memory",
              isHebrew ? "דשבורד בזמן אמת" : "Real-time Dashboard",
            ],
          })}
        </script>

        {/* FAQ Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
              {
                "@type": "Question",
                name: isHebrew
                  ? "איך משתלבת המערכת עם מערכות קיימות?"
                  : "How does the system integrate with existing systems?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: isHebrew
                    ? "חיבור בלחיצות פשוטות ל-CRM (Salesforce, HubSpot וכו'), API ו-Webhooks להזנה אוטומטית."
                    : "Simple connection to CRM (Salesforce, HubSpot, etc.), API and Webhooks for automatic data feeding.",
                },
              },
              {
                "@type": "Question",
                name: isHebrew
                  ? "כמה זמן לוקח להטמיע?"
                  : "How long does implementation take?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: isHebrew
                    ? "הכנה ראשונית בתוך דקות, תוצאות ראשוניות כבר בשבוע הראשון לשימוש."
                    : "Initial setup within minutes, first results already in the first week of use.",
                },
              },
              {
                "@type": "Question",
                name: isHebrew
                  ? "כמה שפות נתמכות?"
                  : "How many languages are supported?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: isHebrew
                    ? "50+ שפות, NLP מתקדם עם זיכרון הקשרי המשפר חוויית משתמש."
                    : "50+ languages with advanced NLP and contextual memory for enhanced user experience.",
                },
              },
            ],
          })}
        </script>

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://crm-portfolio-demo.vercel.app" />
        <meta
          property="og:title"
          content={
            isHebrew
              ? "CRM Demo - מערכת AI מתקדמת למכירות ושירות | Amit Yogev"
              : "CRM Demo - Advanced AI-Powered CRM System | Amit Yogev"
          }
        />
        <meta
          property="og:description"
          content={
            isHebrew
              ? "מערכת AI אוטונומית המייעלת את מחלקות השירות והמכירות, מותאמת אישית עבור הצרכים שלך, משפרת את אחוזי הסגירה ומחממת לידים - ללא צורך בכח אדם נוסף"
              : "Autonomous AI system that optimizes your sales and service departments, customized for your specific needs, improving close rates and warming leads - without requiring additional human resources"
          }
        />
        <meta property="og:image" content="https://crm-portfolio-demo.vercel.app/og-image.png" />
        <meta property="og:locale" content={isHebrew ? "he_IL" : "en_US"} />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://crm-portfolio-demo.vercel.app" />
        <meta
          property="twitter:title"
          content={
            isHebrew
              ? "CRM Demo - מערכת AI מתקדמת למכירות ושירות | Amit Yogev"
              : "CRM Demo - Advanced AI-Powered CRM System | Amit Yogev"
          }
        />
        <meta
          property="twitter:description"
          content={
            isHebrew
              ? "מערכת AI אוטונומית המייעלת את מחלקות השירות והמכירות, מותאמת אישית עבור הצרכים שלך, משפרת את אחוזי הסגירה ומחממת לידים - ללא צורך בכח אדם נוסף"
              : "Autonomous AI system that optimizes your sales and service departments, customized for your specific needs, improving close rates and warming leads - without requiring additional human resources"
          }
        />
        <meta
          property="twitter:image"
          content="https://crm-portfolio-demo.vercel.app/og-image.png"
        />

        {/* Language and direction */}
        <html lang={i18n?.language || "en"} dir={isHebrew ? "rtl" : "ltr"} />
      </Helmet>

      <div className="min-h-screen flex flex-col font-sans overflow-x-hidden">
        {/* Navigation */}
        <div className="fixed top-0 inset-x-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
          <nav className="w-full px-6 py-4" dir={isHebrew ? "rtl" : "ltr"}>
            <div className="w-full flex items-center justify-between">
              {/* Logo */}
              <motion.div
                className="flex items-center gap-2"
                initial={{ opacity: 0, x: isHebrew ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Building2 className="w-8 h-8 text-gray-900" />
                <span className="text-xl font-geist-bold text-gray-900">
                  CRM Demo
                </span>
              </motion.div>

              {/* Language toggle and sign in */}
              <motion.div
                className="flex items-center gap-4"
                initial={{ opacity: 0, x: isHebrew ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <LanguageToggle />
                <ShinyButton
                  className="border-primary-600 text-primary-600 hover:bg-primary-600 hover:text-white px-3 py-1.5 text-sm"
                  onClick={() => navigate("/auth/login")}
                >
                  {isHebrew ? "התחבר" : "Sign In"}
                </ShinyButton>
              </motion.div>
            </div>
          </nav>
        </div>

        {/* Hero Section */}
        <section
          className="relative min-h-screen flex items-center bg-white overflow-hidden pt-32 md:pt-36 lg:pt-32"
          style={{ paddingTop: "max(8rem, env(safe-area-inset-top) + 6rem)" }}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230055FF' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
            />
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left Column - Content */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className={`text-center lg:text-left ${isHebrew ? "lg:text-right" : ""}`}
                dir={isHebrew ? "rtl" : "ltr"}
              >
                {/* Brand Name */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="mb-6"
                >
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-geist-bold text-primary-600 mb-4 max-w-none">
                    {t("hero.brand", "CRM Demo")}
                  </h1>
                </motion.div>

                {/* Main Headline */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="mb-8"
                >
                  <h2 className="text-2xl md:text-3xl lg:text-4xl font-geist-semibold text-gray-900 leading-tight">
                    {isHebrew
                      ? "מערכת חימום לידים מתקדמת"
                      : "Advanced Lead Heating System"}
                  </h2>
                  <div className="mt-6 md:mt-8 text-lg md:text-xl text-gray-600 font-geist-medium">
                    {isHebrew
                      ? "AI אוטונומי שמחמם לידים קרים לחמים בוואטסאפ, מגדיל אחוזי המרה ומקפיץ ציון BANT/HEAT - בלי עבודה ידנית."
                      : "Autonomous AI that heats cold leads into hot prospects via WhatsApp® Business API, boosting conversion rates and BANT/HEAT scores without manual work."}
                  </div>

                  {/* Enhanced Typing Animation with Oven Cooking Visualization */}
                  <div className="mt-4 h-20 flex items-center gap-4">
                    <div className="flex items-center gap-3 text-lg md:text-xl text-primary-600 font-geist-medium">
                      {/* Oven AI Cooking Indicator */}
                      <div className="relative">
                        <div className="w-8 h-8 rounded-full border-3 border-gray-300 relative overflow-hidden bg-gray-50">
                          {/* Oven Heat Animation - Cycles like cooking */}
                          <motion.div
                            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-orange-500 via-red-400 to-yellow-300"
                            animate={{
                              height: [
                                "15%",
                                "35%",
                                "55%",
                                "75%",
                                "90%",
                                "100%",
                                "85%",
                                "65%",
                                "45%",
                                "25%",
                                "15%",
                              ],
                            }}
                            transition={{
                              duration: 6,
                              repeat: Infinity,
                              ease: "easeInOut",
                              times: [
                                0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9,
                                1,
                              ],
                            }}
                          />
                          {/* Heat Shimmer Effect */}
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-t from-transparent via-white/20 to-transparent"
                            animate={{
                              opacity: [0.3, 0.7, 0.4, 0.8, 0.3],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: "easeInOut",
                            }}
                          />
                        </div>
                        {/* Oven Icon with Cooking Animation */}
                        <motion.span
                          className="absolute -top-1 -right-1 text-xs"
                          animate={{
                            scale: [1, 1.1, 1.05, 1.15, 1],
                            rotate: [0, 2, -2, 0],
                          }}
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                        >
                          🔥
                        </motion.span>
                      </div>

                      <span className="min-w-0">
                        {typingText}
                        {showCursor && <span className="animate-pulse">|</span>}
                      </span>
                    </div>
                  </div>
                </motion.div>

                {/* Subtitle */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="mb-10"
                >
                  <p className="text-lg md:text-xl font-geist text-gray-700 leading-relaxed">
                    {isHebrew
                      ? "מערכת CRM חכמה עם אוטומציית WhatsApp מובנית, מעקב BANT/HEAT בזמן אמת, וחימום לידים אוטומטי שמעלה המרות."
                      : "Smart CRM system with built-in WhatsApp automation, real-time BANT/HEAT tracking, and automatic lead warming that increases conversions."}
                  </p>
                </motion.div>

                {/* CTA Button */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="flex flex-col sm:flex-row gap-4 mb-12 justify-center lg:justify-start"
                >
                  <ShimmerButton
                    className="px-8 py-4 text-lg shadow-lg hover:shadow-xl transition-all duration-300 font-geist-semibold"
                    background="rgb(37 99 235)"
                    shimmerColor="#ffffff"
                    borderRadius="8px"
                    onClick={() => setIsEarlyAccessOpen(true)}
                  >
                    {t("hero.cta")}
                  </ShimmerButton>
                </motion.div>

                {/* Trust badges */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  className="flex flex-wrap gap-4 justify-center lg:justify-start mb-12"
                >
                  <span className="hidden sm:inline-flex items-center gap-2 rounded-full bg-primary-600/10 px-4 py-2 text-primary-600 text-sm font-geist-medium">
                    <MessageSquare className="w-4 h-4" />
                    {isHebrew ? "WhatsApp מובנה" : "Built-in WhatsApp"}
                  </span>
                  <span className="hidden sm:inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-green-600 text-sm font-geist-medium">
                    <TrendingUp className="w-4 h-4" />
                    {isHebrew ? "חימום לידים" : "Lead Heating"}
                  </span>
                  <span className="hidden sm:inline-flex items-center gap-2 rounded-full bg-purple-100 px-4 py-2 text-purple-600 text-sm font-geist-medium">
                    <Target className="w-4 h-4" />
                    {isHebrew ? "ציון BANT/HEAT" : "BANT/HEAT Scoring"}
                  </span>
                </motion.div>

                {/* Stats */}
                <motion.div
                  variants={slideUpVariants}
                  className={`hidden sm:flex flex-col sm:flex-row items-center gap-8 text-center ${
                    isHebrew ? "justify-start font-hebrew" : "justify-center"
                  }`}
                  dir={isHebrew ? "rtl" : "ltr"}
                >
                  <motion.div
                    className="flex flex-col items-center"
                    style={{ y: statsParallax }}
                  >
                    <div
                      className={`text-2xl font-geist-bold text-primary-600 ${isHebrew ? "font-hebrew" : ""}`}
                    >
                      <CountUp end={70} duration={2.5} suffix="%" />
                    </div>
                    <div
                      className={`text-sm text-gray-700 mt-1 ${isHebrew ? "font-hebrew" : ""}`}
                    >
                      {t("stats.response_rate")}
                    </div>
                  </motion.div>
                  <motion.div
                    className="flex flex-col items-center"
                    style={{ y: statsParallax }}
                  >
                    <div
                      className={`text-2xl font-geist-bold text-primary-600 ${isHebrew ? "font-hebrew" : ""}`}
                    >
                      <CountUp
                        end={2.5}
                        decimals={1}
                        duration={2.5}
                        suffix="x"
                      />
                    </div>
                    <div
                      className={`text-sm text-gray-700 mt-1 ${isHebrew ? "font-hebrew" : ""}`}
                    >
                      {t("stats.meeting_boost")}
                    </div>
                  </motion.div>
                  <motion.div
                    className="flex flex-col items-center"
                    style={{ y: statsParallax }}
                  >
                    <div
                      className={`text-2xl font-geist-bold text-primary-600 ${isHebrew ? "font-hebrew" : ""}`}
                    >
                      <CountUp end={70} duration={2.5} suffix="%" />
                    </div>
                    <div
                      className={`text-sm text-gray-700 mt-1 ${isHebrew ? "font-hebrew" : ""}`}
                    >
                      {t("stats.time_saved")}
                    </div>
                  </motion.div>
                  <motion.div
                    className="flex flex-col items-center"
                    style={{ y: statsParallax }}
                  >
                    <div
                      className={`text-2xl font-geist-bold text-primary-600 ${isHebrew ? "font-hebrew" : ""}`}
                    >
                      +<CountUp end={50} duration={2.5} />
                    </div>
                    <div
                      className={`text-sm text-gray-700 mt-1 ${isHebrew ? "font-hebrew" : ""}`}
                    >
                      {t("stats.projects")}
                    </div>
                  </motion.div>
                </motion.div>
              </motion.div>

              {/* Right Column - Chat Mockup */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative"
              >
                <ChatMockup />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Why CRM Demo is Different - REDESIGNED */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="py-24 bg-gradient-to-br from-primary-50 via-white to-accent-50"
        >
          <div className="container mx-auto px-4">
            {/* Section Header with Animation */}
            <motion.div
              variants={slideUpVariants}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-geist-bold text-gray-900 mb-6">
                {isHebrew
                  ? "למה הכולם מדברים על CRM Demo"
                  : "Why Everyone's Talking About CRM Demo"}
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-primary-600 to-accent-600 mx-auto mb-8"></div>
            </motion.div>

            {/* Main Content Grid */}
            <div className="grid lg:grid-cols-2 gap-12 max-w-7xl mx-auto mb-16">
              {/* Left Side - Key Points */}
              <motion.div variants={slideUpVariants} className="space-y-8">
                <div className="space-y-6">
                  <div
                    className="flex items-start gap-4 p-6 bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden"
                    dir={isHebrew ? "rtl" : "ltr"}
                  >
                    <div className="absolute top-0 right-0 bg-gradient-to-br from-purple-500 to-blue-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                      {isHebrew ? "חדש!" : "NEW!"}
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                      <Bot className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-geist-semibold text-gray-900 mb-2">
                        {isHebrew
                          ? "עוזר AI חכם עם גיבוי Groq"
                          : "Smart AI Assistant with Groq Fallback"}
                      </h3>
                      <p className="font-geist text-gray-700 leading-relaxed mb-2">
                        {isHebrew
                          ? "שאל את העוזר החכם שלנו כל שאלה על המערכת! מופעל על ידי Gemini AI עם גיבוי Groq (14,400 בקשות/יום) - ללא השבתות, תמיד זמין."
                          : "Ask our clever AI assistant anything about the system! Powered by Gemini AI with Groq fallback (14,400 req/day) - no downtime, always available."}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
                          {isHebrew ? "חכם וסרקסטי" : "Clever & Witty"}
                        </span>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                          {isHebrew ? "עומק טכני" : "Technical Depth"}
                        </span>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                          {isHebrew ? "זמין תמיד" : "Always Available"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div
                    className="flex items-start gap-4 p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group"
                    dir={isHebrew ? "rtl" : "ltr"}
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-geist-semibold text-gray-900 mb-2">
                        {isHebrew
                          ? "טכנולוגיות AI מהפכניות"
                          : "Revolutionary AI Technologies"}
                      </h3>
                      <p className="font-geist text-gray-700 leading-relaxed">
                        {isHebrew
                          ? "פירקנו את מסע הלקוח המסורתי והטמענו טכנולוגיות AI מהפכניות כדי להאיץ חימום לידים ואנליזה מתקדמת."
                          : "We deconstructed the traditional customer journey and embedded revolutionary AI technologies to accelerate lead warming and advanced analytics."}
                      </p>
                    </div>
                  </div>

                  <div
                    className="flex items-start gap-4 p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group"
                    dir={isHebrew ? "rtl" : "ltr"}
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                      <MessageSquare className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-geist-semibold text-gray-900 mb-2">
                        {isHebrew
                          ? "אוטומציית WhatsApp מתקדמת"
                          : "Advanced WhatsApp® Integration"}
                      </h3>
                      <p className="font-geist text-gray-700 leading-relaxed">
                        {isHebrew
                          ? "פלטפורמה מובנית עם WhatsApp Business API, תבניות הודעות מותאמות אישית, ואוטומציה מלאה לחימום לידים קרים."
                          : "Built-in platform with WhatsApp® Business API, custom message templates, and complete automation for heating cold leads."}
                      </p>
                    </div>
                  </div>

                  <div
                    className="flex items-start gap-4 p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group"
                    dir={isHebrew ? "rtl" : "ltr"}
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                      <Target className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-geist-semibold text-gray-900 mb-2">
                        {isHebrew
                          ? "ציון BANT/HEAT אוטומטי"
                          : "Automatic BANT/HEAT Scoring"}
                      </h3>
                      <p className="font-geist text-gray-700 leading-relaxed">
                        {isHebrew
                          ? "מערכת CRM חכמה שמעקבת אחר חימום לידים, מציינת BANT/HEAT בזמן אמת, ומתעדפת לידים לפי פוטנציאל המרה."
                          : "Smart CRM system that tracks lead warming, scores BANT/HEAT in real-time, and prioritizes leads by conversion potential."}
                      </p>
                    </div>
                  </div>

                  <div
                    className="flex items-start gap-4 p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group"
                    dir={isHebrew ? "rtl" : "ltr"}
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-geist-semibold text-gray-900 mb-2">
                        {isHebrew
                          ? "חימום לידים אינטליגנטי"
                          : "Intelligent Lead Warming"}
                      </h3>
                      <p className="font-geist text-gray-700 leading-relaxed">
                        {isHebrew
                          ? "האלגוריתם שלנו מחמם לידים קרים בצורה הדרגתית, מגדיל אחוזי תגובה, וקובע פגישות אוטומטית ביומן המכירות."
                          : "Our algorithm gradually warms cold leads, increases response rates, and automatically schedules meetings in the sales calendar."}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Right Side - Visual Elements */}
              <motion.div variants={slideUpVariants} className="space-y-8">
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 text-white relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-600/20 to-accent-600/20"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                        <BarChart3 className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-xl font-geist-semibold">
                        {isHebrew ? "אנליטיקס בזמן אמת" : "Real-Time Analytics"}
                      </h3>
                    </div>
                    <p className="text-white/90 leading-relaxed mb-4">
                      {isHebrew
                        ? "דשבורד מתקדם מציג ציון BANT/HEAT, סטטיסטיקות WhatsApp, ואחוזי חימום לידים בזמן אמת."
                        : "Advanced dashboard displays BANT/HEAT scores, WhatsApp statistics, and lead warming rates in real-time."}
                    </p>
                    <div className="hidden sm:grid grid-cols-3 gap-4 mt-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-accent-400">
                          85%
                        </div>
                        <div className="text-xs text-white/70">
                          {isHebrew ? "חימום לידים" : "Lead Warming"}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-400">
                          3.2x
                        </div>
                        <div className="text-xs text-white/70">
                          {isHebrew ? "יותר המרות" : "More Conversions"}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary-400">
                          24/7
                        </div>
                        <div className="text-xs text-white/70">
                          {isHebrew ? "WhatsApp" : "WhatsApp"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-8 shadow-lg border-2 border-gradient-to-r from-primary-200 to-accent-200">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-primary-600" />
                    </div>
                    <h3 className="text-xl font-geist-semibold text-gray-900">
                      {isHebrew ? "WhatsApp Business מובנה" : "Built-in WhatsApp Business"}
                    </h3>
                  </div>
                  <p className="text-gray-700 leading-relaxed">
                    {isHebrew
                      ? "אינטגרציה מלאה עם WhatsApp Business API, תבניות הודעות מאושרות, וניהול שיחות מתקדם ישירות מהמערכת."
                      : "Complete integration with WhatsApp Business API, approved message templates, and advanced conversation management directly from the system."}
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Bottom CTA Section */}
            <motion.div variants={slideUpVariants} className="text-center">
              <div className="bg-gradient-to-r from-primary-600 to-accent-600 text-white p-8 rounded-3xl shadow-xl max-w-4xl mx-auto">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Bot className="w-8 h-8" />
                  <h3 className="text-2xl font-geist-bold">
                    {isHebrew
                      ? "אנחנו לא צ'אטבוט. אנחנו צוות המכירות המסור שלך שאף פעם לא ישן"
                      : "We're not a chatbot. We're your dedicated sales team that never sleeps"}
                  </h3>
                </div>
                <p className="text-white/90 text-lg mb-6">
                  {isHebrew
                    ? "גלו איך CRM Demo יכול לשנות את תהליכי המכירה שלכם ולהגדיל את ההכנסות"
                    : "Discover how CRM Demo can transform your sales processes and increase revenue"}
                </p>
                <Button
                  size="lg"
                  className="px-8 py-4 text-lg bg-white text-primary-600 hover:bg-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 font-geist-semibold"
                  onClick={() => navigate("/auth/login")}
                >
                  {isHebrew ? "התחילו עכשיו" : "Get Started Now"}
                </Button>
              </div>
            </motion.div>
          </div>
        </motion.section>

        {/* Process Transformation - Journey Comparison */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="py-24 bg-gradient-to-br from-gray-50 to-white"
        >
          <div className="container mx-auto px-4">
            <motion.div
              variants={slideUpVariants}
              className="text-center mb-16"
            >
              <h2 className="text-2xl md:text-3xl font-geist-semibold text-gray-900 mb-6">
                {isHebrew
                  ? "שדרגו את תהליך המכירה שלכם"
                  : "Upgrade Your Sales Process"}
              </h2>
              <div
                className="text-lg font-geist text-gray-700 max-w-6xl mx-auto leading-relaxed mb-8"
                dir={isHebrew ? "rtl" : "ltr"}
              >
                <p className="mb-6 text-center">
                  {isHebrew
                    ? "העולם מתקדם ואנחנו פה כדי לעזור לכם להטמיע בינה מלאכותית בארגון שלכם כדי לקחת אותו לצעד הבא"
                    : "The world is advancing and we're here to help you implement artificial intelligence in your organization to take it to the next level"}
                </p>
                <div className="grid lg:grid-cols-2 gap-12 text-base">
                  <div
                    className={`text-center ${isHebrew ? "lg:text-right" : "lg:text-left"}`}
                  >
                    <span className="font-geist-semibold text-red-600 text-lg block mb-2">
                      {isHebrew ? "בעבר:" : "In the past:"}
                    </span>
                    <p className="text-gray-700 leading-relaxed">
                      {isHebrew
                        ? "שיפור יחסי ההמרה לפגישה ולעסקה דרשו כח אדם נוסף, זמן והרבה כסף"
                        : "Improving conversion rates for meetings and deals required additional manpower, time and lots of money"}
                    </p>
                  </div>
                  <div
                    className={`text-center ${isHebrew ? "lg:text-right" : "lg:text-left"}`}
                  >
                    <span className="font-geist-semibold text-green-600 text-lg block mb-2">
                      {isHebrew ? "היום:" : "Today:"}
                    </span>
                    <p className="text-gray-700 leading-relaxed">
                      {isHebrew
                        ? "באמצעות הטכנולוגיה של CRM Demo הביצועים שלכם משתפרים פלאים ובאופן מיידי"
                        : "With CRM Demo technology, your performance improves dramatically and immediately"}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
              {/* Old Lead Journey */}
              <motion.div
                variants={slideUpVariants}
                className="bg-white p-8 rounded-2xl shadow-lg border-l-4 border-red-500"
                dir={isHebrew ? "rtl" : "ltr"}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                    <span className="text-red-600 text-xl">❌</span>
                  </div>
                  <h3 className="text-xl font-geist-semibold text-red-600">
                    {isHebrew
                      ? "מסע ליד מיושן בעבר"
                      : "Old Lead Journey (Before)"}
                  </h3>
                </div>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <span className="text-red-500 mt-1 flex-shrink-0">•</span>
                    <span className="text-gray-700 leading-relaxed">
                      {isHebrew
                        ? "צוות של מתאמי פגישות מבזבזים זמן על לידים לא רלוונטיים בניסיון לתאם פגישה"
                        : "Team of meeting coordinators waste time on irrelevant leads trying to schedule meetings"}
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-red-500 mt-1 flex-shrink-0">•</span>
                    <span className="text-gray-700 leading-relaxed">
                      {isHebrew
                        ? "בלבול ובלגן שנוצר בCRM עקב חוסר מענה, תיעודים חלקיים ועומס בפניות"
                        : "Confusion and chaos in CRM due to lack of response, partial documentation and inquiry overload"}
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-red-500 mt-1 flex-shrink-0">•</span>
                    <span className="text-gray-700 leading-relaxed">
                      {isHebrew
                        ? "פגישות לא רלוונטיות מבזבזות את הזמן של מנהלי המכירות שלכם ומייאשות אותם"
                        : "Irrelevant meetings waste your sales managers' time and frustrate them"}
                    </span>
                  </li>
                </ul>
              </motion.div>

              {/* New Lead Journey with OvenAI */}
              <motion.div
                variants={slideUpVariants}
                className="bg-gradient-to-br from-green-50 to-primary-50 p-8 rounded-2xl shadow-xl border-l-4 border-primary-600"
                dir={isHebrew ? "rtl" : "ltr"}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                    <span className="text-primary-600 text-xl">✨</span>
                  </div>
                  <h3 className="text-xl font-geist-semibold text-primary-600">
                    {isHebrew
                      ? "מסע הליד עם CRM Demo"
                      : "Lead Journey with CRM Demo"}
                  </h3>
                </div>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <span className="text-primary-600 mt-1 flex-shrink-0">
                      ✓
                    </span>
                    <span className="text-gray-700 leading-relaxed">
                      {isHebrew
                        ? "מחיים לידים קרים ומתעניינים ישנים שלכם ביעילות"
                        : "Efficiently reviving your cold leads and old prospects"}
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary-600 mt-1 flex-shrink-0">
                      ✓
                    </span>
                    <span className="text-gray-700 leading-relaxed">
                      {isHebrew
                        ? "מחממים לידים חדשים באמצעות תסריט שיחה עם מסע אנושי"
                        : "Warming new leads using conversation scripts with human journey"}
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary-600 mt-1 flex-shrink-0">
                      ✓
                    </span>
                    <span className="text-gray-700 leading-relaxed">
                      {isHebrew
                        ? "הלקוח קובע פגישה ביומן של מנהל המכירות בזמן שמתאים לו"
                        : "Client schedules meeting in sales manager's calendar at their convenient time"}
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary-600 mt-1 flex-shrink-0">
                      ✓
                    </span>
                    <span className="text-gray-700 leading-relaxed">
                      {isHebrew
                        ? "מנהל המכירות מקבל בלייב סיכום שיחה וכל הפרטים שהוא צריך על הלקוח כדי להעלות את יחס ההמרה ולסגור את הפגישה"
                        : "Sales manager receives live conversation summary and all details needed about the client to increase conversion rate and close the meeting"}
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary-600 mt-1 flex-shrink-0">
                      ✓
                    </span>
                    <span className="text-gray-700 leading-relaxed">
                      {isHebrew
                        ? "אינטגרציה מלאה ל-CRM, כולל סיכום שיחה מלא שקורה בצורה אוטומטית"
                        : "Full CRM integration, including complete conversation summary that happens automatically"}
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary-600 mt-1 flex-shrink-0">
                      ✓
                    </span>
                    <span className="text-gray-700 leading-relaxed">
                      {isHebrew
                        ? "אחוז גבוה של פגישות מתקיימות ויחס המרה גבוה לעסקאות ולקוחות מרוצים"
                        : "High percentage of meetings take place with high conversion rate to deals and satisfied customers"}
                    </span>
                  </li>
                </ul>
              </motion.div>
            </div>

            {/* CTA Button */}
            <motion.div
              variants={slideUpVariants}
              className="text-center mt-12"
            >
              <Button
                size="default"
                className="px-6 py-2 text-base bg-primary-600 hover:bg-primary-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 font-geist-semibold"
                onClick={() => setIsEarlyAccessOpen(true)}
              >
                {isHebrew ? " בקש גישה מוקדמת " : "Request Early Access"}
              </Button>
            </motion.div>
          </div>
        </motion.section>

        {/* 5-Step Implementation Process */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="py-24 bg-white"
        >
          <div className="container mx-auto px-4">
            <motion.div
              variants={slideUpVariants}
              className="text-center mb-16"
            >
              <h2 className="text-2xl md:text-3xl font-geist-semibold text-gray-900 mb-4">
                {isHebrew
                  ? "מערכת דשבורד מתקדמת"
                  : "Professional Dashboard System"}
              </h2>
              <p className="text-lg font-geist text-gray-700">
                {isHebrew
                  ? "צאו לדרך בשלבים פשוטים"
                  : "Get started with simple steps"}
              </p>
            </motion.div>

            <div className="max-w-5xl mx-auto">
              <div className="space-y-8">
                {/* Step 1 */}
                <motion.div
                  variants={slideUpVariants}
                  className="flex flex-col md:flex-row items-start gap-6 p-6 bg-gray-50 rounded-2xl hover:shadow-lg transition-all duration-300"
                  dir={isHebrew ? "rtl" : "ltr"}
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-primary-700 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xl font-geist-bold">
                      1
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-geist-semibold text-gray-900 mb-3">
                      {isHebrew
                        ? "בחר פרויקט ואפיין סקריפטים"
                        : "Choose Project and Define Scripts"}
                    </h3>
                    <p className="font-geist text-gray-700 leading-relaxed">
                      {isHebrew
                        ? "העלה תבניות פתיחה, תסריטי שיחה, שאלות נפוצות ותמלולי שיחות"
                        : "Upload opening templates, conversation scripts, FAQs and conversation transcripts"}
                    </p>
                  </div>
                </motion.div>

                {/* Step 2 */}
                <motion.div
                  variants={slideUpVariants}
                  className="flex flex-col md:flex-row items-start gap-6 p-6 bg-gray-50 rounded-2xl hover:shadow-lg transition-all duration-300"
                  dir={isHebrew ? "rtl" : "ltr"}
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-primary-700 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xl font-geist-bold">
                      2
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-geist-semibold text-gray-900 mb-3">
                      {isHebrew ? "טעינת לידים" : "Load Leads"}
                    </h3>
                    <p className="font-geist text-gray-700 leading-relaxed">
                      {isHebrew
                        ? "ייבא לידים מוכשרים (CSV או API מכל מקור) והגדר פרמטרי יצירת קשר."
                        : "Import qualified leads (CSV or API from any source) and set contact parameters."}
                    </p>
                  </div>
                </motion.div>

                {/* Step 3 */}
                <motion.div
                  variants={slideUpVariants}
                  className="flex flex-col md:flex-row items-start gap-6 p-6 bg-gray-50 rounded-2xl hover:shadow-lg transition-all duration-300"
                  dir={isHebrew ? "rtl" : "ltr"}
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-primary-700 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xl font-geist-bold">
                      3
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-geist-semibold text-gray-900 mb-3">
                      {isHebrew
                        ? "חימום ושיחה אוטומטית"
                        : "Warming and Automatic Conversation"}
                    </h3>
                    <p className="font-geist text-gray-700 leading-relaxed">
                      {isHebrew
                        ? "CRM Demo מנהלת שיחות מותאמות אישית 24/7, מזהה כוונות ומחממת לידים."
                        : "CRM Demo manages personalized conversations 24/7, identifies intentions and warms leads."}
                    </p>
                  </div>
                </motion.div>

                {/* Step 4 */}
                <motion.div
                  variants={slideUpVariants}
                  className="flex flex-col md:flex-row items-start gap-6 p-6 bg-gray-50 rounded-2xl hover:shadow-lg transition-all duration-300"
                  dir={isHebrew ? "rtl" : "ltr"}
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-primary-700 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xl font-geist-bold">
                      4
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-geist-semibold text-gray-900 mb-3">
                      {isHebrew ? "תיאום פגישות" : "Meeting Coordination"}
                    </h3>
                    <p className="font-geist text-gray-700 leading-relaxed">
                      {isHebrew
                        ? "הלקוח קובע פגישה ביומן של מנהל המכירות – אינטגרציה מלאה, ללא מאמץ ידני."
                        : "Client schedules meeting in sales manager's calendar – full integration, no manual effort."}
                    </p>
                  </div>
                </motion.div>

                {/* Step 5 */}
                <motion.div
                  variants={slideUpVariants}
                  className="flex flex-col md:flex-row items-start gap-6 p-6 bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl shadow-lg border-2 border-primary-200"
                  dir={isHebrew ? "rtl" : "ltr"}
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-primary-700 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xl font-geist-bold">
                      5
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-geist-semibold text-primary-700 mb-3">
                      {isHebrew
                        ? "דשבורד וניתוח בזמן אמת"
                        : "Real-Time Dashboard and Analytics"}
                    </h3>
                    <p className="font-geist text-gray-700 leading-relaxed">
                      {isHebrew
                        ? "צפה בשיחות, פגישות שנקבעו, KPI מרכזיים (זמן תגובה ממוצע, אחוזי סגירה וכו')."
                        : "View conversations, scheduled meetings, key KPIs (average response time, closing percentages, etc.)."}
                    </p>
                  </div>
                </motion.div>
              </div>
            </div>


          </div>
        </motion.section>

        {/* Benefits Section */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="py-24 bg-white"
        >
          <div className="container mx-auto px-4">
            <motion.div
              variants={slideUpVariants}
              className="text-center mb-16"
            >
              <h2 className="text-2xl md:text-3xl font-geist-semibold text-gray-900 mb-4">
                {t("benefits.title")}
              </h2>
              <p className="text-lg font-geist text-gray-700 max-w-3xl mx-auto">
                {t("benefits.subtitle")}
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
              {getBenefitsItems().map((item, index: number) => {
                const IconComponent =
                  benefitIcons[item.icon as keyof typeof benefitIcons];
                return (
                  <motion.div
                    key={index}
                    variants={slideUpVariants}
                    className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-geist-semibold text-gray-900 mb-3">
                          {item.title}
                        </h3>
                        <p className="font-geist text-gray-700 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.section>

        {/* Process Section */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="py-24 bg-white"
        >
          <div className="container mx-auto px-4">
            <motion.div
              variants={slideUpVariants}
              className="text-center mb-16"
            >
              <h2 className="text-2xl md:text-3xl font-geist-semibold text-gray-900 mb-4">
                {t("process.title")}
              </h2>
              <p className="text-lg font-geist text-gray-700 max-w-3xl mx-auto mb-8">
                {t("process.subtitle")}
              </p>
              <p className="text-base font-geist text-gray-600 max-w-4xl mx-auto leading-relaxed">
                {t("process.description")}
              </p>
            </motion.div>

            <div className="max-w-6xl mx-auto">
              <div className="grid md:grid-cols-3 gap-8">
                {getProcessSteps().map((step, index: number) => {
                  const IconComponent = processIcons[index];
                  return (
                    <motion.div
                      key={index}
                      variants={slideUpVariants}
                      className="relative group"
                    >
                      <div className="bg-gradient-to-br from-grey-100 to-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 h-full">
                        <div className="relative">
                          <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-primary-700 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 relative">
                            <IconComponent className="w-8 h-8 text-white" />
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-accent rounded-full flex items-center justify-center text-white text-xs font-bold">
                              {index + 1}
                            </div>
                          </div>
                          {index < 2 && (
                            <div
                              className={`hidden md:block absolute top-8 h-0.5 bg-gradient-to-r from-primary-600 to-primary-300 -translate-y-0.5 ${
                                isHebrew
                                  ? "right-full w-16 -mr-16"
                                  : "left-full w-16 -ml-16"
                              }`}
                            ></div>
                          )}
                        </div>
                        <h3 className="text-xl font-geist-semibold text-gray-900 mb-3 text-center">
                          {step.title}
                        </h3>
                        <p className="font-geist text-gray-600 leading-relaxed mb-4 text-center">
                          {step.description}
                        </p>
                        <ul className="space-y-2">
                          {step.details.map(
                            (detail: string, detailIndex: number) => (
                              <li
                                key={detailIndex}
                                className="flex items-center gap-2 text-sm text-gray-600"
                              >
                                <CheckCircle2 className="w-4 h-4 text-primary-600 flex-shrink-0" />
                                {detail}
                              </li>
                            ),
                          )}
                        </ul>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.section>

        {/* Metrics Section */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="py-24 bg-white"
        >
          <div className="container mx-auto px-4">
            <motion.div
              variants={slideUpVariants}
              className="text-center mb-16"
            >
              <h2 className="text-2xl md:text-3xl font-geist-semibold text-gray-900 mb-4">
                {t("metrics.title")}
              </h2>
              <p className="text-lg font-geist text-gray-700 max-w-3xl mx-auto mb-8">
                {t("metrics.subtitle")}
              </p>
              <p className="text-base font-geist text-gray-600 max-w-4xl mx-auto leading-relaxed">
                {t("metrics.body")}
              </p>
            </motion.div>

            <div className="max-w-6xl mx-auto">
              <div className="grid md:grid-cols-3 gap-8">
                <motion.div
                  variants={slideUpVariants}
                  className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <TrendingUp className="w-8 h-8 text-primary-600 mx-auto mb-4" />
                  <h3 className="font-geist-semibold text-gray-900 mb-2 text-center">
                    {t("metrics.bullet1")}
                  </h3>
                </motion.div>
                <motion.div
                  variants={slideUpVariants}
                  className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <BarChart3 className="w-8 h-8 text-primary-600 mx-auto mb-4" />
                  <h3 className="font-geist-semibold text-gray-900 mb-2 text-center">
                    {t("metrics.bullet2")}
                  </h3>
                </motion.div>
                <motion.div
                  variants={slideUpVariants}
                  className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Calendar className="w-8 h-8 text-primary-600 mx-auto mb-4" />
                  <h3 className="font-geist-semibold text-gray-900 mb-2 text-center">
                    {t("metrics.bullet3")}
                  </h3>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Why Choose CRM Demo - Competitor Comparison */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="py-24 bg-gradient-to-br from-primary-50 to-white"
        >
          <div className="container mx-auto px-4">
            <motion.div
              variants={slideUpVariants}
              className="text-center mb-16"
            >
              <div className="flex items-center justify-center gap-3 mb-4">
                <Crown className="w-8 h-8 text-yellow-500" />
                <h2 className="text-2xl md:text-3xl font-geist-semibold text-gray-900">
                  {isHebrew
                    ? "למה CRM Demo? הפתרון הייחודי לנדל״ן ישראלי"
                    : "Why CRM Demo? Built Specifically for Israeli Real Estate"}
                </h2>
                <Crown className="w-8 h-8 text-yellow-500" />
              </div>
              <p className="text-lg font-geist text-gray-700 max-w-4xl mx-auto">
                {isHebrew
                  ? "בעוד שחברות אחרות מציעות פתרונות כלליים, אנחנו בניינו מערכת מותאמת אישית לשוק הנדל״ן הישראלי"
                  : "While others offer generic solutions, we built a system tailored specifically for the Israeli real estate market"}
              </p>
            </motion.div>

            <div className="max-w-6xl mx-auto">
              <div className="grid lg:grid-cols-3 gap-8">
                {/* Others */}
                <motion.div
                  variants={slideUpVariants}
                  className="bg-white p-8 rounded-2xl shadow-lg border-2 border-gray-200"
                >
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Eye className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-geist-semibold text-gray-700 mb-2">
                      {isHebrew ? "פתרונות כלליים" : "Generic Solutions"}
                    </h3>
                  </div>
                  <ul className="space-y-3 text-gray-600">
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 mt-1">✗</span>
                      <span>
                        {isHebrew
                          ? "לא מבינים עברית ברמה גבוהה"
                          : "Poor Hebrew comprehension"}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 mt-1">✗</span>
                      <span>
                        {isHebrew
                          ? "לא מכירים את השוק הישראלי"
                          : "No Israeli market knowledge"}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 mt-1">✗</span>
                      <span>
                        {isHebrew
                          ? "דיווחים בסיסיים בלבד"
                          : "Basic reporting only"}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 mt-1">✗</span>
                      <span>
                        {isHebrew
                          ? "תמיכה טכנית מוגבלת"
                          : "Limited technical support"}
                      </span>
                    </li>
                  </ul>
                </motion.div>

                {/* CRM Demo */}
                <motion.div
                  variants={slideUpVariants}
                  className="bg-gradient-to-br from-primary-600 to-primary-700 p-8 rounded-2xl shadow-xl border-4 border-yellow-400 relative transform scale-105"
                >
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-yellow-400 text-black px-4 py-2 rounded-full text-sm font-geist-bold">
                      {isHebrew ? "הבחירה הטובה ביותר" : "BEST CHOICE"}
                    </div>
                  </div>
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                      <Building2 className="w-8 h-8 text-primary-600" />
                    </div>
                    <h3 className="text-xl font-geist-semibold text-white mb-2">
                      CRM Demo
                    </h3>
                    <p className="text-primary-100 text-sm">
                      {isHebrew
                        ? "מיוחד לנדל״ן ישראלי"
                        : "Built for Israeli Real Estate"}
                    </p>
                  </div>
                  <ul className="space-y-3 text-white">
                    <li className="flex items-start gap-2">
                      <span className="text-lg mt-0.5 flex-shrink-0">🔥</span>
                      <span>
                        {isHebrew
                          ? "מנוע החימום הכי חזק - הופך לידים קרים לחמים"
                          : "Strongest heating engine - turns cold leads hot"}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-lg mt-0.5 flex-shrink-0">🌡️</span>
                      <span>
                        {isHebrew
                          ? "מעלה טמפרטורה של פרוספקטים בצורה שיטתית"
                          : "Systematically raises prospect temperature"}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Calendar className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>
                        {isHebrew
                          ? "מוביל לידים מחוממים לפגישות דרך קלנדלי"
                          : "Drives heated leads to Calendly meetings"}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Zap className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                      <span>
                        {isHebrew
                          ? "מבטל צורך בטלמרקטרים - החימום אוטומטי"
                          : "Eliminates telemarketers - heating is automatic"}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <BarChart3 className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                      <span>
                        {isHebrew
                          ? "מדד חום לידים ומעקב אחר טמפרטורה"
                          : "Lead temperature tracking and heat analytics"}
                      </span>
                    </li>
                  </ul>
                </motion.div>

                {/* Competition */}
                <motion.div
                  variants={slideUpVariants}
                  className="bg-white p-8 rounded-2xl shadow-lg border-2 border-gray-200"
                >
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-gray-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Target className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-geist-semibold text-gray-700 mb-2">
                      {isHebrew
                        ? "פתרונות נדל״ן אחרים"
                        : "Other Real Estate Tools"}
                    </h3>
                  </div>
                  <ul className="space-y-3 text-gray-600">
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-500 mt-1">~</span>
                      <span>
                        {isHebrew ? "עברית בסיסית בלבד" : "Basic Hebrew only"}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-500 mt-1">~</span>
                      <span>
                        {isHebrew
                          ? "מיקוד על שווקים זרים"
                          : "Focus on foreign markets"}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-500 mt-1">~</span>
                      <span>
                        {isHebrew
                          ? "יקר מאוד ולא גמיש"
                          : "Expensive and inflexible"}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 mt-1">✗</span>
                      <span>
                        {isHebrew
                          ? "לא מראה הקלדה אמיתית"
                          : "No realistic typing animation"}
                      </span>
                    </li>
                  </ul>
                </motion.div>
              </div>

              <motion.div
                variants={slideUpVariants}
                className="text-center mt-12"
              >
                <p className="text-lg font-geist-semibold text-gray-800 mb-4">
                  {isHebrew
                    ? "🏆 התוצאה: 70% שיעור תגובה, פגישות פנים אל פנים x2.5 יותר"
                    : "🏆 The Result: 70% response rates, 2.5x more face-to-face meetings"}
                </p>
                <div className="flex items-center justify-center gap-4 text-primary-600">
                  <Star className="w-5 h-5 fill-current" />
                  <Star className="w-5 h-5 fill-current" />
                  <Star className="w-5 h-5 fill-current" />
                  <Star className="w-5 h-5 fill-current" />
                  <Star className="w-5 h-5 fill-current" />
                </div>
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* Integrations */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="py-24 bg-gray-100"
        >
          <div className="container mx-auto px-4">
            <motion.div
              variants={slideUpVariants}
              className="text-center mb-16"
            >
              <h2 className="text-2xl md:text-3xl font-geist-semibold text-gray-900 mb-4">
                {t("integrations.title")}
              </h2>
              <p className="text-lg font-geist text-gray-700 max-w-3xl mx-auto mb-8">
                {t("integrations.subtitle")}
              </p>
              <p className="text-base font-geist text-gray-600 max-w-4xl mx-auto leading-relaxed">
                {t("integrations.body")}
              </p>
            </motion.div>

            <motion.div
              variants={slideUpVariants}
              className="max-w-7xl mx-auto"
            >
              <IntegrationVisualization />
              <motion.div
                variants={slideUpVariants}
                className="text-center mt-8"
              >
                <p className="text-sm text-gray-500 italic">
                  {isHebrew
                    ? "* שילובים מסומנים בכוכבית הם הדמיות למטרות הדגמה"
                    : "* Integrations marked with asterisk are mocked for demonstration purposes"}
                </p>
              </motion.div>
            </motion.div>
          </div>
        </motion.section>

        {/* FAQ Section - Using shadcn/ui Accordion */}
        <FAQ />

        {/* CTA Section */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={slideUpVariants}
          className="py-24 bg-gradient-to-br from-primary-600 to-primary-700 text-white relative overflow-hidden"
        >
          {/* Meteors Background Effect */}
          <Meteors number={15} className="opacity-20" />

          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
            />
          </div>

          <div className="container mx-auto px-4 text-center relative z-10">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-geist-semibold mb-4">
                {t("cta.title")}
              </h2>
              <p className="text-lg font-geist mb-8 text-white/90">
                {t("cta.subtitle")}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <ShimmerButton
                  className="px-8 py-4 text-lg shadow-lg hover:shadow-xl transition-all duration-300 font-geist-semibold"
                  background="rgba(255, 255, 255, 1)"
                  shimmerColor="#2563eb"
                  borderRadius="8px"
                  onClick={() => requestDemo(isHebrew)}
                >
                  <span className="text-primary-600">{t("cta.button")}</span>
                </ShimmerButton>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-16">
          <div className="container mx-auto px-4">
            {/* Single line layout */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8">
              {/* Brand Section */}
              <motion.div
                className="flex items-center gap-2 mb-4 md:mb-0"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <Building2 className="w-6 h-6" />
                <span className="text-xl font-geist-bold text-gray-900">
                  CRM Demo
                </span>
                <span className="text-gray-400 text-sm ml-2">
                  {t("footer.copyright")} | Built by Amit Yogev
                </span>
              </motion.div>

              {/* Contact and Links Section */}
              <motion.div
                className="flex items-center gap-4"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <button
                  onClick={() => setIsEarlyAccessOpen(true)}
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  {t("footer.contact")}
                </button>
                <span className="text-gray-600">•</span>
                <a
                  href="/privacy-policy"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  {t("footer.privacy")}
                </a>
                <span className="text-gray-600">•</span>
                <a
                  href="https://crm-portfolio-demo.vercel.app/terms-of-service"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  {t("footer.terms")}
                </a>
              </motion.div>
            </div>
          </div>
        </footer>
      </div>

      {/* Floating AI Assistant Button */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 2, duration: 0.5, type: "spring" }}
        className="fixed bottom-8 right-8 z-50"
      >
        <Button
          onClick={() => setIsAgentOpen(true)}
          className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 group relative"
          title={isHebrew ? "שאל את העוזר החכם שלנו" : "Ask our AI Assistant"}
        >
          <Sparkles className="h-7 w-7 text-white group-hover:scale-110 transition-transform" />
          
          {/* Animated ping effect */}
          <span className="absolute inset-0 rounded-full bg-purple-500/30 animate-ping" />
          
          {/* Badge for "NEW" */}
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
            {isHebrew ? "חדש" : "NEW"}
          </span>
        </Button>
      </motion.div>

      {/* AI Assistant Dialog */}
      <GeminiAgent
        open={isAgentOpen}
        onOpenChange={setIsAgentOpen}
        pageContext="landing"
      />

      {/* Early Access Form */}
      <EarlyAccessForm 
        isOpen={isEarlyAccessOpen} 
        onClose={() => setIsEarlyAccessOpen(false)} 
        language={isHebrew ? 'he' : 'en'}
      />
    </>
  );
};

export default LandingPage;
