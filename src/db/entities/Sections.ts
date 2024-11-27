import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Employees } from "./Employees";
import { Users } from "./Users";
import { Departments } from "./Departments";
import { Schools } from "./Schools";
import { SchoolYearLevels } from "./SchoolYearLevels";
import { StudentSection } from "./StudentSection";

@Index("Sections_pkey", ["sectionId"], { unique: true })
@Entity("Sections", { schema: "dbo" })
export class Sections {
  @PrimaryGeneratedColumn({ type: "bigint", name: "SectionId" })
  sectionId: string;

  @Column("character varying", { name: "SectionCode", nullable: true })
  sectionCode: string | null;

  @Column("character varying", { name: "SectionName" })
  sectionName: string;

  @Column("timestamp with time zone", {
    name: "CreatedDate",
    default: () => "(now() AT TIME ZONE 'Asia/Manila')",
  })
  createdDate: Date;

  @Column("timestamp with time zone", { name: "UpdatedDate", nullable: true })
  updatedDate: Date | null;

  @Column("boolean", { name: "Active", default: () => "true" })
  active: boolean;

  @ManyToOne(() => Employees, (employees) => employees.sections)
  @JoinColumn([
    { name: "AdviserEmployeeId", referencedColumnName: "employeeId" },
  ])
  adviserEmployee: Employees;

  @ManyToOne(() => Users, (users) => users.sections)
  @JoinColumn([{ name: "CreatedByUserId", referencedColumnName: "userId" }])
  createdByUser: Users;

  @ManyToOne(() => Departments, (departments) => departments.sections)
  @JoinColumn([{ name: "DepartmentId", referencedColumnName: "departmentId" }])
  department: Departments;

  @ManyToOne(() => Schools, (schools) => schools.sections)
  @JoinColumn([{ name: "SchoolId", referencedColumnName: "schoolId" }])
  school: Schools;

  @ManyToOne(
    () => SchoolYearLevels,
    (schoolYearLevels) => schoolYearLevels.sections
  )
  @JoinColumn([
    { name: "SchoolYearLevelId", referencedColumnName: "schoolYearLevelId" },
  ])
  schoolYearLevel: SchoolYearLevels;

  @ManyToOne(() => Users, (users) => users.sections2)
  @JoinColumn([{ name: "UpdatedByUserId", referencedColumnName: "userId" }])
  updatedByUser: Users;

  @OneToMany(() => StudentSection, (studentSection) => studentSection.section)
  studentSections: StudentSection[];
}
