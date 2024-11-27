import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("u_version_build", ["appBuild", "appTypeCode", "appVersion"], {
  unique: true,
})
@Index("AppRelease_pkey", ["id"], { unique: true })
@Entity("AppRelease", { schema: "dbo" })
export class AppRelease {
  @PrimaryGeneratedColumn({ type: "bigint", name: "Id" })
  id: string;

  @Column("character varying", { name: "Description" })
  description: string;

  @Column("character", { name: "AppTypeCode", unique: true, length: 1 })
  appTypeCode: string;

  @Column("character varying", { name: "AppVersion", unique: true })
  appVersion: string;

  @Column("character varying", { name: "AppBuild", unique: true })
  appBuild: string;

  @Column("date", {
    name: "Date",
    default: () => "(now() AT TIME ZONE 'Asia/Manila')",
  })
  date: string;
}
