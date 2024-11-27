import {
  Column,
  Entity,
  Index,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { AnnouncementVisitLogs } from "./AnnouncementVisitLogs";
import { Announcements } from "./Announcements";
import { Clients } from "./Clients";
import { Courses } from "./Courses";
import { Departments } from "./Departments";
import { EmployeeTitles } from "./EmployeeTitles";
import { EmployeeUser } from "./EmployeeUser";
import { EmployeeUserAccess } from "./EmployeeUserAccess";
import { Employees } from "./Employees";
import { LinkStudentRequest } from "./LinkStudentRequest";
import { Machines } from "./Machines";
import { Notifications } from "./Notifications";
import { Operators } from "./Operators";
import { SchoolRequestAccess } from "./SchoolRequestAccess";
import { SchoolYearLevels } from "./SchoolYearLevels";
import { Schools } from "./Schools";
import { Sections } from "./Sections";
import { Strands } from "./Strands";
import { Students } from "./Students";
import { UserFirebaseToken } from "./UserFirebaseToken";
import { UserOneSignalSubscription } from "./UserOneSignalSubscription";
import { UserProfilePic } from "./UserProfilePic";

@Index("u_user", ["active", "userName"], { unique: true })
@Index("Users_pkey", ["userId"], { unique: true })
@Entity("Users", { schema: "dbo" })
export class Users {
  @PrimaryGeneratedColumn({ type: "bigint", name: "UserId" })
  userId: string;

  @Column("character varying", { name: "UserCode", nullable: true })
  userCode: string | null;

  @Column("character varying", { name: "UserName" })
  userName: string;

  @Column("character varying", { name: "Password" })
  password: string;

  @Column("character varying", { name: "UserType" })
  userType: string;

  @Column("timestamp with time zone", {
    name: "DateRegistered",
    default: () => "(now() AT TIME ZONE 'Asia/Manila')",
  })
  dateRegistered: Date;

  @Column("timestamp with time zone", { name: "DateUpdated", nullable: true })
  dateUpdated: Date | null;

  @Column("boolean", { name: "Active", default: () => "true" })
  active: boolean;

  @OneToMany(
    () => AnnouncementVisitLogs,
    (announcementVisitLogs) => announcementVisitLogs.user
  )
  announcementVisitLogs: AnnouncementVisitLogs[];

  @OneToMany(
    () => Announcements,
    (announcements) => announcements.createdByUser
  )
  announcements: Announcements[];

  @OneToMany(
    () => Announcements,
    (announcements) => announcements.updatedByUser
  )
  announcements2: Announcements[];

  @OneToMany(() => Clients, (clients) => clients.registeredByUser)
  clients: Clients[];

  @OneToMany(() => Clients, (clients) => clients.updatedByUser)
  clients2: Clients[];

  @OneToMany(() => Clients, (clients) => clients.user)
  clients3: Clients[];

  @OneToMany(() => Courses, (courses) => courses.createdByUser)
  courses: Courses[];

  @OneToMany(() => Courses, (courses) => courses.updatedByUser)
  courses2: Courses[];

  @OneToMany(() => Departments, (departments) => departments.createdByUser)
  departments: Departments[];

  @OneToMany(() => Departments, (departments) => departments.updatedByUser)
  departments2: Departments[];

  @OneToMany(
    () => EmployeeTitles,
    (employeeTitles) => employeeTitles.createdByUser
  )
  employeeTitles: EmployeeTitles[];

  @OneToMany(
    () => EmployeeTitles,
    (employeeTitles) => employeeTitles.updatedByUser
  )
  employeeTitles2: EmployeeTitles[];

  @OneToMany(() => EmployeeUser, (employeeUser) => employeeUser.user)
  employeeUsers: EmployeeUser[];

  @OneToMany(
    () => EmployeeUserAccess,
    (employeeUserAccess) => employeeUserAccess.createdByUser
  )
  employeeUserAccesses: EmployeeUserAccess[];

  @OneToMany(
    () => EmployeeUserAccess,
    (employeeUserAccess) => employeeUserAccess.updatedByUser
  )
  employeeUserAccesses2: EmployeeUserAccess[];

  @OneToMany(() => Employees, (employees) => employees.createdByUser)
  employees: Employees[];

  @OneToMany(() => Employees, (employees) => employees.updatedByUser)
  employees2: Employees[];

  @OneToMany(
    () => LinkStudentRequest,
    (linkStudentRequest) => linkStudentRequest.updatedByUser
  )
  linkStudentRequests: LinkStudentRequest[];

  @OneToMany(() => Machines, (machines) => machines.createdByUser)
  machines: Machines[];

  @OneToMany(() => Machines, (machines) => machines.updatedByUser)
  machines2: Machines[];

  @OneToMany(() => Notifications, (notifications) => notifications.forUser)
  notifications: Notifications[];

  @OneToMany(() => Operators, (operators) => operators.user)
  operators: Operators[];

  @OneToMany(
    () => SchoolRequestAccess,
    (schoolRequestAccess) => schoolRequestAccess.requestedByUser
  )
  schoolRequestAccesses: SchoolRequestAccess[];

  @OneToMany(
    () => SchoolRequestAccess,
    (schoolRequestAccess) => schoolRequestAccess.updatedByUser
  )
  schoolRequestAccesses2: SchoolRequestAccess[];

  @OneToMany(
    () => SchoolYearLevels,
    (schoolYearLevels) => schoolYearLevels.createdByUser
  )
  schoolYearLevels: SchoolYearLevels[];

  @OneToMany(
    () => SchoolYearLevels,
    (schoolYearLevels) => schoolYearLevels.updatedByUser
  )
  schoolYearLevels2: SchoolYearLevels[];

  @OneToMany(() => Schools, (schools) => schools.registeredByUser)
  schools: Schools[];

  @OneToMany(() => Schools, (schools) => schools.updatedByUser)
  schools2: Schools[];

  @OneToMany(() => Sections, (sections) => sections.createdByUser)
  sections: Sections[];

  @OneToMany(() => Sections, (sections) => sections.updatedByUser)
  sections2: Sections[];

  @OneToMany(() => Strands, (strands) => strands.createdByUser)
  strands: Strands[];

  @OneToMany(() => Strands, (strands) => strands.updatedByUser)
  strands2: Strands[];

  @OneToMany(() => Students, (students) => students.registeredByUser)
  students: Students[];

  @OneToMany(() => Students, (students) => students.updatedByUser)
  students2: Students[];

  @OneToMany(
    () => UserFirebaseToken,
    (userFirebaseToken) => userFirebaseToken.user
  )
  userFirebaseTokens: UserFirebaseToken[];

  @OneToMany(
    () => UserOneSignalSubscription,
    (userOneSignalSubscription) => userOneSignalSubscription.user
  )
  userOneSignalSubscriptions: UserOneSignalSubscription[];

  @OneToOne(() => UserProfilePic, (userProfilePic) => userProfilePic.user)
  userProfilePic: UserProfilePic;
}
