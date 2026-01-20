export async function parseCSV(file: File): Promise<Array<{ email: string; full_name: string }>> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          reject(new Error('CSV file is empty or has no data rows'));
          return;
        }

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        if (!headers.includes('email') || !headers.includes('full_name')) {
          reject(new Error('CSV must contain "email" and "full_name" columns'));
          return;
        }

        const emailIndex = headers.indexOf('email');
        const nameIndex = headers.indexOf('full_name');

        const data = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim());
          return {
            email: values[emailIndex] || '',
            full_name: values[nameIndex] || '',
          };
        }).filter(row => row.email && row.full_name);

        if (data.length === 0) {
          reject(new Error('No valid data rows found in CSV'));
          return;
        }

        resolve(data);
      } catch (error) {
        reject(new Error('Failed to parse CSV file'));
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
