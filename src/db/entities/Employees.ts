import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { EmployeeUser } from "./EmployeeUser";
import { Users } from "./Users";
import { Departments } from "./Departments";
import { EmployeeTitles } from "./EmployeeTitles";
import { Schools } from "./Schools";
import { Sections } from "./Sections";

@Index("Employees_pkey", ["employeeId"], { unique: true })
@Entity("Employees", { schema: "dbo" })
export class Employees {
  @PrimaryGeneratedColumn({ type: "bigint", name: "EmployeeId" })
  employeeId: string;

  @Column("character varying", { name: "EmployeeCode", nullable: true })
  employeeCode: string | null;

  @Column("timestamp with time zone", {
    name: "CreatedDate",
    default: () => "(now() AT TIME ZONE 'Asia/Manila')",
  })
  createdDate: Date;

  @Column("timestamp with time zone", { name: "UpdatedDate", nullable: true })
  updatedDate: Date | null;

  @Column("boolean", { name: "Active", default: () => "true" })
  active: boolean;

  @Column("boolean", { name: "AccessGranted", default: () => "false" })
  accessGranted: boolean;

  @Column("character varying", {
    name: "MobileNumber",
    nullable: true,
    default: () => "0",
  })
  mobileNumber: string | null;

  @Column("character varying", { name: "CardNumber", nullable: true })
  cardNumber: string | null;

  @Column("character varying", { name: "FullName" })
  fullName: string;

  @Column("character varying", {
    name: "OrgEmployeeId",
    nullable: true,
    default: () => "''",
  })
  orgEmployeeId: string | null;

  @OneToOne(() => EmployeeUser, (employeeUser) => employeeUser.employee)
  employeeUser: EmployeeUser;

  @ManyToOne(() => Users, (users) => users.employees)
  @JoinColumn([{ name: "CreatedByUserId", referencedColumnName: "userId" }])
  createdByUser: Users;

  @ManyToOne(() => Departments, (departments) => departments.employees)
  @JoinColumn([{ name: "DepartmentId", referencedColumnName: "departmentId" }])
  department: Departments;

  @ManyToOne(() => EmployeeTitles, (employeeTitles) => employeeTitles.employees)
  @JoinColumn([
    { name: "EmployeePositionId", referencedColumnName: "employeeTitleId" },
  ])
  employeePosition: EmployeeTitles;

  @ManyToOne(() => Schools, (schools) => schools.employees)
  @JoinColumn([{ name: "SchoolId", referencedColumnName: "schoolId" }])
  school: Schools;

  @ManyToOne(() => Users, (users) => users.employees2)
  @JoinColumn([{ name: "UpdatedByUserId", referencedColumnName: "userId" }])
  updatedByUser: Users;

  @OneToMany(() => Sections, (sections) => sections.adviserEmployee)
  sections: Sections[];
}
