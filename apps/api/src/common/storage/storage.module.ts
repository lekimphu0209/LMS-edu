import { Module } from '@nestjs/common';
import { R2FileStorageService } from './r2-file-storage.service';

export const FILE_STORAGE = Symbol('FILE_STORAGE');

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
