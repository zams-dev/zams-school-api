import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
} from "typeorm";
import { Employees } from "./Employees";
import { EmployeeUserAccess } from "./EmployeeUserAccess";
import { Users } from "./Users";

@Index("u_Employee", ["employeeId"], { unique: true })
@Index("EmployeeUser_pkey", ["employeeId", "userId"], { unique: true })
@Entity("EmployeeUser", { schema: "dbo" })
export class EmployeeUser {
  @Column("bigint", { primary: true, name: "EmployeeId" })
  employeeId: string;

  @Column("bigint", { primary: true, name: "UserId" })
  userId: string;

  @Column("timestamp with time zone", {
    name: "DateRegistered",
    default: () => "(now() AT TIME ZONE 'Asia/Manila')",
  })
  dateRegistered: Date;

  @Column("boolean", { name: "Active", default: () => "true" })
  active: boolean;

  @OneToOne(() => Employees, (employees) => employees.employeeUser)
  @JoinColumn([{ name: "EmployeeId", referencedColumnName: "employeeId" }])
  employee: Employees;

  @ManyToOne(
    () => EmployeeUserAccess,
    (employeeUserAccess) => employeeUserAccess.employeeUsers
  )
  @JoinColumn([
    {
      name: "EmployeeUserAccessId",
      referencedColumnName: "employeeUserAccessId",
    },
  ])
  employeeUserAccess: EmployeeUserAccess;

  @ManyToOne(() => Users, (users) => users.employeeUsers)
  @JoinColumn([{ name: "UserId", referencedColumnName: "userId" }])
  user: Users;
}
