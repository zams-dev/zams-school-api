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
import { Employees } from "./Employees";
import { Sections } from "./Sections";
import { Students } from "./Students";

@Index("u_department", ["active", "departmentName", "schoolId"], {
  unique: true,
})
@Index("Departments_pkey", ["departmentId"], { unique: true })
@Entity("Departments", { schema: "dbo" })
export class Departments {
  @PrimaryGeneratedColumn({ type: "bigint", name: "DepartmentId" })
  departmentId: string;

  @Column("character varying", { name: "DepartmentCode", nullable: true })
  departmentCode: string | null;

  @Column("bigint", { name: "SchoolId" })
  schoolId: string;

  @Column("character varying", { name: "DepartmentName" })
  departmentName: string;

  @Column("timestamp with time zone", {
    name: "CreatedDate",
    default: () => "(now() AT TIME ZONE 'Asia/Manila')",
  })
  createdDate: Date;

  @Column("timestamp with time zone", { name: "UpdatedDate", nullable: true })
  updatedDate: Date | null;

  @Column("boolean", { name: "Active", default: () => "true" })
  active: boolean;

  @Column("character varying", { name: "Type", nullable: true })
  type: string | null;

  @ManyToOne(() => Users, (users) => users.departments)
  @JoinColumn([{ name: "CreatedByUserId", referencedColumnName: "userId" }])
  createdByUser: Users;

  @ManyToOne(() => Schools, (schools) => schools.departments)
  @JoinColumn([{ name: "SchoolId", referencedColumnName: "schoolId" }])
  school: Schools;

  @ManyToOne(() => Users, (users) => users.departments2)
  @JoinColumn([{ name: "UpdatedByUserId", referencedColumnName: "userId" }])
  updatedByUser: Users;

  @OneToMany(() => Employees, (employees) => employees.department)
  employees: Employees[];

  @OneToMany(() => Sections, (sections) => sections.department)
  sections: Sections[];

  @OneToMany(() => Students, (students) => students.department)
  students: Students[];
}
