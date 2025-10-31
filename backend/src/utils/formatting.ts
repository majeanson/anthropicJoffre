/**
 * Formatting Utilities
 * Sprint 3 Phase 4: Extracted from index.ts
 *
 * Provides string formatting functions for displaying:
 * - Bytes in human-readable format (KB, MB, GB)
 * - Uptime in human-readable format (days, hours, minutes, seconds)
 */

/**
 * Format bytes to human-readable string
 * Used for displaying memory usage, file sizes, etc.
 *
 * @param bytes - Number of bytes
 * @returns Formatted string (e.g., "1.5 MB", "512 KB")
 *
 * @example
 * formatBytes(1024) // "1.0 KB"
 * formatBytes(1536) // "1.5 KB"
 * formatBytes(1048576) // "1.0 MB"
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

/**
 * Format uptime seconds to human-readable string
 * Used for displaying server uptime in health checks
 *
 * @param seconds - Number of seconds
 * @returns Formatted string (e.g., "2d 4h 30m", "1h 15m 30s")
 *
 * @example
 * formatUptime(3661) // "1h 1m 1s"
 * formatUptime(90) // "1m 30s"
 * formatUptime(172800) // "2d 0h 0m"
 */
export function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(' ');
}
