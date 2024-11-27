import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
} from "typeorm";
import { Sections } from "./Sections";
import { Students } from "./Students";

@Index("StudentSection_pkey", ["sectionId", "studentId"], { unique: true })
@Index("u_StudentSection", ["studentId"], { unique: true })
@Entity("StudentSection", { schema: "dbo" })
export class StudentSection {
  @Column("bigint", { primary: true, name: "StudentId" })
  studentId: string;

  @Column("bigint", { primary: true, name: "SectionId" })
  sectionId: string;

  @Column("date", {
    name: "DateAdded",
    default: () => "(now() AT TIME ZONE 'Asia/Manila')",
  })
  dateAdded: string;

  @ManyToOne(() => Sections, (sections) => sections.studentSections)
  @JoinColumn([{ name: "SectionId", referencedColumnName: "sectionId" }])
  section: Sections;

  @OneToOne(() => Students, (students) => students.studentSection)
  @JoinColumn([{ name: "StudentId", referencedColumnName: "studentId" }])
  student: Students;
}
