import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
} from "typeorm";
import { Courses } from "./Courses";
import { Students } from "./Students";

@Index("StudentCourse_pkey", ["courseId", "studentId"], { unique: true })
@Index("u_StudentCourse", ["studentId"], { unique: true })
@Entity("StudentCourse", { schema: "dbo" })
export class StudentCourse {
  @Column("bigint", { primary: true, name: "StudentId" })
  studentId: string;

  @Column("bigint", { primary: true, name: "CourseId" })
  courseId: string;

  @Column("date", {
    name: "EnrolledDate",
    default: () => "(now() AT TIME ZONE 'Asia/Manila')",
  })
  enrolledDate: string;

  @ManyToOne(() => Courses, (courses) => courses.studentCourses)
  @JoinColumn([{ name: "CourseId", referencedColumnName: "courseId" }])
  course: Courses;

  @OneToOne(() => Students, (students) => students.studentCourse)
  @JoinColumn([{ name: "StudentId", referencedColumnName: "studentId" }])
  student: Students;
}
