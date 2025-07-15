const axios = require('axios');
const cheerio = require('cheerio');
const whois = require('whois-json');
const tldts = require('tldts');
const dns = require('dns').promises;
const { URL } = require('url');
const { differenceInDays } = require('date-fns');
const puppeteer = require('puppeteer');

function getDomain(url) {
  try {
    const parsed = tldts.parse(url);
    return parsed.domain || '';
  } catch {
    return '';
  }
}

function getNetloc(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

function getScheme(url) {
  try {
    return new URL(url).protocol.replace(':', '');
  } catch {
    return '';
  }
}

function getPort(url) {
  try {
    return new URL(url).port ? parseInt(new URL(url).port) : null;
  } catch {
    return null;
  }
}

async function fetchHtml(url) {
  try {
    const { data } = await axios.get(url, { timeout: 5000 });
    return data;
  } catch {
    return '';
  }
}

async function fetchWithRedirects(url) {
  try {
    const response = await axios.get(url, { timeout: 5000, maxRedirects: 10 });
    return response;
  } catch {
    return null;
  }
}

async function extractJsFeatures(url) {
  let statusBar = -1;
  let rightClick = -1;
  let popupWindow = -1;
  let browser;
  try {
    browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });

    statusBar = await page.evaluate(() => {
      let original = window.status;
      window.status = '';
      const links = document.querySelectorAll('a');
      let custom = false;
      links.forEach(link => {
        link.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
        if (window.status && window.status !== original) custom = true;
      });
      return custom ? 1 : -1;
    });

    rightClick = await page.evaluate(() => {
      let disabled = false;
      function handler(e) { disabled = true; }
      document.addEventListener('contextmenu', handler);
      // Simulate right-click
      const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
      document.dispatchEvent(event);
      document.removeEventListener('contextmenu', handler);
      return disabled ? 1 : -1;
    });

    popupWindow = await page.evaluate(() => {
      let opened = false;
      const originalOpen = window.open;
      window.open = function() { opened = true; return null; };
      document.querySelectorAll('a,button').forEach(el => {
        el.click();
      });
      window.open = originalOpen;
      return opened ? 1 : -1;
    });
  } catch (e) {
  } finally {
    if (browser) await browser.close();
  }
  return { statusBar, rightClick, popupWindow };
}

async function extractFeaturesFromUrl(url) {
  const safeDomains = ['linkedin.com', 'google.com', 'facebook.com', 'microsoft.com', 'apple.com', 'amazon.com', 'github.com'];
  const domain = getDomain(url);
  if (safeDomains.some(safe => domain.endsWith(safe))) {
    const features = Array(30).fill(1);
    console.log(`Whitelisted domain detected: ${domain}. Returning safe feature vector.`);
    return features;
  }
  function hasIp(url) {
    const netloc = getNetloc(url);
    return /^\d+\.\d+\.\d+\.\d+$/.test(netloc) ? 1 : -1;
  }

  function longUrl(url) {
    return url.length >= 54 ? 1 : -1;
  }

  function shortUrl(url) {
    const shorteners = /bit\.ly|goo\.gl|shorte\.st|go2l\.ink|x\.co|ow\.ly|t\.co|tinyurl|tr\.im|is\.gd|cli\.gs|yfrog\.com|migre\.me|ff\.im|tiny\.cc|url4\.eu|twit\.ac|su\.pr|twurl\.nl|snipurl\.com|short\.to|BudURL\.com|ping\.fm|post\.ly|Just\.as|bkite\.com|snipr\.com|fic\.kr|loopt\.us|doiop\.com|short\.ie|kl\.am|wp\.me|rubyurl\.com|om\.ly|to\.ly|bit\.do|lnkd\.in|db\.tt|qr\.ae|adf\.ly|bitly\.com|cur\.lv|tinyurl\.com|owly\.com|bit\.ly|ity\.im|q\.gs|is\.gd|po\.st|bc\.vc|twitthis\.com|u\.to|j\.mp|buzurl\.com|cutt\.us|u\.bb|yourls\.org|prettylinkpro\.com|scrnch\.me|filoops\.info|vzturl\.com|qr\.net|1url\.com|tweez\.me|v\.gd|tr\.im|link\.zip\.net/;
    return shorteners.test(url) ? 1 : -1;
  }

  function symbolAt(url) {
    return url.includes('@') ? 1 : -1;
  }

  function redirecting(url) {
    const path = (() => { try { return new URL(url).pathname; } catch { return ''; } })();
    return (path.match(/\/\//g) || []).length > 0 ? 1 : -1;
  }

  function prefixSuffix(url) {
    const netloc = getNetloc(url);
    return netloc.includes('-') ? -1 : 1;
  }

  function subdomains(url) {
    let netloc = getNetloc(url);
    if (netloc.startsWith('www.')) netloc = netloc.replace('www.', '');
    const dots = (netloc.match(/\./g) || []).length;
    if (dots === 1) return -1;
    if (dots === 2) return 0;
    return 1;
  }

  function httpsToken(url) {
    return getScheme(url) === 'https' ? 1 : -1;
  }

  async function domainRegLen(url) {
    try {
      const domain = getDomain(url);
      const w = await whois(domain);
      const exp = Array.isArray(w.expiryDate) ? w.expiryDate[0] : w.expiryDate;
      const updated = Array.isArray(w.updatedDate) ? w.updatedDate[0] : w.updatedDate;
      if (exp && updated) {
        const days = differenceInDays(new Date(exp), new Date(updated));
        return days > 365 ? 1 : -1;
      }
      return -1;
    } catch {
      return -1;
    }
  }

  async function favicon(url) {
    try {
      const html = await fetchHtml(url);
      const $ = cheerio.load(html);
      let found = false;
      $('link[rel="icon"]').each((_, el) => {
        const href = $(el).attr('href') || '';
        if (href && getNetloc(href) && getNetloc(href) !== getNetloc(url)) found = true;
      });
      return found ? -1 : 1;
    } catch {
      return 1;
    }
  }

  function nonStdPort(url) {
    const port = getPort(url);
    return port && ![80, 443].includes(port) ? 1 : -1;
  }

  function httpsDomainUrl(url) {
    return getNetloc(url).includes('https') ? 1 : -1;
  }

  async function requestUrl(url) {
    try {
      const html = await fetchHtml(url);
      const $ = cheerio.load(html);
      const imgs = $('img[src]');
      const total = imgs.length;
      let linked = 0;
      imgs.each((_, img) => {
        const src = $(img).attr('src');
        if (src && getNetloc(src) && getNetloc(src) !== getNetloc(url)) linked++;
      });
      if (total === 0) return 1;
      const percent = linked / total;
      if (percent < 0.22) return 1;
      if (percent < 0.61) return 0;
      return -1;
    } catch {
      return 1;
    }
  }

  async function anchorUrl(url) {
    try {
      const html = await fetchHtml(url);
      const $ = cheerio.load(html);
      const anchors = $('a[href]');
      const total = anchors.length;
      let unsafe = 0;
      anchors.each((_, a) => {
        const href = $(a).attr('href') || '';
        if (!href || href.startsWith('#') || href.toLowerCase().includes('javascript') || href.toLowerCase().includes('mailto') || (getNetloc(href) && getNetloc(href) !== getNetloc(url))) unsafe++;
      });
      if (total === 0) return 1;
      const percent = unsafe / total;
      if (percent < 0.31) return 1;
      if (percent < 0.67) return 0;
      return -1;
    } catch {
      return 1;
    }
  }

  async function linksInScriptTags(url) {
    try {
      const html = await fetchHtml(url);
      const $ = cheerio.load(html);
      const tags = $('script[src],link[src]');
      const total = tags.length;
      let linked = 0;
      tags.each((_, tag) => {
        const src = $(tag).attr('src') || '';
        if (src && getNetloc(src) && getNetloc(src) !== getNetloc(url)) linked++;
      });
      if (total === 0) return 1;
      const percent = linked / total;
      if (percent < 0.17) return 1;
      if (percent < 0.81) return 0;
      return -1;
    } catch {
      return 1;
    }
  }

  async function serverFormHandler(url) {
    try {
      const html = await fetchHtml(url);
      const $ = cheerio.load(html);
      const forms = $('form[action]');
      for (let i = 0; i < forms.length; i++) {
        const action = $(forms[i]).attr('action') || '';
        if (!action || action === 'about:blank') return -1;
        if (getNetloc(action) && getNetloc(action) !== getNetloc(url)) return 0;
      }
      return 1;
    } catch {
      return 1;
    }
  }

  async function infoEmail(url) {
    try {
      const html = await fetchHtml(url);
      return /mailto:|@/.test(html) ? 1 : -1;
    } catch {
      return -1;
    }
  }

  function abnormalUrl(url) {
    const domain = getDomain(url);
    return url.includes(domain) ? 1 : -1;
  }

  async function websiteForwarding(url) {
    try {
      const response = await fetchWithRedirects(url);
      if (response && response.request && response.request._redirectable && response.request._redirectable._redirectCount > 1) return -1;
      return 1;
    } catch {
      return 1;
    }
  }

  async function iframeRedirection(url) {
    try {
      const html = await fetchHtml(url);
      const $ = cheerio.load(html);
      const iframes = $('iframe');
      for (let i = 0; i < iframes.length; i++) {
        if ($(iframes[i]).attr('frameborder') === '0') return -1;
      }
      return 1;
    } catch {
      return 1;
    }
  }

  async function ageOfDomain(url) {
    try {
      const domain = getDomain(url);
      const w = await whois(domain);
      const creation = Array.isArray(w.creationDate) ? w.creationDate[0] : w.creationDate;
      if (creation) {
        const age = differenceInDays(new Date(), new Date(creation));
        return age > 180 ? 1 : -1;
      }
      return -1;
    } catch {
      return -1;
    }
  }

  async function dnsRecording(url) {
    try {
      const domain = getDomain(url);
      await dns.resolve(domain, 'A');
      return 1;
    } catch {
      return -1;
    }
  }

  async function websiteTraffic(url) {
    try {
      const domain = getDomain(url);
      const swUrl = `https://www.similarweb.com/website/${domain}/`;
      const { data } = await axios.get(swUrl, { timeout: 7000 });
      const match = data.match(/"totalVisits":(\d+)/);
      if (match && parseInt(match[1]) > 0) return 1; 
      return 0; 
    } catch {
      return -1; 
    }
  }

  function pageRank() {
    return -1;
  }

  async function googleIndex(url) {
    try {
      const domain = getDomain(url);
      const bingUrl = `https://www.bing.com/search?q=site:${domain}`;
      const { data } = await axios.get(bingUrl, { timeout: 7000 });
      if (data.includes(domain)) return 1;
      return -1;
    } catch {
      return -1;
    }
  }

  async function linksPointingToPage(url) {
    try {
      const domain = getDomain(url);
      const bingUrl = `https://www.bing.com/search?q=linkfromdomain:${domain}`;
      const { data } = await axios.get(bingUrl, { timeout: 7000 });
      const match = data.match(/([\d,]+) results/);
      if (match && parseInt(match[1].replace(/,/g, '')) > 0) return 1;
      return -1;
    } catch {
      return -1;
    }
  }

  async function statsReport(url) {
    try {
      const apiUrl = `https://checkurl.phishtank.com/checkurl/`; 
      const params = new URLSearchParams();
      params.append('url', url);
      params.append('format', 'json');
      const { data } = await axios.post(apiUrl, params, { timeout: 7000 });
      if (data && data.results && data.results.in_database && data.results.valid) return -1; 
      return 1; 
    } catch {
      return 1;
    }
  }

  const jsFeatures = await extractJsFeatures(url);
  const features = [
    hasIp(url),
    longUrl(url),
    shortUrl(url),
    symbolAt(url),
    redirecting(url),
    prefixSuffix(url),
    subdomains(url),
    httpsToken(url),
    await domainRegLen(url),
    await favicon(url),
    nonStdPort(url),
    httpsDomainUrl(url),
    await requestUrl(url),
    await anchorUrl(url),
    await linksInScriptTags(url),
    await serverFormHandler(url),
    await infoEmail(url),
    abnormalUrl(url),
    await websiteForwarding(url),
    jsFeatures.statusBar, 
    jsFeatures.rightClick, 
    jsFeatures.popupWindow, 
    await iframeRedirection(url),
    await ageOfDomain(url),
    await dnsRecording(url),
    await websiteTraffic(url), 
    pageRank(), 
    await googleIndex(url), 
    await linksPointingToPage(url), 
    await statsReport(url) 
  ];
  console.log(`Feature vector for URL: ${url}`);
  console.log(features);
  return features;
}

module.exports = { extractFeaturesFromUrl }; 