const fs = require('fs');
const data = JSON.parse(fs.readFileSync('lighthouse-report.json', 'utf8'));

console.log('\n=== LIGHTHOUSE AUDIT RESULTS ===\n');

const cats = data.categories;
console.log('CATEGORY SCORES:');
console.log(`  Performance:    ${Math.round(cats.performance.score * 100)}/100`);
console.log(`  Accessibility:  ${Math.round(cats.accessibility.score * 100)}/100`);
console.log(`  Best Practices: ${Math.round(cats['best-practices'].score * 100)}/100`);
console.log(`  SEO:            ${Math.round(cats.seo.score * 100)}/100`);

console.log('\n=== TOP ISSUES TO FIX ===\n');

const audits = data.audits;
const failed = Object.values(audits)
  .filter(a => a.score !== null && a.score < 1 && a.score !== undefined)
  .sort((a,b) => a.score - b.score)
  .slice(0, 10);

failed.forEach((a, i) => {
  console.log(`${i+1}. [${Math.round(a.score * 100)}/100] ${a.title}`);
  if (a.description) {
    console.log(`   ${a.description.substring(0, 100)}...`);
  }
});

console.log('\n');
