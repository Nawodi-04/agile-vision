import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Validate environment variables
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
  console.error('Email configuration missing. Please set EMAIL_USER and EMAIL_PASSWORD in .env file');
  process.exit(1);
}

// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Verify transporter configuration
transporter.verify(function (error, success) {
  if (error) {
    console.error('Email transporter verification failed:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});

export const sendMessageEmail = async (recipientEmail, message) => {
  try {
    console.log('Preparing to send email to:', recipientEmail);
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: recipientEmail,
      subject: message.sprintInfo ? `Sprint Update: ${message.sprintInfo.name}` : 'New Message from Sprint Chat',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1976d2;">${message.sprintInfo ? `Sprint Update: ${message.sprintInfo.name}` : 'New Message from Sprint Chat'}</h2>
          ${message.sprintInfo ? `
            <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; font-weight: bold;">Sprint Information:</p>
              <p style="margin: 5px 0;">Name: ${message.sprintInfo.name}</p>
              <p style="margin: 5px 0;">Remaining Days: ${message.sprintInfo.remainingDays}</p>
              <p style="margin: 5px 0;">End Date: ${new Date(message.sprintInfo.endDate).toLocaleDateString()}</p>
            </div>
          ` : ''}
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0;">${message.text}</p>
          </div>
          <p style="color: #666; font-size: 12px;">
            Sent at: ${new Date(message.timestamp).toLocaleString()}
          </p>
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="margin: 0; color: #666;">Regards,<br>Agile Vision Team</p>
          </div>
        </div>
      `
    };

    console.log('Sending email...');
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.response);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    if (error.code === 'EAUTH') {
      throw new Error('Email authentication failed. Please check your email credentials.');
    } else if (error.code === 'ESOCKET') {
      throw new Error('Network error while sending email. Please check your internet connection.');
    } else {
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }
};

export const sendSprintAssignmentEmail = async (recipientEmail, sprint) => {
  try {
    console.log('Preparing to send sprint assign email to:', recipientEmail);
    
    const startDate = new Date(sprint.startDate).toLocaleDateString();
    const endDate = new Date(sprint.endDate).toLocaleDateString();
    const remainingDays = Math.ceil((new Date(sprint.endDate) - new Date()) / (1000 * 60 * 60 * 24));
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: recipientEmail,
      subject: `Sprint Assign: ${sprint.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1976d2;">Sprint Assign Notification</h2>
          
          <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold;">You have been assigned to a new sprint:</p>
            <p style="margin: 5px 0;">Sprint Name: ${sprint.name}</p>
            <p style="margin: 5px 0;">Start Date: ${startDate}</p>
            <p style="margin: 5px 0;">End Date: ${endDate}</p>
            <p style="margin: 5px 0;">Remaining Days: ${remainingDays}</p>
            ${sprint.details ? `<p style="margin: 5px 0;">Details: ${sprint.details}</p>` : ''}
          </div>

          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0;">Please log in to the Agile Vision platform to view the sprint details and start working on your assigned tasks.</p>
          </div>

          <p style="color: #666; font-size: 12px;">
            Sent at: ${new Date().toLocaleString()}
          </p>

          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="margin: 0; color: #666;">Regards,<br>Agile Vision Team</p>
          </div>
        </div>
      `
    };

    console.log('Sending sprint assign email...');
    const info = await transporter.sendMail(mailOptions);
    console.log('Sprint assign email sent successfully:', info.response);
    return true;
  } catch (error) {
    console.error('Error sending sprint assignment email:', error);
    if (error.code === 'EAUTH') {
      throw new Error('Email authentication failed. Please check your email credentials.');
    } else if (error.code === 'ESOCKET') {
      throw new Error('Network error while sending email. Please check your internet connection.');
    } else {
      throw new Error(`Failed to send sprint assignment email: ${error.message}`);
    }
  }
}; 