import { sendMessageEmail } from '../services/emailService.js';

export const sendMessage = async (req, res) => {
  console.log('Received message request:', req.body);
  
  const { recipientEmail, message } = req.body;

  // Validate required fields
  if (!recipientEmail || !message) {
    console.error('Missing required fields:', { recipientEmail, message });
    return res.status(400).json({ 
      success: false, 
      error: 'Recipient email and message are required' 
    });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(recipientEmail)) {
    console.error('Invalid email format:', recipientEmail);
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid email format' 
    });
  }

  try {
    console.log('Attempting to send email to:', recipientEmail);
    await sendMessageEmail(recipientEmail, message);
    console.log('Email sent successfully to:', recipientEmail);
    
    res.status(200).json({ 
      success: true, 
      message: 'Message sent successfully' 
    });
  } catch (error) {
    console.error('Error in sendMessage controller:', error);
    
    // Handle specific error cases
    if (error.message.includes('authentication failed')) {
      return res.status(500).json({ 
        success: false, 
        error: 'Email service configuration error. Please contact support.' 
      });
    }
    
    if (error.message.includes('Network error')) {
      return res.status(503).json({ 
        success: false, 
        error: 'Email service temporarily unavailable. Please try again later.' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to send message' 
    });
  }
}; 