/**
 * Arabic Reshaper & BiDi Processing Utility for PDF Generation
 * Handles:
 * 1. Full Arabic letter contextual shaping (Isolated, Initial, Medial, Final)
 * 2. Lam-Alif ligatures (لا, لأ, لإ, لآ)
 * 3. Diacritics (Tashkeel) removal/handling
 * 4. BiDi segment reordering with preservation of LTR numbers, dates, IDs, and English words
 * 5. Parentheses & brackets mirroring in RTL
 * 6. Deep recursive AST traversal for pdfmake document definitions
 */

type JoiningType = 'D' | 'R' | 'U'; // D: Dual, R: Right-only, U: Non-joining

interface ArabicCharDef {
  code: number;
  joining: JoiningType;
  isolated: number;
  final: number;
  initial: number;
  medial: number;
}

// Arabic Unicode mappings to Presentation Forms-B
const ARABIC_GLYPHS: Record<number, ArabicCharDef> = {
  // Hamza & Alef variants
  0x0621: { code: 0x0621, joining: 'U', isolated: 0xFE80, final: 0xFE80, initial: 0xFE80, medial: 0xFE80 }, // ء
  0x0622: { code: 0x0622, joining: 'R', isolated: 0xFE81, final: 0xFE82, initial: 0xFE81, medial: 0xFE82 }, // آ
  0x0623: { code: 0x0623, joining: 'R', isolated: 0xFE83, final: 0xFE84, initial: 0xFE83, medial: 0xFE84 }, // أ
  0x0624: { code: 0x0624, joining: 'R', isolated: 0xFE85, final: 0xFE86, initial: 0xFE85, medial: 0xFE86 }, // ؤ
  0x0625: { code: 0x0625, joining: 'R', isolated: 0xFE87, final: 0xFE88, initial: 0xFE87, medial: 0xFE88 }, // إ
  0x0626: { code: 0x0626, joining: 'D', isolated: 0xFE89, final: 0xFE8A, initial: 0xFE8B, medial: 0xFE8C }, // ئ
  0x0627: { code: 0x0627, joining: 'R', isolated: 0xFE8D, final: 0xFE8E, initial: 0xFE8D, medial: 0xFE8E }, // ا

  // Main Alphabet
  0x0628: { code: 0x0628, joining: 'D', isolated: 0xFE8F, final: 0xFE90, initial: 0xFE91, medial: 0xFE92 }, // ب
  0x0629: { code: 0x0629, joining: 'R', isolated: 0xFE93, final: 0xFE94, initial: 0xFE93, medial: 0xFE94 }, // ة
  0x062A: { code: 0x062A, joining: 'D', isolated: 0xFE95, final: 0xFE96, initial: 0xFE97, medial: 0xFE98 }, // ت
  0x062B: { code: 0x062B, joining: 'D', isolated: 0xFE99, final: 0xFE9A, initial: 0xFE9B, medial: 0xFE9C }, // ث
  0x062C: { code: 0x062C, joining: 'D', isolated: 0xFE9D, final: 0xFE9E, initial: 0xFE9F, medial: 0xFEA0 }, // ج
  0x062D: { code: 0x062D, joining: 'D', isolated: 0xFEA1, final: 0xFEA2, initial: 0xFEA3, medial: 0xFEA4 }, // ح
  0x062E: { code: 0x062E, joining: 'D', isolated: 0xFEA5, final: 0xFEA6, initial: 0xFEA7, medial: 0xFEA8 }, // خ
  0x062F: { code: 0x062F, joining: 'R', isolated: 0xFEA9, final: 0xFEAA, initial: 0xFEA9, medial: 0xFEAA }, // د
  0x0630: { code: 0x0630, joining: 'R', isolated: 0xFEAB, final: 0xFEAC, initial: 0xFEAB, medial: 0xFEAC }, // ذ
  0x0631: { code: 0x0631, joining: 'R', isolated: 0xFEAD, final: 0xFEAE, initial: 0xFEAD, medial: 0xFEAE }, // ر
  0x0632: { code: 0x0632, joining: 'R', isolated: 0xFEAF, final: 0xFEB0, initial: 0xFEAF, medial: 0xFEB0 }, // ز
  0x0633: { code: 0x0633, joining: 'D', isolated: 0xFEB1, final: 0xFEB2, initial: 0xFEB3, medial: 0xFEB4 }, // س
  0x0634: { code: 0x0634, joining: 'D', isolated: 0xFEB5, final: 0xFEB6, initial: 0xFEB7, medial: 0xFEB8 }, // ش
  0x0635: { code: 0x0635, joining: 'D', isolated: 0xFEB9, final: 0xFEBA, initial: 0xFEBB, medial: 0xFEBC }, // ص
  0x0636: { code: 0x0636, joining: 'D', isolated: 0xFEBD, final: 0xFEBE, initial: 0xFEBF, medial: 0xFEC0 }, // ض
  0x0637: { code: 0x0637, joining: 'D', isolated: 0xFEC1, final: 0xFEC2, initial: 0xFEC3, medial: 0xFEC4 }, // ط
  0x0638: { code: 0x0638, joining: 'D', isolated: 0xFEC5, final: 0xFEC6, initial: 0xFEC7, medial: 0xFEC8 }, // ظ
  0x0639: { code: 0x0639, joining: 'D', isolated: 0xFEC9, final: 0xFECA, initial: 0xFECB, medial: 0xFECC }, // ع
  0x063A: { code: 0x063A, joining: 'D', isolated: 0xFECD, final: 0xFECE, initial: 0xFECF, medial: 0xFED0 }, // غ
  0x0641: { code: 0x0641, joining: 'D', isolated: 0xFED1, final: 0xFED2, initial: 0xFED3, medial: 0xFED4 }, // ف
  0x0642: { code: 0x0642, joining: 'D', isolated: 0xFED5, final: 0xFED6, initial: 0xFED7, medial: 0xFED8 }, // ق
  0x0643: { code: 0x0643, joining: 'D', isolated: 0xFED9, final: 0xFEDA, initial: 0xFEDB, medial: 0xFEDC }, // ك
  0x0644: { code: 0x0644, joining: 'D', isolated: 0xFEDD, final: 0xFEDE, initial: 0xFEDF, medial: 0xFEE0 }, // ل
  0x0645: { code: 0x0645, joining: 'D', isolated: 0xFEE1, final: 0xFEE2, initial: 0xFEE3, medial: 0xFEE4 }, // م
  0x0646: { code: 0x0646, joining: 'D', isolated: 0xFEE5, final: 0xFEE6, initial: 0xFEE7, medial: 0xFEE8 }, // ن
  0x0647: { code: 0x0647, joining: 'D', isolated: 0xFEE9, final: 0xFEEA, initial: 0xFEEB, medial: 0xFEEC }, // ه
  0x0648: { code: 0x0648, joining: 'R', isolated: 0xFEED, final: 0xFEEE, initial: 0xFEED, medial: 0xFEEE }, // و
  0x0649: { code: 0x0649, joining: 'R', isolated: 0xFEEF, final: 0xFEF0, initial: 0xFEEF, medial: 0xFEF0 }, // ى
  0x064A: { code: 0x064A, joining: 'D', isolated: 0xFEF1, final: 0xFEF2, initial: 0xFEF3, medial: 0xFEF4 }, // ي
  0x0640: { code: 0x0640, joining: 'D', isolated: 0x0640, final: 0x0640, initial: 0x0640, medial: 0x0640 }  // ـ (Tatweel)
};

// Check Tashkeel / Harakat
const isTashkeel = (code: number): boolean => {
  return (code >= 0x064B && code <= 0x065F) || code === 0x0670;
};

// Check if character is Arabic
export const isArabicChar = (code: number): boolean => {
  return (
    (code >= 0x0600 && code <= 0x06FF) ||
    (code >= 0x0750 && code <= 0x077F) ||
    (code >= 0x08A0 && code <= 0x08FF) ||
    (code >= 0xFB50 && code <= 0xFDFF) ||
    (code >= 0xFE70 && code <= 0xFEFC)
  );
};

// Check if string contains any Arabic characters
export const hasArabic = (text: string): boolean => {
  if (!text) return false;
  for (let i = 0; i < text.length; i++) {
    if (isArabicChar(text.charCodeAt(i))) return true;
  }
  return false;
};

// Ligature check for Lam + Alef
const getLamAlefLigature = (alefCode: number, isFinal: boolean): number | null => {
  switch (alefCode) {
    case 0x0622: // Madda
      return isFinal ? 0xFEF6 : 0xFEF5;
    case 0x0623: // Hamza Above
      return isFinal ? 0xFEF8 : 0xFEF7;
    case 0x0625: // Hamza Below
      return isFinal ? 0xFEFA : 0xFEF9;
    case 0x0627: // Plain Alef
      return isFinal ? 0xFEFC : 0xFEFB;
    default:
      return null;
  }
};

/**
 * Reshapes Arabic text to connected glyphs based on cursive typography rules.
 */
export const reshapeArabicText = (text: string): string => {
  if (!text) return text;

  // Strip diacritics
  const chars: number[] = [];
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (!isTashkeel(code)) {
      chars.push(code);
    }
  }

  const result: number[] = [];
  const len = chars.length;

  for (let i = 0; i < len; i++) {
    const code = chars[i];
    const charDef = ARABIC_GLYPHS[code];

    if (!charDef) {
      result.push(code);
      continue;
    }

    // Check preceding character connection to right
    let prevConnects = false;
    if (i > 0) {
      const prevCode = chars[i - 1];
      const prevDef = ARABIC_GLYPHS[prevCode];
      if (prevDef && prevDef.joining === 'D') {
        prevConnects = true;
      }
    }

    // Check succeeding character connection to left
    let nextConnects = false;
    if (i < len - 1 && charDef.joining === 'D') {
      const nextCode = chars[i + 1];
      const nextDef = ARABIC_GLYPHS[nextCode];
      if (nextDef && (nextDef.joining === 'D' || nextDef.joining === 'R')) {
        nextConnects = true;
      }
    }

    // Check for Lam + Alef Ligature
    if (code === 0x0644 && i < len - 1) { // Lam
      const nextCode = chars[i + 1];
      const lig = getLamAlefLigature(nextCode, prevConnects);
      if (lig !== null) {
        result.push(lig);
        i++; // skip next alef
        continue;
      }
    }

    // Determine contextual form
    if (prevConnects && nextConnects) {
      result.push(charDef.medial);
    } else if (prevConnects) {
      result.push(charDef.final);
    } else if (nextConnects) {
      result.push(charDef.initial);
    } else {
      result.push(charDef.isolated);
    }
  }

  return String.fromCharCode(...result);
};

// Mirror brackets and punctuation for RTL visual layout
const mirrorPunctuation = (ch: string): string => {
  switch (ch) {
    case '(': return ')';
    case ')': return '(';
    case '[': return ']';
    case ']': return '[';
    case '{': return '}';
    case '}': return '{';
    case '<': return '>';
    case '>': return '<';
    case '«': return '»';
    case '»': return '«';
    default: return ch;
  }
};

/**
 * BiDi Layout Engine:
 * Converts mixed Arabic/English/Numbers strings into visually ordered strings for PDF engines.
 */
export const fixArabicPdfText = (rawText: any): string => {
  if (rawText === null || rawText === undefined) return '';
  const text = String(rawText);
  if (!text || text.trim() === '') return text;

  // If there's no Arabic character in the string, return as is
  if (!hasArabic(text)) {
    return text;
  }

  // Handle multi-line strings line-by-line
  if (text.includes('\n')) {
    return text
      .split('\n')
      .map((line) => fixArabicPdfText(line))
      .join('\n');
  }

  // Segment text into tokens: Arabic, LTR (Latin/Numbers/Dates/IDs), and Neutral symbols/spaces
  const tokens: { type: 'ARABIC' | 'LTR' | 'NEUTRAL'; text: string }[] = [];
  
  let currType: 'ARABIC' | 'LTR' | 'NEUTRAL' | null = null;
  let currBuffer = '';

  const flush = () => {
    if (currBuffer.length > 0 && currType) {
      tokens.push({ type: currType, text: currBuffer });
      currBuffer = '';
      currType = null;
    }
  };

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const code = ch.charCodeAt(0);

    let type: 'ARABIC' | 'LTR' | 'NEUTRAL';
    if (isArabicChar(code)) {
      type = 'ARABIC';
    } else if (/[a-zA-Z0-9_\-\.\:\/\#\+\@]/.test(ch)) {
      type = 'LTR';
    } else {
      type = 'NEUTRAL';
    }

    if (currType === null) {
      currType = type;
      currBuffer = ch;
    } else if (currType === type) {
      currBuffer += ch;
    } else {
      flush();
      currType = type;
      currBuffer = ch;
    }
  }
  flush();

  // Process tokens
  const processedTokens = tokens.map((token) => {
    if (token.type === 'ARABIC') {
      const reshaped = reshapeArabicText(token.text);
      return Array.from(reshaped).reverse().join('');
    } else if (token.type === 'NEUTRAL') {
      return Array.from(token.text).map(mirrorPunctuation).reverse().join('');
    } else {
      // LTR token: retain inner order (numbers, Latin words, dates)
      return token.text;
    }
  });

  // In RTL context, reverse the outer sequence of tokens
  return processedTokens.reverse().join('');
};

/**
 * Deep recursive AST processor for pdfmake document definitions.
 */
export const processPdfMakeContent = (node: any): any => {
  if (node === null || node === undefined) return node;

  if (typeof node === 'string') {
    return fixArabicPdfText(node);
  }

  if (typeof node === 'number' || typeof node === 'boolean') {
    return node;
  }

  if (Array.isArray(node)) {
    return node.map((item) => processPdfMakeContent(item));
  }

  if (typeof node === 'object') {
    const newNode: Record<string, any> = {};
    for (const key of Object.keys(node)) {
      if (key === 'text' && typeof node[key] === 'string') {
        newNode[key] = fixArabicPdfText(node[key]);
      } else if (key === 'text' && Array.isArray(node[key])) {
        newNode[key] = node[key].map((sub: any) => processPdfMakeContent(sub));
      } else if (key === 'table' && node[key] && Array.isArray(node[key].body)) {
        newNode[key] = {
          ...node[key],
          body: node[key].body.map((row: any[]) =>
            row.map((cell: any) => processPdfMakeContent(cell))
          )
        };
      } else if (key === 'columns' && Array.isArray(node[key])) {
        newNode[key] = node[key].map((col: any) => processPdfMakeContent(col));
      } else if (key === 'content') {
        newNode[key] = processPdfMakeContent(node[key]);
      } else {
        newNode[key] = node[key];
      }
    }
    return newNode;
  }

  return node;
};
