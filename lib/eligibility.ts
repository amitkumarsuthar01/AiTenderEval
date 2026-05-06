interface AnalysisResult {
  eligible: boolean;

  score: number;

  matchedKeywords: string[];

  unmatchedKeywords: string[];

  keywordScore: number;

  numericScore: number;

  complianceScore: number;

  matchedCount: number;

  missingCount: number;

  breakdown: {
    turnover: boolean;
    experience: boolean;
    certifications: boolean;
    project: boolean;
  };
}

export function analyzeEligibility(
  tender: any,
  bidder: any,
): AnalysisResult {
  // NORMALIZE KEYWORDS
  const tenderKeywords: string[] =
    tender.keywords.map((k: string) =>
      k.toLowerCase().trim(),
    );

  const bidderKeywords: string[] =
    bidder.keywords.map((k: string) =>
      k.toLowerCase().trim(),
    );

  // REMOVE DUPLICATES
  const uniqueTenderKeywords = [
    ...new Set(tenderKeywords),
  ];

  const uniqueBidderKeywords = [
    ...new Set(bidderKeywords),
  ];

  // SEMANTIC MATCHING
  const matchedKeywords =
    uniqueTenderKeywords.filter(
      (keyword: string) =>
        uniqueBidderKeywords.some(
          (bidderKeyword: string) =>
            bidderKeyword.includes(keyword) ||
            keyword.includes(
              bidderKeyword,
            ) ||
            keyword
              .split(" ")
              .some((word) =>
                bidderKeyword.includes(word),
              ),
        ),
    );

  // MISSING KEYWORDS
  const unmatchedKeywords =
    uniqueTenderKeywords.filter(
      (keyword: string) =>
        !uniqueBidderKeywords.some(
          (bidderKeyword: string) =>
            bidderKeyword.includes(keyword) ||
            keyword.includes(
              bidderKeyword,
            ),
        ),
    );

  // KEYWORD SCORE
  const keywordScore =
    uniqueTenderKeywords.length > 0
      ? (matchedKeywords.length /
          uniqueTenderKeywords.length) *
        100
      : 0;

  // NUMERIC MATCHING
  let numericMatches = 0;

  tender.numbers.forEach(
    (num: number) => {
      const matched =
        bidder.numbers.some(
          (bNum: number) => {
            const difference =
              Math.abs(bNum - num);

            return difference <= 5;
          },
        );

      if (matched) {
        numericMatches++;
      }
    },
  );

  // NUMERIC SCORE
  const numericScore =
    tender.numbers.length > 0
      ? (numericMatches /
          tender.numbers.length) *
        100
      : 0;

  // PROCUREMENT BREAKDOWN
  const breakdown = {
    turnover:
      Number(
        bidder.annual_turnover || 0,
      ) >=
      Number(
        tender.minimum_turnover || 0,
      ),

    experience:
      Number(
        bidder.years_of_experience || 0,
      ) >=
      Number(
        tender.required_experience_years ||
          0,
      ),

    certifications:
      tender.required_certifications?.every(
        (cert: string) =>
          bidder.certifications?.includes(
            cert,
          ),
      ) || false,

    project:
      bidder.past_project_types?.includes(
        tender.project_type,
      ) || false,
  };

  // COMPLIANCE SCORE
  const complianceChecks =
    Object.values(breakdown);

  const passedChecks =
    complianceChecks.filter(Boolean)
      .length;

  const complianceScore =
    (passedChecks /
      complianceChecks.length) *
    100;

  // FINAL AI SCORE
  const finalScore = Math.round(
    keywordScore * 0.45 +
      numericScore * 0.15 +
      complianceScore * 0.4,
  );

  // FINAL ELIGIBILITY
  const eligible =
    finalScore >= 65 &&
    breakdown.turnover &&
    breakdown.experience;

  return {
    eligible,

    score: finalScore,

    matchedKeywords,

    unmatchedKeywords,

    keywordScore:
      Math.round(keywordScore),

    numericScore:
      Math.round(numericScore),

    complianceScore:
      Math.round(complianceScore),

    matchedCount:
      matchedKeywords.length,

    missingCount:
      unmatchedKeywords.length,

    breakdown,
  };
}