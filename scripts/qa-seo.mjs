#!/usr/bin/env node

const baseUrl = (process.argv[2] || "http://127.0.0.1:3001").replace(/\/$/, "");

const redirectChecks = [
  ["/aktivnosti/", "/tecaji"],
  ["/prijava/", "/tecaji/zacetni"],
  ["/prijava-na-trening-prostega-potapljanja/", "/treningi"],
  ["/pogosto-zastavljena-vprasanja/", "/vprasanja"],
  ["/pogoji-poslovanja/", "/pogoji"],
  ["/samo-jeranko/", "/o-nas"],
  ["/nadaljevalni-tecaji/", "/tecaji/nadaljevalni"],
  ["/o-prostem-potapljanju-z-druzbo-eles/", "/predavanja"],
  ["/narocilo-vratne-utezi/", "/kontakt"],
  ["/narocilo-najade-plavuti/", "/kontakt"],
  ["/demo-home/", "/"],
  ["/shop/", "/"],
  ["/cart/", "/"],
  ["/checkout/", "/"],
  ["/my-account/", "/"],
  ["/category/nasveti/", "/novice"],
  ["/tag/izenacevanje/", "/novice"],
  ["/events/nek-star-dogodek/", "/tecaji"],
  ["/dogodki/zacetni-tecaj-potapljanja-na-vdih-ljubljana-maj/", "/tecaji"],
  ["/calendar/calendar/", "/tecaji"],
  ["/apnea-category/treningi/", "/treningi"],
  ["/apnea-category/tecaji/", "/tecaji"],
  ["/event_categories/course/", "/tecaji"],
  ["/event_tags/trening/", "/treningi"],
  [
    "/2017/07/16/10-nasvetov-za-uspesno-izenacevanje/",
    "/novice/10-nasvetov-za-uspesno-izenacevanje",
  ],
  [
    "/2026/03/18/reportaza-apnea-si-challenge-2026/",
    "/novice/reportaza-apnea-si-challenge-2026",
  ],
  [
    "/2026/06/10/apnea-si-trening-camp-2026/",
    "/novice/apnea-si-trening-camp-2026",
  ],
  ["/2020/03/01/some-old-non-migrated-post/", "/novice"],
];

function normalizePath(location) {
  if (!location) return "";
  try {
    const url = new URL(location, baseUrl);
    return (url.pathname.replace(/\/$/, "") || "/");
  } catch {
    return location.replace(/\/$/, "") || "/";
  }
}

async function checkRedirects() {
  const results = [];
  for (const [path, expectedPath] of redirectChecks) {
    const res = await fetch(`${baseUrl}${path}`, { redirect: "manual" });
    const actualPath = normalizePath(res.headers.get("location"));
    const expected = expectedPath.replace(/\/$/, "") || "/";
    results.push({
      path,
      status: res.status,
      actualPath,
      expected,
      ok: [307, 308].includes(res.status) && actualPath === expected,
    });
  }
  return results;
}

async function checkSitemap() {
  const res = await fetch(`${baseUrl}/sitemap.xml`);
  const xml = await res.text();
  const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
  const expectedHost = "https://www.apnea.si";

  return {
    status: res.status,
    totalUrls: urls.length,
    hasHome: urls.includes(`${expectedHost}/`),
    hasTrainings: urls.includes(`${expectedHost}/treningi`),
    hasProstoPotapljanje: urls.includes(`${expectedHost}/prosto-potapljanje`),
    hasBeginnerCourse: urls.includes(`${expectedHost}/tecaji/zacetni`),
    hasNews: urls.includes(`${expectedHost}/novice`),
    hasBlogPost: urls.some((u) => u.includes("/novice/reportaza-apnea-si-challenge-2026")),
    hasTrainingCamp2026: urls.some((u) => u.includes("/novice/apnea-si-trening-camp-2026")),
    excludesDesignPreview: !urls.includes(`${expectedHost}/design-preview`),
  };
}

async function checkRobots() {
  const res = await fetch(`${baseUrl}/robots.txt`);
  const text = await res.text();
  return {
    status: res.status,
    hasSitemap: text.includes("Sitemap: https://www.apnea.si/sitemap.xml"),
    disallowsApi: text.includes("Disallow: /api/"),
    disallowsStudio: text.includes("Disallow: /studio/"),
    disallowsCourseSignup: text.includes("Disallow: /tecaji/*/prijava"),
  };
}

function allValuesTrue(obj) {
  return Object.entries(obj).every(([key, value]) => {
    if (key === "totalUrls") return Number(value) > 0;
    if (key === "status") return value === 200;
    return value === true;
  });
}

const redirectResults = await checkRedirects();
const sitemap = await checkSitemap();
const robots = await checkRobots();

const redirectFailures = redirectResults.filter((r) => !r.ok);
const sitemapOk = allValuesTrue(sitemap);
const robotsOk = allValuesTrue(robots);

console.log(`SEO QA target: ${baseUrl}`);
console.log(`Redirects: ${redirectResults.length - redirectFailures.length}/${redirectResults.length} passed`);
if (redirectFailures.length) {
  console.log(JSON.stringify(redirectFailures, null, 2));
}
console.log(`Sitemap: ${sitemapOk ? "passed" : "failed"}`);
console.log(JSON.stringify(sitemap, null, 2));
console.log(`Robots: ${robotsOk ? "passed" : "failed"}`);
console.log(JSON.stringify(robots, null, 2));

if (redirectFailures.length || !sitemapOk || !robotsOk) {
  process.exit(1);
}
