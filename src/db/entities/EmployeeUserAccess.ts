import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { EmployeeUser } from "./EmployeeUser";
import { Users } from "./Users";
import { Schools } from "./Schools";

@Index("EmployeeUserAccess_pkey", ["employeeUserAccessId"], { unique: true })
@Entity("EmployeeUserAccess", { schema: "dbo" })
export class EmployeeUserAccess {
  @PrimaryGeneratedColumn({ type: "bigint", name: "EmployeeUserAccessId" })
  employeeUserAccessId: string;

  @Column("character varying", {
    name: "EmployeeUserAccessCode",
    nullable: true,
  })
  employeeUserAccessCode: string | null;

  @Column("character varying", { name: "Name" })
  name: string;

  @Column("json", { name: "AccessPages", default: [] })
  accessPages: object;

  @Column("timestamp with time zone", {
    name: "CreatedDate",
    default: () => "(now() AT TIME ZONE 'Asia/Manila')",
  })
  createdDate: Date;

  @Column("timestamp with time zone", { name: "UpdatedDate", nullable: true })
  updatedDate: Date | null;

  @Column("boolean", { name: "Active", default: () => "true" })
  active: boolean;

  @OneToMany(
    () => EmployeeUser,
    (employeeUser) => employeeUser.employeeUserAccess
  )
  employeeUsers: EmployeeUser[];

  @ManyToOne(() => Users, (users) => users.employeeUserAccesses)
  @JoinColumn([{ name: "CreatedByUserId", referencedColumnName: "userId" }])
  createdByUser: Users;

  @ManyToOne(() => Schools, (schools) => schools.employeeUserAccesses)
  @JoinColumn([{ name: "SchoolId", referencedColumnName: "schoolId" }])
  school: Schools;

  @ManyToOne(() => Users, (users) => users.employeeUserAccesses2)
  @JoinColumn([{ name: "UpdatedByUserId", referencedColumnName: "userId" }])
  updatedByUser: Users;
}
