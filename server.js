require("dotenv").config()
const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const fs = require("fs");
const path = require("path")


const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

console.log('📧 Email User:', process.env.EMAIL_USER);
console.log('📧 Email Pass:', process.env.EMAIL_PASS);
console.log('📄 Sheet ID:', process.env.SHEET_ID);
console.log('🖥️ Port:', process.env.PORT);


// const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);


const auth = new google.auth.GoogleAuth({
  credentials: {
    type: process.env.GOOGLE_TYPE,
    project_id: process.env.GOOGLE_PROJECT_ID,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    client_id: process.env.GOOGLE_CLIENT_ID,
    auth_uri: process.env.GOOGLE_AUTH_URI,
    token_uri: process.env.GOOGLE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.GOOGLE_AUTH_PROVIDER_CERT,
    client_x509_cert_url: process.env.GOOGLE_CLIENT_CERT
  },
  scopes: ["https://www.googleapis.com/auth/spreadsheets"]
});

const SHEET_ID = process.env.SHEET_ID; // add this in Railway/Render env vars

// Nodemailer config
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
// Check SMTP connection
transporter.verify((error, success) => {
  if (error) {
    console.error("SMTP connection failed ❌", error);
  } else {
    console.log("SMTP connection successful ✅");
  }
});


// Contact form endpoint
app.post("/api/contact", async (req, res) => {
  try {
    const { name, email, subject, message, phone } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ success: false, message: "Please fill all required fields" });
    }

    // Save to Google Sheet
    const client = await auth.getClient();
    const sheets = google.sheets({ version: "v4", auth: client });

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: "Sheet1!A:F",
      valueInputOption: "USER_ENTERED",
      resource: {
        values: [[new Date().toISOString(), name, email, subject, message, phone || "Not provided"]],
      },
    });

    // Send email to admin
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: "azzaconstruction55@gmail.com",
      subject: `New Contact Form Submission: ${subject}`,
      html: `<p><strong>Name:</strong> ${name}</p>
             <p><strong>Email:</strong> ${email}</p>
             <p><strong>Phone:</strong> ${phone || "Not provided"}</p>
             <p><strong>Message:</strong> ${message}</p>`,
    });

    // Confirmation email to user
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Thank you for contacting Azza Construction",
      html: `<p>Dear ${name},</p>
             <p>We have received your message and will get back to you soon.</p>`,
    });

    res.json({ success: true, message: "Message sent and saved to Google Sheets!" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ success: false, message: "Error processing request" });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
