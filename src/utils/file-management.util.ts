import path from 'node:path';

export abstract class FileManager {
  /**
   * Fungsi Upload File - Convert to Base64 and save to database
   * @param {string} file_folder_path lokasi upload file (not used for base64, kept for compatibility)
   * @param {File} file file yang mau diupload
   * @returns {Promise<string>} Base64 string dengan format data:image/...;base64,...
   */
  static async upload(file_folder_path: string, file: File): Promise<string> {
    // Convert file to buffer
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');

    // Detect MIME type from file extension
    const extension = path.extname(file.name).toLowerCase();
    let mimeType = 'image/png'; // default

    switch (extension) {
      case '.jpeg': {
        mimeType = 'image/jpeg';
        break;
      }

      case '.jpg': {
        mimeType = 'image/jpeg';

        break;
      }

      case '.png': {
        mimeType = 'image/png';

        break;
      }

      case '.gif': {
        mimeType = 'image/gif';

        break;
      }

      case '.webp': {
        mimeType = 'image/webp';

        break;
      }
      // No default
    }

    // Return base64 with data URI prefix
    return `data:${mimeType};base64,${base64}`;
  }

  /**
   * Remove file - Not needed for base64, kept for compatibility
   */
  static remove() {
    // Base64 data is stored in database, nothing to delete from filesystem
    // Keep this method for backward compatibility
  }
}
