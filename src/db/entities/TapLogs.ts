import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Machines } from "./Machines";

@Index("TapLogs_pkey", ["tapLogId"], { unique: true })
@Entity("TapLogs", { schema: "dbo" })
export class TapLogs {
  @PrimaryGeneratedColumn({ type: "bigint", name: "TapLogId" })
  tapLogId: string;

  @Column("character varying", { name: "Status" })
  status: string;

  @Column("date", {
    name: "Date",
    default: () => "(now() AT TIME ZONE 'Asia/Manila')",
  })
  date: string;

  @Column("character varying", { name: "Time" })
  time: string;

  @Column("character varying", { name: "CardNumber", default: () => "''" })
  cardNumber: string;

  @Column("character varying", { name: "Type", default: () => "''" })
  type: string;

  @ManyToOne(() => Machines, (machines) => machines.tapLogs)
  @JoinColumn([{ name: "MachineId", referencedColumnName: "machineId" }])
  machine: Machines;
}
