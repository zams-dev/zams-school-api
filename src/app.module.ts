import { Module } from "@nestjs/common";
import { AppService } from "./app.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TypeOrmConfigService } from "./db/typeorm/typeorm.service";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./modules/auth/auth.module";
import { createConfig, getEnvPath } from "./common/utils/utils";
import { SchoolsModule } from "./modules/schools/schools.module";
import { DepartmentsModule } from "./modules/departments/departments.module";
import { CoursesModule } from "./modules/courses/courses.module";
import { SchoolYearLevelsModule } from "./modules/school-year-levels/school-year-levels.module";
import { SectionsModule } from "./modules/sections/sections.module";
import { EmployeeTitlesModule } from "./modules/employee-titles/employee-titles.module";
import { StudentsModule } from "./modules/students/students.module";
import { EmployeesModule } from "./modules/employees/employees.module";
import { OperatorsModule } from "./modules/operators/operators.module";
import { ClientsModule } from "./modules/clients/clients.module";
import { LinkStudentRequestModule } from "./modules/link-student-request/link-student-request.module";
import { UserFirebaseTokenModule } from "./modules/user-firebase-token/user-firebase-token.module";
import { TapLogsModule } from "./modules/tap-logs/tap-logs.module";
import { MachinesModule } from "./modules/machines/machines.module";
import { StrandsModule } from "./modules/strands/strands.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { UserOneSignalSubscriptionModule } from "./modules/user-one-signal-subscription/user-one-signal-subscription.module";
import { AnnouncementsModule } from "./modules/announcements/announcements.module";
import { EmployeeUserModule } from "./modules/employee-user/employee-user.module";
import { EmployeeUserAccessModule } from "./modules/employee-user-access/employee-user-access.module";
import { AppReleaseModule } from "./modules/app-release/app-release.module";
import { AttendanceModule } from "./modules/attendance/attendance.module";
import { DateTimeCheckerModule } from "./modules/date-time-checker/date-time-checker.module";
import { JobsModule } from "./modules/jobs/jobs.module";
import { DashboardClientModule } from "./modules/dashboard-client/dashboard-client.module";
import { DashboardOrganizationModule } from "./modules/dashboard-organization/dashboard-organization.module";
import { ThrottlerModule } from "@nestjs/throttler";
import { CustomCacheManagerModule } from "./modules/custom-cache-manager/custom-cache-manager.module";
import { AppController } from "./app.controller";
import { FirebaseProviderModule } from "./core/provider/firebase/firebase-provider.module";
// const config = createConfig();--for dynamic config using aws secrets
const envFilePath: string = getEnvPath(`${__dirname}/common/envs`);

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60,
        limit: 10,
      },
    ]),
    ConfigModule.forRoot({
      // ...config,
      envFilePath,
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({ useClass: TypeOrmConfigService }),
    FirebaseProviderModule,
    AuthModule,
    SchoolsModule,
    EmployeeUserAccessModule,
    EmployeeTitlesModule,
    DepartmentsModule,
    CoursesModule,
    SchoolYearLevelsModule,
    SectionsModule,
    OperatorsModule,
    EmployeesModule,
    EmployeeUserModule,
    StudentsModule,
    ClientsModule,
    LinkStudentRequestModule,
    UserFirebaseTokenModule,
    MachinesModule,
    TapLogsModule,
    StrandsModule,
    NotificationsModule,
    UserOneSignalSubscriptionModule,
    AnnouncementsModule,
    AppReleaseModule,
    DashboardClientModule,
    DashboardOrganizationModule,
    AttendanceModule,
    DateTimeCheckerModule,
    JobsModule,
    CustomCacheManagerModule,
  ],
  providers: [AppService],
  controllers: [],
})
export class AppModule {}
