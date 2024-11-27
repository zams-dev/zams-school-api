import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Announcements } from "./Announcements";
import { Courses } from "./Courses";
import { Departments } from "./Departments";
import { EmployeeTitles } from "./EmployeeTitles";
import { EmployeeUserAccess } from "./EmployeeUserAccess";
import { Employees } from "./Employees";
import { LinkStudentRequest } from "./LinkStudentRequest";
import { Machines } from "./Machines";
import { SchoolRequestAccess } from "./SchoolRequestAccess";
import { SchoolYearLevels } from "./SchoolYearLevels";
import { Users } from "./Users";
import { Sections } from "./Sections";
import { Strands } from "./Strands";
import { Students } from "./Students";

@Index("Schools_pkey", ["schoolId"], { unique: true })
@Entity("Schools", { schema: "dbo" })
export class Schools {
  @PrimaryGeneratedColumn({ type: "bigint", name: "SchoolId" })
  schoolId: string;

  @Column("character varying", { name: "SchoolCode", nullable: true })
  schoolCode: string | null;

  @Column("character varying", { name: "SchoolName" })
  schoolName: string;

  @Column("character varying", {
    name: "StudentsAllowableTimeLate",
    nullable: true,
  })
  studentsAllowableTimeLate: string | null;

  @Column("character varying", { name: "StudentsTimeLate", nullable: true })
  studentsTimeLate: string | null;

  @Column("boolean", { name: "RestrictGuardianTime", nullable: true })
  restrictGuardianTime: boolean | null;

  @Column("character varying", {
    name: "EmployeesTimeBeforeSwipeIsAllowed",
    nullable: true,
  })
  employeesTimeBeforeSwipeIsAllowed: string | null;

  @Column("character varying", {
    name: "EmployeesAllowableTimeLate",
    nullable: true,
  })
  employeesAllowableTimeLate: string | null;

  @Column("character varying", { name: "EmployeesTimeLate", nullable: true })
  employeesTimeLate: string | null;

  @Column("character varying", {
    name: "TimeBeforeSwipeIsAllowed",
    nullable: true,
  })
  timeBeforeSwipeIsAllowed: string | null;

  @Column("character varying", {
    name: "SMSNotificationForStaffEntry",
    nullable: true,
  })
  smsNotificationForStaffEntry: string | null;

  @Column("character varying", {
    name: "SMSNotificationForStudentBreakTime",
    nullable: true,
  })
  smsNotificationForStudentBreakTime: string | null;

  @Column("character varying", { name: "SchoolContactNumber", nullable: true })
  schoolContactNumber: string | null;

  @Column("character varying", { name: "SchoolAddress", nullable: true })
  schoolAddress: string | null;

  @Column("character varying", { name: "SchoolEmail", nullable: true })
  schoolEmail: string | null;

  @Column("timestamp with time zone", {
    name: "DateRegistered",
    default: () => "(now() AT TIME ZONE 'Asia/Manila')",
  })
  dateRegistered: Date;

  @Column("timestamp with time zone", { name: "DateUpdated", nullable: true })
  dateUpdated: Date | null;

  @Column("boolean", { name: "Active", default: () => "true" })
  active: boolean;

  @Column("character varying", { name: "OrgSchoolCode", default: () => "''" })
  orgSchoolCode: string;

  @OneToMany(() => Announcements, (announcements) => announcements.school)
  announcements: Announcements[];

  @OneToMany(() => Courses, (courses) => courses.school)
  courses: Courses[];

  @OneToMany(() => Departments, (departments) => departments.school)
  departments: Departments[];

  @OneToMany(() => EmployeeTitles, (employeeTitles) => employeeTitles.school)
  employeeTitles: EmployeeTitles[];

  @OneToMany(
    () => EmployeeUserAccess,
    (employeeUserAccess) => employeeUserAccess.school
  )
  employeeUserAccesses: EmployeeUserAccess[];

  @OneToMany(() => Employees, (employees) => employees.school)
  employees: Employees[];

  @OneToMany(
    () => LinkStudentRequest,
    (linkStudentRequest) => linkStudentRequest.school
  )
  linkStudentRequests: LinkStudentRequest[];

  @OneToMany(() => Machines, (machines) => machines.school)
  machines: Machines[];

  @OneToMany(
    () => SchoolRequestAccess,
    (schoolRequestAccess) => schoolRequestAccess.school
  )
  schoolRequestAccesses: SchoolRequestAccess[];

  @OneToMany(
    () => SchoolYearLevels,
    (schoolYearLevels) => schoolYearLevels.school
  )
  schoolYearLevels: SchoolYearLevels[];

  @ManyToOne(() => Users, (users) => users.schools)
  @JoinColumn([{ name: "RegisteredByUserId", referencedColumnName: "userId" }])
  registeredByUser: Users;

  @ManyToOne(() => Users, (users) => users.schools2)
  @JoinColumn([{ name: "UpdatedByUserId", referencedColumnName: "userId" }])
  updatedByUser: Users;

  @OneToMany(() => Sections, (sections) => sections.school)
  sections: Sections[];

  @OneToMany(() => Strands, (strands) => strands.school)
  strands: Strands[];

  @OneToMany(() => Students, (students) => students.school)
  students: Students[];
}
