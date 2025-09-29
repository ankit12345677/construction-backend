const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const { google } = require('googleapis');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Gmail transporter
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

transporter.verify((err, success) => {
  if(err) console.log("SMTP connection failed ❌", err);
  else console.log("SMTP ready ✅");
});

// Google Sheets setup
const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"]
});

const sheets = google.sheets({ version: 'v4', auth });
const SHEET_ID = process.env.SHEET_ID;

// Function to append submission to Google Sheets
async function appendToSheet(data) {
  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: 'Submissions!A:F', // Make sure your sheet has headers: timestamp,name,email,subject,message,phone
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          new Date().toISOString(),
          data.name,
          data.email,
          data.subject,
          data.message,
          data.phone || 'Not provided'
        ]]
      }
    });
    console.log('Data appended to Google Sheet ✅');
  } catch(err) {
    console.error('Error appending to Google Sheet:', err);
    throw err;
  }
}

// Contact form endpoint
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, subject, message, phone } = req.body;

    if (!name || !email || !subject || !message)
      return res.status(400).json({ success: false, message: 'Please fill all required fields' });

    await appendToSheet({ name, email, subject, message, phone });

    // Email to user
    const userMailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Thank you for contacting Azza Construction',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Thank You for Contacting Azza Construction!</h2>
          <p>Dear ${name},</p>
          <p>We have received your message and will get back to you within 24 hours.</p>
          <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Your Message:</strong></p>
            <p>${message}</p>
          </div>
          <p><strong>Our Contact Information:</strong></p>
          <p>📞 Phone: (+91) 73041 21012</p>
          <p>✉️ Email: azzaconstruction55@gmail.com</p>
          <p>📍 Address: Oppo Jaliwala building, Atmaram nivas, shop no 5, Mumbai 400006</p>
          <br>
          <p>Best regards,<br>The Azza Construction Team</p>
        </div>
      `
    };

    await transporter.sendMail(userMailOptions);

    res.json({ success: true, message: 'Message sent successfully!' });

  } catch (error) {
    console.error('🔥 Detailed error:', error);
    res.status(500).json({ success: false, message: 'Error sending message. Please try again later.' });
  }
});

// Optional: download submissions as Excel (generate from Google Sheets)
app.get('/api/download-submissions', async (req, res) => {
  try {
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Submissions!A:F'
    });

    const XLSX = require('xlsx');
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(result.data.values || []);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Submissions');

    const tempFile = '/tmp/contact_submissions.xlsx';
    XLSX.writeFile(workbook, tempFile);
    res.download(tempFile, 'contact_submissions.xlsx');

  } catch (err) {
    console.error('Error downloading submissions:', err);
    res.status(500).json({ success: false, message: 'Error downloading file' });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
