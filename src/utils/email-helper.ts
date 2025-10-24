/**
 * Email Helper Utility
 * Handles opening email client with fallbacks for different browsers and scenarios
 */

export const openEmailClient = (
  email: string,
  subject: string,
  body: string,
  fallbackMessage?: string
) => {
  const encodedSubject = encodeURIComponent(subject);
  const encodedBody = encodeURIComponent(body);
  const mailtoLink = `mailto:${email}?subject=${encodedSubject}&body=${encodedBody}`;

  try {
    // Try window.open first (works in most cases)
    const emailWindow = window.open(mailtoLink, '_blank');
    
    // Check if popup was blocked
    if (!emailWindow || emailWindow.closed || typeof emailWindow.closed === 'undefined') {
      // Fallback: Direct location change
      window.location.href = mailtoLink;
    }
  } catch (error) {
    console.warn('Email client opening failed, trying fallback:', error);
    
    try {
      // Fallback: Direct location change
      window.location.href = mailtoLink;
    } catch (fallbackError) {
      console.error('All email opening methods failed:', fallbackError);
      
      // Final fallback: Show manual instructions
      const message = fallbackMessage || `Please send an email to: ${email}\nSubject: ${subject}\n\nBody:\n${body}`;
      
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(`${email}\nSubject: ${subject}\n\n${body}`).then(() => {
          alert(`Email details copied to clipboard!\n\n${message}`);
        }).catch(() => {
          alert(message);
        });
      } else {
        alert(message);
      }
    }
  }
};

/**
 * Specific helper for OvenAI early access requests
 */
export const requestEarlyAccess = (isHebrew: boolean = false) => {
  const email = 'amit.yogev@gmail.com';
  const subject = isHebrew 
    ? 'בקשה לגישה מוקדמת ל-OvenAI' 
    : 'OvenAI Early Access Request';
  const body = isHebrew 
    ? 'שלום,\n\nאני מעוניין/ת לקבל גישה מוקדמת למערכת OvenAI.\n\nתודה רבה!'
    : 'Hello,\n\nI am interested in getting early access to OvenAI.\n\nThank you!';
  const fallbackMessage = isHebrew
    ? `אנא שלחו מייל ל: ${email}\nנושא: ${subject}\n\nתוכן:\n${body}`
    : `Please send an email to: ${email}\nSubject: ${subject}\n\nContent:\n${body}`;

  openEmailClient(email, subject, body, fallbackMessage);
};

/**
 * Helper for demo requests
 */
export const requestDemo = (isHebrew: boolean = false) => {
  const email = 'amit.yogev@gmail.com';
  const subject = isHebrew 
    ? 'בקשה להדגמה של OvenAI' 
    : 'OvenAI Demo Request';
  const body = isHebrew 
    ? 'שלום,\n\nאני מעוניין/ת לקבוע הדגמה של מערכת OvenAI.\n\nתודה!'
    : 'Hello,\n\nI would like to schedule a demo of OvenAI.\n\nThank you!';
  const fallbackMessage = isHebrew
    ? `אנא שלחו מייל ל: ${email}\nנושא: ${subject}\n\nתוכן:\n${body}`
    : `Please send an email to: ${email}\nSubject: ${subject}\n\nContent:\n${body}`;

  openEmailClient(email, subject, body, fallbackMessage);
}; 