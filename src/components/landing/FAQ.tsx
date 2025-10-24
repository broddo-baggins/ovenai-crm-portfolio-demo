import React from 'react';
import { useTranslation } from 'react-i18next';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { motion } from 'framer-motion';
import { useLang } from '@/hooks/useLang';
import { cn } from '@/lib/utils';

const FAQ: React.FC = () => {
  const { t, i18n } = useTranslation('landing');
  const { isRTL, textStart } = useLang();
  const isHebrew = i18n.language === 'he';

  // FAQ data using translation keys
  const faqData = [
    {
      id: 'integration',
      question: t('faq.integration.question', 'How does the system integrate with existing systems?'),
      answer: t('faq.integration.answer', 'Simple connection to CRM (Salesforce, HubSpot, etc.), API and Webhooks for automatic data feeding. The system connects to all popular platforms and syncs data in real-time.')
    },
    {
      id: 'implementation-time',
      question: t('faq.implementationTime.question', 'How long does implementation take?'),
      answer: t('faq.implementationTime.answer', 'Initial setup within minutes, first results already in the first week of use. We provide complete training and technical support throughout the entire process.')
    },
    {
      id: 'languages',
      question: t('faq.languages.question', 'How many languages are supported?'),
      answer: t('faq.languages.answer', '50+ languages with advanced NLP and contextual memory for enhanced user experience.')
    },
    {
      id: 'customization',
      question: t('faq.customization.question', 'Can the system be customized for my business?'),
      answer: t('faq.customization.answer', 'Absolutely! The system is custom-built for each business. We learn your tone, products, customers, and unique sales processes to create a perfect fit.')
    },
    {
      id: 'roi',
      question: t('faq.roi.question', 'How quickly will I see ROI?'),
      answer: t('faq.roi.answer', 'Most clients see significant improvement in the first month. Average 70% increase in cold lead responses and 2.5x more face-to-face meetings.')
    },
    {
      id: 'support',
      question: t('faq.support.question', 'What kind of support do I receive?'),
      answer: t('faq.support.answer', '24/7 support in Hebrew and English, dedicated account manager, regular training sessions and ongoing strategic consulting. We\'re here to ensure your success.')
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  return (
    <section 
      className={cn("py-20 bg-gray-50 dark:bg-slate-900", isRTL && "font-hebrew")} 
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
          className="text-center mb-16"
        >
          <motion.h2 
            variants={itemVariants}
            className={cn(
              "text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4",
              textStart()
            )}
          >
            {t('faq.title', 'Frequently Asked Questions')}
          </motion.h2>
          <motion.p 
            variants={itemVariants}
            className={cn(
              "text-lg text-gray-600 dark:text-slate-300 max-w-2xl mx-auto",
              textStart()
            )}
          >
            {t('faq.subtitle', 'Everything you need to know about CRM Demo and how it can transform your business')}
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
        >
          <Accordion type="single" collapsible className="space-y-4">
            {faqData.map((item, index) => (
              <motion.div key={item.id} variants={itemVariants}>
                <AccordionItem 
                  value={item.id}
                  className={cn(
                    "bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 px-6 py-2",
                    isRTL && "text-right"
                  )}
                >
                  <AccordionTrigger 
                    className={cn(
                      "hover:no-underline py-4 text-gray-900 dark:text-white font-semibold",
                      textStart()
                    )}
                  >
                    <span className={cn("flex-1", textStart())}>
                      {item.question}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className={cn(
                    "pb-4 text-gray-600 dark:text-slate-300 leading-relaxed",
                    textStart()
                  )}>
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQ; 