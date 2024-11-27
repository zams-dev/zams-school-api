import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
} from "typeorm";
import { Files } from "./Files";
import { Users } from "./Users";

@Index("pk_userprofilepic_1_1525580473", ["userId"], { unique: true })
@Entity("UserProfilePic", { schema: "dbo" })
export class UserProfilePic {
  @Column("bigint", { primary: true, name: "UserId" })
  userId: string;

  @ManyToOne(() => Files, (files) => files.userProfilePics)
  @JoinColumn([{ name: "FileId", referencedColumnName: "fileId" }])
  file: Files;

  @OneToOne(() => Users, (users) => users.userProfilePic)
  @JoinColumn([{ name: "UserId", referencedColumnName: "userId" }])
  user: Users;
}
