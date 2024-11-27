import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { AnnouncementVisitLogs } from "./AnnouncementVisitLogs";
import { Users } from "./Users";
import { Schools } from "./Schools";

@Index("Announcements_pkey", ["announcementId"], { unique: true })
@Entity("Announcements", { schema: "dbo" })
export class Announcements {
  @PrimaryGeneratedColumn({ type: "bigint", name: "AnnouncementId" })
  announcementId: string;

  @Column("character varying", { name: "AnnouncementCode", nullable: true })
  announcementCode: string | null;

  @Column("enum", {
    name: "Status",
    nullable: true,
    enum: ["DRAFT", "PENDING", "SENDING", "SENT", "CANCELLED"],
    default: () => "'DRAFT'.announcement_status",
  })
  status: "DRAFT" | "PENDING" | "SENDING" | "SENT" | "CANCELLED" | null;

  @Column("character varying", { name: "Title" })
  title: string;

  @Column("text", { name: "Description" })
  description: string;

  @Column("varchar", {
    name: "AudienceType",
    nullable: true,
    array: true,
    default: () => "'{}'[]",
  })
  audienceType: string[] | null;

  @Column("enum", {
    name: "AudienceMode",
    enum: ["SEND_TO_ALL", "SEND_TO_ONE", "SEND_TO_MANY"],
  })
  audienceMode: "SEND_TO_ALL" | "SEND_TO_ONE" | "SEND_TO_MANY";

  @Column("json", { name: "EmployeeFilter", default: [] })
  employeeFilter: object;

  @Column("varchar", {
    name: "EmployeeExcluded",
    nullable: true,
    array: true,
    default: () => "'{}'[]",
  })
  employeeExcluded: string[] | null;

  @Column("json", { name: "StudentPrimaryFilter", default: [] })
  studentPrimaryFilter: object;

  @Column("varchar", {
    name: "StudentPrimaryExlcuded",
    nullable: true,
    array: true,
    default: () => "'{}'[]",
  })
  studentPrimaryExlcuded: string[] | null;

  @Column("json", { name: "StudentJuniorFilter", default: [] })
  studentJuniorFilter: object;

  @Column("varchar", {
    name: "StudentJuniorExcluded",
    nullable: true,
    array: true,
    default: () => "'{}'[]",
  })
  studentJuniorExcluded: string[] | null;

  @Column("json", { name: "StudentSeniorFilter", default: [] })
  studentSeniorFilter: object;

  @Column("varchar", {
    name: "StudentSeniorExcluded",
    nullable: true,
    array: true,
    default: () => "'{}'[]",
  })
  studentSeniorExcluded: string[] | null;

  @Column("boolean", {
    name: "IsSchedule",
    nullable: true,
    default: () => "false",
  })
  isSchedule: boolean | null;

  @Column("timestamp with time zone", {
    name: "TargetDateTime",
    nullable: true,
  })
  targetDateTime: Date | null;

  @Column("timestamp without time zone", {
    name: "DateTimeSent",
    nullable: true,
  })
  dateTimeSent: Date | null;

  @Column("timestamp without time zone", {
    name: "CreatedDate",
    nullable: true,
    default: () => "now()",
  })
  createdDate: Date | null;

  @Column("timestamp without time zone", {
    name: "UpdatedDate",
    nullable: true,
  })
  updatedDate: Date | null;

  @Column("boolean", { name: "Active", nullable: true, default: () => "true" })
  active: boolean | null;

  @Column("json", { name: "TargetRecipient", nullable: true })
  targetRecipient: object | null;

  @OneToMany(
    () => AnnouncementVisitLogs,
    (announcementVisitLogs) => announcementVisitLogs.announcement
  )
  announcementVisitLogs: AnnouncementVisitLogs[];

  @ManyToOne(() => Users, (users) => users.announcements)
  @JoinColumn([{ name: "CreatedByUserId", referencedColumnName: "userId" }])
  createdByUser: Users;

  @ManyToOne(() => Schools, (schools) => schools.announcements)
  @JoinColumn([{ name: "SchoolId", referencedColumnName: "schoolId" }])
  school: Schools;

  @ManyToOne(() => Users, (users) => users.announcements2)
  @JoinColumn([{ name: "UpdatedByUserId", referencedColumnName: "userId" }])
  updatedByUser: Users;
}
