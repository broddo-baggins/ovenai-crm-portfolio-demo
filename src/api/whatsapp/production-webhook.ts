// Production WhatsApp Webhook Integration
// Connects your web app with the Supabase webhook function

import { env } from "@/config/env";

interface WebhookMessage {
  id: string;
  from: string;
  timestamp: string;
  text?: {
    body: string;
  };
  type: "text" | "image" | "audio" | "video" | "document";
}

interface WebhookPayload {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        messages?: WebhookMessage[];
        statuses?: Array<{
          id: string;
          status: "sent" | "delivered" | "read" | "failed";
          timestamp: string;
          recipient_id: string;
        }>;
      };
      field: string;
    }>;
  }>;
}

export class ProductionWebhookHandler {
  private readonly webhookUrl = env.WHATSAPP_WEBHOOK_URL;
  private readonly verifyToken = env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
  private readonly phoneNumberId = env.WHATSAPP_PHONE_NUMBER_ID;

  constructor() {
    console.log("LINK Production Webhook Handler initialized:", {
      webhookUrl: this.webhookUrl,
      hasVerifyToken: !!this.verifyToken,
      phoneNumberId: this.phoneNumberId,
    });
  }

  /**
   * Process incoming webhook data from your Supabase function
   * This is called when your Supabase function forwards webhook data to your app
   */
  async processIncomingWebhook(payload: WebhookPayload): Promise<void> {
    try {
      console.log("📥 Processing incoming webhook:", payload);

      // Verify this is a WhatsApp webhook
      if (payload.object !== "whatsapp_business_account") {
        throw new Error("Invalid webhook object type");
      }

      // Process each entry
      for (const entry of payload.entry) {
        for (const change of entry.changes) {
          if (change.field === "messages") {
            await this.processMessages(change.value);
          } else if (change.field === "message_status") {
            await this.processMessageStatus(change.value);
          }
        }
      }
    } catch (error) {
      console.error("ERROR Error processing webhook:", error);
      throw error;
    }
  }

  /**
   * Process incoming messages
   */
  private async processMessages(value: any): Promise<void> {
    const messages = value.messages || [];

    for (const message of messages) {
      console.log("📨 Processing message:", {
        id: message.id,
        from: message.from,
        type: message.type,
        timestamp: message.timestamp,
      });

      // Extract message content based on type
      let content = "";
      switch (message.type) {
        case "text":
          content = message.text?.body || "";
          break;
        case "image":
          content = "[Image received]";
          break;
        case "audio":
          content = "[Audio received]";
          break;
        case "video":
          content = "[Video received]";
          break;
        case "document":
          content = "[Document received]";
          break;
        default:
          content = `[${message.type} message]`;
      }

      // Store message in your database
      await this.storeIncomingMessage({
        whatsappMessageId: message.id,
        senderNumber: message.from,
        receiverNumber: value.metadata?.phone_number_id || this.phoneNumberId,
        content,
        messageType: message.type,
        timestamp: new Date(parseInt(message.timestamp) * 1000).toISOString(),
        payload: message,
      });

      // Trigger auto-response if needed
      await this.handleAutoResponse(message.from, content);
    }
  }

  /**
   * Process message status updates (sent, delivered, read)
   */
  private async processMessageStatus(value: any): Promise<void> {
    const statuses = value.statuses || [];

    for (const status of statuses) {
      // Update message status in your database
      await this.updateMessageStatus(status.id, status.status);
    }
  }

  /**
   * Store incoming message in your database
   */
  private async storeIncomingMessage(messageData: {
    whatsappMessageId: string;
    senderNumber: string;
    receiverNumber: string;
    content: string;
    messageType: string;
    timestamp: string;
    payload: any;
  }): Promise<void> {
    try {
      // This would connect to your existing database service
      // For now, we'll log it and you can integrate with your DB
      console.log("SAVE Storing message:", messageData);

      // TODO: Integrate with your simpleProjectService or database
      // await simpleProjectService.createWhatsAppMessage(messageData);
    } catch (error) {
      console.error("ERROR Error storing message:", error);
    }
  }

  /**
   * Update message status in your database
   */
  private async updateMessageStatus(
    messageId: string,
    status: string,
  ): Promise<void> {
    try {
      console.log("NOTE Updating message status:", { messageId, status });

      // TODO: Integrate with your database
      // await simpleProjectService.updateMessageStatus(messageId, status);
    } catch (error) {
      console.error("ERROR Error updating message status:", error);
    }
  }

  /**
   * Handle auto-responses based on incoming messages
   */
  private async handleAutoResponse(
    senderNumber: string,
    messageContent: string,
  ): Promise<void> {
    try {
      const content = messageContent.toLowerCase();

      // Simple auto-response logic
      if (content.includes("hello") || content.includes("hi")) {
        await this.sendAutoResponse(
          senderNumber,
          "Hello! Thanks for reaching out. How can we help you today?",
        );
      } else if (content.includes("hours") || content.includes("time")) {
        await this.sendAutoResponse(
          senderNumber,
          "Our business hours are Monday-Friday 9AM-6PM EST. We'll get back to you during business hours!",
        );
      } else if (content.includes("price") || content.includes("cost")) {
        await this.sendAutoResponse(
          senderNumber,
          "Thanks for your interest! Our team will send you pricing information shortly.",
        );
      }
    } catch (error) {
      console.error("ERROR Error handling auto-response:", error);
    }
  }

  /**
   * Send auto-response message
   */
  private async sendAutoResponse(to: string, message: string): Promise<void> {
    try {
      // Import WhatsAppService dynamically to avoid circular dependency
      const { WhatsAppService } = await import("@/services/whatsapp-api");
      const whatsappService = new WhatsAppService();

      await whatsappService.sendMessage(to, message);
      console.log("🤖 Auto-response sent to:", to);
    } catch (error) {
      console.error("ERROR Error sending auto-response:", error);
    }
  }

  /**
   * Verify webhook signature (for security)
   */
  static verifyWebhookSignature(
    payload: string,
    signature: string,
    verifyToken: string,
  ): boolean {
    try {
      // Simple token verification (you can enhance this with crypto signatures)
      return signature === `sha256=${verifyToken}`;
    } catch (error) {
      console.error("ERROR Error verifying webhook signature:", error);
      return false;
    }
  }

  /**
   * Get webhook configuration for Meta setup
   */
  getWebhookConfig() {
    return {
      webhookUrl: this.webhookUrl,
      verifyToken: this.verifyToken,
      subscriptionFields: [
        "messages",
        "messaging_postbacks",
        "message_deliveries",
        "message_reads",
      ],
    };
  }
}

// Export singleton instance
export const productionWebhookHandler = new ProductionWebhookHandler();
