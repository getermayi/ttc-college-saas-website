/**
 * Seed script — loads the verified TTC Aalo information.
 * Safe to run more than once: records are upserted by their unique keys and
 * existing admin edits to content are NOT overwritten (we only create when missing).
 *
 * Rules followed here: no invented fees, dates, rankings, placement numbers,
 * quotes or testimonials. Anything we don't know is left empty for the admin.
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type Prisma } from "../lib/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function createIfMissing<T>(
  find: () => Promise<T | null>,
  create: () => Promise<unknown>,
) {
  const existing = await find();
  if (!existing) await create();
}

async function seedSettings() {
  await prisma.siteSettings.upsert({
    where: { id: "site" },
    update: {},
    create: {
      id: "site",
      siteName: "Teacher Training College, Aalo",
      shortName: "TTC Aalo",
      tagline: "A campus you can trust, a future you can see.",
      description:
        "TTC Aalo prepares caring, skilled and ethical teachers for Arunachal Pradesh. B.Ed. affiliated to Rajiv Gandhi University and recognised by NCTE, on a green 30-acre campus in Aalo.",
      established: 2011,
      campusAcres: 30,
      affiliation: "Affiliated to Rajiv Gandhi University (RGU), Rono Hills, Doimukh",
      recognition: "Recognised by NCTE for the B.Ed. programme",
      managedBy: "Marjum Welfare Society",
      addressLine: "Bogdo, Aalo",
      city: "Aalo",
      district: "West Siang",
      state: "Arunachal Pradesh",
      postalCode: "791001",
      mapLink: "https://www.google.com/maps/search/?api=1&query=Teacher+Training+College+Aalo+Bogdo+West+Siang",
      mapEmbedUrl: "https://www.google.com/maps?q=Bogdo,+Aalo,+West+Siang,+Arunachal+Pradesh+791001&output=embed",
      whatsappMessage: "Hello TTC Aalo, I would like to know more about B.Ed. admissions.",
      admissionsOpen: true,
      admissionsSession: "2026–27",
      admissionsBadge: "Admissions open 2026–27",
      announcementEnabled: false,
      principalName: "Ramen Kumar Bayan",
      principalTitle: "Principal",
      footerAbout:
        "Teacher Training College, Aalo is managed by Marjum Welfare Society. Since 2011 we have helped graduates from Arunachal Pradesh and the Northeast become confident, caring teachers.",
    },
  });
}

const SEO_ENTRIES: { path: string; label: string; title: string; description: string }[] = [
  {
    path: "/",
    label: "Home",
    title: "TTC Aalo — B.Ed. college in Aalo, Arunachal Pradesh",
    description:
      "Become a confident, caring teacher. 2-year B.Ed. at Teacher Training College, Aalo — affiliated to Rajiv Gandhi University and recognised by NCTE. Check your eligibility and enquire today.",
  },
  {
    path: "/about",
    label: "About",
    title: "About TTC Aalo — our story, mission and leadership",
    description:
      "Since 2011, Teacher Training College, Aalo has prepared qualified, ethical teachers for Arunachal Pradesh. Managed by Marjum Welfare Society.",
  },
  {
    path: "/programmes",
    label: "Programmes",
    title: "Programmes at TTC Aalo",
    description: "Explore the teacher education programmes at TTC Aalo, including the 2-year B.Ed.",
  },
  {
    path: "/admissions",
    label: "Admissions",
    title: "Admissions 2026–27 — eligibility, documents and steps",
    description:
      "Check if you are eligible for B.Ed. at TTC Aalo in under a minute. See the steps, documents you need, important dates and forms.",
  },
  {
    path: "/enquire",
    label: "Enquire",
    title: "Enquire about admission — TTC Aalo",
    description: "Send a short enquiry and our admissions team will call you back.",
  },
  {
    path: "/notices",
    label: "Notices",
    title: "Notices — admissions, exams and academics",
    description: "Latest admission, exam, academic and general notices from TTC Aalo.",
  },
  {
    path: "/faculty",
    label: "Faculty & staff",
    title: "Faculty and staff — TTC Aalo",
    description: "Meet the teachers and staff who guide you at TTC Aalo.",
  },
  {
    path: "/campus",
    label: "Campus & facilities",
    title: "Campus and facilities — TTC Aalo",
    description: "A green, 30-acre campus near Aalo, West Siang. Explore our classrooms, library and learning spaces.",
  },
  {
    path: "/events",
    label: "Events",
    title: "Events — TTC Aalo",
    description: "Workshops, seminars and campus events at TTC Aalo.",
  },
  {
    path: "/gallery",
    label: "Gallery",
    title: "Photo gallery — TTC Aalo",
    description: "Photos from campus life, teaching practice and events at TTC Aalo.",
  },
  {
    path: "/student-life",
    label: "Student life",
    title: "Student life — TTC Aalo",
    description: "What it is like to study at TTC Aalo, in the words of our students.",
  },
  {
    path: "/disclosures",
    label: "Mandatory disclosures",
    title: "Mandatory disclosures — NCTE, RGU, RTI and more",
    description:
      "NCTE recognition, RGU affiliation, RTI, grievance redressal, anti-ragging, admission committee and IQAC documents for TTC Aalo.",
  },
  {
    path: "/contact",
    label: "Contact",
    title: "Contact TTC Aalo",
    description: "Find us at Bogdo, Aalo, West Siang, Arunachal Pradesh – 791001. Call, WhatsApp or send an enquiry.",
  },
  {
    path: "/grievance",
    label: "Grievance",
    title: "Submit a grievance — TTC Aalo",
    description: "Raise a concern safely. Every grievance gets a ticket number and is reviewed by the college.",
  },
];

async function seedSeo() {
  for (const entry of SEO_ENTRIES) {
    await prisma.seoEntry.upsert({ where: { path: entry.path }, update: {}, create: entry });
  }
}

type SectionSeed = Omit<Prisma.SectionCreateInput, "items"> & { items?: Prisma.InputJsonValue };

const SECTIONS: SectionSeed[] = [
  // ── Home ────────────────────────────────────────────────
  {
    page: "home",
    key: "home.hero",
    label: "Hero",
    order: 0,
    eyebrow: "Teacher Training College, Aalo",
    title: "Become the teacher your community remembers.",
    subtitle:
      "A 2-year B.Ed. in the green hills of West Siang — affiliated to Rajiv Gandhi University and recognised by NCTE. Small classes, real classroom practice, and people who know your name.",
    ctaLabel: "Check eligibility & enquire",
    ctaHref: "/enquire",
    secondaryCtaLabel: "Explore the B.Ed.",
    secondaryCtaHref: "/programmes/bed",
  },
  {
    page: "home",
    key: "home.trust",
    label: "Trust strip",
    order: 1,
    items: [
      { title: "RGU affiliated", description: "Rajiv Gandhi University, Doimukh" },
      { title: "NCTE recognised", description: "For the B.Ed. programme" },
      { title: "Since 2011", description: "Teacher education in Aalo" },
      { title: "30-acre campus", description: "Green and peaceful" },
    ],
  },
  {
    page: "home",
    key: "home.stats",
    label: "Number counters",
    order: 2,
    items: [
      { value: "2011", title: "Established", description: "Serving Arunachal for over a decade" },
      { value: "100", title: "B.Ed. seats a year", description: "Sanctioned intake" },
      { value: "30", suffix: " acres", title: "Green campus", description: "Near Aalo, West Siang" },
      { value: "4", title: "Semesters", description: "Two years of guided practice" },
    ],
  },
  {
    page: "home",
    key: "home.programmes",
    label: "Programmes",
    order: 3,
    eyebrow: "Programmes",
    title: "Start your teaching career here",
    subtitle: "Clear eligibility, honest information, and support at every step.",
    ctaLabel: "See all programmes",
    ctaHref: "/programmes",
  },
  {
    page: "home",
    key: "home.why",
    label: "Why TTC Aalo",
    order: 4,
    eyebrow: "Why TTC Aalo",
    title: "Built for future teachers from the hills and valleys",
    subtitle: "We focus on what makes a good teacher: practice, patience and purpose.",
    items: [
      {
        icon: "presentation",
        title: "Practical teaching from the start",
        description: "You learn by doing — lesson planning, micro-teaching and real classroom practice with guidance.",
      },
      {
        icon: "award",
        title: "A recognised degree",
        description: "Our B.Ed. is affiliated to Rajiv Gandhi University and recognised by NCTE.",
      },
      {
        icon: "heart-handshake",
        title: "Rooted in community",
        description: "We prepare teachers for rural and underserved schools, where good teaching changes the most.",
      },
      {
        icon: "lightbulb",
        title: "Workshops, seminars & research",
        description: "Grow beyond the syllabus through workshops, seminars and small research projects.",
      },
      {
        icon: "briefcase",
        title: "Welcome, in-service teachers",
        description: "Eligible in-service teachers get preference in admission (an NOC from your employer is required).",
      },
      {
        icon: "trees",
        title: "A calm, green campus",
        description: "Thirty acres of open, green space near Aalo — a good place to think, read and grow.",
      },
    ],
  },
  {
    page: "home",
    key: "home.campus",
    label: "Campus life gallery",
    order: 5,
    eyebrow: "Campus life",
    title: "A place to learn, and to belong",
    subtitle: "Classrooms, teaching practice, celebrations and quiet corners to study.",
    ctaLabel: "Open the gallery",
    ctaHref: "/gallery",
    items: [
      { title: "Campus" },
      { title: "Classrooms" },
      { title: "Teaching practice" },
      { title: "Library" },
      { title: "Events" },
    ],
  },
  {
    page: "home",
    key: "home.principal",
    label: "Principal's message",
    order: 6,
    eyebrow: "From the Principal",
    title: "A message for you",
  },
  {
    page: "home",
    key: "home.notices",
    label: "Latest notices",
    order: 7,
    eyebrow: "Notice board",
    title: "Latest notices",
    ctaLabel: "All notices",
    ctaHref: "/notices",
  },
  {
    page: "home",
    key: "home.testimonials",
    label: "Testimonials",
    order: 8,
    eyebrow: "In their words",
    title: "Students and alumni on TTC Aalo",
  },
  {
    page: "home",
    key: "home.faq",
    label: "FAQ preview",
    order: 9,
    eyebrow: "Questions",
    title: "Answers to common questions",
    ctaLabel: "More answers on the admissions page",
    ctaHref: "/admissions#faq",
  },
  {
    page: "home",
    key: "home.cta",
    label: "Final call to action",
    order: 10,
    title: "Ready to take the first step?",
    subtitle: "Check your eligibility in under a minute. Our team will call you back and guide you through the rest.",
    ctaLabel: "Check eligibility & enquire",
    ctaHref: "/enquire",
    secondaryCtaLabel: "Visit us",
    secondaryCtaHref: "/contact",
  },

  // ── About ───────────────────────────────────────────────
  {
    page: "about",
    key: "about.intro",
    label: "Introduction",
    order: 0,
    eyebrow: "About us",
    title: "Preparing good teachers for Arunachal since 2011",
    subtitle:
      "Teacher Training College, Aalo is a teacher education college at Bogdo, Aalo in West Siang district. We are managed by Marjum Welfare Society, affiliated to Rajiv Gandhi University, and our B.Ed. programme is recognised by NCTE.",
  },
  {
    page: "about",
    key: "about.history",
    label: "Our story",
    order: 1,
    eyebrow: "Our story",
    title: "Started in Aalo, for Arunachal",
    body:
      "<p>TTC Aalo was established in 2011 with a simple aim: to give young people in Arunachal Pradesh a good place to train as teachers, close to home.</p><p>Our campus covers about 30 acres of green land near Aalo. Over the years, the college has grown as a home for future teachers from across West Siang, the wider state and the Northeast.</p>",
  },
  {
    page: "about",
    key: "about.mission",
    label: "Mission & objectives",
    order: 2,
    eyebrow: "Our mission",
    title: "What we work for",
    subtitle: "Every programme, class and workshop at TTC Aalo connects to these goals.",
    items: [
      { icon: "graduation-cap", title: "Qualified, competent teachers", description: "Develop teachers who are well-qualified, skilled and confident in the classroom." },
      { icon: "scale", title: "Ethical practice", description: "Build honesty, care and responsibility into everyday teaching." },
      { icon: "book-open", title: "Better classroom learning", description: "Improve how children learn, through better planning and teaching methods." },
      { icon: "users", title: "Leadership & social responsibility", description: "Help teachers lead in their schools and serve their communities." },
      { icon: "mountain", title: "Rural & underserved communities", description: "Support education where it is needed most." },
      { icon: "flask-conical", title: "Research & practice", description: "Encourage research, workshops, seminars and practical teaching." },
    ],
  },
  {
    page: "about",
    key: "about.management",
    label: "Management",
    order: 3,
    eyebrow: "Management",
    title: "Marjum Welfare Society",
    body:
      "<p>TTC Aalo is managed by Marjum Welfare Society. The society guides the college's development and works to keep quality teacher education within reach of students in Arunachal Pradesh.</p>",
  },
  {
    page: "about",
    key: "about.timeline",
    label: "Timeline",
    order: 4,
    eyebrow: "Milestones",
    title: "Our journey",
    items: [
      { value: "2011", title: "TTC Aalo is established", description: "The college opens at Bogdo, Aalo under Marjum Welfare Society." },
      { value: "B.Ed.", title: "Recognised and affiliated", description: "Our B.Ed. is recognised by NCTE and affiliated to Rajiv Gandhi University." },
      { value: "2026–27", title: "Admissions for the new session", description: "Enquiries are open for the 2026–27 session." },
    ],
  },

  // ── Admissions ──────────────────────────────────────────
  {
    page: "admissions",
    key: "admissions.intro",
    label: "Introduction",
    order: 0,
    eyebrow: "Admissions 2026–27",
    title: "Your path to a B.Ed., step by step",
    subtitle:
      "Selection is based on merit. Check if you are eligible, keep your documents ready, and talk to us any time — we are happy to help.",
  },
  {
    page: "admissions",
    key: "admissions.steps",
    label: "Admission steps",
    order: 1,
    eyebrow: "How it works",
    title: "Five simple steps",
    items: [
      { title: "Check your eligibility", description: "Use the eligibility checker below. It takes less than a minute." },
      { title: "Send an enquiry", description: "Share your details and our admissions team will call you back to answer your questions." },
      { title: "Apply when the form is released", description: "Fill in the application form once the admission notice is published on our Notices page." },
      { title: "Merit list & document check", description: "Selection is merit-based. If you are selected, bring your original documents for verification." },
      { title: "Confirm your seat", description: "Complete the admission formalities and fee payment to confirm your seat." },
    ],
  },
  {
    page: "admissions",
    key: "admissions.documents",
    label: "Document checklist",
    order: 2,
    eyebrow: "Keep these ready",
    title: "Document checklist",
    subtitle: "The final list will be confirmed in the official admission notice. Carry originals and two photocopies of each.",
    items: [
      { title: "Bachelor's degree mark sheets and certificate", description: "And Master's degree documents, if you have one." },
      { title: "Class 10 certificate", description: "As proof of your date of birth." },
      { title: "Class 12 mark sheet", description: "" },
      { title: "Migration certificate", description: "Only if you graduated from a university other than Rajiv Gandhi University." },
      { title: "Category certificate", description: "Only if you are applying for a reserved-category relaxation." },
      { title: "No Objection Certificate (NOC)", description: "Only for in-service teachers, from your employer." },
      { title: "Photo ID proof", description: "Such as Aadhaar card or voter ID." },
      { title: "Recent passport-size photographs", description: "" },
    ],
  },
];

async function seedSections() {
  for (const s of SECTIONS) {
    await prisma.section.upsert({
      where: { key: s.key },
      update: {},
      create: { ...s, items: s.items ?? [] },
    });
  }
}

async function seedPages() {
  const pages: Prisma.PageCreateInput[] = [
    {
      slug: "privacy-policy",
      title: "Privacy policy",
      system: true,
      status: "PUBLISHED",
      excerpt: "How TTC Aalo collects, uses and protects your personal information.",
      body: `<h2>Who we are</h2>
<p>This website is run by Teacher Training College, Aalo ("TTC Aalo", "we"), Bogdo, Aalo, West Siang, Arunachal Pradesh – 791001, managed by Marjum Welfare Society.</p>
<h2>What we collect</h2>
<p>When you send an enquiry, we collect the details you type into the form: your name, phone number, email (optional), the programme you are interested in, your district, qualification, marks, category and preferred contact time. We also record your consent and the date and time you gave it.</p>
<p>To understand which of our adverts and links are useful, we also store the campaign tags in the link you used to reach us (for example <em>utm_source</em> and <em>utm_campaign</em>) and the page you came from.</p>
<p>When you submit a grievance, we collect the details you provide so that we can look into it. You may choose to submit anonymously.</p>
<h2>How we use it</h2>
<ul><li>To call, message or email you about admissions, only after you agree.</li><li>To respond to and resolve grievances.</li><li>To improve our website and outreach.</li></ul>
<p>We do not sell your information. Only authorised college staff can see it.</p>
<h2>Cookies and analytics</h2>
<p>We use privacy-friendly, cookie-free statistics to see how many people visit our pages. Optional analytics and advertising tools (Google Analytics and Meta Pixel) load only if you click "Accept" on the cookie banner. You can change your choice at any time using the "Cookie settings" link at the bottom of every page.</p>
<h2>How long we keep it</h2>
<p>We keep enquiry records for as long as they are useful for the admissions process, and delete them when they are no longer needed.</p>
<h2>Your choices</h2>
<p>You can ask us to see, correct or delete your information at any time. Please contact the college office using the details on our Contact page.</p>`,
    },
    {
      slug: "student-life",
      title: "Student life",
      system: true,
      status: "PUBLISHED",
      excerpt: "Learning, friendship and growing into a teacher.",
      body: `<p>Studying at TTC Aalo is about more than lectures. Over two years you will plan lessons, practise teaching, take part in workshops and seminars, and learn alongside classmates from across Arunachal Pradesh and the Northeast.</p>
<p>Our green campus near Aalo gives you room to read, reflect and enjoy time with friends. The photos and stories on this page come from our own students and events.</p>`,
    },
  ];
  for (const page of pages) {
    await prisma.page.upsert({ where: { slug: page.slug }, update: {}, create: page });
  }
}

async function seedProgrammes() {
  const bed = await prisma.programme.upsert({
    where: { slug: "bed" },
    update: {},
    create: {
      slug: "bed",
      name: "Bachelor of Education (B.Ed.)",
      shortName: "B.Ed.",
      level: "Undergraduate professional degree",
      tagline: "Two years to become a confident, caring teacher.",
      summary:
        "A 2-year, 4-semester programme that prepares you to teach — with strong foundations in education, teaching methods and real classroom practice.",
      overview:
        "<p>The B.Ed. at TTC Aalo is a two-year programme, organised into four semesters. You will study how children learn, how to plan and teach lessons, and how to manage a classroom with care.</p><p>A large part of the programme is practical. You will practise teaching with guidance and feedback, and take part in workshops and seminars that help you grow as a professional.</p><p>The programme is affiliated to Rajiv Gandhi University (RGU), Rono Hills, Doimukh, and recognised by the National Council for Teacher Education (NCTE).</p>",
      duration: "2 years",
      semesters: 4,
      intake: 100,
      affiliation: "Rajiv Gandhi University (RGU), Rono Hills, Doimukh",
      recognition: "National Council for Teacher Education (NCTE)",
      status: "ACTIVE",
      order: 0,
      eligibility: [
        { category: "General", requirement: "Bachelor's or Master's degree with at least 50% marks" },
        {
          category: "Reserved categories",
          requirement: "Bachelor's or Master's degree, with relaxation in marks as per Government rules",
        },
        {
          category: "In-service teachers",
          requirement: "Eligible in-service teachers get preference. A No Objection Certificate (NOC) from your employer is required.",
        },
        {
          category: "Graduates of other universities",
          requirement: "A migration certificate is required if your degree is not from Rajiv Gandhi University.",
        },
      ],
      eligibilityNotes: "Selection is based on merit.",
      subjects: [
        "Childhood and growing up",
        "Learning and teaching",
        "Contemporary India and education",
        "Assessment for learning",
        "Pedagogy of school subjects",
        "Language across the curriculum",
        "Knowledge and curriculum",
        "Creating an inclusive school",
        "School internship and teaching practice",
      ],
      careers: [
        { title: "School teacher", description: "Teach in government and private schools, subject to each employer's recruitment rules." },
        { title: "Teacher eligibility tests", description: "A B.Ed. is one of the qualifications that lets you prepare for teacher eligibility tests such as CTET and state TETs." },
        { title: "Further study", description: "Continue to M.Ed. or other postgraduate studies in education." },
        { title: "Education & community work", description: "Work with education programmes, NGOs and community learning centres." },
      ],
      fees: [],
      documents: [
        "Bachelor's degree mark sheets and certificate (and Master's, if any)",
        "Class 10 certificate (proof of date of birth)",
        "Class 12 mark sheet",
        "Migration certificate (if your degree is from a university other than RGU)",
        "Category certificate (if claiming relaxation)",
        "No Objection Certificate (in-service teachers only)",
        "Photo ID proof",
        "Recent passport-size photographs",
      ],
      seoTitle: "B.Ed. at TTC Aalo — 2 years, 100 seats, RGU affiliated",
      seoDescription:
        "2-year, 4-semester B.Ed. at Teacher Training College, Aalo. 100 seats. Affiliated to Rajiv Gandhi University and recognised by NCTE. Check your eligibility.",
    },
  });

  await prisma.programme.upsert({
    where: { slug: "ba" },
    update: {},
    create: {
      slug: "ba",
      name: "Bachelor of Arts (B.A.)",
      shortName: "B.A.",
      level: "Undergraduate degree",
      summary:
        "Undergraduate study in History, Geography, Education, Political Science and Economics.",
      overview: "<p>Subjects: History, Geography, Education, Political Science and Economics.</p>",
      subjects: ["History", "Geography", "Education", "Political Science", "Economics"],
      approvalNote: "RGU approval in principle from 2023–24. Confirm current status before making this programme public.",
      status: "VERIFY",
      order: 1,
    },
  });

  await prisma.programme.upsert({
    where: { slug: "bsc" },
    update: {},
    create: {
      slug: "bsc",
      name: "Bachelor of Science (B.Sc.)",
      shortName: "B.Sc.",
      level: "Undergraduate degree",
      summary: "Undergraduate study in Botany, Zoology and Chemistry.",
      overview: "<p>Subjects: Botany, Zoology and Chemistry.</p>",
      subjects: ["Botany", "Zoology", "Chemistry"],
      approvalNote:
        "RGU approval in principle from 2024–25, subject to inspection. Confirm current status before making this programme public.",
      status: "VERIFY",
      order: 2,
    },
  });

  const existingRules = await prisma.eligibilityRule.count({ where: { programmeId: bed.id } });
  if (existingRules === 0) {
    const degrees = ["BACHELORS", "MASTERS"];
    const relaxationNote =
      "Relaxation in marks applies as per Government rules. Our admissions team will confirm the exact cut-off for your category.";
    await prisma.eligibilityRule.createMany({
      data: [
        {
          programmeId: bed.id,
          category: "GENERAL",
          qualifications: degrees,
          minPercent: 50,
          resultNote: "You need at least 50% marks in your Bachelor's or Master's degree.",
          order: 0,
        },
        { programmeId: bed.id, category: "SC", qualifications: degrees, minPercent: null, resultNote: relaxationNote, order: 1 },
        { programmeId: bed.id, category: "ST", qualifications: degrees, minPercent: null, resultNote: relaxationNote, order: 2 },
        { programmeId: bed.id, category: "OBC", qualifications: degrees, minPercent: null, resultNote: relaxationNote, order: 3 },
        { programmeId: bed.id, category: "PWD", qualifications: degrees, minPercent: null, resultNote: relaxationNote, order: 4 },
        {
          programmeId: bed.id,
          category: "EWS",
          qualifications: degrees,
          minPercent: null,
          resultNote: "Please check with our admissions team whether a relaxation applies to your category.",
          order: 5,
        },
      ],
    });
  }
}

async function seedFaculty() {
  const people = [
    { name: "Doi Ado", designation: "Managing Director", type: "LEADERSHIP" as const, order: 0 },
    { name: "Ramen Kumar Bayan", designation: "Principal", type: "LEADERSHIP" as const, order: 1 },
  ];
  for (const p of people) {
    await createIfMissing(
      () => prisma.facultyMember.findFirst({ where: { name: p.name } }),
      () => prisma.facultyMember.create({ data: { ...p, status: "PUBLISHED" } }),
    );
  }
}

async function seedFacilities() {
  const facilities: Prisma.FacilityCreateInput[] = [
    {
      name: "Green campus",
      slug: "green-campus",
      category: "Campus",
      summary: "About 30 acres of open, green land near Aalo — calm, safe and close to nature.",
      description:
        "<p>Our campus at Bogdo, Aalo covers about 30 acres. Open spaces and greenery make it a peaceful place to study, reflect and spend time with friends.</p>",
      highlights: ["About 30 acres", "Bogdo, Aalo, West Siang", "Peaceful setting"],
      status: "PUBLISHED",
      order: 0,
    },
    {
      name: "Classrooms",
      slug: "classrooms",
      category: "Academic",
      summary: "Classrooms for lectures, group work and teaching practice.",
      description: "<p>Add details about classrooms here (number of rooms, seating, teaching aids) and publish when ready.</p>",
      status: "DRAFT",
      order: 1,
    },
    {
      name: "Library",
      slug: "library",
      category: "Library",
      summary: "Books, journals and a quiet space to read.",
      description: "<p>Add details about the library here (collection size, reading room, timings) and publish when ready.</p>",
      status: "DRAFT",
      order: 2,
    },
    {
      name: "Learning resource labs",
      slug: "labs",
      category: "Laboratory",
      summary: "Spaces for hands-on practice in teaching and learning.",
      description: "<p>Add details about your labs and resource centres here and publish when ready.</p>",
      status: "DRAFT",
      order: 3,
    },
    {
      name: "Hostel",
      slug: "hostel",
      category: "Residential",
      summary: "Residential facilities for students.",
      description: "<p>If the college offers hostel accommodation, add the details here (capacity, rules, fees) and publish.</p>",
      status: "DRAFT",
      order: 4,
    },
  ];
  for (const f of facilities) {
    await prisma.facility.upsert({ where: { slug: f.slug }, update: {}, create: f });
  }
}

async function seedFaqs() {
  const faqs = [
    {
      question: "Who can apply for the B.Ed. at TTC Aalo?",
      answer:
        "You can apply if you have a Bachelor's or Master's degree with at least 50% marks (General category). Reserved categories get relaxation in marks as per Government rules.",
      category: "Admissions",
      showOnHome: true,
    },
    {
      question: "How long is the B.Ed. programme?",
      answer: "The B.Ed. is a 2-year programme, divided into 4 semesters.",
      category: "Programmes",
      showOnHome: true,
    },
    {
      question: "How many seats are there?",
      answer: "The B.Ed. has an intake of 100 seats.",
      category: "Admissions",
      showOnHome: true,
    },
    {
      question: "Is the B.Ed. recognised?",
      answer:
        "Yes. The B.Ed. programme is recognised by the National Council for Teacher Education (NCTE) and the college is affiliated to Rajiv Gandhi University (RGU), Rono Hills, Doimukh.",
      category: "Programmes",
      showOnHome: true,
    },
    {
      question: "How are students selected?",
      answer: "Selection is based on merit. Eligible in-service teachers get preference.",
      category: "Admissions",
      showOnHome: false,
    },
    {
      question: "I am already working as a teacher. Can I apply?",
      answer:
        "Yes. Eligible in-service teachers get preference in admission. You will need a No Objection Certificate (NOC) from your employer.",
      category: "Admissions",
      showOnHome: true,
    },
    {
      question: "My degree is from a university other than RGU. What do I need?",
      answer: "You will need a migration certificate from your university, along with your other documents.",
      category: "Fees & documents",
      showOnHome: false,
    },
    {
      question: "What are the fees?",
      answer:
        "The fee details for the 2026–27 session will be shared here once they are confirmed. Until then, please call or WhatsApp the college office and we will tell you the current fees.",
      category: "Fees & documents",
      showOnHome: false,
    },
    {
      question: "Where is the college?",
      answer: "We are at Bogdo, Aalo, in West Siang district, Arunachal Pradesh – 791001.",
      category: "Campus",
      showOnHome: false,
    },
  ];
  let order = 0;
  for (const faq of faqs) {
    await createIfMissing(
      () => prisma.faq.findFirst({ where: { question: faq.question } }),
      () => prisma.faq.create({ data: { ...faq, order: order, status: "PUBLISHED" } }),
    );
    order++;
  }
}

async function seedNotices() {
  await prisma.notice.upsert({
    where: { slug: "bed-admissions-2026-27-enquiries-open" },
    update: {},
    create: {
      slug: "bed-admissions-2026-27-enquiries-open",
      title: "B.Ed. admissions 2026–27: enquiries are open",
      category: "ADMISSION",
      summary: "Send an enquiry and our admissions team will call you back.",
      body:
        "<p>We are now taking enquiries for B.Ed. admission for the 2026–27 session. Use the eligibility checker on our Admissions page, then send us your details through the enquiry form. Our admissions team will call you back.</p><p>Important dates and the application form will be published on this Notices page.</p>",
      pinned: true,
      status: "PUBLISHED",
    },
  });
}

async function seedNavigation() {
  const count = await prisma.navItem.count();
  if (count > 0) return;
  const items: Prisma.NavItemCreateManyInput[] = [
    { menu: "HEADER", label: "About", href: "/about", order: 0 },
    { menu: "HEADER", label: "Programmes", href: "/programmes", order: 1 },
    { menu: "HEADER", label: "Admissions", href: "/admissions", order: 2 },
    { menu: "HEADER", label: "Notices", href: "/notices", order: 3 },
    { menu: "HEADER", label: "Campus", href: "/campus", order: 4 },
    { menu: "HEADER", label: "Contact", href: "/contact", order: 5 },

    { menu: "FOOTER_EXPLORE", label: "About TTC Aalo", href: "/about", order: 0 },
    { menu: "FOOTER_EXPLORE", label: "Programmes", href: "/programmes", order: 1 },
    { menu: "FOOTER_EXPLORE", label: "Faculty & staff", href: "/faculty", order: 2 },
    { menu: "FOOTER_EXPLORE", label: "Campus & facilities", href: "/campus", order: 3 },
    { menu: "FOOTER_EXPLORE", label: "Events", href: "/events", order: 4 },
    { menu: "FOOTER_EXPLORE", label: "Gallery", href: "/gallery", order: 5 },

    { menu: "FOOTER_STUDENTS", label: "Admissions", href: "/admissions", order: 0 },
    { menu: "FOOTER_STUDENTS", label: "Eligibility checker", href: "/admissions#eligibility", order: 1 },
    { menu: "FOOTER_STUDENTS", label: "Notices", href: "/notices", order: 2 },
    { menu: "FOOTER_STUDENTS", label: "Student life", href: "/student-life", order: 3 },
    { menu: "FOOTER_STUDENTS", label: "Submit a grievance", href: "/grievance", order: 4 },
    { menu: "FOOTER_STUDENTS", label: "Contact", href: "/contact", order: 5 },

    { menu: "FOOTER_LEGAL", label: "Mandatory disclosures", href: "/disclosures", order: 0 },
    { menu: "FOOTER_LEGAL", label: "Privacy policy", href: "/privacy-policy", order: 1 },
  ];
  await prisma.navItem.createMany({ data: items });
}

async function seedSuperAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL?.toLowerCase().trim();
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) {
    console.log("ℹ︎  SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD not set — skipping super admin. Run `npm run create-admin` later.");
    return;
  }
  if (password.length < 10) throw new Error("SEED_ADMIN_PASSWORD must be at least 10 characters.");
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`ℹ︎  User ${email} already exists — leaving it unchanged.`);
    return;
  }
  await prisma.user.create({
    data: {
      email,
      name: process.env.SEED_ADMIN_NAME ?? "Super Admin",
      role: "SUPER_ADMIN",
      passwordHash: await bcrypt.hash(password, 12),
    },
  });
  console.log(`✓ Created super admin ${email}`);
}

async function main() {
  await seedSettings();
  await seedSeo();
  await seedSections();
  await seedPages();
  await seedProgrammes();
  await seedFaculty();
  await seedFacilities();
  await seedFaqs();
  await seedNotices();
  await seedNavigation();
  await seedSuperAdmin();
  console.log("✓ Seed complete");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
