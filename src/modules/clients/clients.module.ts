import { Module } from "@nestjs/common";
import { ClientsController } from "./clients.controller";
import { Clients } from "src/db/entities/Clients";
import { ClientsService } from "src/services/clients.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FirebaseProviderModule } from "src/core/provider/firebase/firebase-provider.module";
import { CustomCacheManagerModule } from "../custom-cache-manager/custom-cache-manager.module";

@Module({
  imports: [
    FirebaseProviderModule, 
    TypeOrmModule.forFeature([Clients]),
    CustomCacheManagerModule,
  ],
  controllers: [ClientsController],
  providers: [ClientsService],
  exports: [ClientsService],
})
export class ClientsModule {}
