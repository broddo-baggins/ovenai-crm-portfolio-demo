import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Shield,
  Scale,
  FileText,
  Users,
  AlertTriangle,
  Info,
  Building2,
  Mail,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLang } from "@/hooks/useLang";
import { cn } from "@/lib/utils";

export default function TermsOfService() {
  const { t } = useTranslation("pages");
  const { isRTL, textStart } = useLang();

  // Format the last updated date
  const formattedDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Set the document title and meta tags with useEffect
  useEffect(() => {
    // Set document title
    document.title = `Terms & Conditions - OvenAI`;

    // Add meta tags for SEO
    const metaDescription = document.createElement("meta");
    metaDescription.name = "description";
    metaDescription.content =
      "OvenAI Terms & Conditions - AI-powered property management platform terms of service";
    document.head.appendChild(metaDescription);

    const metaRobots = document.createElement("meta");
    metaRobots.name = "robots";
    metaRobots.content = "index,follow";
    document.head.appendChild(metaRobots);

    return () => {
      // Clean up meta tags when component unmounts
      if (document.head.contains(metaDescription)) {
        document.head.removeChild(metaDescription);
      }
      if (document.head.contains(metaRobots)) {
        document.head.removeChild(metaRobots);
      }
    };
  }, []);

  const sections = [
    {
      id: "introduction",
      title: "Introduction",
      icon: <Info className="h-6 w-6 text-primary" />,
      content: (
        <div className="space-y-4">
          <p className="text-foreground">
            Welcome to OvenAI, an AI-powered property management and lead
            generation platform. These Terms & Conditions ("Terms") govern your
            access to and use of OvenAI's website, services, and applications
            (collectively, the "Services").
          </p>
          <p className="text-foreground">
            By accessing or using our Services, you agree to be bound by these
            Terms. If you disagree with any part of these terms, then you may
            not access the Service.
          </p>
        </div>
      ),
    },
    {
      id: "definitions",
      title: "Definitions",
      icon: <FileText className="h-6 w-6 text-primary" />,
      content: (
        <div className="space-y-2">
          <p className="text-gray-700">For the purposes of these Terms:</p>
          <ul className="list-disc pl-6 text-gray-700 space-y-1">
            <li>
              <strong>"Company"</strong> refers to OvenAI
            </li>
            <li>
              <strong>"Service"</strong> refers to the AI property management
              platform
            </li>
            <li>
              <strong>"User"</strong> refers to the individual accessing or
              using the Service
            </li>
            <li>
              <strong>"Content"</strong> refers to any data, text, graphics, or
              other materials
            </li>
            <li>
              <strong>"AI Agent"</strong> refers to our automated conversation
              and lead management system
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: "account",
      title: "Your Account",
      icon: <Users className="h-6 w-6 text-primary" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            You are responsible for maintaining the security of your account and
            for all activities that occur under your account. You must
            immediately notify us of any unauthorized use of your account or any
            other breach of security.
          </p>
          <p className="text-gray-700">
            You agree to provide accurate, current, and complete information
            during registration and to update such information to keep it
            accurate, current, and complete.
          </p>
        </div>
      ),
    },
    {
      id: "acceptable-use",
      title: "Acceptable Use",
      icon: <Shield className="h-6 w-6 text-primary" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">You agree not to:</p>
          <ul className="list-disc pl-6 text-gray-700 space-y-1">
            <li>
              Use the Services for any illegal purpose or in violation of any
              laws
            </li>
            <li>
              Violate any laws in your jurisdiction (including but not limited
              to copyright laws)
            </li>
            <li>Infringe upon the rights of others</li>
            <li>
              Interfere with or disrupt the Services or servers connected to the
              Services
            </li>
            <li>
              Attempt to gain unauthorized access to any portion of the Services
            </li>
            <li>Use the AI Agent to send spam or unsolicited communications</li>
            <li>
              Upload or transmit viruses or any other type of malicious code
            </li>
            <li>
              Collect or harvest any personally identifiable information from
              the Services
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: "ai-services",
      title: "AI Services and Limitations",
      icon: <Building2 className="h-6 w-6 text-primary" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            Our AI Agent provides automated conversation and lead management
            services. While we strive for accuracy, AI-generated content may not
            always be perfect or appropriate for every situation.
          </p>
          <p className="text-gray-700">You acknowledge that:</p>
          <ul className="list-disc pl-6 text-gray-700 space-y-1">
            <li>
              AI responses are generated automatically and may require human
              oversight
            </li>
            <li>
              You are responsible for reviewing and approving AI-generated
              communications
            </li>
            <li>
              We do not guarantee the accuracy or appropriateness of
              AI-generated content
            </li>
            <li>
              You should comply with all applicable laws regarding automated
              communications
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: "whatsapp-usage",
      title: "WhatsApp® Business API Usage",
      icon: <Mail className="h-6 w-6 text-primary" />,
      content: (
        <div className="space-y-4">
          <p>
            Our platform integrates with Meta's WhatsApp® Business API. By using these features, you agree to:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Comply with Meta's WhatsApp® Business API Terms of Service</li>
            <li>Respect recipient privacy and consent requirements</li>
            <li>Use messaging features only for legitimate business purposes</li>
            <li>Follow WhatsApp® Business messaging policies and guidelines</li>
            <li>Maintain accurate business information and verification status</li>
            <li>Ensure your business is properly verified for WhatsApp® Business API usage</li>
            <li>Report any violations or abuse of the messaging system</li>
          </ul>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
            You are responsible for maintaining compliance with WhatsApp® Business API policies. 
            Violations may result in suspension of messaging features.
          </p>
        </div>
      ),
    },
    {
      id: "intellectual-property",
      title: "Intellectual Property",
      icon: <Scale className="h-6 w-6 text-primary" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            All content, features, and functionality of the Services are owned
            by OvenAI and are protected by Israeli and international copyright,
            trademark, and other intellectual property laws.
          </p>
          <p className="text-gray-700">
            You retain ownership of any content you upload to the Services, but
            grant us a license to use, modify, and display such content as
            necessary to provide the Services.
          </p>
        </div>
      ),
    },
    {
      id: "data-privacy",
      title: "Data and Privacy",
      icon: <Shield className="h-6 w-6 text-primary" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            Your privacy is important to us. Please review our Privacy Policy,
            which also governs your use of the Service, to understand our
            practices.
          </p>
          <p className="text-gray-700">
            By using our Service, you agree to the collection and use of
            information in accordance with our Privacy Policy.
          </p>
        </div>
      ),
    },
    {
      id: "payment-billing",
      title: "Payment and Billing",
      icon: <FileText className="h-6 w-6 text-primary" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            Paid services are billed in advance on a monthly or annual basis.
            You will be charged for the upcoming billing period upon
            subscription.
          </p>
          <p className="text-gray-700">
            All fees are non-refundable except as required by law or as
            specifically stated in these Terms.
          </p>
        </div>
      ),
    },
    {
      id: "termination",
      title: "Termination",
      icon: <AlertTriangle className="h-6 w-6 text-primary" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            We may terminate or suspend your access to the Services immediately,
            without prior notice or liability, for any reason, including if you
            breach these Terms.
          </p>
          <p className="text-gray-700">
            Upon termination, your right to use the Services will cease
            immediately. If you wish to terminate your account, you may simply
            discontinue using the Services.
          </p>
        </div>
      ),
    },
    {
      id: "limitation-liability",
      title: "Limitation of Liability",
      icon: <Scale className="h-6 w-6 text-primary" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            To the maximum extent permitted by law, OvenAI shall not be liable
            for any indirect, incidental, special, consequential, or punitive
            damages resulting from your use of or inability to use the Services.
          </p>
          <p className="text-gray-700">
            In no event shall our total liability to you for all damages exceed
            the amount paid by you to OvenAI in the twelve (12) months preceding
            the claim.
          </p>
        </div>
      ),
    },
    {
      id: "governing-law",
      title: "Governing Law",
      icon: <Scale className="h-6 w-6 text-primary" />,
      content: (
        <p className="text-gray-700">
          These Terms shall be governed by and construed in accordance with the
          laws of the State of Israel, without regard to its conflict of law
          provisions. Any disputes arising from these Terms will be subject to
          the exclusive jurisdiction of the courts of Tel Aviv, Israel.
        </p>
      ),
    },
    {
      id: "changes",
      title: "Changes to Terms",
      icon: <AlertTriangle className="h-6 w-6 text-primary" />,
      content: (
        <p className="text-gray-700">
          We reserve the right to modify these Terms at any time. We will notify
          you of any changes by posting the new Terms on this page and updating
          the "Last updated" date. Your continued use of the Service after such
          modifications constitutes acceptance of the updated Terms.
        </p>
      ),
    },
    {
      id: "contact",
      title: "Contact Us",
      icon: <Mail className="h-6 w-6 text-primary" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            If you have any questions about these Terms & Conditions, please
            contact us:
          </p>
          <ul className="list-none text-gray-700 space-y-1">
            <li>
              Email:{" "}
              <a
                href="mailto:legal@ovenai.com"
                className="text-primary hover:underline"
              >
                legal@ovenai.com
              </a>
            </li>
            <li>Address: Tel Aviv, Israel</li>
            <li>
              Website:{" "}
              <a
                href="https://ovenai.app"
                className="text-primary hover:underline"
              >
                https://ovenai.app
              </a>
            </li>
          </ul>
        </div>
      ),
    },
  ];

  return (
    <div
      className={cn("container mx-auto py-12 px-4", isRTL && "rtl")}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            {t("terms.title", "Terms & Conditions")}
          </h1>
          <p className="text-muted-foreground">Last updated: {formattedDate}</p>
          <div className="flex justify-center mt-6">
            <div className="h-1 w-20 bg-primary rounded"></div>
          </div>
        </div>

        <div className="grid gap-8">
          {sections.map((section, index) => (
            <Card
              key={section.id}
              className="overflow-hidden transition-all hover:shadow-md"
            >
              <CardHeader className="bg-muted/50 flex flex-row items-center gap-4 pb-4">
                <div className="p-2 bg-primary/10 rounded-full">
                  {section.icon}
                </div>
                <CardTitle className="text-xl font-semibold">
                  {index + 1}. {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">{section.content}</CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-muted-foreground text-sm">
            By using our service, you acknowledge that you have read and
            understand these Terms & Conditions.
          </p>
          <div className="mt-6 space-x-4">
            <Link to="/privacy-policy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
            <span className="text-muted-foreground">•</span>
            <Link to="/" className="text-primary hover:underline">
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
