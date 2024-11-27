import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { Clients } from "./Clients";
import { Students } from "./Students";

@Index("ClientStudent_pkey", ["clientId", "studentId"], { unique: true })
@Entity("ClientStudent", { schema: "dbo" })
export class ClientStudent {
  @Column("bigint", { primary: true, name: "ClientId" })
  clientId: string;

  @Column("bigint", { primary: true, name: "StudentId" })
  studentId: string;

  @Column("timestamp with time zone", {
    name: "DateAdded",
    default: () => "(now() AT TIME ZONE 'Asia/Manila')",
  })
  dateAdded: Date;

  @Column("boolean", { name: "Active", default: () => "true" })
  active: boolean;

  @Column("timestamp with time zone", { name: "DateRemoved", nullable: true })
  dateRemoved: Date | null;

  @ManyToOne(() => Clients, (clients) => clients.clientStudents)
  @JoinColumn([{ name: "ClientId", referencedColumnName: "clientId" }])
  client: Clients;

  @ManyToOne(() => Students, (students) => students.clientStudents)
  @JoinColumn([{ name: "StudentId", referencedColumnName: "studentId" }])
  student: Students;
}
