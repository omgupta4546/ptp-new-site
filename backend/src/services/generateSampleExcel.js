const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

/**
 * Generate a sample student dataset and export to Excel (.xlsx) file
 * matching the schema requirements.
 */
const generateSampleExcel = () => {
  const sampleStudents = [
    {
      Roll_Number: '20EICCS001',
      Student_Name: 'Aarav Sharma',
      RTU_Enrollment_No: '20E1EICCS40P001',
      Branch: 'CSE',
      Current_Year_Sem: '7th Sem',
      Email_ID: 'aarav.sharma@rtu.ac.in',
      Phone_Number: '9876543210',
      SGPA_Sem1: '8.50',
      SGPA_Sem2: '8.75',
      SGPA_Sem3: '8.20',
      SGPA_Sem4: '8.90',
      SGPA_Sem5: '8.40',
      SGPA_Sem6: '8.60',
      Current_CGPA: '8.55',
      Active_Backlogs_Count: '0',
      Backlog_Details: '',
    },
    {
      Roll_Number: '20EICEC015',
      Student_Name: 'Priya Verma',
      RTU_Enrollment_No: '20E1EICEC40P015',
      Branch: 'ECE',
      Current_Year_Sem: '7th Sem',
      Email_ID: 'priya.verma@rtu.ac.in',
      Phone_Number: '9812345678',
      SGPA_Sem1: '7.20',
      SGPA_Sem2: '6.80',
      SGPA_Sem3: '7.50',
      SGPA_Sem4: '6.90',
      SGPA_Sem5: '7.10',
      SGPA_Sem6: '7.30',
      Current_CGPA: '7.13',
      Active_Backlogs_Count: '1',
      Backlog_Details: 'Digital Communication (EC-502)',
    },
    {
      Roll_Number: '20EICEI032',
      Student_Name: 'Rohan Gupta',
      RTU_Enrollment_No: '20E1EICEI40P032',
      Branch: 'EIC',
      Current_Year_Sem: '7th Sem',
      Email_ID: 'rohan.gupta@rtu.ac.in',
      Phone_Number: '9988776655',
      SGPA_Sem1: '9.10',
      SGPA_Sem2: '9.30',
      SGPA_Sem3: '9.00',
      SGPA_Sem4: '9.25',
      SGPA_Sem5: '9.40',
      SGPA_Sem6: '9.15',
      Current_CGPA: '9.20',
      Active_Backlogs_Count: '0',
      Backlog_Details: '',
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleStudents);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

  const outputDir = path.join(__dirname, '../uploads');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const filePath = path.join(outputDir, 'sample_students.xlsx');
  XLSX.writeFile(workbook, filePath);
  console.log(`✅ Sample Excel file created at: ${filePath}`);
};

generateSampleExcel();
