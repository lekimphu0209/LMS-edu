/** Contract lưu trữ file (upload/xóa/signed-url); inject qua token FILE_STORAGE. */
export interface UploadResult {
  url: string;
  key: string;
  bucket: string;
}

export interface FileStorage {
  upload(file: Buffer, fileName: string, mimeType: string): Promise<UploadResult>;
  delete(key: string): Promise<void>;
  getSignedUrl(key: string, expiresIn?: number): Promise<string>;
}
