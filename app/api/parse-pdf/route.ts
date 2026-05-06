import { NextResponse } from 'next/server';
import { PDFParse } from 'pdf-parse';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    // Use Uint8Array or Buffer for PDFParse
    const buffer = Buffer.from(bytes);
    
    const parser = new PDFParse({ data: buffer });
    const data = await parser.getText();
    
    return NextResponse.json({ text: data.text });
  } catch (error: any) {
    console.error('Error parsing PDF:', error);
    return NextResponse.json({ error: error.message || 'Failed to parse PDF' }, { status: 500 });
  }
}
