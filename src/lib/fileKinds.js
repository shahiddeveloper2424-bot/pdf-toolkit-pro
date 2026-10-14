/**
 * File classification shared by Merge, PDF Maker and Convert to PDF.
 * Classification trusts the extension first (some mobile file providers
 * report empty/generic MIME types) and falls back to the MIME type.
 */

export const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp'];

export function classifyFile(file) {
  const name = (file?.name || '').toLowerCase();
  const type = file?.type || '';
  if (name.endsWith('.pdf') || type === 'application/pdf') return 'pdf';
  if (
    IMAGE_EXTS.some((e) => name.endsWith(e)) ||
    type === 'image/jpeg' ||
    type === 'image/png' ||
    type === 'image/webp'
  ) {
    return 'image';
  }
  if (name.endsWith('.txt') || type === 'text/plain') return 'txt';
  if (name.endsWith('.html') || name.endsWith('.htm') || type === 'text/html') return 'html';
  if (
    name.endsWith('.docx') ||
    type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    return 'docx';
  }
  return 'unsupported';
}

/** Image sub-format from extension/MIME: 'jpeg' | 'png' | 'webp' | 'other' */
export function imageFormat(file) {
  const name = (file?.name || '').toLowerCase();
  const type = file?.type || '';
  if (name.endsWith('.png') || type === 'image/png') return 'png';
  if (name.endsWith('.webp') || type === 'image/webp') return 'webp';
  if (name.endsWith('.jpg') || name.endsWith('.jpeg') || type === 'image/jpeg') return 'jpeg';
  return 'other';
}

export const MERGE_ACCEPT =
  'application/pdf,.pdf,image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp';
export const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp';
export const CONVERT_ACCEPT =
  'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp,.txt,text/plain,.html,.htm,text/html,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export const CONVERT_SUPPORTED_LABEL =
  'Images (JPG, PNG, WebP), plain text (.txt), HTML (.html) and Word (.docx)';
export const CONVERT_UNSUPPORTED_NOTE =
  'Legacy .doc, Excel (.xls/.xlsx), PowerPoint (.ppt/.pptx) and other formats cannot be converted reliably in the browser without a paid server service, so they are not accepted here. Convert them to .docx, .txt or PDF first, then use this tool.';
