export interface R2BrowserUploadInput {
  uploadUrl: string;
  publicUrl: string;
  storageKey: string;
  file: File;
}

export interface R2BrowserUploadResult {
  url: string;
  storageKey: string;
}

const LOG_PREFIX = '[storix-upload]';

function uploadContext(file: File, uploadUrl: string, storageKey: string) {
  return {
    fileName: file.name,
    contentType: file.type,
    fileSize: file.size,
    storageKey,
    uploadUrlHost: new URL(uploadUrl).host,
    pageOrigin: typeof window !== 'undefined' ? window.location.origin : undefined,
  };
}

/**
 * PUT a file to a presigned R2 URL from the browser.
 * Logs detailed diagnostics when CORS or R2 rejects the upload.
 */
export async function uploadFileToPresignedUrl(
  input: R2BrowserUploadInput,
): Promise<R2BrowserUploadResult> {
  const { uploadUrl, publicUrl, storageKey, file } = input;
  const context = uploadContext(file, uploadUrl, storageKey);

  let response: Response;
  try {
    // Send raw bytes without Content-Type so the CORS preflight only checks PUT,
    // not the content-type header (R2 rejects preflight when Allowed Headers is empty).
    response = await fetch(uploadUrl, {
      method: 'PUT',
      body: await file.arrayBuffer(),
    });
  } catch (err) {
    console.error(`${LOG_PREFIX} Browser PUT to R2 failed — often a CORS issue`, {
      ...context,
      error: err instanceof Error ? { name: err.name, message: err.message } : err,
      corsHint: [
        `Origin "${context.pageOrigin}" must be in R2 bucket CORS Allowed Origins.`,
        'Allowed Methods must include PUT.',
        'If you set Content-Type on uploads, Allowed Headers must include Content-Type (not empty).',
      ],
    });
    throw new Error('Upload failed. Open the browser console for CORS diagnostics.');
  }

  if (!response.ok) {
    const responseBody = await response.text().catch(() => '');
    console.error(`${LOG_PREFIX} R2 returned a non-success status`, {
      ...context,
      status: response.status,
      statusText: response.statusText,
      responseBody: responseBody.slice(0, 500),
    });
    throw new Error(`Upload failed (${response.status})`);
  }

  return { url: publicUrl, storageKey };
}
