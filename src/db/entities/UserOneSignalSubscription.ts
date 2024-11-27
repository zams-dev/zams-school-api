import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { Users } from "./Users";

@Index("UserOneSignalSubscription_pkey", ["subscriptionId", "userId"], {
  unique: true,
})
@Entity("UserOneSignalSubscription", { schema: "dbo" })
export class UserOneSignalSubscription {
  @Column("bigint", { primary: true, name: "UserId" })
  userId: string;

  @Column("character varying", { primary: true, name: "SubscriptionID" })
  subscriptionId: string;

  @ManyToOne(() => Users, (users) => users.userOneSignalSubscriptions)
  @JoinColumn([{ name: "UserId", referencedColumnName: "userId" }])
  user: Users;
}
