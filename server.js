// const express = require('express');
// const cors = require('cors');
// const nodemailer = require('nodemailer');
// const XLSX = require('xlsx');
// const fs = require('fs');
// const path = require('path');
// require('dotenv').config();

// const app = express();
// const PORT = process.env.PORT || 5000;

// // Middleware
// app.use(cors());
// app.use(express.json());
// app.use(express.static('public'));

// // Email transporter configuration
// const transporter = nodemailer.createTransport({
//   host: "smtp.gmail.com",
//   port: 465,
//   secure: true, // true for port 465
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS
//   }
// });


// // Ensure Excel file exists
// const excelFilePath = path.join(__dirname, 'contact_submissions.xlsx');

// const initializeExcelFile = () => {
//   if (!fs.existsSync(excelFilePath)) {
//     const workbook = XLSX.utils.book_new();
//     const worksheet = XLSX.utils.json_to_sheet([], {
//       header: ['timestamp', 'name', 'email', 'subject', 'message', 'phone']
//     });
//     XLSX.utils.book_append_sheet(workbook, worksheet, 'Submissions');
//     XLSX.writeFile(workbook, excelFilePath);
//   }
// };

// // Initialize Excel file on server start
// initializeExcelFile();

// // Function to append data to Excel
// const appendToExcel = (data) => {
//   try {
//     const workbook = XLSX.readFile(excelFilePath);
//     const worksheet = workbook.Sheets['Submissions'];
    
//     // Convert worksheet to JSON
//     const existingData = XLSX.utils.sheet_to_json(worksheet);
    
//     // Add new data with timestamp
//     const newData = {
//       timestamp: new Date().toISOString(),
//       ...data
//     };
    
//     existingData.push(newData);
    
//     // Create new worksheet with updated data
//     const newWorksheet = XLSX.utils.json_to_sheet(existingData);
    
//     // Replace the worksheet in the workbook
//     workbook.Sheets['Submissions'] = newWorksheet;
    
//     // Write the updated workbook to file
//     XLSX.writeFile(workbook, excelFilePath);
    
//     console.log('Data successfully appended to Excel file');
//   } catch (error) {
//     console.error('Error appending to Excel:', error);
//     throw error;
//   }
// };

// // Contact form endpoint
// app.post('/api/contact', async (req, res) => {
//   try {
//     const { name, email, subject, message, phone } = req.body;

//     // Validate required fields
//     if (!name || !email || !subject || !message) {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'Please fill all required fields' 
//       });
//     }

//     // Save to Excel
//     const excelData = { name, email, subject, message, phone: phone || 'Not provided' };
//     appendToExcel(excelData);

//     // Email content
//     const mailOptions = {
//       from: process.env.EMAIL_USER,
//       to: 'azzaconstruction55@gmail.com',
//       subject: `New Contact Form Submission: ${subject}`,
//       html: `
//         <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//           <h2 style="color: #333;">New Contact Form Submission</h2>
//           <div style="background: #f9f9f9; padding: 20px; border-radius: 5px;">
//             <p><strong>Name:</strong> ${name}</p>
//             <p><strong>Email:</strong> ${email}</p>
//             <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
//             <p><strong>Subject:</strong> ${subject}</p>
//             <p><strong>Message:</strong></p>
//             <div style="background: white; padding: 15px; border-left: 4px solid #007bff; margin: 10px 0;">
//               ${message.replace(/\n/g, '<br>')}
//             </div>
//           </div>
//           <p style="color: #666; font-size: 12px; margin-top: 20px;">
//             This email was sent from your website contact form.
//           </p>
//         </div>
//       `
//     };

//     // Send email
//     await transporter.sendMail(mailOptions);

//     // Send confirmation email to user
//     const userMailOptions = {
//       from: process.env.EMAIL_USER,
//       to: email,
//       subject: 'Thank you for contacting Azza Construction',
//       html: `
//         <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//           <h2 style="color: #333;">Thank You for Contacting Azza Construction!</h2>
//           <p>Dear ${name},</p>
//           <p>We have received your message and will get back to you within 24 hours.</p>
//           <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
//             <p><strong>Your Message:</strong></p>
//             <p>${message}</p>
//           </div>
//           <p><strong>Our Contact Information:</strong></p>
//           <p>📞 Phone: (+91) 73041 21012</p>
//           <p>✉️ Email: azzaconstruction55@gmail.com</p>
//           <p>📍 Address: Oppo Jaliwala building, Atmaram nivas, shop no 5, Mumbai 400006</p>
//           <br>
//           <p>Best regards,<br>The Azza Construction Team</p>
//         </div>
//       `
//     };

//     await transporter.sendMail(userMailOptions);

//     res.json({ 
//       success: true, 
//       message: 'Message sent successfully! We will get back to you soon.' 
//     });

//   } catch (error) {
//     console.error('Error processing contact form:', error);
//     res.status(500).json({ 
//       success: false, 
//       message: 'Error sending message. Please try again later.' 
//     });
//   }
// });

// // Endpoint to download Excel file (optional - for admin)
// app.get('/api/download-submissions', (req, res) => {
//   try {
//     if (fs.existsSync(excelFilePath)) {
//       res.download(excelFilePath, 'contact_submissions.xlsx');
//     } else {
//       res.status(404).json({ success: false, message: 'No submissions found' });
//     }
//   } catch (error) {
//     console.error('Error downloading file:', error);
//     res.status(500).json({ success: false, message: 'Error downloading file' });
//   }
// });

// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });

const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const fs = require("fs");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Load Google Sheets credentials
const auth = new google.auth.GoogleAuth({
  keyFile: "credentials.json", // downloaded from Google Cloud
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const SHEET_ID = process.env.SHEET_ID; // add this in Railway/Render env vars

// Nodemailer config
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
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
