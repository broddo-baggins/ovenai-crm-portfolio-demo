// WhatsApp Business API Message Service
// Complete bidirectional messaging for Meta App Review

import {
  WhatsAppLogger,
  MetaAPIError,
  ValidationError,
  RateLimitError,
  ErrorRecoveryManager,
  CircuitBreaker,
  RateLimiter,
  HealthMonitor,
  type LogContext,
} from "../../lib/whatsapp-error-handler";

const logger = WhatsAppLogger.getInstance();
const errorRecovery = new ErrorRecoveryManager();
const circuitBreaker = new CircuitBreaker(5, 60000);
const rateLimiter = new RateLimiter();
const healthMonitor = new HealthMonitor();

// WhatsApp API Configuration
const WHATSAPP_API_URL = "https://graph.facebook.com/v18.0";
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

export interface WhatsAppMessage {
  id: string;
  from: string;
  to?: string;
  type: "text" | "image" | "document" | "audio" | "video" | "template";
  text?: {
    body: string;
  };
  image?: {
    id?: string;
    link?: string;
    caption?: string;
  };
  template?: {
    name: string;
    language: { code: string };
    components?: any[];
  };
  timestamp: string;
  status?: "sent" | "delivered" | "read" | "failed";
}

export interface IncomingWebhookData {
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
        contacts?: Array<{
          profile: {
            name: string;
          };
          wa_id: string;
        }>;
        messages?: WhatsAppMessage[];
        statuses?: Array<{
          id: string;
          status: string;
          timestamp: string;
          recipient_id: string;
        }>;
      };
      field: string;
    }>;
  }>;
}

export class WhatsAppMessageService {
  // Process incoming webhook data
  static async processIncomingWebhook(
    webhookData: IncomingWebhookData,
  ): Promise<{
    success: boolean;
    processedMessages: number;
    processedStatuses: number;
    errors: string[];
  }> {
    const context: LogContext = {
      requestId: `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      phoneNumberId: PHONE_NUMBER_ID,
    };

    logger.info("Processing incoming webhook", context, {
      object: webhookData.object,
      entryCount: webhookData.entry?.length || 0,
    });

    const result = {
      success: true,
      processedMessages: 0,
      processedStatuses: 0,
      errors: [] as string[],
    };

    try {
      if (!webhookData.entry || webhookData.entry.length === 0) {
        throw new ValidationError("No entry data in webhook");
      }

      for (const entry of webhookData.entry) {
        for (const change of entry.changes) {
          if (change.field === "messages") {
            // Process incoming messages
            if (change.value.messages) {
              for (const message of change.value.messages) {
                try {
                  await this.processIncomingMessage(message, context);
                  result.processedMessages++;
                  healthMonitor.incrementMessagesReceived();
                } catch (error) {
                  const errorMsg = `Failed to process message ${message.id}: ${(error as Error).message}`;
                  result.errors.push(errorMsg);
                  logger.error(
                    "Message processing failed",
                    { ...context, messageId: message.id },
                    error as Error,
                  );
                  healthMonitor.incrementErrors();
                }
              }
            }

            // Process message status updates
            if (change.value.statuses) {
              for (const status of change.value.statuses) {
                try {
                  await this.processStatusUpdate(status, context);
                  result.processedStatuses++;
                } catch (error) {
                  const errorMsg = `Failed to process status ${status.id}: ${(error as Error).message}`;
                  result.errors.push(errorMsg);
                  logger.error(
                    "Status processing failed",
                    { ...context, messageId: status.id },
                    error as Error,
                  );
                }
              }
            }
          }
        }
      }

      if (result.errors.length > 0) {
        result.success = false;
      }

      logger.info("Webhook processing completed", context, result);
      return result;
    } catch (error) {
      result.success = false;
      result.errors.push((error as Error).message);
      logger.error("Webhook processing failed", context, error as Error);
      healthMonitor.incrementErrors();
      throw error;
    }
  }

  // Process individual incoming message
  private static async processIncomingMessage(
    message: WhatsAppMessage,
    context: LogContext,
  ): Promise<void> {
    const messageContext = {
      ...context,
      messageId: message.id,
      from: message.from,
    };

    logger.info("Processing incoming message", messageContext, {
      type: message.type,
      hasText: !!message.text?.body,
    });

    // Validate message
    if (!message.from || !message.id) {
      throw new ValidationError("Invalid message: missing from or id");
    }

    // Check rate limiting
    if (!rateLimiter.isAllowed(message.from)) {
      throw new RateLimitError(`Rate limit exceeded for ${message.from}`);
    }

    // Store message in database (implement your storage logic)
    await this.storeIncomingMessage(message);

    // Auto-respond based on message type and content
    await this.handleAutoResponse(message, messageContext);
  }

  // Process message status updates
  private static async processStatusUpdate(
    status: any,
    context: LogContext,
  ): Promise<void> {
    logger.info("Processing message status", context, {
      messageId: status.id,
      status: status.status,
      recipientId: status.recipient_id,
    });

    // Update message status in database
    await this.updateMessageStatus(status.id, status.status, status.timestamp);
  }

  // Send text message
  static async sendTextMessage(
    to: string,
    text: string,
    replyToMessageId?: string,
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const context: LogContext = {
      requestId: `send_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      phoneNumberId: PHONE_NUMBER_ID,
      from: to,
    };

    try {
      logger.info("Sending text message", context, {
        to,
        textLength: text.length,
        isReply: !!replyToMessageId,
      });

      // Validate inputs
      if (!to || !text) {
        throw new ValidationError("Missing required parameters: to or text");
      }

      if (!ACCESS_TOKEN || !PHONE_NUMBER_ID) {
        throw new ValidationError("Missing WhatsApp configuration");
      }

      // Check rate limiting
      if (!rateLimiter.isAllowed(to)) {
        throw new RateLimitError(`Rate limit exceeded for ${to}`);
      }

      const messageData = {
        messaging_product: "whatsapp",
        to: to,
        type: "text",
        text: {
          body: text,
        },
        ...(replyToMessageId && {
          context: {
            message_id: replyToMessageId,
          },
        }),
      };

      const response = await this.makeMetaAPICall(
        "POST",
        `/${PHONE_NUMBER_ID}/messages`,
        messageData,
        context,
      );

      if (response.messages && response.messages[0]) {
        const messageId = response.messages[0].id;

        // Store sent message
        await this.storeSentMessage({
          id: messageId,
          to,
          type: "text",
          text: { body: text },
          timestamp: new Date().toISOString(),
          status: "sent",
        });

        healthMonitor.incrementMessagesSent();
        logger.info("Text message sent successfully", context, { messageId });

        return { success: true, messageId };
      } else {
        throw new MetaAPIError("Invalid response from Meta API");
      }
    } catch (error) {
      logger.error("Failed to send text message", context, error as Error);
      healthMonitor.incrementErrors();
      return { success: false, error: (error as Error).message };
    }
  }

  // Send template message
  static async sendTemplateMessage(
    to: string,
    templateName: string,
    languageCode: string = "en_US",
    components?: any[],
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const context: LogContext = {
      requestId: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      phoneNumberId: PHONE_NUMBER_ID,
      from: to,
    };

    try {
      logger.info("Sending template message", context, {
        to,
        templateName,
        languageCode,
        hasComponents: !!components?.length,
      });

      // Validate inputs
      if (!to || !templateName) {
        throw new ValidationError(
          "Missing required parameters: to or templateName",
        );
      }

      // Check rate limiting
      if (!rateLimiter.isAllowed(to)) {
        throw new RateLimitError(`Rate limit exceeded for ${to}`);
      }

      const messageData = {
        messaging_product: "whatsapp",
        to: to,
        type: "template",
        template: {
          name: templateName,
          language: {
            code: languageCode,
          },
          ...(components && { components }),
        },
      };

      const response = await this.makeMetaAPICall(
        "POST",
        `/${PHONE_NUMBER_ID}/messages`,
        messageData,
        context,
      );

      if (response.messages && response.messages[0]) {
        const messageId = response.messages[0].id;

        // Store sent message
        await this.storeSentMessage({
          id: messageId,
          to,
          type: "template",
          template: {
            name: templateName,
            language: { code: languageCode },
            components,
          },
          timestamp: new Date().toISOString(),
          status: "sent",
        });

        healthMonitor.incrementMessagesSent();
        logger.info("Template message sent successfully", context, {
          messageId,
          templateName,
        });

        return { success: true, messageId };
      } else {
        throw new MetaAPIError("Invalid response from Meta API");
      }
    } catch (error) {
      logger.error("Failed to send template message", context, error as Error);
      healthMonitor.incrementErrors();
      return { success: false, error: (error as Error).message };
    }
  }

  // Mark message as read
  static async markMessageAsRead(
    messageId: string,
  ): Promise<{ success: boolean; error?: string }> {
    const context: LogContext = {
      requestId: `read_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      phoneNumberId: PHONE_NUMBER_ID,
      messageId,
    };

    try {
      logger.info("Marking message as read", context);

      const response = await this.makeMetaAPICall(
        "POST",
        `/${PHONE_NUMBER_ID}/messages`,
        {
          messaging_product: "whatsapp",
          status: "read",
          message_id: messageId,
        },
        context,
      );

      logger.info("Message marked as read", context);
      return { success: true };
    } catch (error) {
      logger.error("Failed to mark message as read", context, error as Error);
      return { success: false, error: (error as Error).message };
    }
  }

  // Make API call to Meta with error handling and retry logic
  private static async makeMetaAPICall(
    method: "GET" | "POST",
    endpoint: string,
    data?: any,
    context?: LogContext,
  ): Promise<any> {
    const operation = async (): Promise<any> => {
      const url = `${WHATSAPP_API_URL}${endpoint}`;

      const options: RequestInit = {
        method,
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        ...(data && { body: JSON.stringify(data) }),
      };

      const response = await fetch(url, options);
      const responseData = await response.json();

      if (!response.ok) {
        if (responseData.error) {
          throw new MetaAPIError(
            responseData.error.message || "Meta API Error",
            responseData.error.code?.toString(),
            responseData.error.error_subcode?.toString(),
          );
        } else {
          throw new MetaAPIError(
            `HTTP ${response.status}: ${response.statusText}`,
            response.status.toString(),
          );
        }
      }

      return responseData;
    };

    // Execute with circuit breaker and retry logic
    return await errorRecovery.executeWithRetry(
      () => circuitBreaker.execute(operation),
      `meta_api_${endpoint}_${method}`,
      3, // max retries
      1000, // base delay ms
    );
  }

  // Auto-response handler
  private static async handleAutoResponse(
    message: WhatsAppMessage,
    context: LogContext,
  ): Promise<void> {
    // Simple auto-response logic - customize as needed
    if (message.type === "text" && message.text?.body) {
      const text = message.text.body.toLowerCase();

      if (text.includes("hello") || text.includes("hi")) {
        await this.sendTextMessage(
          message.from,
          "Hello! Thanks for contacting us. How can I help you today?",
          message.id,
        );
      } else if (text.includes("help") || text.includes("support")) {
        await this.sendTextMessage(
          message.from,
          "I'm here to help! Please describe your question or concern and I'll assist you.",
          message.id,
        );
      } else if (text.includes("thank")) {
        await this.sendTextMessage(
          message.from,
          "You're welcome! Is there anything else I can help you with?",
          message.id,
        );
      }
    }

    // Mark message as read
    await this.markMessageAsRead(message.id);
  }

  // Database operations (implement based on your database)
  private static async storeIncomingMessage(
    message: WhatsAppMessage,
  ): Promise<void> {
    // TODO: Implement database storage
    logger.debug(
      "Storing incoming message",
      { messageId: message.id },
      {
        action: "store_incoming_message",
        messageType: message.type,
      },
    );
  }

  private static async storeSentMessage(
    message: Partial<WhatsAppMessage>,
  ): Promise<void> {
    // TODO: Implement database storage
    logger.debug(
      "Storing sent message",
      { messageId: message.id },
      {
        action: "store_sent_message",
        messageType: message.type,
      },
    );
  }

  private static async updateMessageStatus(
    messageId: string,
    status: string,
    timestamp: string,
  ): Promise<void> {
    // TODO: Implement database update
    logger.debug(
      "Updating message status",
      { messageId },
      {
        action: "update_message_status",
        status,
        timestamp,
      },
    );
  }

  // Health check for the message service
  static getHealthStatus(): any {
    return {
      service: "WhatsApp Message Service",
      ...healthMonitor.getHealthStatus(),
      errorRate: healthMonitor.getErrorRate(),
      configuration: {
        hasAccessToken: !!ACCESS_TOKEN,
        hasPhoneNumberId: !!PHONE_NUMBER_ID,
        hasVerifyToken: !!VERIFY_TOKEN,
        apiUrl: WHATSAPP_API_URL,
      },
    };
  }
}

export default WhatsAppMessageService;
