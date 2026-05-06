import { NextResponse } from 'next/server';
import PDFParser from 'pdf2json';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const text = await new Promise<string>((resolve, reject) => {
      const pdfParser = new PDFParser(null, 1 as any); // 1 = extract text
      pdfParser.on("pdfParser_dataError", (errData: any) => reject(errData.parserError || errData));
      pdfParser.on("pdfParser_dataReady", (pdfData: any) => resolve((pdfParser as any).getRawTextContent()));
      pdfParser.parseBuffer(buffer);
    });
    
    return NextResponse.json({ text });
  } catch (error: any) {
    console.error('Error parsing PDF:', error);
    return NextResponse.json({ error: error.stack || error.message || 'Failed to parse PDF' }, { status: 500 });
  }
}
