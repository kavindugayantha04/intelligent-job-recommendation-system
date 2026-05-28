/* =========================================================
   Known skills whitelist
   ---------------------------------------------------------
   We use this list ONLY to decide what counts as a real skill
   when scanning free-form text such as a candidate's resumeText.
   Job-side fields (mandatorySkills / preferredSkills) are
   already curated arrays — they bypass the whitelist.

   This list is intentionally pragmatic, not exhaustive. Add
   skills here when you start tagging jobs / courses with them.
========================================================= */
const KNOWN_SKILLS = [
  // Programming languages
  "JavaScript", "TypeScript", "Python", "Java", "C", "C++", "C#",
  "Go", "Golang", "Rust", "Ruby", "PHP", "Swift", "Kotlin", "Scala",
  "R", "Dart", "Perl", "Bash", "Shell", "PowerShell", "Objective-C",

  // Frontend
  "React", "ReactJS", "Angular", "AngularJS", "Vue", "Vue.js", "Vuex",
  "Next.js", "Nuxt.js", "Svelte", "Redux", "MobX", "RxJS",
  "HTML", "HTML5", "CSS", "CSS3", "SASS", "SCSS", "Less",
  "Tailwind", "Tailwind CSS", "Bootstrap", "Material UI", "Chakra UI",
  "jQuery", "Webpack", "Vite", "Babel", "Storybook",

  // Backend
  "Node.js", "NodeJS", "Express", "Express.js", "NestJS", "Koa",
  "Django", "Flask", "FastAPI", "Spring", "Spring Boot",
  "Laravel", "Symfony", "Ruby on Rails", "ASP.NET", ".NET", ".NET Core",
  "GraphQL", "REST", "REST API", "RESTful", "gRPC", "WebSockets",
  "Microservices", "Serverless",

  // Databases
  "MongoDB", "MySQL", "PostgreSQL", "SQLite", "Redis", "Cassandra",
  "DynamoDB", "Oracle", "SQL Server", "MariaDB", "Firebase", "Firestore",
  "Elasticsearch", "Neo4j", "SQL", "NoSQL", "PL/SQL", "T-SQL",

  // Cloud / DevOps
  "AWS", "Azure", "GCP", "Google Cloud", "Heroku", "DigitalOcean",
  "Docker", "Kubernetes", "Helm", "Terraform", "Ansible", "Chef",
  "Puppet", "Jenkins", "GitHub Actions", "GitLab CI", "CircleCI",
  "Travis CI", "CI/CD", "Linux", "Unix", "Nginx", "Apache",
  "Prometheus", "Grafana", "Datadog", "Splunk",

  // Mobile
  "React Native", "Flutter", "iOS", "Android", "Xamarin", "Ionic",
  "SwiftUI", "Jetpack Compose",

  // Data / AI / ML
  "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "Keras",
  "Scikit-learn", "Pandas", "NumPy", "SciPy", "Matplotlib", "Seaborn",
  "Tableau", "Power BI", "Looker", "Data Science", "Data Analysis",
  "Data Engineering", "NLP", "Computer Vision", "OpenCV",
  "Hadoop", "Spark", "Kafka", "Airflow", "Snowflake", "Databricks",
  "ETL", "Big Data",

  // Testing
  "Jest", "Mocha", "Chai", "Cypress", "Selenium", "Playwright",
  "JUnit", "Pytest", "Postman", "Swagger", "OpenAPI",
  "Unit Testing", "Integration Testing", "End-to-End Testing",
  "TDD", "BDD",

  // Security
  "Cybersecurity", "Penetration Testing", "OAuth", "OAuth2", "JWT",
  "OWASP", "SSL", "TLS", "Encryption",

  // Tools / Other
  "Git", "GitHub", "GitLab", "Bitbucket", "Jira", "Confluence",
  "Trello", "Slack", "Notion", "Figma", "Photoshop", "Illustrator",
  "Adobe XD", "Sketch", "Canva",

  // Soft / general engineering
  "Agile", "Scrum", "Kanban", "Waterfall", "Project Management",
  "Communication", "Leadership", "Teamwork", "Problem Solving",
  "Time Management", "Critical Thinking",

  // Concepts
  "Algorithms", "Data Structures", "OOP", "Functional Programming",
  "Design Patterns", "System Design", "Distributed Systems",
  "API", "API Development", "JSON", "XML", "YAML",
];

const KNOWN_SKILLS_LOWER = new Set(KNOWN_SKILLS.map((s) => s.toLowerCase()));

/* =========================================================
   normalizeSkill — lowercase + trim, used as comparison key.
========================================================= */
function normalizeSkill(value) {
  return String(value || "").trim().toLowerCase();
}

/* =========================================================
   isKnownSkill — case-insensitive whitelist check.
========================================================= */
function isKnownSkill(value) {
  return KNOWN_SKILLS_LOWER.has(normalizeSkill(value));
}

/* =========================================================
   extractKnownSkillsFromText
   ---------------------------------------------------------
   Scan a free-text blob (e.g. resumeText) and return the
   list of whitelist skills that appear in it as whole tokens.

   Junk like "her", "tbt", "owemglc" can NEVER come back from
   this function because they're not in KNOWN_SKILLS.

   Returns the canonical casing from KNOWN_SKILLS.
========================================================= */
function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractKnownSkillsFromText(text) {
  if (!text || typeof text !== "string") return [];

  const found = new Map(); // lower -> original
  for (const skill of KNOWN_SKILLS) {
    const lower = skill.toLowerCase();
    if (found.has(lower)) continue;

    const escaped = escapeRegex(skill);
    // Treat +, #, . and / as part of a "skill word" so C++ / C# / Node.js
    // don't get split, but still require a hard boundary on either side.
    const pattern = new RegExp(
      `(?:^|[^a-zA-Z0-9+#./])${escaped}(?:[^a-zA-Z0-9+#./]|$)`,
      "i"
    );

    if (pattern.test(text)) {
      found.set(lower, skill);
    }
  }

  return Array.from(found.values());
}

/* =========================================================
   mergeSkillsCaseInsensitive
   ---------------------------------------------------------
   Combine multiple skill arrays, dedupe case-insensitively,
   prefer the first non-empty original casing.
========================================================= */
function mergeSkillsCaseInsensitive(...lists) {
  const out = new Map(); // lower -> original
  for (const list of lists) {
    if (!Array.isArray(list)) continue;
    for (const raw of list) {
      const original = String(raw || "").trim();
      if (!original) continue;
      const lower = original.toLowerCase();
      if (!out.has(lower)) out.set(lower, original);
    }
  }
  return Array.from(out.values());
}

module.exports = {
  KNOWN_SKILLS,
  isKnownSkill,
  normalizeSkill,
  extractKnownSkillsFromText,
  mergeSkillsCaseInsensitive,
};
