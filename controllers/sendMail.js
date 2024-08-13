const nodemailer = require('nodemailer');

// Function to send a password reset email
const sendResetEmail = async (email, token) => {
    try {
        // Create a transporter object using SMTP transport
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true, 
            auth: {
                user: process.env.EMAIL_USER, 
                pass: process.env.EMAIL_PASS, 
            }
        });

      
        const resetLink = `http://localhost:3000/reset-password/${token}`;

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Password Reset Request',
            text: `You requested a password reset. Please use the following link to reset your password:\n\n${resetLink}\n\nIf you did not request a password reset, please ignore this email.`,
        };

        // Send the email
        await transporter.sendMail(mailOptions);
        console.log('Reset email sent successfully');
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error(`Could not send reset email: ${error.message}`);
    }
};

module.exports = sendResetEmail;
