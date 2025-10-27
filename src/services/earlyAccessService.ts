export interface EarlyAccessRequest {
  fullName: string;
  email: string;
  company: string;
  message?: string;
  language: 'he' | 'en';
  submittedAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface EarlyAccessResponse {
  success: boolean;
  message: string;
  requestId?: string;
}

class EarlyAccessService {
  async submitRequest(request: Omit<EarlyAccessRequest, 'submittedAt'>): Promise<EarlyAccessResponse> {
    try {
      // Basic validation
      if (!request.fullName || !request.email || !request.company) {
        return {
          success: false,
          message: 'All required fields must be filled'
        };
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(request.email)) {
        return {
          success: false,
          message: 'Invalid email address'
        };
      }

      // For now, we'll store the request locally and send notification
      // Later you can integrate with your database or external service
      const requestData = {
        ...request,
        submittedAt: new Date(),
        requestId: crypto.randomUUID()
      };

      // Store in local storage temporarily (for demo)
      const existingRequests = JSON.parse(localStorage.getItem('earlyAccessRequests') || '[]');
      const existingRequest = existingRequests.find((req: any) => req.email === request.email);
      
      if (existingRequest) {
        return {
          success: false,
          message: 'A request with this email already exists'
        };
      }

      existingRequests.push(requestData);
      localStorage.setItem('earlyAccessRequests', JSON.stringify(existingRequests));

      // Send notification email (optional)
      await this.sendNotificationEmail(request);

      return {
        success: true,
        message: 'Request submitted successfully!',
        requestId: requestData.requestId
      };

    } catch (error) {
      console.error('Early access service error:', error);
      return {
        success: false,
        message: 'Unexpected error. Please try again.'
      };
    }
  }

  private async sendNotificationEmail(request: Omit<EarlyAccessRequest, 'submittedAt'>) {
    try {
      // Here you would integrate with your email service
      // For example, using SendGrid, Resend, or similar
      
      const emailData = {
        to: 'amit@amityogev.com', // Your team email
        subject: `New Early Access Request - ${request.company}`,
        text: `
          New early access request received:
          
          Name: ${request.fullName}
          Email: ${request.email}
          Company: ${request.company}
          Language: ${request.language}
          Message: ${request.message || 'No message provided'}
          
          Submitted at: ${new Date().toISOString()}
        `
      };

      console.log('Would send email notification:', emailData);
      
      // TODO: Implement actual email sending
      // await emailService.send(emailData);
      
    } catch (error) {
      console.error('Error sending notification email:', error);
      // Don't throw error here - request was still successful
    }
  }

  async getRequests(filters?: {
    language?: 'he' | 'en';
    status?: 'pending' | 'contacted' | 'converted';
    startDate?: Date;
    endDate?: Date;
  }): Promise<EarlyAccessRequest[]> {
    try {
      // For now, get from local storage (demo implementation)
      const existingRequests = JSON.parse(localStorage.getItem('earlyAccessRequests') || '[]');
      
      let filteredRequests = existingRequests;

      if (filters?.language) {
        filteredRequests = filteredRequests.filter((req: any) => req.language === filters.language);
      }

      if (filters?.startDate) {
        filteredRequests = filteredRequests.filter((req: any) => 
          new Date(req.submittedAt) >= filters.startDate!
        );
      }

      if (filters?.endDate) {
        filteredRequests = filteredRequests.filter((req: any) => 
          new Date(req.submittedAt) <= filters.endDate!
        );
      }

      return filteredRequests.map((item: any) => ({
        fullName: item.fullName,
        email: item.email,
        company: item.company,
        message: item.message,
        language: item.language,
        submittedAt: new Date(item.submittedAt),
        ipAddress: item.ipAddress,
        userAgent: item.userAgent
      }));

    } catch (error) {
      console.error('Error in getRequests:', error);
      return [];
    }
  }

  async updateRequestStatus(email: string, status: 'pending' | 'contacted' | 'converted'): Promise<boolean> {
    try {
      // For now, update in local storage (demo implementation)
      const existingRequests = JSON.parse(localStorage.getItem('earlyAccessRequests') || '[]');
      const requestIndex = existingRequests.findIndex((req: any) => req.email === email);
      
      if (requestIndex === -1) {
        return false;
      }

      existingRequests[requestIndex].status = status;
      localStorage.setItem('earlyAccessRequests', JSON.stringify(existingRequests));

      return true;
    } catch (error) {
      console.error('Error in updateRequestStatus:', error);
      return false;
    }
  }
}

export const earlyAccessService = new EarlyAccessService(); 