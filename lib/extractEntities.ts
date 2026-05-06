import nlp from "compromise";

function extractAmount(
  text: string,
  keywords: string[],
) {
  const lines = text
    .split(/\n|\r/)
    .map((line) => line.trim())
    .filter(Boolean);

  for (let i = 0; i < lines.length; i++) {
    const lower = lines[i].toLowerCase();

    const hasKeyword = keywords.some(
      (keyword) =>
        lower.includes(keyword),
    );

    if (!hasKeyword) continue;

    // CHECK CURRENT + NEXT 2 LINES
    const combinedText = [
      lines[i],
      lines[i + 1] || "",
      lines[i + 2] || "",
    ].join(" ");

    const match = combinedText.match(
      /(\d+(\.\d+)?)\s*(crore|lakh|million|thousand)?/i,
    );

    if (!match) continue;

    let value = parseFloat(match[1]);

    const unit =
      match[3]?.toLowerCase();

    switch (unit) {
      case "crore":
        value *= 10000000;
        break;

      case "lakh":
        value *= 100000;
        break;

      case "million":
        value *= 1000000;
        break;

      case "thousand":
        value *= 1000;
        break;
    }

    return value;
  }

  return 0;
}

const IGNORE_WORDS = [
  "government",
  "department",
  "document",
  "documents",
  "submission",
  "required",
  "proposal",
  "authority",
  "criteria",
  "technical",
  "financial",
  "evaluation",
  "support",
  "statement",
  "company",
  "registration",
  "certificate",
  "certificates",
  "requirements",
  "eligibility",
  "weightage",
  "gst",
  "pan",
  "june",
  "years",
  "bidder",
];

const CERTIFICATIONS = [
  "iso",
  "iso 9001",
  "iso 27001",
  "msme",
  "startup india",
  "cmmi",
  "gmp",
];

const PROJECT_TYPES = [
  "surveillance",
  "construction",
  "software",
  "ai",
  "networking",
  "cloud",
  "security",
  "mobile app",
  "web development",
];

export interface ExtractedEntity {
  keywords: string[];
  numbers: number[];
  rawText: string;

  annual_turnover: number;
  minimum_turnover: number;

  years_of_experience: number;
  required_experience_years: number;

  certifications: string[];
  required_certifications: string[];

  project_type: string;

  past_project_types: string[];
}

export function extractEntities(text: string): ExtractedEntity {
  // CLEAN TEXT
  const cleaned = text
    .replace(/[■▪●]/g, " ")
    .replace(/₹/g, "")
    .replace(/,/g, "")
    .replace(/[^\w\s.%\n-]/g, " ")
    .replace(/[ \t]+/g, " ")
    .toLowerCase();

  const doc = nlp(cleaned);

  // EXTRACT PHRASES
  const phrases = [
    ...doc.topics().out("array"),
    ...doc.match("#Adjective? #Noun+").out("array"),
  ];

  // NORMALIZE
  const normalized = phrases
    .map((phrase) => phrase.trim().toLowerCase().replace(/\.$/, ""))
    .filter((phrase) => {
      if (phrase.length < 4) return false;

      if (IGNORE_WORDS.some((word) => phrase.includes(word))) {
        return false;
      }

      if (/^\d+$/.test(phrase)) return false;

      return true;
    });

  // REMOVE DUPLICATES
  const keywords = [...new Set(normalized)].slice(0, 25);

  // NUMBERS
  const numberMatches = cleaned.match(/\d+(\.\d+)?/g) || [];

  const numbers = numberMatches.map((n) => Number(n)).filter((n) => !isNaN(n));

  // TURNOVER

  const annual_turnover = extractAmount(cleaned, [
    "annual turnover",
    "company turnover",
    "revenue",
  ]);

  const minimum_turnover = extractAmount(cleaned, [
    "minimum turnover",
    "turnover above",
    "turnover requirement",
  ]);

  // EXPERIENCE
  const experienceMatch =
    cleaned.match(/(\d+)\s*(years|year).*?(experience)/i) ||
    cleaned.match(/(experience).*?(\d+)\s*(years|year)/i);

  const years_of_experience = experienceMatch
    ? Number(
        experienceMatch[1]?.match(/\d+/)
          ? experienceMatch[1]
          : experienceMatch[2],
      )
    : 0;

  // CERTIFICATIONS
  const certifications = CERTIFICATIONS.filter((cert) =>
    cleaned.includes(cert),
  );

  // PROJECT TYPES
  const past_project_types = PROJECT_TYPES.filter((project) =>
    cleaned.includes(project),
  );

  // PROJECT TYPE
  const project_type = past_project_types[0] || "";

  return {
    keywords,

    numbers,

    rawText: cleaned,

    annual_turnover,

    minimum_turnover,

    years_of_experience,

    required_experience_years: years_of_experience,

    certifications,

    required_certifications: certifications,

    project_type,

    past_project_types,
  };
}
