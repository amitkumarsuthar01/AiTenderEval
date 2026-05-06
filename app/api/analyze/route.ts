import { NextResponse } from "next/server";

import { generateAIReport } from "@/lib/generateAIReport";

export async function POST(
  req: Request,
) {
  try {
    const body = await req.json();

    const {
      tenderText,
      bidderText,
    } = body;

    const report =
      await generateAIReport(
        tenderText,
        bidderText,
      );

    return NextResponse.json({
      report,
    });
  } catch (error: any) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          error.message ||
          "AI generation failed",
      },
      { status: 500 },
    );
  }
}