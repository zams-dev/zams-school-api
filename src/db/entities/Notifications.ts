import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Users } from "./Users";

@Index("Notifications_pkey", ["notificationId"], { unique: true })
@Entity("Notifications", { schema: "dbo" })
export class Notifications {
  @PrimaryGeneratedColumn({ type: "bigint", name: "NotificationId" })
  notificationId: string;

  @Column("character varying", { name: "Type" })
  type: string;

  @Column("character varying", { name: "Title" })
  title: string;

  @Column("character varying", { name: "Description" })
  description: string;

  @Column("timestamp with time zone", {
    name: "DateTime",
    default: () => "(now() AT TIME ZONE 'Asia/Manila')",
  })
  dateTime: Date;

  @Column("boolean", { name: "IsRead", default: () => "false" })
  isRead: boolean;

  @Column("boolean", { name: "Active", default: () => "true" })
  active: boolean;

  @Column("character varying", { name: "ReferenceId", default: () => "''" })
  referenceId: string;

  @ManyToOne(() => Users, (users) => users.notifications)
  @JoinColumn([{ name: "ForUserId", referencedColumnName: "userId" }])
  forUser: Users;
}
