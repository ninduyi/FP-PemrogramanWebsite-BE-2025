import { existsSync } from 'node:fs';
import { rm } from 'node:fs/promises';

export abstract class FileManager {
  /**
   * Fungsi Upload File - Convert to Base64
   * @param {string} file_folder_path lokasi upload file (tidak digunakan, untuk backward compatibility)
   * @param {File} file file yang mau diupload
   * @returns {Promise<string>} base64 string dengan format data:image/jpeg;base64,...
   */
  static async upload(file_folder_path: string, file: File) {
    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');

    const result = `data:${file.type};base64,${base64}`;
    console.log(
      `📤 Upload: ${file.name} (${file.size} bytes, ${file.type}) -> Base64 length: ${base64.length}`,
    );

    // Return with data URL format
    return result;
  }

  /**
   * Konversi path relatif ke URL absolut (atau return base64 as is)
   * @param {string | null | undefined} filePath path relatif dari file atau base64 string
   * @returns {string | null} URL absolut, base64 string, atau null
   */
  static toAbsoluteUrl(filePath: string | null | undefined): string | null {
    if (!filePath) return null;

    // Jika sudah berupa base64 data URL, return as is
    if (filePath.startsWith('data:')) {
      return filePath;
    }

    // Jika sudah berupa URL lengkap, return as is
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      return filePath;
    }

    // Legacy: convert file path to absolute URL
    const baseUrl = process.env.BASE_URL || 'http://localhost:4002';
    const normalizedPath = filePath.startsWith('/') ? filePath : `/${filePath}`;

    return `${baseUrl}${normalizedPath}`;
  }

  static async remove(file_path?: string | null) {
    if (!file_path) return;
    if (!existsSync(`./${file_path}`)) return;

    const file = Bun.file(`./${file_path}`);
    await file.delete();
  }

  static async removeFolder(folder_path: string) {
    if (!existsSync(folder_path)) return;
    await rm(folder_path, { recursive: true, force: true });
  }
}
