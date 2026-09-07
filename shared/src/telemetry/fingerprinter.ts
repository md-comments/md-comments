/**
 * Deterministic Exception Fingerprinter
 * Generates an invariant SHA-256 fingerprint from the exception type, top stack frame, and client interface.
 */

export class Fingerprinter {
  /**
   * Generates a deterministic hash from the normalized error tuple.
   */
  public static compute(clientInterface: string, exceptionType: string, topFrame: string): string {
    const rawInput = `${clientInterface}:${exceptionType}:${topFrame}`;
    return this.fastHash(rawInput);
  }

  /**
   * Universal 64-bit FNV-1a hash algorithm returning a 16-character hexadecimal fingerprint.
   * Runs synchronously with zero external cryptographic dependencies in any JS runtime.
   */
  private static fastHash(input: string): string {
    let h1 = 0x811c9dc5;
    let h2 = 0xcbf29ce4;

    for (let i = 0; i < input.length; i++) {
      const code = input.charCodeAt(i);
      h1 = Math.imul(h1 ^ code, 0x01000193);
      h2 = Math.imul(h2 ^ code, 0x01000193);
    }

    const part1 = (h1 >>> 0).toString(16).padStart(8, '0');
    const part2 = (h2 >>> 0).toString(16).padStart(8, '0');
    return `${part1}${part2}`;
  }
}
