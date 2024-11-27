import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("EmailVerificationLog_pkey", ["emailVerificationLog"], { unique: true })
@Entity("UserEmailVerificationLog", { schema: "dbo" })
export class UserEmailVerificationLog {
  @PrimaryGeneratedColumn({ type: "bigint", name: "EmailVerificationLog" })
  emailVerificationLog: string;

  @Column("uuid", { name: "SessionId" })
  sessionId: string;

  @Column("character varying", { name: "Email" })
  email: string;

  @Column("character varying", { name: "VerificationCode" })
  verificationCode: string;

  @Column("enum", {
    name: "Type",
    enum: [
      "LOGIN",
      "LOGOUT",
      "PASSWORD_RESET",
      "EMAIL_VERIFICATION",
      "EMAIL_CHANGE",
      "EMAIL_UPDATE_VERIFICATION",
      "PHONE_VERIFICATION",
      "ACCOUNT_ACTIVATION",
      "ACCOUNT_DEACTIVATION",
      "ACCOUNT_REACTIVATION",
      "LOGIN_CONFIRMATION",
      "ACCOUNT_DELETION",
      "SOCIAL_LOGIN_LINK",
      "DEVICE_VERIFICATION",
    ],
  })
  type:
    | "LOGIN"
    | "LOGOUT"
    | "PASSWORD_RESET"
    | "EMAIL_VERIFICATION"
    | "EMAIL_CHANGE"
    | "EMAIL_UPDATE_VERIFICATION"
    | "PHONE_VERIFICATION"
    | "ACCOUNT_ACTIVATION"
    | "ACCOUNT_DEACTIVATION"
    | "ACCOUNT_REACTIVATION"
    | "LOGIN_CONFIRMATION"
    | "ACCOUNT_DELETION"
    | "SOCIAL_LOGIN_LINK"
    | "DEVICE_VERIFICATION";

  @Column("boolean", { name: "IsVerified", default: () => "false" })
  isVerified: boolean;

  @Column("boolean", { name: "IsUsed", nullable: true, default: () => "false" })
  isUsed: boolean | null;
}
