import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { COURSES_ERROR_NOT_FOUND } from "src/common/constant/courses.constant";
import { SCHOOLS_ERROR_NOT_FOUND } from "src/common/constant/schools.constant";
import { CONST_QUERYCURRENT_TIMESTAMP } from "src/common/constant/timestamp.constant";
import { USER_ERROR_USER_NOT_FOUND } from "src/common/constant/user-error.constant";
import {
  columnDefToTypeORMCondition,
  generateIndentityCode,
} from "src/common/utils/utils";
import { CreateCourseDto } from "src/core/dto/courses/courses.create.dto";
import { UpdateCourseDto } from "src/core/dto/courses/courses.update.dto";
import { Courses } from "src/db/entities/Courses";
import { Schools } from "src/db/entities/Schools";
import { Users } from "src/db/entities/Users";
import { Repository } from "typeorm";

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Courses)
    private readonly coursesRepo: Repository<Courses>
  ) {}

  async getCoursesPagination({ pageSize, pageIndex, order, columnDef }) {
    const skip =
      Number(pageIndex) > 0 ? Number(pageIndex) * Number(pageSize) : 0;
    const take = Number(pageSize);

    const condition = columnDefToTypeORMCondition(columnDef);
    const [results, total] = await Promise.all([
      this.coursesRepo.find({
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
      this.coursesRepo.count({
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

  async getByCode(courseCode) {
    const result = await this.coursesRepo.findOne({
      where: {
        courseCode,
        active: true,
      },
      relations: {
        createdByUser: true,
        updatedByUser: true,
      },
    });
    if (!result) {
      throw Error(COURSES_ERROR_NOT_FOUND);
    }
    delete result.createdByUser.password;
    if (result?.updatedByUser?.password) {
      delete result.updatedByUser.password;
    }
    return result;
  }

  async create(dto: CreateCourseDto) {
    try {
      return await this.coursesRepo.manager.transaction(
        async (entityManager) => {
          let courses = new Courses();
          courses.name = dto.name;
          const timestamp = await entityManager
            .query(CONST_QUERYCURRENT_TIMESTAMP)
            .then((res) => {
              return res[0]["timestamp"];
            });
          courses.createdDate = timestamp;

          const school = await entityManager.findOne(Schools, {
            where: {
              schoolId: dto.schoolId,
              active: true,
            },
          });
          if (!school) {
            throw Error(SCHOOLS_ERROR_NOT_FOUND);
          }
          courses.school = school;

          const createdByUser = await entityManager.findOne(Users, {
            where: {
              userId: dto.createdByUserId,
              active: true,
            },
          });
          if (!createdByUser) {
            throw Error(USER_ERROR_USER_NOT_FOUND);
          }
          courses.createdByUser = createdByUser;
          courses = await entityManager.save(courses);
          courses.courseCode = generateIndentityCode(courses.courseId);
          courses = await entityManager.save(Courses, courses);

          delete courses.createdByUser.password;
          return courses;
        }
      );
    } catch (ex) {
      if (
        ex["message"] &&
        (ex["message"].includes("duplicate key") ||
          ex["message"].includes("violates unique constraint")) &&
        ex["message"].includes("u_course")
      ) {
        throw Error("Entry already exists!");
      } else {
        throw ex;
      }
    }
  }

  async update(courseCode, dto: UpdateCourseDto) {
    try {
      return await this.coursesRepo.manager.transaction(
        async (entityManager) => {
          let courses = await entityManager.findOne(Courses, {
            where: {
              courseCode,
              active: true,
            },
            relations: {
              createdByUser: true,
              updatedByUser: true,
            },
          });
          if (!courses) {
            throw Error(COURSES_ERROR_NOT_FOUND);
          }
          const timestamp = await entityManager
            .query(CONST_QUERYCURRENT_TIMESTAMP)
            .then((res) => {
              return res[0]["timestamp"];
            });
          courses.updatedDate = timestamp;

          const updatedByUser = await entityManager.findOne(Users, {
            where: {
              userId: dto.updatedByUserId,
              active: true,
            },
          });
          if (!updatedByUser) {
            throw Error(USER_ERROR_USER_NOT_FOUND);
          }
          courses.updatedByUser = updatedByUser;
          courses.name = dto.name;
          courses = await entityManager.save(Courses, courses);
          if (courses?.createdByUser?.password) {
            delete courses.createdByUser.password;
          }
          if (courses?.updatedByUser?.password) {
            delete courses.updatedByUser.password;
          }
          return courses;
        }
      );
    } catch (ex) {
      if (
        ex["message"] &&
        (ex["message"].includes("duplicate key") ||
          ex["message"].includes("violates unique constraint")) &&
        ex["message"].includes("u_course")
      ) {
        throw Error("Entry already exists!");
      } else {
        throw ex;
      }
    }
  }

  async delete(courseCode) {
    return await this.coursesRepo.manager.transaction(async (entityManager) => {
      let courses = await entityManager.findOne(Courses, {
        where: {
          courseCode,
          active: true,
        },
        relations: {
          createdByUser: true,
          updatedByUser: true,
        },
      });
      if (!courses) {
        throw Error(COURSES_ERROR_NOT_FOUND);
      }
      courses.active = false;
      const timestamp = await entityManager
        .query(CONST_QUERYCURRENT_TIMESTAMP)
        .then((res) => {
          return res[0]["timestamp"];
        });
      courses.updatedDate = timestamp;
      courses = await entityManager.save(Courses, courses);
      delete courses.createdByUser?.password;
      if (courses?.updatedByUser?.password) {
        delete courses.updatedByUser.password;
      }
      return courses;
    });
  }
}
