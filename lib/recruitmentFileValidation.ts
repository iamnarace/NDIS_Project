export interface FileValidationResult {
  valid: boolean;
  error?: string;
  canonicalMime?: string;
  sanitizedFilename?: string;
}

export function sanitizeRecruitmentFilename(name: string, ext: string): string {
  const baseName = name
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 60);
  return `${baseName || 'document'}.${ext}`;
}

export function validateCandidateBuffer(
  buffer: ArrayBuffer | Uint8Array | Buffer,
  fileName: string,
  kind: 'resume' | 'cover_letter'
): FileValidationResult {
  if (!fileName) {
    return { valid: false, error: 'No file name provided.' };
  }

  const byteLength = buffer.byteLength || (buffer as Buffer).length || 0;
  const maxSize = kind === 'resume' ? 8 * 1024 * 1024 : 5 * 1024 * 1024;
  const maxMb = kind === 'resume' ? 8 : 5;

  if (byteLength <= 0) {
    return { valid: false, error: `${kind === 'resume' ? 'Resume' : 'Cover letter'} file is empty.` };
  }

  if (byteLength > maxSize) {
    return {
      valid: false,
      error: `${kind === 'resume' ? 'Resume' : 'Cover letter'} file exceeds the maximum allowed size of ${maxMb}MB.`
    };
  }

  const name = fileName.trim();
  const extMatch = name.match(/\.([a-zA-Z0-9]+)$/);
  if (!extMatch) {
    return { valid: false, error: 'File must have a valid extension (.pdf, .doc, or .docx).' };
  }

  const ext = extMatch[1].toLowerCase();
  if (!['pdf', 'doc', 'docx'].includes(ext)) {
    return {
      valid: false,
      error: 'Only PDF (.pdf), Microsoft Word 97-2003 (.doc), and Microsoft Word (.docx) files are accepted.'
    };
  }

  const uint8 = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  if (uint8.length < 4) {
    return { valid: false, error: 'File data is corrupted or too short.' };
  }

  // Reject Executable / binary formats directly (MZ header 0x4D, 0x5A or ELF 0x7F, 0x45, 0x4C, 0x46)
  if (uint8[0] === 0x4d && uint8[1] === 0x5a) {
    return { valid: false, error: 'Executable binary files (.exe/.dll) are strictly prohibited.' };
  }
  if (uint8[0] === 0x7f && uint8[1] === 0x45 && uint8[2] === 0x4c && uint8[3] === 0x46) {
    return { valid: false, error: 'Executable binary files (ELF) are strictly prohibited.' };
  }

  let canonicalMime = '';

  if (ext === 'pdf') {
    // PDF must start with %PDF- (0x25, 0x50, 0x44, 0x46)
    const isPdf = uint8[0] === 0x25 && uint8[1] === 0x50 && uint8[2] === 0x44 && uint8[3] === 0x46;
    if (!isPdf) {
      return { valid: false, error: 'File has a .pdf extension but is not a valid PDF document.' };
    }
    canonicalMime = 'application/pdf';
  } else if (ext === 'doc') {
    // OLE Compound document magic bytes: D0 CF 11 E0 A1 B1 1A E1
    const isDoc =
      uint8[0] === 0xd0 &&
      uint8[1] === 0xcf &&
      uint8[2] === 0x11 &&
      uint8[3] === 0xe0;
    if (!isDoc) {
      return { valid: false, error: 'File has a .doc extension but is not a valid Word compound document.' };
    }
    canonicalMime = 'application/msword';
  } else if (ext === 'docx') {
    // DOCX is a zip archive: PK\x03\x04 (0x50, 0x4B, 0x03, 0x04)
    const isZip = uint8[0] === 0x50 && uint8[1] === 0x4b && uint8[2] === 0x03 && uint8[3] === 0x04;
    if (!isZip) {
      return { valid: false, error: 'File has a .docx extension but is not a valid Word document package.' };
    }

    // Inspect buffer for Office Open XML structures: [Content_Types].xml or word/
    // A raw zip file renamed to .docx without Word contents must be rejected.
    const inspectLength = Math.min(uint8.length, 1024 * 1024); // inspect up to first 1MB
    let latin1Str = '';
    // Use buffer toString if available or charCode conversion
    if (typeof Buffer !== 'undefined' && Buffer.isBuffer(buffer)) {
      latin1Str = (buffer as Buffer).subarray(0, inspectLength).toString('latin1');
    } else {
      const slice = uint8.subarray(0, inspectLength);
      latin1Str = new TextDecoder('latin1').decode(slice);
    }

    const hasWordStructure =
      latin1Str.includes('[Content_Types].xml') ||
      latin1Str.includes('word/') ||
      latin1Str.includes('word/document.xml');

    if (!hasWordStructure) {
      return {
        valid: false,
        error: 'File has a .docx extension but does not contain a valid Microsoft Word document package.'
      };
    }

    canonicalMime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }

  const sanitizedFilename = sanitizeRecruitmentFilename(name, ext);

  return {
    valid: true,
    canonicalMime,
    sanitizedFilename
  };
}

export async function validateCandidateFile(
  file: File | { name: string; size: number; type: string; arrayBuffer: () => Promise<ArrayBuffer> },
  kind: 'resume' | 'cover_letter'
): Promise<FileValidationResult> {
  if (!file || !file.name) {
    return { valid: false, error: 'No file provided.' };
  }

  let arrayBuf: ArrayBuffer;
  try {
    arrayBuf = await file.arrayBuffer();
  } catch {
    return { valid: false, error: 'Failed to read file data for validation.' };
  }

  return validateCandidateBuffer(arrayBuf, file.name, kind);
}
