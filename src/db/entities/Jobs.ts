import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("Jobs_pkey", ["jobId"], { unique: true })
@Entity("Jobs", { schema: "dbo" })
export class Jobs {
  @PrimaryGeneratedColumn({ type: "bigint", name: "JobId" })
  jobId: string;

  @Column("character varying", { name: "JobCronTime" })
  jobCronTime: string;

  @Column("enum", {
    name: "JobType",
    enum: ["ANNOUNCEMENTS_SENDER", "LINK_REQUEST_PENDING_REMINDER"],
  })
  jobType: "ANNOUNCEMENTS_SENDER" | "LINK_REQUEST_PENDING_REMINDER";

  @Column("character varying", { name: "JobReferenceId" })
  jobReferenceId: string;

  @Column("json", { name: "Payload", nullable: true })
  payload: object | null;

  @Column("json", { name: "Response", nullable: true })
  response: object | null;

  @Column("character varying", { name: "Description", nullable: true })
  description: string | null;

  @Column("timestamp with time zone", {
    name: "DateTimeCreated",
    default: () => "(now() AT TIME ZONE 'utc')",
  })
  dateTimeCreated: Date;

  @Column("timestamp with time zone", {
    name: "DateTimeUpdated",
    nullable: true,
  })
  dateTimeUpdated: Date | null;

  @Column("timestamp with time zone", {
    name: "DateTimeStarted",
    nullable: true,
  })
  dateTimeStarted: Date | null;

  @Column("timestamp with time zone", {
    name: "DateTimeCompleted",
    nullable: true,
  })
  dateTimeCompleted: Date | null;

  @Column("timestamp with time zone", {
    name: "DateTimeFailed",
    nullable: true,
  })
  dateTimeFailed: Date | null;

  @Column("enum", {
    name: "Status",
    enum: ["PENDING", "RUNNING", "COMPLETED", "FAILED", "CANCELLED"],
    default: () => "'PENDING'.job_status",
  })
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED";
}
