/**
 * Phone Number Matching Utility
 * Handles various phone number formats to prevent database matching issues
 *
 * This utility was created to solve the phone number format mismatch issue
 * where messages couldn't be matched to leads due to different phone formats.
 */

export interface PhoneMatchResult {
  originalPhone: string;
  normalizedPhone: string;
  possibleMatches: string[];
  confidence: "high" | "medium" | "low";
}

/**
 * Normalizes a phone number to digits only
 */
export function normalizePhone(phone: string): string {
  if (!phone) return "";
  return phone.replace(/[^\d]/g, "");
}

/**
 * Extracts the core 10-digit US phone number
 */
export function getPhoneCore(phone: string): string {
  const normalized = normalizePhone(phone);

  // Handle 11-digit numbers starting with 1 (US country code)
  if (normalized.length === 11 && normalized.startsWith("1")) {
    return normalized.slice(1);
  }

  // Handle the specific case of malformed phone numbers like +1512555001
  // which normalize to 1512555001 (10 digits starting with 1)
  if (normalized.length === 10 && normalized.startsWith("1")) {
    const areaCodePart = normalized.slice(1, 4); // Get potential area code

    // If this looks like a US area code (200-999) and original had country code
    if (
      parseInt(areaCodePart) >= 200 &&
      (phone.includes("+1") || phone.startsWith("1"))
    ) {
      // This is likely a country code + area code + partial number
      // We need to pad it to make a proper 10-digit number
      // But since we only have 9 digits after removing country code, we'll match partially
      return normalized; // Keep the full 10 digits for now
    }
  }

  // For standard 10-digit numbers
  if (normalized.length === 10 && !normalized.startsWith("1")) {
    return normalized;
  }

  // Return last 10 digits for longer numbers
  return normalized.length >= 10 ? normalized.slice(-10) : normalized;
}

/**
 * Generates all possible phone number format variations
 */
export function generatePhoneVariations(phone: string): string[] {
  if (!phone) return [];

  const core = getPhoneCore(phone);
  if (core.length < 10) return [phone]; // Return original if too short

  const areaCode = core.slice(0, 3);
  const exchange = core.slice(3, 6);
  const number = core.slice(6, 10);

  const variations = [
    // Original
    phone,

    // Digits only variations
    core, // 5125550001
    `1${core}`, // 15125550001
    `+1${core}`, // +15125550001

    // Formatted variations
    `${areaCode}${exchange}${number}`, // 5125550001
    `1${areaCode}${exchange}${number}`, // 15125550001
    `+1${areaCode}${exchange}${number}`, // +15125550001

    // With separators
    `+1-${areaCode}-${exchange}-${number}`, // +1-512-555-0001
    `1-${areaCode}-${exchange}-${number}`, // 1-512-555-0001
    `${areaCode}-${exchange}-${number}`, // 512-555-0001

    `+1 ${areaCode} ${exchange} ${number}`, // +1 512 555 0001
    `1 ${areaCode} ${exchange} ${number}`, // 1 512 555 0001
    `${areaCode} ${exchange} ${number}`, // 512 555 0001

    `+1.${areaCode}.${exchange}.${number}`, // +1.512.555.0001
    `${areaCode}.${exchange}.${number}`, // 512.555.0001

    `(${areaCode}) ${exchange}-${number}`, // (512) 555-0001
    `+1 (${areaCode}) ${exchange}-${number}`, // +1 (512) 555-0001
    `1 (${areaCode}) ${exchange}-${number}`, // 1 (512) 555-0001

    // Legacy format support
    `+1${areaCode}${exchange}${number.slice(0, 3)}`, // +1512555001 (shortened)
  ];

  // Remove duplicates and empty strings
  return [...new Set(variations.filter((v) => v && v.length > 0))];
}

/**
 * Matches phone numbers with fuzzy matching
 */
export function matchPhoneNumbers(
  phone1: string,
  phone2: string,
): PhoneMatchResult {
  if (!phone1 || !phone2) {
    return {
      originalPhone: phone1 || phone2,
      normalizedPhone: "",
      possibleMatches: [],
      confidence: "low",
    };
  }

  const core1 = getPhoneCore(phone1);
  const core2 = getPhoneCore(phone2);

  // High confidence: exact core match
  if (core1 === core2 && core1.length >= 10) {
    return {
      originalPhone: phone1,
      normalizedPhone: core1,
      possibleMatches: generatePhoneVariations(phone1),
      confidence: "high",
    };
  }

  // Special case: find longest common substring for fuzzy matching
  // This handles malformed numbers like +1512555001 vs 5125550001
  const normalized1 = normalizePhone(phone1);
  const normalized2 = normalizePhone(phone2);

  // Find longest common substring
  let longestCommon = "";
  for (let i = 0; i < normalized1.length; i++) {
    for (let j = 0; j < normalized2.length; j++) {
      let k = 0;
      while (
        i + k < normalized1.length &&
        j + k < normalized2.length &&
        normalized1[i + k] === normalized2[j + k]
      ) {
        k++;
      }

      if (k > longestCommon.length) {
        longestCommon = normalized1.substring(i, i + k);
      }
    }
  }

  // High confidence if we have 8+ consecutive matching digits OR
  // if the common substring covers most of both numbers
  const minLength = Math.min(normalized1.length, normalized2.length);
  const coverageRatio = longestCommon.length / minLength;

  if (
    longestCommon.length >= 8 ||
    (longestCommon.length >= 7 && coverageRatio >= 0.8)
  ) {
    return {
      originalPhone: phone1,
      normalizedPhone: core1,
      possibleMatches: generatePhoneVariations(phone1),
      confidence: "high",
    };
  }

  // Medium confidence if we have 6-7 consecutive matching digits
  if (longestCommon.length >= 6) {
    return {
      originalPhone: phone1,
      normalizedPhone: core1,
      possibleMatches: generatePhoneVariations(phone1),
      confidence: "medium",
    };
  }

  // Medium confidence: partial match (last 7 digits)
  if (core1.length >= 7 && core2.length >= 7) {
    const suffix1 = core1.slice(-7);
    const suffix2 = core2.slice(-7);

    if (suffix1 === suffix2) {
      return {
        originalPhone: phone1,
        normalizedPhone: core1,
        possibleMatches: generatePhoneVariations(phone1),
        confidence: "medium",
      };
    }
  }

  // Low confidence: no match
  return {
    originalPhone: phone1,
    normalizedPhone: core1,
    possibleMatches: generatePhoneVariations(phone1),
    confidence: "low",
  };
}

/**
 * Creates SQL LIKE patterns for phone number matching
 */
export function createPhoneLikePatterns(phone: string): string[] {
  const variations = generatePhoneVariations(phone);
  const core = getPhoneCore(phone);

  const patterns = [
    ...variations,
    `%${core}%`, // Contains core digits
    `%${core.slice(-7)}%`, // Contains last 7 digits
    `%${core.slice(-4)}%`, // Contains last 4 digits
  ];

  return [...new Set(patterns)];
}

/**
 * Debug utility to analyze phone number matching
 */
export function debugPhoneMatch(leadPhone: string, messagePhone: string): void {
  console.log("============================");
  console.log(`Lead Phone: "${leadPhone}"`);
  console.log(`Message Phone: "${messagePhone}"`);

  const leadCore = getPhoneCore(leadPhone);
  const messageCore = getPhoneCore(messagePhone);

  console.log(`Lead Core: "${leadCore}"`);
  console.log(`Message Core: "${messageCore}"`);

  const matchResult = matchPhoneNumbers(leadPhone, messagePhone);
  console.log(`Match Confidence: ${matchResult.confidence}`);

  console.log("Lead Variations:");
  generatePhoneVariations(leadPhone).forEach((v, i) => {
    console.log(`  ${i + 1}. "${v}"`);
  });

  console.log("Message Variations:");
  generatePhoneVariations(messagePhone).forEach((v, i) => {
    console.log(`  ${i + 1}. "${v}"`);
  });

  console.log("SQL LIKE Patterns:");
  createPhoneLikePatterns(leadPhone).forEach((p, i) => {
    console.log(`  ${i + 1}. LIKE "${p}"`);
  });
}

/**
 * Test function to validate phone matching works
 */
export function testPhoneMatching(): boolean {
  const testCases = [
    ["+1512555001", "5125550001"],
    ["+1-512-555-0001", "15125550001"],
    ["(512) 555-0001", "+1512555001"],
    ["512.555.0001", "1 512 555 0001"],
  ];

  console.log("TEST Testing Phone Number Matching");
  console.log("================================");

  let allPassed = true;

  testCases.forEach(([phone1, phone2], index) => {
    const result = matchPhoneNumbers(phone1, phone2);
    const passed =
      result.confidence === "high" || result.confidence === "medium";

    console.log(`  "${phone1}" vs "${phone2}"`);
    console.log(`  Confidence: ${result.confidence}`);

    if (!passed) allPassed = false;
  });

  return allPassed;
}

// Export default object for easy importing
export default {
  normalizePhone,
  getPhoneCore,
  generatePhoneVariations,
  matchPhoneNumbers,
  createPhoneLikePatterns,
  debugPhoneMatch,
  testPhoneMatching,
};
