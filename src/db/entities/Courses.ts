import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Users } from "./Users";
import { Schools } from "./Schools";
import { StudentCourse } from "./StudentCourse";

@Index("u_course", ["active", "name", "schoolId"], { unique: true })
@Index("Courses_pkey", ["courseId"], { unique: true })
@Entity("Courses", { schema: "dbo" })
export class Courses {
  @PrimaryGeneratedColumn({ type: "bigint", name: "CourseId" })
  courseId: string;

  @Column("character varying", { name: "CourseCode", nullable: true })
  courseCode: string | null;

  @Column("bigint", { name: "SchoolId" })
  schoolId: string;

  @Column("character varying", { name: "Name" })
  name: string;

  @Column("timestamp with time zone", {
    name: "CreatedDate",
    default: () => "(now() AT TIME ZONE 'Asia/Manila')",
  })
  createdDate: Date;

  @Column("timestamp with time zone", { name: "UpdatedDate", nullable: true })
  updatedDate: Date | null;

  @Column("boolean", { name: "Active", default: () => "true" })
  active: boolean;

  @ManyToOne(() => Users, (users) => users.courses)
  @JoinColumn([{ name: "CreatedByUserId", referencedColumnName: "userId" }])
  createdByUser: Users;

  @ManyToOne(() => Schools, (schools) => schools.courses)
  @JoinColumn([{ name: "SchoolId", referencedColumnName: "schoolId" }])
  school: Schools;

  @ManyToOne(() => Users, (users) => users.courses2)
  @JoinColumn([{ name: "UpdatedByUserId", referencedColumnName: "userId" }])
  updatedByUser: Users;

  @OneToMany(() => StudentCourse, (studentCourse) => studentCourse.course)
  studentCourses: StudentCourse[];
}
