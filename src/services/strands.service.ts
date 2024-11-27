import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { SCHOOLS_ERROR_NOT_FOUND } from "src/common/constant/schools.constant";
import { STRAND_ERROR_NOT_FOUND } from "src/common/constant/strand.constant";
import { CONST_QUERYCURRENT_TIMESTAMP } from "src/common/constant/timestamp.constant";
import { USER_ERROR_USER_NOT_FOUND } from "src/common/constant/user-error.constant";
import {
  columnDefToTypeORMCondition,
  generateIndentityCode,
} from "src/common/utils/utils";
import { CreateStrandDto } from "src/core/dto/strands/strands.create.dto";
import { UpdateStrandDto } from "src/core/dto/strands/strands.update.dto";
import { Schools } from "src/db/entities/Schools";
import { Strands } from "src/db/entities/Strands";
import { Users } from "src/db/entities/Users";
import { Repository } from "typeorm";

@Injectable()
export class StrandsService {
  constructor(
    @InjectRepository(Strands)
    private readonly strandsRepo: Repository<Strands>
  ) {}

  async getStrandsPagination({ pageSize, pageIndex, order, columnDef }) {
    const skip =
      Number(pageIndex) > 0 ? Number(pageIndex) * Number(pageSize) : 0;
    const take = Number(pageSize);

    const condition = columnDefToTypeORMCondition(columnDef);
    const [results, total] = await Promise.all([
      this.strandsRepo.find({
        where: {
          ...condition,
          active: true,
        },
        relations: {
          createdByUser: true,
          updatedByUser: true,
        },
        skip,
        take,
        order,
      }),
      this.strandsRepo.count({
        where: {
          ...condition,
          active: true,
        },
      }),
    ]);
    return {
      results: results.map((x) => {
        delete x.createdByUser.password;
        if (x?.updatedByUser?.password) {
          delete x.updatedByUser.password;
        }
        return x;
      }),
      total,
    };
  }

  async getByCode(strandCode) {
    const result = await this.strandsRepo.findOne({
      where: {
        strandCode,
        active: true,
      },
      relations: {
        createdByUser: true,
        updatedByUser: true,
      },
    });
    if (!result) {
      throw Error(STRAND_ERROR_NOT_FOUND);
    }
    delete result.createdByUser.password;
    if (result?.updatedByUser?.password) {
      delete result.updatedByUser.password;
    }
    return result;
  }

  async create(dto: CreateStrandDto) {
    try {
      return await this.strandsRepo.manager.transaction(
        async (entityManager) => {
          let strands = new Strands();
          strands.name = dto.name;
          const timestamp = await entityManager
            .query(CONST_QUERYCURRENT_TIMESTAMP)
            .then((res) => {
              return res[0]["timestamp"];
            });
          strands.createdDate = timestamp;

          const school = await entityManager.findOne(Schools, {
            where: {
              schoolId: dto.schoolId,
              active: true,
            },
          });
          if (!school) {
            throw Error(SCHOOLS_ERROR_NOT_FOUND);
          }
          strands.school = school;

          const createdByUser = await entityManager.findOne(Users, {
            where: {
              userId: dto.createdByUserId,
              active: true,
            },
          });
          if (!createdByUser) {
            throw Error(USER_ERROR_USER_NOT_FOUND);
          }
          strands.createdByUser = createdByUser;
          strands = await entityManager.save(strands);
          strands.strandCode = generateIndentityCode(strands.strandId);
          strands = await entityManager.save(Strands, strands);

          delete strands.createdByUser.password;
          return strands;
        }
      );
    } catch (ex) {
      if (
        ex["message"] &&
        (ex["message"].includes("duplicate key") ||
          ex["message"].includes("violates unique constraint")) &&
        ex["message"].includes("u_strand")
      ) {
        throw Error("Entry already exists!");
      } else {
        throw ex;
      }
    }
  }

  async update(strandCode, dto: UpdateStrandDto) {
    try {
      return await this.strandsRepo.manager.transaction(
        async (entityManager) => {
          let strands = await entityManager.findOne(Strands, {
            where: {
              strandCode,
              active: true,
            },
          });
          if (!strands) {
            throw Error(STRAND_ERROR_NOT_FOUND);
          }
          const timestamp = await entityManager
            .query(CONST_QUERYCURRENT_TIMESTAMP)
            .then((res) => {
              return res[0]["timestamp"];
            });
          strands.updatedDate = timestamp;

          const updatedByUser = await entityManager.findOne(Users, {
            where: {
              userId: dto.updatedByUserId,
              active: true,
            },
          });
          if (!updatedByUser) {
            throw Error(USER_ERROR_USER_NOT_FOUND);
          }
          strands.updatedByUser = updatedByUser;
          strands.name = dto.name;
          strands = await entityManager.save(Strands, strands);
          if (strands?.createdByUser?.password) {
            delete strands.createdByUser.password;
          }
          if (strands?.updatedByUser?.password) {
            delete strands.updatedByUser.password;
          }
          return strands;
        }
      );
    } catch (ex) {
      if (
        ex["message"] &&
        (ex["message"].includes("duplicate key") ||
          ex["message"].includes("violates unique constraint")) &&
        ex["message"].includes("u_strand")
      ) {
        throw Error("Entry already exists!");
      } else {
        throw ex;
      }
    }
  }

  async delete(strandCode) {
    return await this.strandsRepo.manager.transaction(async (entityManager) => {
      let strands = await entityManager.findOne(Strands, {
        where: {
          strandCode,
          active: true,
        },
      });
      if (!strands) {
        throw Error(STRAND_ERROR_NOT_FOUND);
      }
      strands.active = false;
      const timestamp = await entityManager
        .query(CONST_QUERYCURRENT_TIMESTAMP)
        .then((res) => {
          return res[0]["timestamp"];
        });
      strands.updatedDate = timestamp;
      strands = await entityManager.save(Strands, strands);
      delete strands.createdByUser.password;
      if (strands?.updatedByUser?.password) {
        delete strands.updatedByUser.password;
      }
      return strands;
    });
  }
}
