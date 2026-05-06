import { NextResponse } from "next/server";
import PDFParser from "pdf2json";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const text = await new Promise<string>((resolve, reject) => {
      const pdfParser = new PDFParser(null, 1 as any);

      pdfParser.on("pdfParser_dataError", (err: any) => {
        reject(err.parserError);
      });

      pdfParser.on("pdfParser_dataReady", () => {
        resolve((pdfParser as any).getRawTextContent());
      });

      pdfParser.parseBuffer(buffer);
    });

    return NextResponse.json({ text });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}