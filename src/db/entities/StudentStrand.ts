import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
} from "typeorm";
import { Strands } from "./Strands";
import { Students } from "./Students";

@Index("StudentStrand_pkey", ["strandId", "studentId"], { unique: true })
@Index("u_StudentStrand", ["studentId"], { unique: true })
@Entity("StudentStrand", { schema: "dbo" })
export class StudentStrand {
  @Column("bigint", { primary: true, name: "StudentId" })
  studentId: string;

  @Column("bigint", { primary: true, name: "StrandId" })
  strandId: string;

  @Column("date", {
    name: "EnrolledDate",
    default: () => "(now() AT TIME ZONE 'Asia/Manila')",
  })
  enrolledDate: string;

  @ManyToOne(() => Strands, (strands) => strands.studentStrands)
  @JoinColumn([{ name: "StrandId", referencedColumnName: "strandId" }])
  strand: Strands;

  @OneToOne(() => Students, (students) => students.studentStrand)
  @JoinColumn([{ name: "StudentId", referencedColumnName: "studentId" }])
  student: Students;
}
