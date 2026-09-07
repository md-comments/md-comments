/**
 * Universal PII, Secret and Customer Data Sanitizer (INV-ZERO-CUSTOMER-DATA, INV-ZERO-PII-LEAK)
 * Enforces strict technical-only scrubbing before any telemetry leaves the client.
 */

// Patterns matching secrets, tokens, credentials
const TOKEN_PATTERNS = [
  /gh[pousr]_[A-Za-z0-9_]+/g, // GitHub tokens
  /glc_[A-Za-z0-9_=-]+/g, // Grafana Cloud tokens
  /Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi, // Bearer headers
  /ey[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g, // JWTs
  /\b[0-9a-fA-F]{40}\b/g, // 40-character hex tokens/SHAs
  /secret[_\s:=]+['"]?[A-Za-z0-9+/=_-]{8,}['"]?/gi,
];

// Patterns matching email addresses
const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

// Patterns matching local filesystem paths
const LOCAL_PATH_PATTERNS = [
  /\/Users\/[^/\s]+/g, // macOS home directory
  /\/home\/[^/\s]+/g, // Linux home directory
  /[A-Za-z]:\\[Uu]sers\\[^\\]+/g, // Windows home directory
];

// Pattern matching URL query strings
const QUERY_PARAM_PATTERN = /\?[^#\s]*/g;

export class UniversalSanitizer {
  /**
   * Sanitizes a text string by scrubbing all tokens, emails, paths, and query params.
   */
  public static sanitizeString(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    let sanitized = input;

    // 1. Scrub Secrets & Tokens
    for (const pattern of TOKEN_PATTERNS) {
      sanitized = sanitized.replace(pattern, '[REDACTED_SECRET]');
    }

    // 2. Scrub Emails
    sanitized = sanitized.replace(EMAIL_PATTERN, '[REDACTED_EMAIL]');

    // 3. Scrub Local Paths
    for (const pattern of LOCAL_PATH_PATTERNS) {
      sanitized = sanitized.replace(pattern, '~');
    }

    // 4. Scrub URL Query Parameters
    sanitized = sanitized.replace(QUERY_PARAM_PATTERN, '?query=[REDACTED]');

    // 5. Truncate arbitrary lengthy strings (defense against leaking markdown documents)
    if (sanitized.length > 500) {
      sanitized = sanitized.slice(0, 500) + '... [TRUNCATED]';
    }

    return sanitized;
  }

  /**
   * Cleans an error message, removing any embedded markdown or raw customer text.
   */
  public static sanitizeErrorMessage(message: string): string {
    const cleaned = this.sanitizeString(message);
    // Disallow multiline user markdown payloads in exception messages
    return cleaned.split('\n')[0].trim();
  }
}
