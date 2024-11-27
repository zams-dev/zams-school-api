import { Module } from "@nestjs/common";
import { FirebaseProviderModule } from "src/core/provider/firebase/firebase-provider.module";
import { CustomCacheManagerService } from "src/services/custom-cache-manager.service";

@Module({
  imports: [FirebaseProviderModule],
  providers: [CustomCacheManagerService],
  exports: [CustomCacheManagerService],
})
export class CustomCacheManagerModule {}
