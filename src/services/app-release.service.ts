import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import moment from 'moment-timezone';
import { columnDefToTypeORMCondition } from "src/common/utils/utils";
import { CreateAppReleaseDto } from "src/core/dto/app-release/app-release.create.dto";
import { UpdateAppReleaseDto } from "src/core/dto/app-release/app-release.update.dto";
import { AppRelease } from "src/db/entities/AppRelease";
import { Repository } from "typeorm";

@Injectable()
export class AppReleaseService {
  constructor(
    @InjectRepository(AppRelease)
    private readonly appReleaseRepo: Repository<AppRelease>
  ) {}

  async getPagination({ pageSize, pageIndex, order, columnDef }) {
    const skip =
      Number(pageIndex) > 0 ? Number(pageIndex) * Number(pageSize) : 0;
    const take = Number(pageSize);

    const condition = columnDefToTypeORMCondition(columnDef);
    const [results, total] = await Promise.all([
      this.appReleaseRepo.find({
        skip,
        take,
        order,
      }),
      this.appReleaseRepo.count({
        where: condition,
      }),
    ]);
    return {
      results,
      total,
    };
  }

  async getLatestVersion(appTypeCode: "ANDROID" | "IOS" | "WEB") {
    const [result] = await this.appReleaseRepo.manager.query(`
    SELECT "Id" as "id", 
    "Description" as "description", 
    "AppTypeCode" as "appTypeCode", 
    "AppVersion" as "appVersion", 
    "AppBuild" as "appBuild", 
    "Date" as "date"
	FROM dbo."AppRelease" Where UPPER("AppTypeCode")=UPPER('${appTypeCode}') ORDER BY "Date" DESC Limit 1;
      `);
    if (result) {
      return {
        id: result.id,
        description: result.description,
        appTypeCode: result.appTypeCode,
        appVersion: result.appVersion,
        appBuild: result.appBuild,
        date: moment(result.date).format("YYYY-MM-DD"),
      };
    } else {
      throw Error("Not found");
    }
  }

  async getByCode(id) {
    const result = await this.appReleaseRepo.findOne({
      where: {
        id,
      },
    });
    if (!result) {
      throw Error("Not found");
    }
    return result;
  }

  async create(dto: CreateAppReleaseDto) {
    try {
      return await this.appReleaseRepo.manager.transaction(
        async (entityManager) => {
          let appRelease = new AppRelease();
          appRelease.description = dto.description;
          appRelease.appTypeCode = dto.appTypeCode.toUpperCase();
          appRelease.appVersion = dto.appVersion;
          appRelease.appBuild = dto.appBuild;
          appRelease.date = moment(dto.date).format("YYYY-MM-DD");
          appRelease = await entityManager.save(appRelease);
          return appRelease;
        }
      );
    } catch (ex) {
      throw ex;
    }
  }

  async update(id, dto: UpdateAppReleaseDto) {
    try {
      return await this.appReleaseRepo.manager.transaction(
        async (entityManager) => {
          let appRelease = await entityManager.findOne(AppRelease, {
            where: {
              id,
            },
          });
          appRelease.description = dto.description;
          appRelease.appTypeCode = dto.appTypeCode.toUpperCase();
          appRelease.appVersion = dto.appVersion;
          appRelease.appBuild = dto.appBuild;
          appRelease.date = moment(dto.date).format("YYYY-MM-DD");
          appRelease = await entityManager.save(appRelease);
          return appRelease;
        }
      );
    } catch (ex) {
      throw ex;
    }
  }

  async delete(id) {
    try {
      return await this.appReleaseRepo.manager.transaction(
        async (entityManager) => {
          const appRelease = await entityManager.findOne(AppRelease, {
            where: {
              id,
            },
          });
          await entityManager.delete(AppRelease, appRelease);
          return appRelease;
        }
      );
    } catch (ex) {
      throw ex;
    }
  }
}
