import { CATEGORY_LABELS, type CategoryValue } from "@/lib/constants";

export type EligibilityRuleLite = {
  id: string;
  category: string;
  qualifications: string[];
  minPercent: number | null;
  resultNote: string | null;
};

export type EligibilityAnswers = {
  qualification: string;
  percentage: number | null;
  category: CategoryValue;
  inService: boolean;
  otherUniversity: boolean;
};

export type EligibilityResult = {
  status: "eligible" | "likely" | "not-eligible" | "unknown";
  title: string;
  message: string;
  nextSteps: string[];
};

const APPEARING: Record<string, string> = { BACHELORS_APPEARING: "BACHELORS", MASTERS_APPEARING: "MASTERS" };

/** Pure eligibility logic shared by the public checker and its tests. */
export function checkEligibility(
  rules: EligibilityRuleLite[],
  a: EligibilityAnswers,
  programmeName: string,
): EligibilityResult {
  const rule = rules.find((r) => r.category === a.category);
  const nextSteps: string[] = [];
  if (a.inService)
    nextSteps.push(
      "As an in-service teacher you get preference. Ask your employer for a No Objection Certificate (NOC).",
    );
  if (a.otherUniversity)
    nextSteps.push("Your degree is from another university, so you will need a migration certificate.");
  if (a.category !== "GENERAL")
    nextSteps.push(`Keep your ${CATEGORY_LABELS[a.category]} category certificate ready.`);

  if (!rule) {
    return {
      status: "unknown",
      title: "Let's check this together",
      message: `We don't have an automatic answer for this combination yet. Send us an enquiry and our admissions team will confirm your eligibility for the ${programmeName}.`,
      nextSteps,
    };
  }

  const appearing = a.qualification in APPEARING;
  const effective = APPEARING[a.qualification] ?? a.qualification;
  if (!rule.qualifications.includes(effective)) {
    return {
      status: "not-eligible",
      title: "Not eligible yet",
      message: `The ${programmeName} needs a ${rule.qualifications.map((q) => (q === "BACHELORS" ? "Bachelor's" : q === "MASTERS" ? "Master's" : q)).join(" or ")} degree. You can apply once you complete one.`,
      nextSteps: ["Talk to us about the right time to apply — we're happy to guide you."],
    };
  }

  if (rule.minPercent === null) {
    return {
      status: "likely",
      title: "You are likely eligible",
      message:
        rule.resultNote ??
        "A relaxation in marks applies to your category. Our admissions team will confirm the exact cut-off.",
      nextSteps: appearing
        ? [
            "Your final result is awaited — you may be able to apply provisionally. Please confirm with us.",
            ...nextSteps,
          ]
        : nextSteps,
    };
  }

  if (a.percentage === null || Number.isNaN(a.percentage)) {
    return {
      status: "likely",
      title: "Almost there — we need your marks",
      message: `You need at least ${rule.minPercent}% marks. Enter your percentage to see your result.`,
      nextSteps,
    };
  }

  if (a.percentage >= rule.minPercent) {
    return {
      status: appearing ? "likely" : "eligible",
      title: appearing ? "You are likely eligible" : "Good news — you are eligible!",
      message: appearing
        ? `With ${a.percentage}% you meet the ${rule.minPercent}% requirement. Since your result is awaited, please confirm with us before applying.`
        : `With ${a.percentage}% you meet the minimum of ${rule.minPercent}% for the ${programmeName}. Selection is merit-based, so higher marks improve your chances.`,
      nextSteps,
    };
  }

  return {
    status: "not-eligible",
    title: "Below the minimum marks",
    message: `The minimum for your category is ${rule.minPercent}%, and you entered ${a.percentage}%. Rules sometimes change — talk to us before you decide.`,
    nextSteps: ["Send us an enquiry and we'll check if any option is open to you."],
  };
}
