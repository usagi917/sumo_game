/**
 * TapTracker - Tap Rate Measurement System
 *
 * Tracks tap events using a 1-second sliding window to measure tap rate (taps/second).
 * Based on TECHNICAL_DESIGN.md specification.
 */

/**
 * TapTracker class
 *
 * Uses sliding window algorithm to track tap rate over the last 1 second.
 * Automatically removes old taps beyond the 1-second window.
 */
export class TapTracker {
  /** Array of tap timestamps (milliseconds since epoch) */
  private tapTimestamps: number[] = [];

  /** Sliding window duration (1 second = 1000ms) */
  private readonly windowDuration = 1000;

  /**
   * Add a tap event to the tracker
   *
   * @param timestamp - Optional timestamp (defaults to Date.now())
   */
  addTap(timestamp?: number): void {
    const now = timestamp ?? Date.now();
    this.tapTimestamps.push(now);

    // Remove taps older than 1 second
    this.cleanup(now);
  }

  /**
   * Get current tap rate (taps per second)
   *
   * Calculates tap rate based on taps within the last 1 second.
   *
   * @returns Tap rate (taps/second)
   */
  getTapRate(): number {
    const now = Date.now();
    this.cleanup(now);

    // Return number of taps in the last 1 second
    return this.tapTimestamps.length;
  }

  /**
   * Reset all tap history
   */
  reset(): void {
    this.tapTimestamps = [];
  }

  /**
   * Remove taps older than the sliding window
   *
   * @param currentTime - Current timestamp (milliseconds)
   * @private
   */
  private cleanup(currentTime: number): void {
    const cutoffTime = currentTime - this.windowDuration;

    // Remove all taps before cutoff time
    this.tapTimestamps = this.tapTimestamps.filter(
      (timestamp) => timestamp > cutoffTime
    );
  }
}
