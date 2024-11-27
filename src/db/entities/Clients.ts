import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { ClientStudent } from "./ClientStudent";
import { Users } from "./Users";
import { LinkStudentRequest } from "./LinkStudentRequest";

@Index("u_clients_number", ["active", "mobileNumber"], { unique: true })
@Index("u_clients_email", ["active", "email"], { unique: true })
@Index("Clients_pkey", ["clientId"], { unique: true })
@Entity("Clients", { schema: "dbo" })
export class Clients {
  @PrimaryGeneratedColumn({ type: "bigint", name: "ClientId" })
  clientId: string;

  @Column("character varying", { name: "ClientCode", nullable: true })
  clientCode: string | null;

  @Column("character varying", { name: "FullName", default: () => "''" })
  fullName: string;

  @Column("character varying", { name: "MobileNumber" })
  mobileNumber: string;

  @Column("character varying", { name: "Email", nullable: true })
  email: string | null;

  @Column("timestamp with time zone", {
    name: "RegistrationDate",
    default: () => "(now() AT TIME ZONE 'Asia/Manila')",
  })
  registrationDate: Date;

  @Column("timestamp with time zone", { name: "UpdatedDate", nullable: true })
  updatedDate: Date | null;

  @Column("boolean", { name: "Active", default: () => "true" })
  active: boolean;

  @Column("character varying", { name: "OrgEmployeeId", nullable: true })
  orgEmployeeId: string | null;

  @OneToMany(() => ClientStudent, (clientStudent) => clientStudent.client)
  clientStudents: ClientStudent[];

  @ManyToOne(() => Users, (users) => users.clients)
  @JoinColumn([{ name: "RegisteredByUserId", referencedColumnName: "userId" }])
  registeredByUser: Users;

  @ManyToOne(() => Users, (users) => users.clients2)
  @JoinColumn([{ name: "UpdatedByUserId", referencedColumnName: "userId" }])
  updatedByUser: Users;

  @ManyToOne(() => Users, (users) => users.clients3)
  @JoinColumn([{ name: "UserId", referencedColumnName: "userId" }])
  user: Users;

  @OneToMany(
    () => LinkStudentRequest,
    (linkStudentRequest) => linkStudentRequest.requestedByClient
  )
  linkStudentRequests: LinkStudentRequest[];
}
