const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Email transporter configuration
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
transporter.verify((error, success) => {
  if (error) console.log("SMTP connection failed ❌", error);
  else console.log("SMTP server ready ✅");
});



// Ensure Excel file exists
const excelFilePath = path.join('/tmp', 'contact_submissions.xlsx');

const initializeExcelFile = () => {
  if (!fs.existsSync(excelFilePath)) {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet([], {
      header: ['timestamp', 'name', 'email', 'subject', 'message', 'phone']
    });
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Submissions');
    XLSX.writeFile(workbook, excelFilePath);
  }
};

// Initialize Excel file on server start
initializeExcelFile();

// Function to append data to Excel
const appendToExcel = (data) => {
  try {
    const workbook = XLSX.readFile(excelFilePath);
    const worksheet = workbook.Sheets['Submissions'];
    
    // Convert worksheet to JSON
    const existingData = XLSX.utils.sheet_to_json(worksheet);
    
    // Add new data with timestamp
    const newData = {
      timestamp: new Date().toISOString(),
      ...data
    };
    
    existingData.push(newData);
    
    // Create new worksheet with updated data
    const newWorksheet = XLSX.utils.json_to_sheet(existingData);
    
    // Replace the worksheet in the workbook
    workbook.Sheets['Submissions'] = newWorksheet;
    
    // Write the updated workbook to file
    XLSX.writeFile(workbook, excelFilePath);
    
    console.log('Data successfully appended to Excel file');
  } catch (error) {
    console.error('Error appending to Excel:', error);
    throw error;
  }
};

// Contact form endpoint
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, subject, message, phone } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please fill all required fields' 
      });
    }

    appendToExcel({ name, email, subject, message, phone: phone || 'Not provided' });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `New Contact Form Submission: ${subject}`,
      html: `<p>${message}</p>`
    };

    await transporter.sendMail(mailOptions);

    res.json({ success: true, message: 'Message sent successfully!' });

  } catch (error) {
    console.error('🔥 Detailed error:', error);  // <-- Add this line
    res.status(500).json({ 
      success: false, 
      message: 'Error sending message. Please try again later.' 
    });
  }
});


// Endpoint to download Excel file (optional - for admin)
app.get('/api/download-submissions', (req, res) => {
  try {
    if (fs.existsSync(excelFilePath)) {
      res.download(excelFilePath, 'contact_submissions.xlsx');
    } else {
      res.status(404).json({ success: false, message: 'No submissions found' });
    }
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ success: false, message: 'Error downloading file' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});