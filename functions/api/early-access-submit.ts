export interface EarlyAccessSubmission {
  fullName: string;
  email: string;
  phone: string;
  company: string;
  message?: string;
  language: 'he' | 'en';
  submittedAt: string;
}

export async function handleEarlyAccessSubmission(data: EarlyAccessSubmission): Promise<{
  success: boolean;
  message: string;
  requestId?: string;
}> {
  try {
    // Basic validation
    if (!data.fullName || !data.email || !data.phone || !data.company) {
      return { 
        success: false,
        message: 'Missing required fields' 
      };
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return { 
        success: false,
        message: 'Invalid email format' 
      };
    }

    // Phone validation
    const phoneRegex = /^[+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(data.phone.replace(/[-\s()]/g, ''))) {
      return { 
        success: false,
        message: 'Invalid phone format' 
      };
    }

    // Log the submission (in production, save to database or send to Google Forms)
    console.log('📝 Early Access Request Received:', {
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      company: data.company,
      language: data.language,
      submittedAt: data.submittedAt,
      message: data.message || 'No message provided'
    });

    // Store locally for now (you can integrate with Google Forms later)
    const existingSubmissions = JSON.parse(localStorage.getItem('earlyAccessSubmissions') || '[]');
    const newSubmission = {
      ...data,
      requestId: `EA-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    
    // Check for duplicates
    const isDuplicate = existingSubmissions.some((submission: any) => 
      submission.email === data.email || submission.phone === data.phone
    );
    
    if (isDuplicate) {
      return {
        success: false,
        message: 'A request with this email or phone already exists'
      };
    }

    existingSubmissions.push(newSubmission);
    localStorage.setItem('earlyAccessSubmissions', JSON.stringify(existingSubmissions));

    // TODO: Here you would typically:
    // 1. Save to database (Supabase, MongoDB, etc.)
    // 2. Send to Google Forms
    // 3. Send notification email to team
    // 4. Add to CRM system

    return { 
      success: true, 
      message: 'Request submitted successfully',
      requestId: newSubmission.requestId
    };

  } catch (error) {
    console.error('❌ Early Access API Error:', error);
    return { 
      success: false,
      message: 'Internal server error' 
    };
  }
}

// Function to get all submissions (for admin viewing)
export function getAllSubmissions(): EarlyAccessSubmission[] {
  try {
    return JSON.parse(localStorage.getItem('earlyAccessSubmissions') || '[]');
  } catch (error) {
    console.error('Error getting submissions:', error);
    return [];
  }
}

// Function to export submissions as CSV
export function exportSubmissionsAsCSV(): string {
  const submissions = getAllSubmissions();
  
  if (submissions.length === 0) {
    return '';
  }

  const headers = ['Full Name', 'Email', 'Phone', 'Company', 'Message', 'Language', 'Submitted At'];
  const csvContent = [
    headers.join(','),
    ...submissions.map(sub => [
      `"${sub.fullName}"`,
      `"${sub.email}"`,
      `"${sub.phone}"`,
      `"${sub.company}"`,
      `"${sub.message || ''}"`,
      `"${sub.language}"`,
      `"${sub.submittedAt}"`
    ].join(','))
  ].join('\n');

  return csvContent;
} 