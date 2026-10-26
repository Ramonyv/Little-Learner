const fs = require('fs');
const { PDFParse } = require('pdf-parse');

async function run() {
  const dataBuffer = fs.readFileSync('./CBSE_Class_1_English_Olympiad_60_Questions.pdf');
  const parser = new PDFParse({ data: dataBuffer });
  const result = await parser.getText();
  console.log('Result total pages:', result.pages ? result.pages.length : 'unknown');
  console.log('Document text length:', result.text.length);
  fs.writeFileSync('./extracted_pdf_text.txt', result.text);
  console.log('Successfully wrote extracted_pdf_text.txt');
  await parser.destroy();
}

run().catch(err => {
  console.error('Extraction error:', err);
});
