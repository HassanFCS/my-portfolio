#!/usr/bin/env node
/**
 * Portfolio build script.
 *
 * Source of truth for ALL content is ../cv/master/data.js (the master CV).
 * This script reads it, renders index.html next to this file, and copies the
 * CV PDF into assets/ so the "Download CV" button always serves the current CV.
 *
 * Usage:  node build.js            (from the portfolio/ folder)
 *         SITE_URL=https://you.example node build.js   (sets canonical / og:url)
 */
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const CV_DIR = path.resolve(ROOT, "..", "cv", "master");
const data = require(path.join(CV_DIR, "data.js"));

const SITE_URL = (process.env.SITE_URL || "https://hassanfcs.github.io").replace(/\/$/, "");
const CV_PDF_SRC = path.join(CV_DIR, "Ibn_e_Hassan_CV_Master.pdf");
const CV_PDF_OUT = "assets/Ibn_e_Hassan_CV.pdf";

// ---------- helpers ----------
const esc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const attr = esc;

const titleCase = (s) =>
  s
    .toLowerCase()
    .split(" ")
    .map((w) => (w.length > 1 ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");

const slug = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const ext = (url, cls = "") =>
  `href="${attr(url)}" target="_blank" rel="noopener noreferrer"${cls ? ` class="${cls}"` : ""}`;

// ---------- derive structured contact from the CV's contact lines ----------
function parseContact(lines) {
  const c = { location: "", phone: "", phoneDigits: "", email: "", github: "", linkedin: "", note: "" };
  for (const raw of lines) {
    const line = raw.trim();
    if (/^\+?[\d\s()-]+(\(WhatsApp\))?$/i.test(line) || /whatsapp/i.test(line)) {
      c.phone = line.replace(/\s*\(WhatsApp\)\s*/i, "").trim();
      c.phoneDigits = c.phone.replace(/\D/g, "");
    } else if (/@/.test(line)) c.email = line;
    else if (/^github\.com\//i.test(line)) c.github = line;
    else if (/^linkedin\.com\//i.test(line)) c.linkedin = line;
    else if (/open to|available/i.test(line)) c.note = line;
    else if (!c.location) c.location = line;
  }
  return c;
}

const name = titleCase(data.name); // "IBN E HASSAN" -> "Ibn e Hassan"
const firstName = name.split(" ")[0];
const [role, ...tagGroups] = data.headline.split("|").map((s) => s.trim());
const tags = tagGroups.flatMap((g) => g.split(/,\s*|\s&\s/)).map((s) => s.trim()).filter(Boolean);
const contact = parseContact(data.contact);
const initials = name
  .split(" ")
  .filter((w) => w.length > 1)
  .map((w) => w[0].toUpperCase())
  .join("");

const description = data.summary.split(". ").slice(0, 2).join(". ") + ".";

// ---------- icons (inline SVG, stroke = currentColor) ----------
const icons = {
  github: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2.17c-3.2.7-3.87-1.37-3.87-1.37-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.76 2.69 1.25 3.35.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.42-2.7 5.39-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.2.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z"/></svg>`,
  linkedin: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z"/></svg>`,
  mail: `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>`,
  whatsapp: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.39-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.91-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35M12.05 21.78h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.9-9.88 2.64 0 5.12 1.03 6.99 2.9a9.82 9.82 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.89 9.88m8.41-18.3A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.33.16 11.89c0 2.1.55 4.14 1.59 5.95L0 24l6.3-1.65a11.88 11.88 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.33 11.89-11.89 0-3.18-1.24-6.16-3.48-8.41"/></svg>`,
  pin: `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
  download: `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></svg>`,
  external: `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h6v6"/><path d="M20 4 10 14"/><path d="M18 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6"/></svg>`,
  sun: `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>`,
  moon: `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>`,
  spark: `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/></svg>`,
  cap: `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 9 10-5 10 5-10 5z"/><path d="M6 11.5V17c0 1.5 3 3 6 3s6-1.5 6-3v-5.5"/><path d="M22 9v6"/></svg>`,
  badge: `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="9" r="6"/><path d="m8.5 14-1.5 7 5-3 5 3-1.5-7"/></svg>`,
};

// ---------- section renderers ----------
function renderHero() {
  const links = [];
  if (contact.github)
    links.push(`<a ${ext("https://" + contact.github, "chip")}>${icons.github}<span>GitHub</span></a>`);
  if (contact.linkedin)
    links.push(`<a ${ext("https://" + contact.linkedin, "chip")}>${icons.linkedin}<span>LinkedIn</span></a>`);
  if (contact.email)
    links.push(`<a class="chip" href="mailto:${attr(contact.email)}">${icons.mail}<span>${esc(contact.email)}</span></a>`);
  if (contact.phone)
    links.push(
      `<a ${ext("https://wa.me/" + contact.phoneDigits, "chip")} aria-label="WhatsApp ${attr(contact.phone)}">${icons.whatsapp}<span>${esc(contact.phone)} <small>(WhatsApp)</small></span></a>`
    );

  return `
<section class="hero" id="top">
  <div class="container hero-grid">
    <div class="hero-copy">
      <p class="eyebrow">
        ${icons.pin}<span>${esc(contact.location)}</span>
        ${contact.note ? `<span class="dot" aria-hidden="true"></span><span class="status"><i aria-hidden="true"></i>${esc(contact.note)}</span>` : ""}
      </p>
      <h1>${esc(name)}</h1>
      <p class="role">${esc(role)}</p>
      <ul class="tags" aria-label="Focus areas">
        ${tags.map((t) => `<li>${esc(t)}</li>`).join("\n        ")}
      </ul>
      <div class="cta">
        <a class="btn btn-primary" href="${CV_PDF_OUT}" download="Ibn_e_Hassan_CV.pdf">${icons.download}Download CV</a>
        <a class="btn btn-ghost" href="#experience">See experience</a>
      </div>
      <div class="contact-links">
        ${links.join("\n        ")}
      </div>
    </div>
    <div class="hero-card" aria-hidden="true">
      <div class="code-card">
        <div class="code-bar"><i></i><i></i><i></i><span>engineer.rb</span></div>
<pre><code><span class="k">class</span> <span class="c">Engineer</span>
  <span class="m">def</span> <span class="f">initialize</span>
    <span class="v">@name</span>       = <span class="s">"${esc(name)}"</span>
    <span class="v">@stack</span>      = <span class="s">%w[rails postgres sidekiq graphql]</span>
    <span class="v">@years</span>      = <span class="n">6</span>.<span class="f">plus</span>
    <span class="v">@focus</span>      = <span class="s">:apis</span>, <span class="s">:pipelines</span>, <span class="s">:ai</span>
    <span class="v">@remote</span>     = <span class="n">true</span>
  <span class="m">end</span>
<span class="k">end</span></code></pre>
      </div>
    </div>
  </div>
</section>`;
}

function renderAbout() {
  return `
<section class="section" id="about">
  <div class="container narrow">
    <h2 class="section-title"><span class="num">01</span>About</h2>
    <p class="lede">${esc(data.summary)}</p>
  </div>
</section>`;
}

function renderEngagement(e) {
  const title = e.url
    ? `<a ${ext(e.url, "eng-link")}>${esc(e.name)}${icons.external}</a>`
    : `<span>${esc(e.name)}</span>`;
  const meta = [e.role, e.dates].filter(Boolean).map(esc).join(" · ");
  return `
        <article class="engagement">
          <header>
            <h4>${title}</h4>
            ${meta ? `<p class="eng-meta">${meta}</p>` : ""}
          </header>
          ${e.blurb ? `<p class="blurb">${esc(e.blurb)}</p>` : ""}
          <ul class="bullets">
            ${e.bullets.map((b) => `<li>${esc(b)}</li>`).join("\n            ")}
          </ul>
        </article>`;
}

function renderExperience() {
  const items = data.experience
    .map((job) => {
      const company = job.url
        ? `<a ${ext(job.url, "company-link")}>${esc(job.company)}${icons.external}</a>`
        : esc(job.company);
      return `
    <li class="timeline-item">
      <div class="timeline-marker" aria-hidden="true"></div>
      <div class="timeline-body">
        <header class="job-head">
          <div>
            <h3>${esc(job.title)} <span class="at">at</span> ${company}</h3>
            <p class="job-meta">${esc(job.location)}</p>
            ${job.intro ? `<p class="job-intro">${esc(job.intro)}</p>` : ""}
          </div>
          <time class="dates">${esc(job.dates)}</time>
        </header>
        <div class="engagements">
          ${job.engagements.map(renderEngagement).join("\n")}
        </div>
      </div>
    </li>`;
    })
    .join("\n");

  return `
<section class="section" id="experience">
  <div class="container">
    <h2 class="section-title"><span class="num">02</span>Experience</h2>
    <ol class="timeline">
      ${items}
    </ol>
  </div>
</section>`;
}

function splitProjectText(text) {
  // Last sentence of a project description is its tech stack (comma list).
  const sentences = text.trim().replace(/\.$/, "").split(/\.\s+/);
  const last = sentences[sentences.length - 1];
  if (sentences.length > 1 && /,/.test(last) && !/\s(and|with|that|using)\s/.test(last)) {
    return { body: sentences.slice(0, -1).join(". ") + ".", stack: last.split(/,\s*/) };
  }
  return { body: text, stack: [] };
}

function renderProjects() {
  const cards = data.projects
    .map((p, i) => {
      const { body, stack } = splitProjectText(p.text);
      const featured = i === 0 || /solicitation tracker/i.test(p.name);
      const title = p.url ? `<a ${ext(p.url)}>${esc(p.name)}${icons.external}</a>` : esc(p.name);
      return `
    <article class="project${featured ? " featured" : ""}">
      ${featured ? `<p class="flag">${icons.spark}Featured</p>` : ""}
      <h3>${title}</h3>
      <p class="project-meta">${esc(p.meta)}</p>
      <p>${esc(body)}</p>
      ${stack.length ? `<ul class="stack" aria-label="Tech stack">${stack.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>` : ""}
    </article>`;
    })
    .join("\n");

  return `
<section class="section" id="projects">
  <div class="container">
    <h2 class="section-title"><span class="num">03</span>Projects</h2>
    <div class="projects">
      ${cards}
    </div>
  </div>
</section>`;
}

function renderSkills() {
  const groups = data.skills
    .map(
      ([group, list]) => `
      <div class="skill-group">
        <h3>${esc(group)}</h3>
        <ul>${list.split(/,\s*/).map((s) => `<li>${esc(s)}</li>`).join("")}</ul>
      </div>`
    )
    .join("\n");
  return `
<section class="section" id="skills">
  <div class="container">
    <h2 class="section-title"><span class="num">04</span>Skills</h2>
    <div class="skills-grid">
      ${groups}
    </div>
  </div>
</section>`;
}

function renderEducation() {
  const edu = data.education
    .map(
      (e) => `
        <li>
          <strong>${esc(e.degree)}</strong>
          <span>${esc(e.school)}</span>
          <time>${esc(e.dates)}</time>
        </li>`
    )
    .join("\n");
  const certs = data.certifications.map((c) => `<li>${esc(c)}</li>`).join("\n        ");
  return `
<section class="section" id="education">
  <div class="container two-col">
    <div>
      <h2 class="section-title"><span class="num">05</span>Education</h2>
      <ul class="plain-list edu">${edu}
      </ul>
    </div>
    <div>
      <h2 class="section-title"><span class="num">06</span>Certifications</h2>
      <ul class="plain-list certs">
        ${certs}
      </ul>
    </div>
  </div>
</section>`;
}

function renderContact() {
  return `
<section class="section contact" id="contact">
  <div class="container narrow">
    <h2 class="section-title"><span class="num">07</span>Get in touch</h2>
    <p class="lede">${contact.note ? esc(contact.note) + ". " : ""}The fastest way to reach me is email or WhatsApp.</p>
    <div class="cta">
      <a class="btn btn-primary" href="mailto:${attr(contact.email)}">${icons.mail}Email me</a>
      <a class="btn btn-ghost" ${ext("https://wa.me/" + contact.phoneDigits)}>${icons.whatsapp}WhatsApp</a>
      <a class="btn btn-ghost" href="${CV_PDF_OUT}" download="Ibn_e_Hassan_CV.pdf">${icons.download}Download CV</a>
    </div>
  </div>
</section>`;
}

// ---------- JSON-LD ----------
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name,
  jobTitle: role,
  description,
  email: `mailto:${contact.email}`,
  telephone: contact.phone,
  url: SITE_URL + "/",
  address: { "@type": "PostalAddress", addressLocality: contact.location.split(",")[0].trim(), addressCountry: "PK" },
  sameAs: [contact.github, contact.linkedin].filter(Boolean).map((u) => "https://" + u),
  knowsAbout: data.skills.flatMap(([, list]) => list.split(/,\s*/)),
  alumniOf: data.education.map((e) => ({ "@type": "CollegeOrUniversity", name: e.school })),
  worksFor: { "@type": "Organization", name: data.experience[0].company },
};

// ---------- page ----------
const navItems = [
  ["about", "About"],
  ["experience", "Experience"],
  ["projects", "Projects"],
  ["skills", "Skills"],
  ["education", "Education"],
  ["contact", "Contact"],
];

const pageTitle = `${name} · ${role}`;

const html = `<!doctype html>
<!-- GENERATED FILE. Do not edit by hand: run \`node build.js\`. Content comes from ../cv/master/data.js -->
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(pageTitle)}</title>
  <meta name="description" content="${attr(description)}">
  <meta name="author" content="${attr(name)}">
  <meta name="theme-color" content="#0f1115" media="(prefers-color-scheme: dark)">
  <meta name="theme-color" content="#fbfaf7" media="(prefers-color-scheme: light)">
  <link rel="canonical" href="${SITE_URL}/">
  <link rel="icon" href="favicon.svg" type="image/svg+xml">

  <meta property="og:type" content="profile">
  <meta property="og:title" content="${attr(pageTitle)}">
  <meta property="og:description" content="${attr(description)}">
  <meta property="og:url" content="${SITE_URL}/">
  <meta property="og:site_name" content="${attr(name)}">
  <meta property="og:image" content="${SITE_URL}/assets/og.jpg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${attr(name)} – ${attr(role)}">
  <meta property="profile:first_name" content="${attr(firstName)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${attr(pageTitle)}">
  <meta name="twitter:description" content="${attr(description)}">
  <meta name="twitter:image" content="${SITE_URL}/assets/og.jpg">

  <link rel="preload" href="styles.css" as="style">
  <link rel="stylesheet" href="styles.css">
  <script>
    // Apply saved theme before first paint to avoid a flash.
    (function(){try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark"){document.documentElement.setAttribute("data-theme",t);}}catch(e){}})();
  </script>
  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
</head>
<body>
  <a class="skip" href="#about">Skip to content</a>
  <header class="site-header">
    <div class="container header-inner">
      <a class="brand" href="#top" aria-label="${attr(name)} – home"><span class="mono">${esc(initials.toLowerCase())}</span><span class="brand-name">${esc(name)}</span></a>
      <nav class="site-nav" aria-label="Primary">
        <button class="nav-toggle" aria-expanded="false" aria-controls="nav-menu" aria-label="Open menu">
          <span></span><span></span><span></span>
        </button>
        <ul id="nav-menu" class="nav-menu">
          ${navItems.map(([id, label]) => `<li><a href="#${id}">${label}</a></li>`).join("\n          ")}
        </ul>
      </nav>
      <button class="theme-toggle" type="button" aria-label="Toggle colour theme" title="Toggle theme">
        <span class="icon-sun">${icons.sun}</span><span class="icon-moon">${icons.moon}</span>
      </button>
    </div>
  </header>

  <main>
${renderHero()}
${renderAbout()}
${renderExperience()}
${renderProjects()}
${renderSkills()}
${renderEducation()}
${renderContact()}
  </main>

  <footer class="site-footer">
    <div class="container footer-inner">
      <p>© <span id="year"></span> ${esc(name)}. Built with plain HTML, CSS and a little JavaScript.</p>
      <p class="footer-links">
        <a ${ext("https://" + contact.github)}>GitHub</a>
        <a ${ext("https://" + contact.linkedin)}>LinkedIn</a>
        <a href="mailto:${attr(contact.email)}">Email</a>
        <a href="#top">Back to top ↑</a>
      </p>
    </div>
  </footer>

  <script src="main.js" defer></script>
</body>
</html>
`;

// ---------- write ----------
fs.writeFileSync(path.join(ROOT, "index.html"), html);
fs.mkdirSync(path.join(ROOT, "assets"), { recursive: true });
fs.copyFileSync(CV_PDF_SRC, path.join(ROOT, CV_PDF_OUT));

// Favicon with initials, same accent as the site.
const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#0f1115"/><text x="32" y="42" font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-size="28" font-weight="700" fill="#ff7a59" text-anchor="middle">${initials.toLowerCase()}</text></svg>`;
fs.writeFileSync(path.join(ROOT, "favicon.svg"), favicon);

console.log(`Built index.html (${(html.length / 1024).toFixed(1)} KB), favicon.svg and ${CV_PDF_OUT} from ${path.relative(ROOT, CV_DIR)}/data.js`);
