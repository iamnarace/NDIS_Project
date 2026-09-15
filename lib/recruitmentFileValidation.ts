export interface FileValidationResult {
  valid: boolean;
  error?: string;
  canonicalMime?: string;
  sanitizedFilename?: string;
}

export function validateCandidateFile(
  file: File | { name: string; size: number; type: string; arrayBuffer: () => Promise<ArrayBuffer> },
  kind: 'resume' | 'cover_letter'
): Promise<FileValidationResult> {
  return (async () => {
    if (!file || !file.name) {
      return { valid: false, error: 'No file provided.' };
    }

    const maxSize = kind === 'resume' ? 8 * 1024 * 1024 : 5 * 1024 * 1024;
    const maxMb = kind === 'resume' ? 8 : 5;

    if (file.size <= 0) {
      return { valid: false, error: `${kind === 'resume' ? 'Resume' : 'Cover letter'} file is empty.` };
    }

    if (file.size > maxSize) {
      return {
        valid: false,
        error: `${kind === 'resume' ? 'Resume' : 'Cover letter'} file exceeds the maximum allowed size of ${maxMb}MB.`
      };
    }

    const name = file.name.trim();
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

    // Inspect signature / magic bytes
    let bytes: Uint8Array;
    try {
      const buffer = await file.arrayBuffer();
      bytes = new Uint8Array(buffer.slice(0, 16));
    } catch {
      return { valid: false, error: 'Failed to read file data for signature verification.' };
    }

    if (bytes.length < 4) {
      return { valid: false, error: 'File data is corrupted or too short.' };
    }

    // Reject Executable / binary formats directly (MZ header 0x4D, 0x5A or ELF 0x7F, 0x45, 0x4C, 0x46)
    if (bytes[0] === 0x4d && bytes[1] === 0x5a) {
      return { valid: false, error: 'Executable binary files (.exe/.dll) are strictly prohibited.' };
    }
    if (bytes[0] === 0x7f && bytes[1] === 0x45 && bytes[2] === 0x4c && bytes[3] === 0x46) {
      return { valid: false, error: 'Executable binary files (ELF) are strictly prohibited.' };
    }

    let canonicalMime = '';

    if (ext === 'pdf') {
      // PDF must start with %PDF- (0x25, 0x50, 0x44, 0x46)
      const isPdf = bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
      if (!isPdf) {
        return { valid: false, error: 'File has a .pdf extension but is not a valid PDF document.' };
      }
      canonicalMime = 'application/pdf';
    } else if (ext === 'doc') {
      // OLE Compound document magic bytes: D0 CF 11 E0 A1 B1 1A E1
      const isDoc =
        bytes[0] === 0xd0 &&
        bytes[1] === 0xcf &&
        bytes[2] === 0x11 &&
        bytes[3] === 0xe0;
      if (!isDoc) {
        return { valid: false, error: 'File has a .doc extension but is not a valid Word compound document.' };
      }
      canonicalMime = 'application/msword';
    } else if (ext === 'docx') {
      // DOCX is a zip archive: PK\x03\x04 (0x50, 0x4B, 0x03, 0x04)
      const isZip = bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04;
      if (!isZip) {
        return { valid: false, error: 'File has a .docx extension but is not a valid Word document package.' };
      }
      canonicalMime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    }

    // Sanitize filename
    const baseName = name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 60);
    const sanitizedFilename = `${baseName || 'document'}.${ext}`;

    return {
      valid: true,
      canonicalMime,
      sanitizedFilename
    };
  })();
}
