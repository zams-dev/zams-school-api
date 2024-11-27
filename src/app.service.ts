import { Injectable } from "@nestjs/common";
import { CustomCacheManagerService } from "./services/custom-cache-manager.service";

@Injectable()
export class AppService {
  constructor(private customCacheManagerService: CustomCacheManagerService) {}
  getHello(): string {
    return "Hello World!";
  }
}
