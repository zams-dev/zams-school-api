import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Users } from "./Users";

@Index("Operators_pkey", ["operatorId"], { unique: true })
@Entity("Operators", { schema: "dbo" })
export class Operators {
  @PrimaryGeneratedColumn({ type: "bigint", name: "OperatorId" })
  operatorId: string;

  @Column("character varying", { name: "OperatorCode", nullable: true })
  operatorCode: string | null;

  @Column("character varying", { name: "Name" })
  name: string;

  @Column("boolean", { name: "Active", default: () => "true" })
  active: boolean;

  @ManyToOne(() => Users, (users) => users.operators)
  @JoinColumn([{ name: "UserId", referencedColumnName: "userId" }])
  user: Users;
}
