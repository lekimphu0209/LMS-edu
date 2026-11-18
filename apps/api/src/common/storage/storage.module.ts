import { Module } from '@nestjs/common';
import { R2FileStorageService } from './r2-file-storage.service';

export const FILE_STORAGE = Symbol('FILE_STORAGE');

/** StorageModule — cung cấp FILE_STORAGE (Cloudflare R2) để upload/xóa file. */
@Module({
  providers: [
    {
      provide: FILE_STORAGE,
      useClass: R2FileStorageService,
    },
  ],
  exports: [FILE_STORAGE],
})
export class StorageModule {}
