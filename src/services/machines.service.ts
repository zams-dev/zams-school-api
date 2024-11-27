import { Schools } from "src/db/entities/Schools";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { MACHINES_ERROR_NOT_FOUND } from "src/common/constant/machines.constant";
import { CONST_QUERYCURRENT_TIMESTAMP } from "src/common/constant/timestamp.constant";
import { USER_ERROR_USER_NOT_FOUND } from "src/common/constant/user-error.constant";
import {
  columnDefToTypeORMCondition,
  generateIndentityCode,
} from "src/common/utils/utils";
import { CreateMachineDto } from "src/core/dto/machines/machines.create.dto";
import { UpdateMachineDto } from "src/core/dto/machines/machines.update.dto";
import { Machines } from "src/db/entities/Machines";
import { Users } from "src/db/entities/Users";
import { Repository } from "typeorm";
import { SCHOOLS_ERROR_NOT_FOUND } from "src/common/constant/schools.constant";

@Injectable()
export class MachinesService {
  constructor(
    @InjectRepository(Machines)
    private readonly machinesRepo: Repository<Machines>
  ) {}

  async getMachinesPagination({ pageSize, pageIndex, order, columnDef }) {
    const skip =
      Number(pageIndex) > 0 ? Number(pageIndex) * Number(pageSize) : 0;
    const take = Number(pageSize);

    const condition = columnDefToTypeORMCondition(columnDef);
    const [results, total] = await Promise.all([
      this.machinesRepo.find({
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
      this.machinesRepo.count({
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

  async getByCode(machineCode) {
    const result = await this.machinesRepo.findOne({
      where: {
        machineCode,
        active: true,
      },
      relations: {
        createdByUser: true,
        updatedByUser: true,
      },
    });
    if (!result) {
      throw Error(MACHINES_ERROR_NOT_FOUND);
    }
    delete result.createdByUser.password;
    if (result?.updatedByUser?.password) {
      delete result.updatedByUser.password;
    }
    return result;
  }

  async create(dto: CreateMachineDto) {
    try {
      return await this.machinesRepo.manager.transaction(
        async (entityManager) => {
          let machines = new Machines();
          machines.description = dto.description;
          machines.path = dto.path;
          machines.domain = dto.domain;
          const timestamp = await entityManager
            .query(CONST_QUERYCURRENT_TIMESTAMP)
            .then((res) => {
              return res[0]["timestamp"];
            });
          machines.createdDate = timestamp;

          const school = await entityManager.findOne(Schools, {
            where: {
              schoolId: dto.schoolId,
              active: true,
            },
          });
          if (!school) {
            throw Error(SCHOOLS_ERROR_NOT_FOUND);
          }
          machines.school = school;

          const createdByUser = await entityManager.findOne(Users, {
            where: {
              userId: dto.createdByUserId,
              active: true,
            },
          });
          if (!createdByUser) {
            throw Error(USER_ERROR_USER_NOT_FOUND);
          }
          machines.createdByUser = createdByUser;
          machines = await entityManager.save(machines);
          machines.machineCode = generateIndentityCode(machines.machineId);
          machines = await entityManager.save(Machines, machines);
          delete machines.createdByUser.password;
          return machines;
        }
      );
    } catch (ex) {
      if (
        ex["message"] &&
        (ex["message"].includes("duplicate key") ||
          ex["message"].includes("violates unique constraint")) &&
        ex["message"].includes("u_machine")
      ) {
        throw Error("Entry already exists!");
      } else {
        throw ex;
      }
    }
  }

  async batchCreate(dtos: CreateMachineDto[]) {
    return await this.machinesRepo.manager.transaction(
      async (entityManager) => {
        const machines = [];
        for (const dto of dtos) {
          let machine = new Machines();
          machine.description = dto.description;
          machine.path = dto.path;
          machine.domain = dto.domain;
          const timestamp = await entityManager
            .query(CONST_QUERYCURRENT_TIMESTAMP)
            .then((res) => {
              return res[0]["timestamp"];
            });
          machine.createdDate = timestamp;

          const school = await entityManager.findOne(Schools, {
            where: {
              schoolId: dto.schoolId,
              active: true,
            },
          });
          if (!school) {
            throw Error(SCHOOLS_ERROR_NOT_FOUND);
          }
          machine.school = school;

          const createdByUser = await entityManager.findOne(Users, {
            where: {
              userId: dto.createdByUserId,
              active: true,
            },
          });
          if (!createdByUser) {
            throw Error(USER_ERROR_USER_NOT_FOUND);
          }
          machine.createdByUser = createdByUser;
          machine = await entityManager.save(machine);
          machine.machineCode = generateIndentityCode(machine.machineId);
          machine = await entityManager.save(Machines, machine);
          delete machine.createdByUser.password;
          machines.push(machine);
        }
        return machines;
      }
    );
  }

  async update(machineCode, dto: UpdateMachineDto) {
    try {
      return await this.machinesRepo.manager.transaction(
        async (entityManager) => {
          let machines = await entityManager.findOne(Machines, {
            where: {
              machineCode,
              active: true,
            },
          });
          if (!machines) {
            throw Error(MACHINES_ERROR_NOT_FOUND);
          }
          const timestamp = await entityManager
            .query(CONST_QUERYCURRENT_TIMESTAMP)
            .then((res) => {
              return res[0]["timestamp"];
            });
          machines.updatedDate = timestamp;

          const updatedByUser = await entityManager.findOne(Users, {
            where: {
              userId: dto.updatedByUserId,
              active: true,
            },
          });
          if (!updatedByUser) {
            throw Error(USER_ERROR_USER_NOT_FOUND);
          }
          machines.updatedByUser = updatedByUser;
          machines.description = dto.description;
          machines.path = dto.path;
          machines.domain = dto.domain;
          machines = await entityManager.save(Machines, machines);
          if (machines?.createdByUser?.password) {
            delete machines.createdByUser.password;
          }
          if (machines?.updatedByUser?.password) {
            delete machines.updatedByUser.password;
          }
          return machines;
        }
      );
    } catch (ex) {
      if (
        ex["message"] &&
        (ex["message"].includes("duplicate key") ||
          ex["message"].includes("violates unique constraint")) &&
        ex["message"].includes("u_machine")
      ) {
        throw Error("Entry already exists!");
      } else {
        throw ex;
      }
    }
  }

  async delete(machineCode) {
    return await this.machinesRepo.manager.transaction(
      async (entityManager) => {
        const machines = await entityManager.findOne(Machines, {
          where: {
            machineCode,
            active: true,
          },
        });
        if (!machines) {
          throw Error(MACHINES_ERROR_NOT_FOUND);
        }
        machines.active = false;
        const timestamp = await entityManager
          .query(CONST_QUERYCURRENT_TIMESTAMP)
          .then((res) => {
            return res[0]["timestamp"];
          });
        machines.updatedDate = timestamp;
        return await entityManager.save(Machines, machines);
      }
    );
  }
}
