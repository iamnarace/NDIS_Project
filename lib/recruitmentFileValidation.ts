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

/**
 * Robust, dependency-free ZIP Central Directory parser.
 * Extracts all file entry names from a genuine ZIP package.
 */
export function extractZipEntryNames(buffer: Uint8Array | Buffer): string[] | null {
  const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  if (buf.length < 4) return null;

  // Search for End of Central Directory (EOCD) signature: 0x50, 0x4B, 0x05, 0x06 from the end
  let eocdOffset = -1;
  const maxSearch = Math.min(buf.length - 22, 65535 + 22);
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - maxSearch); i--) {
    if (
      buf[i] === 0x50 &&
      buf[i + 1] === 0x4b &&
      buf[i + 2] === 0x05 &&
      buf[i + 3] === 0x06
    ) {
      eocdOffset = i;
      break;
    }
  }

  if (eocdOffset !== -1 && eocdOffset + 22 <= buf.length) {
    const numEntries = buf.readUInt16LE(eocdOffset + 10);
    const cdSize = buf.readUInt32LE(eocdOffset + 12);
    const cdOffset = buf.readUInt32LE(eocdOffset + 16);

    if (cdOffset + cdSize <= buf.length) {
      const entries: string[] = [];
      let currentOffset = cdOffset;

      for (let i = 0; i < numEntries && currentOffset + 46 <= buf.length; i++) {
        if (
          buf[currentOffset] !== 0x50 ||
          buf[currentOffset + 1] !== 0x4b ||
          buf[currentOffset + 2] !== 0x01 ||
          buf[currentOffset + 3] !== 0x02
        ) {
          break;
        }

        const nameLen = buf.readUInt16LE(currentOffset + 28);
        const extraLen = buf.readUInt16LE(currentOffset + 30);
        const commentLen = buf.readUInt16LE(currentOffset + 32);

        if (currentOffset + 46 + nameLen > buf.length) break;

        const entryName = buf.toString('utf8', currentOffset + 46, currentOffset + 46 + nameLen);
        entries.push(entryName);

        currentOffset += 46 + nameLen + extraLen + commentLen;
      }

      if (entries.length > 0) return entries;
    }
  }

  // Scan local file headers
  const localEntries: string[] = [];
  let offset = 0;
  while (offset + 30 <= buf.length) {
    if (
      buf[offset] === 0x50 &&
      buf[offset + 1] === 0x4b &&
      buf[offset + 2] === 0x03 &&
      buf[offset + 3] === 0x04
    ) {
      const nameLen = buf.readUInt16LE(offset + 26);
      const extraLen = buf.readUInt16LE(offset + 28);
      const compSize = buf.readUInt32LE(offset + 18);
      if (nameLen > 0 && offset + 30 + nameLen <= buf.length) {
        const name = buf.toString('utf8', offset + 30, offset + 30 + nameLen);
        localEntries.push(name);
        offset += 30 + nameLen + extraLen + compSize;
      } else {
        break;
      }
    } else {
      break;
    }
  }

  return localEntries.length > 0 ? localEntries : null;
}

export function validateCandidateBuffer(
  buffer: ArrayBuffer | Uint8Array | Buffer,
  fileName: string,
  kind: 'resume' | 'cover_letter',
  declaredMime?: string | null
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

  // Check declared MIME compatibility if supplied
  if (declaredMime) {
    const normDeclared = declaredMime.toLowerCase().trim();
    if (ext === 'pdf') {
      const allowedPdfMimes = ['application/pdf', 'application/x-pdf', 'application/octet-stream'];
      if (!allowedPdfMimes.includes(normDeclared)) {
        return {
          valid: false,
          error: `MIME type mismatch: declared '${declaredMime}' is not compatible with .pdf extension.`
        };
      }
    } else if (ext === 'doc') {
      const allowedDocMimes = ['application/msword', 'application/doc', 'application/octet-stream'];
      if (!allowedDocMimes.includes(normDeclared)) {
        return {
          valid: false,
          error: `MIME type mismatch: declared '${declaredMime}' is not compatible with .doc extension.`
        };
      }
    } else if (ext === 'docx') {
      const allowedDocxMimes = [
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/octet-stream'
      ];
      if (!allowedDocxMimes.includes(normDeclared)) {
        return {
          valid: false,
          error: `MIME type mismatch: declared '${declaredMime}' is not compatible with .docx extension.`
        };
      }
    }
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
    const isZipHeader = uint8[0] === 0x50 && uint8[1] === 0x4b && uint8[2] === 0x03 && uint8[3] === 0x04;
    if (!isZipHeader) {
      return { valid: false, error: 'File has a .docx extension but is not a valid Word document package.' };
    }

    // Parse ZIP entries from package
    const zipEntries = extractZipEntryNames(uint8);
    if (!zipEntries || zipEntries.length === 0) {
      return {
        valid: false,
        error: 'File has a .docx extension but is not a readable or valid ZIP package.'
      };
    }

    const hasContentTypes = zipEntries.includes('[Content_Types].xml');
    const hasWordDocument = zipEntries.includes('word/document.xml') || zipEntries.some(e => e.startsWith('word/'));

    if (!hasContentTypes || !hasWordDocument) {
      return {
        valid: false,
        error: 'File has a .docx extension but does not contain a genuine Microsoft Word document package.'
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

  return validateCandidateBuffer(arrayBuf, file.name, kind, file.type);
}
