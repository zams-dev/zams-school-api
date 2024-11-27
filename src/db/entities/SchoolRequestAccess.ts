import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Users } from "./Users";
import { Schools } from "./Schools";

@Index("SchoolRequestAccess_pkey", ["schoolRequestAccessId"], { unique: true })
@Entity("SchoolRequestAccess", { schema: "dbo" })
export class SchoolRequestAccess {
  @PrimaryGeneratedColumn({ type: "bigint", name: "SchoolRequestAccessId" })
  schoolRequestAccessId: string;

  @Column("character varying", { name: "Status" })
  status: string;

  @Column("timestamp with time zone", {
    name: "DateRequested",
    default: () => "(now() AT TIME ZONE 'Asia/Manila')",
  })
  dateRequested: Date;

  @Column("timestamp with time zone", { name: "UpdatedDate", nullable: true })
  updatedDate: Date | null;

  @ManyToOne(() => Users, (users) => users.schoolRequestAccesses)
  @JoinColumn([{ name: "RequestedByUserId", referencedColumnName: "userId" }])
  requestedByUser: Users;

  @ManyToOne(() => Schools, (schools) => schools.schoolRequestAccesses)
  @JoinColumn([{ name: "SchoolId", referencedColumnName: "schoolId" }])
  school: Schools;

  @ManyToOne(() => Users, (users) => users.schoolRequestAccesses2)
  @JoinColumn([{ name: "UpdatedByUserId", referencedColumnName: "userId" }])
  updatedByUser: Users;
}
