import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { Users } from "./Users";

@Index("UserFirebaseToken_pkey", ["device", "firebaseToken", "userId"], {
  unique: true,
})
@Entity("UserFirebaseToken", { schema: "dbo" })
export class UserFirebaseToken {
  @Column("bigint", { primary: true, name: "UserId" })
  userId: string;

  @Column("character varying", { primary: true, name: "FirebaseToken" })
  firebaseToken: string;

  @Column("character varying", { primary: true, name: "Device" })
  device: string;

  @ManyToOne(() => Users, (users) => users.userFirebaseTokens)
  @JoinColumn([{ name: "UserId", referencedColumnName: "userId" }])
  user: Users;
}
