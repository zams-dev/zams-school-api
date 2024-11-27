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
import { StudentStrand } from "./StudentStrand";

@Index("u_strand", ["active", "name", "schoolId"], { unique: true })
@Index("Strands_pkey", ["strandId"], { unique: true })
@Entity("Strands", { schema: "dbo" })
export class Strands {
  @PrimaryGeneratedColumn({ type: "bigint", name: "StrandId" })
  strandId: string;

  @Column("character varying", { name: "StrandCode", nullable: true })
  strandCode: string | null;

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

  @ManyToOne(() => Users, (users) => users.strands)
  @JoinColumn([{ name: "CreatedByUserId", referencedColumnName: "userId" }])
  createdByUser: Users;

  @ManyToOne(() => Schools, (schools) => schools.strands)
  @JoinColumn([{ name: "SchoolId", referencedColumnName: "schoolId" }])
  school: Schools;

  @ManyToOne(() => Users, (users) => users.strands2)
  @JoinColumn([{ name: "UpdatedByUserId", referencedColumnName: "userId" }])
  updatedByUser: Users;

  @OneToMany(() => StudentStrand, (studentStrand) => studentStrand.strand)
  studentStrands: StudentStrand[];
}
