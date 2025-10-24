// WhatsApp Business Template Submission Utility
// Use this to submit templates to Meta for approval

import { META_SUBMISSION_TEMPLATES } from "../../services/whatsapp-api";

interface WhatsAppTemplate {
  name: string;
  category: "MARKETING" | "UTILITY" | "AUTHENTICATION";
  language: string;
  components: Array<{
    type: "HEADER" | "BODY" | "FOOTER" | "BUTTONS";
    text?: string;
    parameters?: Array<{
      type: "TEXT";
      text: string;
    }>;
  }>;
}

export interface TemplateSubmissionResult {
  success: boolean;
  templateId?: string;
  templateName: string;
  error?: string;
  submissionDetails?: {
    status: "PENDING" | "SUBMITTED" | "ERROR";
    submittedAt: string;
    estimatedApprovalTime: string;
  };
}

export class TemplateSubmissionService {
  private static businessAccountId =
    process.env.VITE_WHATSAPP_BUSINESS_ACCOUNT_ID;
  private static accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  private static baseUrl = "https://graph.facebook.com/v18.0";

  /**
   * Submit all Meta-ready templates for approval
   * Use this to submit the 5 basic utility templates
   */
  static async submitAllTemplates(): Promise<TemplateSubmissionResult[]> {
    console.log("INIT Starting bulk template submission to Meta...");

    const results: TemplateSubmissionResult[] = [];
    const templates = Object.values(META_SUBMISSION_TEMPLATES);

    for (const template of templates) {
      try {
        console.log(`NOTE Submitting template: ${template.name}`);
        const result = await this.submitSingleTemplate(
          template as WhatsAppTemplate,
        );
        results.push(result);

        // Add delay between submissions to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`ERROR Failed to submit template ${template.name}:`, error);
        results.push({
          success: false,
          templateName: template.name,
          error: (error as Error).message,
        });
      }
    }

    console.log(
      `SUCCESS Template submission complete. ${results.filter((r) => r.success).length}/${results.length} successful`,
    );
    return results;
  }

  /**
   * Submit a single template to Meta for approval
   */
  static async submitSingleTemplate(
    template: WhatsAppTemplate,
  ): Promise<TemplateSubmissionResult> {
    if (!this.businessAccountId || !this.accessToken) {
      throw new Error(
        "Missing WhatsApp Business API credentials. Please check your environment variables.",
      );
    }

    const submissionData = {
      name: template.name,
      category: template.category,
      language: template.language,
      components: template.components,
    };

    console.log(
      `📤 Submitting template "${template.name}" to Meta:`,
      submissionData,
    );

    try {
      const response = await fetch(
        `${this.baseUrl}/${this.businessAccountId}/message_templates`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(submissionData),
        },
      );

      const result = await response.json();

      if (response.ok && result.id) {
        console.log(
          `SUCCESS Template "${template.name}" submitted successfully. ID: ${result.id}`,
        );

        return {
          success: true,
          templateId: result.id,
          templateName: template.name,
          submissionDetails: {
            status: "SUBMITTED",
            submittedAt: new Date().toISOString(),
            estimatedApprovalTime: "1-5 business days",
          },
        };
      } else {
        console.error(
          `ERROR Failed to submit template "${template.name}":`,
          result,
        );
        throw new Error(result.error?.message || "Unknown submission error");
      }
    } catch (error) {
      console.error(`💥 Error submitting template "${template.name}":`, error);
      throw error;
    }
  }

  /**
   * Check approval status of submitted templates
   */
  static async checkTemplateStatus(templateId: string): Promise<{
    id: string;
    name: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    category: string;
    language: string;
  } | null> {
    if (!this.accessToken) {
      throw new Error("Missing WhatsApp access token");
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/${templateId}?fields=id,name,status,category,language`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        },
      );

      if (response.ok) {
        const result = await response.json();

        return result;
      } else {
        console.error(
          "Failed to check template status:",
          await response.text(),
        );
        return null;
      }
    } catch (error) {
      console.error("Error checking template status:", error);
      return null;
    }
  }

  /**
   * Get all submitted templates with their approval status
   */
  static async getAllTemplatesStatus(): Promise<any[]> {
    if (!this.businessAccountId || !this.accessToken) {
      throw new Error("Missing WhatsApp Business API credentials");
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/${this.businessAccountId}/message_templates?fields=id,name,status,category,language,components`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        },
      );

      if (response.ok) {
        const result = await response.json();
        console.log(
          `📋 Found ${result.data?.length || 0} templates in account`,
        );
        return result.data || [];
      } else {
        console.error("Failed to fetch templates:", await response.text());
        return [];
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
      return [];
    }
  }
}

// Quick submission utility for immediate use
export const submitBasicTemplates = async (): Promise<void> => {
  console.log("NOTE Templates to submit:");

  Object.values(META_SUBMISSION_TEMPLATES).forEach((template, index) => {
    const typedTemplate = template as WhatsAppTemplate;
    console.log(
      `${index + 1}. ${typedTemplate.name} (${typedTemplate.category})`,
    );
  });

  console.log("\nINIT Starting submission process...");

  try {
    const results = await TemplateSubmissionService.submitAllTemplates();

    results.forEach((result) => {
      if (result.success) {
        console.log(
          `SUCCESS ${result.templateName}: Submitted (ID: ${result.templateId})`,
        );
      } else {
      }
    });

    const successCount = results.filter((r) => r.success).length;
    console.log(
      `\nCOMPLETE SUCCESS: ${successCount}/${results.length} templates submitted to Meta for approval`,
    );
    console.log("TIMER  Estimated approval time: 1-5 business days");
  } catch (error) {
    console.error("💥 SUBMISSION FAILED:", error);
    throw error;
  }
};

export default TemplateSubmissionService;
