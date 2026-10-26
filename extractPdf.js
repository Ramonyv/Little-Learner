import fs from 'fs';
import pdf from 'pdf-parse';

const dataBuffer = fs.readFileSync('./CBSE_Class_1_English_Olympiad_60_Questions.pdf');

pdf(dataBuffer).then(function(data) {
  console.log('Total pages:', data.numpages);
  fs.writeFileSync('./extracted_pdf_text.txt', data.text);
  console.log('Extracted text written to extracted_pdf_text.txt. Length:', data.text.length);
}).catch(err => {
  console.error('Error parsing PDF:', err);
});
