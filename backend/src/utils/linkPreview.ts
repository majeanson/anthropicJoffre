/**
 * Link Preview Utility
 *
 * Fetches Open Graph metadata from URLs for rich link previews.
 * Includes caching, timeout handling, and SSRF protection.
 */

import https from 'https';
import http from 'http';
import dns from 'dns';
import { URL } from 'url';
import { promisify } from 'util';
import logger from './logger.js';

const dnsLookup = promisify(dns.lookup);

export interface LinkPreview {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  favicon?: string;
}

// Simple in-memory cache for link previews (5 minute TTL)
const previewCache = new Map<string, { preview: LinkPreview; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// URL regex pattern
const URL_PATTERN = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;

// Blocked hostnames to prevent SSRF attacks
const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  '[::1]',
]);

/**
 * Check if an IP address is private/internal (SSRF protection)
 */
function isPrivateIP(ip: string): boolean {
  // IPv4 private ranges
  // 10.0.0.0 - 10.255.255.255
  // 172.16.0.0 - 172.31.255.255
  // 192.168.0.0 - 192.168.255.255
  // 127.0.0.0 - 127.255.255.255 (loopback)
  // 169.254.0.0 - 169.254.255.255 (link-local)
  // 0.0.0.0 - 0.255.255.255
  const parts = ip.split('.').map(Number);
  if (parts.length === 4 && parts.every(p => p >= 0 && p <= 255)) {
    const [a, b] = parts;
    if (a === 10) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 0) return true;
  }

  // IPv6 private ranges (loopback and link-local)
  const ipLower = ip.toLowerCase();
  if (ipLower === '::1' || ipLower.startsWith('fe80:') || ipLower.startsWith('fc') || ipLower.startsWith('fd')) {
    return true;
  }

  return false;
}

/**
 * Validate URL is safe to fetch (SSRF protection)
 */
async function isUrlSafe(urlString: string): Promise<boolean> {
  try {
    const parsedUrl = new URL(urlString);
    const hostname = parsedUrl.hostname.toLowerCase();

    // Block known dangerous hostnames
    if (BLOCKED_HOSTNAMES.has(hostname)) {
      return false;
    }

    // Resolve hostname to IP and check if it's private
    try {
      const { address } = await dnsLookup(hostname);
      if (isPrivateIP(address)) {
        logger.debug(`Blocked private IP ${address} for hostname ${hostname}`);
        return false;
      }
    } catch {
      // DNS resolution failed - could be an IP literal
      if (isPrivateIP(hostname)) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Extract URLs from text
 */
export function extractUrls(text: string): string[] {
  const matches = text.match(URL_PATTERN);
  return matches ? [...new Set(matches)] : []; // Remove duplicates
}

// Maximum number of redirects to follow
const MAX_REDIRECTS = 5;

/**
 * Fetch HTML content from a URL with timeout and SSRF protection
 */
async function fetchHtml(urlString: string, timeout = 5000, redirectCount = 0): Promise<string> {
  // Prevent infinite redirect loops
  if (redirectCount >= MAX_REDIRECTS) {
    throw new Error('Too many redirects');
  }

  // SSRF protection: validate URL before fetching
  const isSafe = await isUrlSafe(urlString);
  if (!isSafe) {
    throw new Error('URL blocked for security reasons');
  }

  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(urlString);
    const protocol = parsedUrl.protocol === 'https:' ? https : http;

    const req = protocol.get(
      urlString,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; JaffreBot/1.0; +https://jaffre.game)',
          Accept: 'text/html,application/xhtml+xml',
        },
        timeout,
      },
      (res) => {
        // Handle redirects with SSRF protection
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          // Resolve relative redirects
          let redirectUrl = res.headers.location;
          if (!redirectUrl.startsWith('http')) {
            redirectUrl = new URL(redirectUrl, urlString).toString();
          }
          fetchHtml(redirectUrl, timeout, redirectCount + 1)
            .then(resolve)
            .catch(reject);
          return;
        }

        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }

        let data = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          data += chunk;
          // Limit to first 50KB to avoid memory issues
          if (data.length > 50000) {
            req.destroy();
            resolve(data);
          }
        });
        res.on('end', () => resolve(data));
        res.on('error', reject);
      }
    );

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });
  });
}

/**
 * Parse Open Graph and meta tags from HTML
 */
function parseMetaTags(html: string, url: string): LinkPreview {
  const preview: LinkPreview = { url };

  // Helper to extract content from meta tags
  const getMeta = (property: string): string | undefined => {
    // Try og:property first
    const ogMatch = html.match(
      new RegExp(`<meta[^>]+(?:property|name)=["']og:${property}["'][^>]+content=["']([^"']+)["']`, 'i')
    );
    if (ogMatch) return ogMatch[1];

    // Try reversed attribute order
    const ogMatchReverse = html.match(
      new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']og:${property}["']`, 'i')
    );
    if (ogMatchReverse) return ogMatchReverse[1];

    // Try twitter:property
    const twitterMatch = html.match(
      new RegExp(`<meta[^>]+(?:property|name)=["']twitter:${property}["'][^>]+content=["']([^"']+)["']`, 'i')
    );
    if (twitterMatch) return twitterMatch[1];

    return undefined;
  };

  // Extract Open Graph tags
  preview.title = getMeta('title');
  preview.description = getMeta('description');
  preview.image = getMeta('image');
  preview.siteName = getMeta('site_name');

  // Fallback to standard meta tags and title
  if (!preview.title) {
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
      preview.title = titleMatch[1].trim();
    }
  }

  if (!preview.description) {
    const descMatch = html.match(
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i
    );
    if (descMatch) {
      preview.description = descMatch[1];
    }
  }

  // Try to get favicon
  const faviconMatch = html.match(
    /<link[^>]+rel=["'](?:shortcut )?icon["'][^>]+href=["']([^"']+)["']/i
  );
  if (faviconMatch) {
    let favicon = faviconMatch[1];
    // Make absolute URL if relative
    if (favicon.startsWith('/')) {
      const parsedUrl = new URL(url);
      favicon = `${parsedUrl.protocol}//${parsedUrl.host}${favicon}`;
    } else if (!favicon.startsWith('http')) {
      const parsedUrl = new URL(url);
      favicon = `${parsedUrl.protocol}//${parsedUrl.host}/${favicon}`;
    }
    preview.favicon = favicon;
  }

  // Make image URL absolute if relative
  if (preview.image && !preview.image.startsWith('http')) {
    const parsedUrl = new URL(url);
    if (preview.image.startsWith('/')) {
      preview.image = `${parsedUrl.protocol}//${parsedUrl.host}${preview.image}`;
    } else {
      preview.image = `${parsedUrl.protocol}//${parsedUrl.host}/${preview.image}`;
    }
  }

  // Decode HTML entities
  if (preview.title) {
    preview.title = decodeHtmlEntities(preview.title).slice(0, 200);
  }
  if (preview.description) {
    preview.description = decodeHtmlEntities(preview.description).slice(0, 300);
  }

  return preview;
}

/**
 * Decode common HTML entities
 */
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&nbsp;/g, ' ');
}

/**
 * Fetch link preview for a URL
 */
export async function fetchLinkPreview(url: string): Promise<LinkPreview | null> {
  try {
    // Validate URL
    const parsedUrl = new URL(url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return null;
    }

    // Check cache
    const cached = previewCache.get(url);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.preview;
    }

    // Fetch and parse
    const html = await fetchHtml(url);
    const preview = parseMetaTags(html, url);

    // Only cache if we got meaningful data
    if (preview.title || preview.description) {
      previewCache.set(url, { preview, timestamp: Date.now() });
    }

    return preview;
  } catch (error) {
    logger.debug(`Failed to fetch link preview for ${url}: ${error}`);
    return { url }; // Return minimal preview with just the URL
  }
}

/**
 * Clean up expired cache entries (call periodically)
 */
export function cleanupPreviewCache(): void {
  const now = Date.now();
  for (const [url, entry] of previewCache.entries()) {
    if (now - entry.timestamp > CACHE_TTL) {
      previewCache.delete(url);
    }
  }
}

// Clean up cache every 10 minutes
setInterval(cleanupPreviewCache, 10 * 60 * 1000);
