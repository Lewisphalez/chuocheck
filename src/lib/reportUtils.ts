import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface AttendanceReportData {
  className: string;
  courseCode: string;
  sessionDate: string;
  sessionTime: string;
  attendees: {
    name: string;
    email: string;
    scannedAt: string;
  }[];
}

export const generatePDFReport = (data: AttendanceReportData) => {
  const doc = new jsPDF();
  
  // Add header
  doc.setFontSize(20);
  doc.text('Attendance Report', 14, 20);
  
  // Add class info
  doc.setFontSize(12);
  doc.text(`Course: ${data.courseCode} - ${data.className}`, 14, 35);
  doc.text(`Session Date: ${data.sessionDate}`, 14, 42);
  doc.text(`Session Time: ${data.sessionTime}`, 14, 49);
  doc.text(`Total Attendees: ${data.attendees.length}`, 14, 56);
  
  // Add attendance table
  autoTable(doc, {
    startY: 65,
    head: [['Name', 'Email', 'Scan Time']],
    body: data.attendees.map(a => [a.name, a.email, a.scannedAt]),
    theme: 'grid',
    headStyles: { fillColor: [37, 99, 235] },
  });
  
  // Save the PDF
  doc.save(`attendance-${data.courseCode}-${data.sessionDate}.pdf`);
};

export const generateCSVReport = (data: AttendanceReportData) => {
  const headers = ['Name', 'Email', 'Scan Time'];
  const rows = data.attendees.map(a => [a.name, a.email, a.scannedAt]);
  
  const csvContent = [
    `Course: ${data.courseCode} - ${data.className}`,
    `Session Date: ${data.sessionDate}`,
    `Session Time: ${data.sessionTime}`,
    `Total Attendees: ${data.attendees.length}`,
    '',
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `attendance-${data.courseCode}-${data.sessionDate}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
