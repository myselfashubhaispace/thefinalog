const http = require('http');
const fs = require('fs');
const path = require('path');
const querystring = require('querystring');

const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

const server = http.createServer((req, res) => {
  // Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept'
    });
    res.end();
    return;
  }

  // Diagnostic endpoint for viewport measurement
  if (req.method === 'POST' && req.url === '/api/diag') {
    let raw = '';
    req.on('data', c => raw += c);
    req.on('end', () => {
      try {
        const d = JSON.parse(raw);
        console.log('\n================ DIAGNOSTIC REPORT ================');
        console.log(`Window Width: ${d.winW}px | Document scrollWidth: ${d.docW}px`);
        if (d.bad && d.bad.length) {
          console.log(`Found ${d.bad.length} overflowing elements:`);
          d.bad.forEach(b => console.log(`  ${b.tag} -> width=${b.w}px, right=${b.r}px (+${b.r - d.winW}px) [${b.text}]`));
        } else {
          console.log('NO OVERFLOWING ELEMENTS!');
        }
        console.log('===================================================\n');
      } catch (e) {
        console.log('Diag error:', e);
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end('{"ok":true}');
    });
    return;
  }

  // Handle Form Submission Endpoint
  if (req.method === 'POST' && (req.url === '/api/submit' || req.url === '/submit')) {
    let rawBody = '';
    req.on('data', chunk => { rawBody += chunk; });
    req.on('end', () => {
      let data = {};
      try {
        if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
          data = JSON.parse(rawBody);
        } else {
          data = querystring.parse(rawBody);
        }
      } catch (err) {
        data = { raw: rawBody };
      }

      const lead = {
        name: data.firstName || data.name || '',
        email: data.email || '',
        creators_required: data.creators_required || '',
        creator_niche: data.creator_niche || '',
        phone: data.phone || '',
        submittedAt: new Date().toISOString()
      };

      // 1. Save to leads.json
      const jsonFile = path.join(__dirname, 'leads.json');
      let leads = [];
      try {
        if (fs.existsSync(jsonFile)) {
          leads = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
        }
      } catch (e) { leads = []; }
      leads.push(lead);
      fs.writeFileSync(jsonFile, JSON.stringify(leads, null, 2), 'utf8');

      // 2. Save to leads.csv
      const csvFile = path.join(__dirname, 'leads.csv');
      const csvHeader = 'Timestamp,Name,Email,Creators,Niche,Phone\n';
      const clean = str => `"${(str || '').toString().replace(/"/g, '""')}"`;
      const csvRow = `${clean(lead.submittedAt)},${clean(lead.name)},${clean(lead.email)},${clean(lead.creators_required)},${clean(lead.creator_niche)},${clean(lead.phone)}\n`;
      if (!fs.existsSync(csvFile)) {
        fs.writeFileSync(csvFile, csvHeader + csvRow, 'utf8');
      } else {
        fs.appendFileSync(csvFile, csvRow, 'utf8');
      }

      console.log('\n======================================================');
      console.log('  🔔 NEW OG HUB LEAD CAPTURED!');
      console.log(`  👤 Name:      ${lead.name}`);
      console.log(`  📧 Email:     ${lead.email}`);
      console.log(`  🎯 Creators:  ${lead.creators_required}`);
      console.log(`  🏷️  Niche:     ${lead.creator_niche}`);
      console.log(`  📱 Phone:     ${lead.phone}`);
      console.log(`  ⏰ Time:      ${lead.submittedAt}`);
      console.log('======================================================\n');

      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({
        ok: true,
        success: true,
        message: 'Lead received successfully',
        redirect: 'thank-you.html'
      }));
    });
    return;
  }

  // Normalize url
  let safeUrl = decodeURI(req.url.split('?')[0]);
  if (safeUrl === '/') safeUrl = '/index.html';

  let filePath = path.join(__dirname, safeUrl);

  // If path doesn't have an extension and doesn't exist, try appending .html
  if (!path.extname(filePath) && !fs.existsSync(filePath) && fs.existsSync(filePath + '.html')) {
    filePath += '.html';
  }

  // Check if file exists
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=UTF-8' });
      res.end(`<h1>404 Not Found</h1><p>The requested file <code>${safeUrl}</code> was not found.</p><p><a href="/">Return to Homepage</a></p>`);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`  🚀 OG Hub (Ashutosh Mishra) Local Server Running!`);
  console.log(`  🔗 Local URL: http://localhost:${PORT}`);
  console.log(`  📧 Form submissions routed to: oghub.in@gmail.com`);
  console.log(`======================================================\n`);
});

