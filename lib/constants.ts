// Shared labels and option lists. Safe to import in client and server code.

export const ROLES = ["SUPER_ADMIN", "ADMIN", "ADMISSIONS_OFFICER", "EDITOR"] as const;
export type RoleValue = (typeof ROLES)[number];

export const ROLE_LABELS: Record<RoleValue, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  ADMISSIONS_OFFICER: "Admissions Officer",
  EDITOR: "Editor",
};

export const ROLE_DESCRIPTIONS: Record<RoleValue, string> = {
  SUPER_ADMIN: "Full access, including users and every setting.",
  ADMIN: "Content, leads, grievances, settings and users (except Super Admins).",
  ADMISSIONS_OFFICER: "Leads, follow-ups and campaign reports only.",
  EDITOR: "Website content and media only.",
};

export const CATEGORIES = ["GENERAL", "EWS", "OBC", "SC", "ST", "PWD"] as const;
export type CategoryValue = (typeof CATEGORIES)[number];
export const CATEGORY_LABELS: Record<CategoryValue, string> = {
  GENERAL: "General",
  EWS: "EWS",
  OBC: "OBC",
  SC: "SC",
  ST: "ST (including APST)",
  PWD: "Persons with Disability",
};

export const QUALIFICATIONS = [
  { value: "CLASS_12", label: "Class 12 / Higher Secondary" },
  { value: "BACHELORS_APPEARING", label: "Bachelor's degree (final year, result awaited)" },
  { value: "BACHELORS", label: "Bachelor's degree" },
  { value: "MASTERS_APPEARING", label: "Master's degree (final year, result awaited)" },
  { value: "MASTERS", label: "Master's degree" },
  { value: "OTHER", label: "Other" },
] as const;
export type QualificationValue = (typeof QUALIFICATIONS)[number]["value"];
export const QUALIFICATION_LABELS = Object.fromEntries(
  QUALIFICATIONS.map((q) => [q.value, q.label]),
) as Record<QualificationValue, string>;

export const CONTACT_TIMES = [
  "Morning (9 am – 12 pm)",
  "Afternoon (12 pm – 3 pm)",
  "Evening (3 pm – 6 pm)",
  "Any time",
] as const;

export const ARUNACHAL_DISTRICTS = [
  "Anjaw",
  "Bichom",
  "Changlang",
  "Dibang Valley",
  "East Kameng",
  "East Siang",
  "Itanagar Capital Complex",
  "Kamle",
  "Keyi Panyor",
  "Kra Daadi",
  "Kurung Kumey",
  "Lepa Rada",
  "Lohit",
  "Longding",
  "Lower Dibang Valley",
  "Lower Siang",
  "Lower Subansiri",
  "Namsai",
  "Pakke-Kessang",
  "Papum Pare",
  "Shi Yomi",
  "Siang",
  "Tawang",
  "Tirap",
  "Upper Siang",
  "Upper Subansiri",
  "West Kameng",
  "West Siang",
  "Outside Arunachal Pradesh",
] as const;

export const LEAD_STAGES = [
  "NEW",
  "CONTACTED",
  "ELIGIBLE",
  "APPLICATION_STARTED",
  "APPLICATION_SUBMITTED",
  "ENROLLED",
  "NOT_ELIGIBLE",
  "LOST",
] as const;
export type LeadStageValue = (typeof LEAD_STAGES)[number];
export const PIPELINE_STAGES: LeadStageValue[] = [
  "NEW",
  "CONTACTED",
  "ELIGIBLE",
  "APPLICATION_STARTED",
  "APPLICATION_SUBMITTED",
  "ENROLLED",
];
export const CLOSED_STAGES: LeadStageValue[] = ["ENROLLED", "NOT_ELIGIBLE", "LOST"];
export const LEAD_STAGE_LABELS: Record<LeadStageValue, string> = {
  NEW: "New enquiry",
  CONTACTED: "Contacted",
  ELIGIBLE: "Eligible",
  APPLICATION_STARTED: "Application started",
  APPLICATION_SUBMITTED: "Application submitted",
  ENROLLED: "Enrolled",
  NOT_ELIGIBLE: "Not eligible",
  LOST: "Lost",
};
export const LEAD_STAGE_TONES: Record<LeadStageValue, string> = {
  NEW: "info",
  CONTACTED: "neutral",
  ELIGIBLE: "success",
  APPLICATION_STARTED: "warning",
  APPLICATION_SUBMITTED: "warning",
  ENROLLED: "success",
  NOT_ELIGIBLE: "danger",
  LOST: "danger",
};

export const LOST_REASONS = [
  "Not reachable",
  "Chose another college",
  "Fees / financial reasons",
  "Not interested any more",
  "Will apply next year",
  "Duplicate enquiry",
  "Other",
] as const;

export const CALL_OUTCOMES = [
  "Spoke — interested",
  "Spoke — needs time",
  "Spoke — not interested",
  "No answer",
  "Switched off / unreachable",
  "Wrong number",
  "Call back requested",
] as const;

export const NOTICE_CATEGORIES = ["ADMISSION", "EXAM", "ACADEMIC", "GENERAL"] as const;
export type NoticeCategoryValue = (typeof NOTICE_CATEGORIES)[number];
export const NOTICE_CATEGORY_LABELS: Record<NoticeCategoryValue, string> = {
  ADMISSION: "Admission",
  EXAM: "Exam",
  ACADEMIC: "Academic",
  GENERAL: "General",
};

export const STAFF_TYPES = ["LEADERSHIP", "TEACHING", "NON_TEACHING"] as const;
export const STAFF_TYPE_LABELS: Record<(typeof STAFF_TYPES)[number], string> = {
  LEADERSHIP: "Leadership",
  TEACHING: "Teaching faculty",
  NON_TEACHING: "Administrative & support staff",
};

export const DOWNLOAD_CATEGORIES = [
  "ADMISSION_FORM",
  "PROSPECTUS",
  "NCTE_RECOGNITION",
  "RGU_AFFILIATION",
  "MANDATORY_DISCLOSURE",
  "RTI",
  "GRIEVANCE_REDRESSAL",
  "ANTI_RAGGING",
  "ADMISSION_COMMITTEE",
  "IQAC",
  "OTHER",
] as const;
export type DownloadCategoryValue = (typeof DOWNLOAD_CATEGORIES)[number];
export const DOWNLOAD_CATEGORY_LABELS: Record<DownloadCategoryValue, string> = {
  ADMISSION_FORM: "Admission forms",
  PROSPECTUS: "Prospectus",
  NCTE_RECOGNITION: "NCTE recognition",
  RGU_AFFILIATION: "RGU affiliation",
  MANDATORY_DISCLOSURE: "Mandatory disclosure",
  RTI: "Right to Information (RTI)",
  GRIEVANCE_REDRESSAL: "Grievance redressal",
  ANTI_RAGGING: "Anti-ragging",
  ADMISSION_COMMITTEE: "Admission committee",
  IQAC: "IQAC",
  OTHER: "Other documents",
};
export const DISCLOSURE_CATEGORIES: DownloadCategoryValue[] = [
  "NCTE_RECOGNITION",
  "RGU_AFFILIATION",
  "MANDATORY_DISCLOSURE",
  "RTI",
  "GRIEVANCE_REDRESSAL",
  "ANTI_RAGGING",
  "ADMISSION_COMMITTEE",
  "IQAC",
  "OTHER",
];

export const GRIEVANCE_STATUSES = ["OPEN", "IN_REVIEW", "RESOLVED", "CLOSED"] as const;
export type GrievanceStatusValue = (typeof GRIEVANCE_STATUSES)[number];
export const GRIEVANCE_STATUS_LABELS: Record<GrievanceStatusValue, string> = {
  OPEN: "Open",
  IN_REVIEW: "In review",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};
export const GRIEVANCE_CATEGORIES = [
  "Academic",
  "Admission",
  "Examination",
  "Fees & finance",
  "Ragging or harassment",
  "Facilities & hostel",
  "Staff conduct",
  "Other",
] as const;
export const GRIEVANCE_ROLES = ["Student", "Parent / guardian", "Applicant", "Staff", "Other"] as const;

export const FACILITY_CATEGORIES = [
  "Academic",
  "Library",
  "Laboratory",
  "Technology",
  "Residential",
  "Sports & wellbeing",
  "Campus",
] as const;

export const FAQ_CATEGORIES = ["Admissions", "Programmes", "Fees & documents", "Campus", "General"] as const;

export const PROGRAMME_STATUS_LABELS = {
  ACTIVE: "Active (public)",
  VERIFY: "Verify (hidden until confirmed)",
  DRAFT: "Draft (hidden)",
  ARCHIVED: "Archived (hidden)",
} as const;

export const CONSENT_TEXT =
  "I agree that TTC Aalo may contact me by phone, SMS, WhatsApp or email about admissions. My details will only be used for this purpose, as explained in the privacy policy.";

export const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const;
