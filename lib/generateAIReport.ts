import { groq } from "./groq";

export async function generateAIReport(
  tenderText: string,
  bidderText: string,
) {
  const completion =
    await groq.chat.completions.create({
      model:
        "llama-3.3-70b-versatile",

      temperature: 0.2,

      response_format: {
        type: "json_object",
      },

      messages: [
        {
          role: "system",

          content: `
You are an expert government procurement AI assistant.

Analyze tender eligibility professionally.

STRICT RULES:
- Return ONLY valid JSON
- Do NOT return markdown
- Do NOT explain outside JSON
- Extract requirements carefully
- Compare bidder against tender
- Generate realistic procurement analysis
`,
        },

        {
          role: "user",

          content: `
Tender Document:
${tenderText}

Bidder Proposal:
${bidderText}

Return JSON in EXACT format:

{
  "score": 82,

  "eligible": true,

  "riskLevel": "Low",

  "summary": "Short executive summary",

  "strengths": [
    "Point 1",
    "Point 2"
  ],

  "gaps": [
    "Gap 1",
    "Gap 2"
  ],

  "recommendation": "Final recommendation",

  "checklist": {

    "turnover": {
      "required": "Above ₹2 Crore",
      "bidder": "₹3.5 Crore",
      "status": true
    },

    "experience": {
      "required": "5 Years",
      "bidder": "7 Years",
      "status": true
    },

    "certifications": {
      "required": "ISO 9001",
      "bidder": "ISO 9001, GST",
      "status": true
    },

    "projectRelevance": {
      "required": "Surveillance Projects",
      "bidder": "Smart Surveillance Projects",
      "status": true
    }
  }
}
`,
        },
      ],
    });

  const content =
    completion.choices[0].message
      .content || "{}";

  // console.log(content);

  return JSON.parse(content);
}