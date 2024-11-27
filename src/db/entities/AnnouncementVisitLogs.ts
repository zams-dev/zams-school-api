import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { Announcements } from "./Announcements";
import { Users } from "./Users";

@Index("AnnouncementVisitLogs_pkey", ["announcementId", "userId"], {
  unique: true,
})
@Entity("AnnouncementVisitLogs", { schema: "dbo" })
export class AnnouncementVisitLogs {
  @Column("bigint", { primary: true, name: "AnnouncementId" })
  announcementId: string;

  @Column("bigint", { primary: true, name: "UserId" })
  userId: string;

  @Column("timestamp with time zone", {
    name: "FirstDateVisited",
    nullable: true,
  })
  firstDateVisited: Date | null;

  @Column("timestamp with time zone", { name: "LastDateVisited" })
  lastDateVisited: Date;

  @Column("bigint", { name: "VisitCount", default: () => "1" })
  visitCount: string;

  @ManyToOne(
    () => Announcements,
    (announcements) => announcements.announcementVisitLogs
  )
  @JoinColumn([
    { name: "AnnouncementId", referencedColumnName: "announcementId" },
  ])
  announcement: Announcements;

  @ManyToOne(() => Users, (users) => users.announcementVisitLogs)
  @JoinColumn([{ name: "UserId", referencedColumnName: "userId" }])
  user: Users;
}
