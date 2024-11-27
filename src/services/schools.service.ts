import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { SCHOOLS_ERROR_NOT_FOUND } from "src/common/constant/schools.constant";
import { CONST_QUERYCURRENT_TIMESTAMP } from "src/common/constant/timestamp.constant";
import { USER_ERROR_USER_NOT_FOUND } from "src/common/constant/user-error.constant";
import {
  columnDefToTypeORMCondition,
  generateIndentityCode,
  hash,
} from "src/common/utils/utils";
import { UpdateSchoolDto } from "src/core/dto/schools/schools.update.dto";
import { CreateSchoolDto } from "src/core/dto/schools/schools.create.dto";
import { Schools } from "src/db/entities/Schools";
import { Users } from "src/db/entities/Users";
import { Repository } from "typeorm";

@Injectable()
export class SchoolsService {
  constructor(
    @InjectRepository(Schools)
    private readonly schoolsRepo: Repository<Schools>
  ) {}

  async getSchoolsPagination({ pageSize, pageIndex, order, columnDef }) {
    const skip =
      Number(pageIndex) > 0 ? Number(pageIndex) * Number(pageSize) : 0;
    const take = Number(pageSize);

    const condition = columnDefToTypeORMCondition(columnDef);
    const [results, total] = await Promise.all([
      this.schoolsRepo.find({
        where: {
          ...condition,
          active: true,
        },
        relations: {
          registeredByUser: true,
          updatedByUser: true,
        },
        skip,
        take,
        order,
      }),
      this.schoolsRepo.count({
        where: {
          ...condition,
          active: true,
        },
      }),
    ]);
    return {
      results: results.map((x) => {
        delete x.registeredByUser.password;
        if (x?.updatedByUser?.password) {
          delete x.updatedByUser.password;
        }
        return x;
      }),
      total,
    };
  }

  async getByCode(schoolCode) {
    const result = await this.schoolsRepo.findOne({
      where: {
        schoolCode,
        active: true,
      },
      relations: {
        registeredByUser: true,
        updatedByUser: true,
      },
    });
    if (!result) {
      throw Error(SCHOOLS_ERROR_NOT_FOUND);
    }
    delete result.registeredByUser.password;
    if (result?.updatedByUser?.password) {
      delete result.updatedByUser.password;
    }
    return result;
  }

  async getByOrgCode(orgSchoolCode) {
    const result = await this.schoolsRepo.findOne({
      where: {
        orgSchoolCode,
        active: true,
      },
      relations: {
        registeredByUser: true,
        updatedByUser: true,
      },
    });
    if (!result) {
      throw Error(SCHOOLS_ERROR_NOT_FOUND);
    }
    delete result.registeredByUser.password;
    if (result?.updatedByUser?.password) {
      delete result.updatedByUser.password;
    }
    return result;
  }

  async create(dto: CreateSchoolDto) {
    return await this.schoolsRepo.manager.transaction(async (entityManager) => {
      let schools = new Schools();
      schools.orgSchoolCode = dto.orgSchoolCode;
      schools.schoolName = dto.schoolName;
      schools.schoolAddress = dto.schoolAddress;
      // schools.schoolContactNumber = dto.schoolContactNumber;
      // schools.schoolEmail = dto.schoolEmail;
      // schools.studentsAllowableTimeLate = dto.studentsAllowableTimeLate;
      // schools.studentsTimeLate = dto.studentsTimeLate;
      // schools.restrictGuardianTime = dto.restrictGuardianTime;
      // schools.employeesTimeBeforeSwipeIsAllowed =
      //   dto.employeesTimeBeforeSwipeIsAllowed;
      // schools.employeesAllowableTimeLate = dto.employeesAllowableTimeLate;
      // schools.employeesTimeLate = dto.employeesTimeLate;
      // schools.timeBeforeSwipeIsAllowed = dto.timeBeforeSwipeIsAllowed;
      // schools.smsNotificationForStaffEntry = dto.smsNotificationForStaffEntry;
      // schools.smsNotificationForStudentBreakTime =
      //   dto.smsNotificationForStudentBreakTime;
      const timestamp = await entityManager
        .query(CONST_QUERYCURRENT_TIMESTAMP)
        .then((res) => {
          return res[0]["timestamp"];
        });
      schools.dateRegistered = timestamp;

      const registeredByUser = await entityManager.findOne(Users, {
        where: {
          userId: dto.registeredByUserId,
          active: true,
        },
      });
      if (!registeredByUser) {
        throw Error(USER_ERROR_USER_NOT_FOUND);
      }
      schools.registeredByUser = registeredByUser;
      schools = await entityManager.save(schools);
      schools.schoolCode = generateIndentityCode(schools.schoolId);
      schools = await entityManager.save(Schools, schools);

      const department = dto.defaulEmployeeDepartment;
      const title = dto.defaultEmployeeTitleName;
      const fullName = dto.defaultUserEmployeeFullName;
      const employeeIdNumber = dto.defaultEmployeeIdNumber;
      const cardNumber = dto.defaultEmployeeCardNumber;
      const contactNumber = dto.defaultEmployeeContactNumber;

      const userName = dto.defaultUserName;
      const password = await hash(dto.defaultUserPassword);
      const access = dto.defaultUserAccessName;

      const query = `
      DO $$
      DECLARE
          OrgSchoolCode TEXT := '${dto.orgSchoolCode}'; -- Example initial value for the school lookup
          SchoolId BIGINT;                  -- Variable to store the SchoolId
          SchoolCode TEXT;                  -- Variable to store the SchoolCode
          NewUserId BIGINT;                 -- Variable to hold the newly inserted UserId
          NewEmployeeId BIGINT;             -- Variable to hold the newly inserted EmployeeId
          NewDepartmentId BIGINT;           -- Variable to hold the newly inserted DepartmentId
          NewEmployeeTitleId BIGINT;     -- Variable to hold the newly inserted EmployeePositionId
          NewEmployeeUserAccessId BIGINT;   -- Variable for the EmployeeUserAccessId
          NewEmployeeUserId BIGINT;         -- Variable for the EmployeeUserId
          ErrorMessage TEXT;                -- Variable to capture the error message
      BEGIN
          -- Lookup SchoolId and SchoolCode based on OrgSchoolCode
          SELECT "SchoolId", "SchoolCode"
          INTO SchoolId, SchoolCode
          FROM dbo."Schools"
          WHERE "OrgSchoolCode" = OrgSchoolCode;

          IF NOT FOUND THEN
              RAISE EXCEPTION 'School with OrgSchoolCode % not found!', OrgSchoolCode;
          END IF;

          -- Insert into dbo."Users" and get the new "UserId"
          INSERT INTO dbo."Users" ("UserName", "Password", "UserType")
          VALUES (
          '${userName}', 
          '${password}',
          'EMPLOYEE'
          )
          RETURNING "UserId" INTO NewUserId;

          -- Update the "UserCode" for the newly inserted user
          UPDATE dbo."Users"
          SET "UserCode" = RIGHT('000000' || NewUserId::TEXT, 6)
          WHERE "UserId" = NewUserId;

          -- Check if "Administration" exists in dbo."Departments"
          IF NOT EXISTS (
              SELECT 1 
              FROM dbo."Departments" 
              WHERE "DepartmentName" = '${department}'
                AND "SchoolId" = SchoolId
          ) THEN
              -- Insert into dbo."Departments"
              INSERT INTO dbo."Departments" ("SchoolId", "DepartmentName", "Type", "CreatedByUserId")
              VALUES (
                  SchoolId, -- Use the SchoolId fetched from dbo."School"
                  '${department}',
                  'EMPLOYEE',
            1
              )
              RETURNING "DepartmentId" INTO NewDepartmentId;

              -- Update the "DepartmentCode" for the new department
              UPDATE dbo."Departments"
              SET "DepartmentCode" = RIGHT('000000' || NewDepartmentId::TEXT, 6)
              WHERE "DepartmentId" = NewDepartmentId;
          ELSE
              -- Get the existing "DepartmentId" for "Administration"
              SELECT "DepartmentId" INTO NewDepartmentId
              FROM dbo."Departments"
              WHERE "DepartmentName" = 'Administration' AND "SchoolId" = SchoolId;
          END IF;

          -- Insert into dbo."EmployeePosition"
          INSERT INTO dbo."EmployeeTitles" ("Name", "SchoolId", "CreatedByUserId")
          VALUES (
              '${title}',
              SchoolId, -- Use the SchoolId fetched from dbo."School"
          1
          )
          RETURNING "EmployeeTitleId" INTO NewEmployeeTitleId;

          -- Update the "EmployeeTitleCode" for the new position
          UPDATE dbo."EmployeeTitles"
          SET "EmployeeTitleCode" = RIGHT('000000' || NewEmployeeTitleId::TEXT, 6)
          WHERE "EmployeeTitleId" = NewEmployeeTitleId;

          -- Insert into dbo."Employee"
          INSERT INTO dbo."Employees" (
              "EmployeePositionId",
              "DepartmentId",
              "CreatedByUserId",
              "SchoolId",
              "MobileNumber",
              "CardNumber",
              "FullName",
              "OrgEmployeeId",
              "AccessGranted"
          )
          VALUES (
              NewEmployeeTitleId, -- "EmployeePositionId"
              NewDepartmentId,       -- "DepartmentId"
              1,                     -- "CreatedByUserId", example value
              SchoolId,              -- "SchoolId"
              '${contactNumber}',          -- "MobileNumber", example value
              '${cardNumber}',          -- "CardNumber", example value
              '${fullName}',    -- "FullName", example value
              '${employeeIdNumber}',  -- "OrgEmployeeId", example value
              true
          )
          RETURNING "EmployeeId" INTO NewEmployeeId;

          -- Update the "EmployeeCode" for the new position
          UPDATE dbo."Employees"
          SET "EmployeeCode" = RIGHT('000000' || NewEmployeeId::TEXT, 6)
          WHERE "EmployeeId" = NewEmployeeId;


          -- Insert into dbo."EmployeeUserAccess"
          INSERT INTO dbo."EmployeeUserAccess" (
              "Name", 
              "AccessPages", 
              "CreatedByUserId", 
              "SchoolId"
          )
          VALUES (
              '${access}',     -- "Name"
              '[{
                  "page": "Employee User Access",
                  "view": true,
                  "modify": true,
                  "rights": []
                },
                {
                  "page": "Employee User",
                  "view": true,
                  "modify": true,
                  "rights": []
                }]', -- "AccessPages"
              1,                 -- "CreatedByUserId", example value
              SchoolId           -- Use the SchoolId fetched from dbo."School"
          )
          RETURNING "EmployeeUserAccessId" INTO NewEmployeeUserAccessId;

          -- Update the "EmployeeUserAccessCode" for the new entry
          UPDATE dbo."EmployeeUserAccess"
          SET "EmployeeUserAccessCode" = RIGHT('000000' || NewEmployeeUserAccessId::TEXT, 6)
          WHERE "EmployeeUserAccessId" = NewEmployeeUserAccessId;

          -- Insert into dbo."EmployeeUser"
          INSERT INTO dbo."EmployeeUser" (
              "EmployeeId", 
              "UserId", 
              "EmployeeUserAccessId"
          )
          VALUES (
              NewEmployeeId,           -- "EmployeeUserId"
              NewUserId,               -- "UserId"
              NewEmployeeUserAccessId  -- The newly inserted EmployeeUserAccessId
          );

          RAISE NOTICE 'All records successfully inserted for SchoolId: %, SchoolCode: %', SchoolId, SchoolCode;

      EXCEPTION
          WHEN OTHERS THEN
              -- Capture the error message
              ErrorMessage := SQLERRM;

              -- Raise a notice with the error details
              RAISE NOTICE 'An error occurred: %', ErrorMessage;

              -- Optionally re-raise the error to propagate it further
              RAISE;
      END $$;
      `;
      const defaults = await entityManager
        .query(query)
        .then((res) => {
          console.log(res);
          return res;
        })
        .catch((res) => {
          console.log(res);
          throw res;
        });
      delete schools.registeredByUser.password;
      return schools;
    });
  }

  async batchCreate(dtos: CreateSchoolDto[]) {
    return await this.schoolsRepo.manager.transaction(async (entityManager) => {
      const schools = [];
      for (const dto of dtos) {
        let school = new Schools();
        school.orgSchoolCode = dto.orgSchoolCode;
        school.schoolName = dto.schoolName;
        school.schoolAddress = dto.schoolAddress;
        // school.schoolContactNumber = dto.schoolContactNumber;
        // school.schoolEmail = dto.schoolEmail;
        // school.studentsAllowableTimeLate = dto.studentsAllowableTimeLate;
        // school.studentsTimeLate = dto.studentsTimeLate;
        // school.restrictGuardianTime = dto.restrictGuardianTime;
        // school.employeesTimeBeforeSwipeIsAllowed =
        //   dto.employeesTimeBeforeSwipeIsAllowed;
        // school.employeesAllowableTimeLate = dto.employeesAllowableTimeLate;
        // school.employeesTimeLate = dto.employeesTimeLate;
        // school.timeBeforeSwipeIsAllowed = dto.timeBeforeSwipeIsAllowed;
        // school.smsNotificationForStaffEntry = dto.smsNotificationForStaffEntry;
        // school.smsNotificationForStudentBreakTime =
        //   dto.smsNotificationForStudentBreakTime;
        const timestamp = await entityManager
          .query(CONST_QUERYCURRENT_TIMESTAMP)
          .then((res) => {
            return res[0]["timestamp"];
          });
        school.dateRegistered = timestamp;

        const registeredByUser = await entityManager.findOne(Users, {
          where: {
            userId: dto.registeredByUserId,
            active: true,
          },
        });
        if (!registeredByUser) {
          throw Error(USER_ERROR_USER_NOT_FOUND);
        }
        school.registeredByUser = registeredByUser;
        school = await entityManager.save(school);
        school.schoolCode = generateIndentityCode(school.schoolId);
        school = await entityManager.save(Schools, school);
        delete school.registeredByUser.password;
        schools.push(school);
      }
      return schools;
    });
  }

  async update(schoolCode, dto: UpdateSchoolDto) {
    return await this.schoolsRepo.manager.transaction(async (entityManager) => {
      let schools = await entityManager.findOne(Schools, {
        where: {
          schoolCode,
          active: true,
        },
      });
      if (!schools) {
        throw Error(SCHOOLS_ERROR_NOT_FOUND);
      }
      schools.orgSchoolCode = dto.orgSchoolCode;
      schools.schoolName = dto.schoolName;
      schools.schoolAddress = dto.schoolAddress;
      // schools.schoolContactNumber = dto.schoolContactNumber;
      // schools.schoolEmail = dto.schoolEmail;
      // schools.studentsAllowableTimeLate = dto.studentsAllowableTimeLate;
      // schools.studentsTimeLate = dto.studentsTimeLate;
      // schools.restrictGuardianTime = dto.restrictGuardianTime;
      // schools.employeesTimeBeforeSwipeIsAllowed =
      //   dto.employeesTimeBeforeSwipeIsAllowed;
      // schools.employeesAllowableTimeLate = dto.employeesAllowableTimeLate;
      // schools.employeesTimeLate = dto.employeesTimeLate;
      // schools.timeBeforeSwipeIsAllowed = dto.timeBeforeSwipeIsAllowed;
      // schools.smsNotificationForStaffEntry = dto.smsNotificationForStaffEntry;
      // schools.smsNotificationForStudentBreakTime =
      //   dto.smsNotificationForStudentBreakTime;
      const timestamp = await entityManager
        .query(CONST_QUERYCURRENT_TIMESTAMP)
        .then((res) => {
          return res[0]["timestamp"];
        });
      schools.dateUpdated = timestamp;

      const updatedByUser = await entityManager.findOne(Users, {
        where: {
          userId: dto.updatedByUserId,
          active: true,
        },
      });
      if (!updatedByUser) {
        throw Error(USER_ERROR_USER_NOT_FOUND);
      }
      schools.updatedByUser = updatedByUser;
      schools = await entityManager.save(Schools, schools);
      if (schools?.registeredByUser?.password) {
        delete schools.registeredByUser.password;
      }
      if (schools?.updatedByUser?.password) {
        delete schools.updatedByUser.password;
      }
      return schools;
    });
  }

  async delete(schoolCode) {
    return await this.schoolsRepo.manager.transaction(async (entityManager) => {
      let schools = await entityManager.findOne(Schools, {
        where: {
          schoolCode,
          active: true,
        },
      });
      if (!schools) {
        throw Error(SCHOOLS_ERROR_NOT_FOUND);
      }
      schools.active = false;
      const timestamp = await entityManager
        .query(CONST_QUERYCURRENT_TIMESTAMP)
        .then((res) => {
          return res[0]["timestamp"];
        });
      schools.dateUpdated = timestamp;
      schools = await entityManager.save(Schools, schools);
      if (schools?.registeredByUser?.password) {
        delete schools.registeredByUser.password;
      }
      if (schools?.updatedByUser?.password) {
        delete schools.updatedByUser.password;
      }
      return schools;
    });
  }
}
