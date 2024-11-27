import { Injectable, Query } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import moment from 'moment-timezone';
import { Students } from "src/db/entities/Students";
import { Repository } from "typeorm";
import { EmployeesService } from "./employees.service";
import { StudentsService } from "./students.service";
import { Employees } from "src/db/entities/Employees";

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Students)
    private readonly studentsRepo: Repository<Students>,
    @InjectRepository(Employees)
    private readonly employeesRepo: Repository<Employees>,
    private studentsService: StudentsService,
    private employeesService: EmployeesService
  ) {}

  async getAttendanceTracker(
    schoolCode = "",
    type: "STUDENT" | "EMPLOYEE",
    date: Date,
    status: "PRESENT" | "ABSENT" | any = "",
    searchKey = "",
    pageNumber = 1,
    pageSize = 10,
    orderColumn = "",
    orderDirection: "ASC" | "DESC" | any
  ) {
    const currentDate = moment(date).format("YYYY-MM-DD");
    const firstDayOfMonth = moment(
      new Date(date.getFullYear(), date.getMonth(), 1).setHours(0, 0, 0, 0)
    ).format("YYYY-MM-DD hh:mm A");
    const lastDayOfMonth = moment(
      new Date(date.getFullYear(), date.getMonth() + 1, 0).setHours(
        23,
        59,
        59,
        999
      )
    ).format("YYYY-MM-DD hh:mm A");

    const studentQuery = `
            SELECT 
                r."StudentCode" as "Code",
                r."OrgStudentId",
                r."FullName",
                r."CardNumber",
                d."DepartmentName" AS "Department",
                syl."Name" AS "SchoolYear",
                sec."SectionName" AS "Section",
                e."FullName" AS "HeadPerson",
                sc."SchoolId",
                CASE 
                    WHEN EXISTS (
                        SELECT 1 
                        FROM dbo."TapLogs" tl 
                        WHERE tl."CardNumber" = r."CardNumber" 
                        AND tl."Date" = (SELECT today FROM CurrentDate)
                    ) THEN 'PRESENT'
                    ELSE 'ABSENT'
                END AS "Status",
                ROW_NUMBER() OVER (
                ORDER BY
                    CASE
                        WHEN (SELECT order_column FROM pagination) = 'code' AND (SELECT order_direction FROM pagination) = 'ASC' THEN r."StudentCode"
                        WHEN (SELECT order_column FROM pagination) = 'orgId' AND (SELECT order_direction FROM pagination) = 'ASC' THEN r."OrgStudentId"
                        WHEN (SELECT order_column FROM pagination) = 'fullName' AND (SELECT order_direction FROM pagination) = 'ASC' THEN r."FullName"
                        WHEN (SELECT order_column FROM pagination) = 'department' AND (SELECT order_direction FROM pagination) = 'ASC' THEN d."DepartmentName"
                        WHEN (SELECT order_column FROM pagination) = 'schoolYear' AND (SELECT order_direction FROM pagination) = 'ASC' THEN syl."Name"
                        WHEN (SELECT order_column FROM pagination) = 'section' AND (SELECT order_direction FROM pagination) = 'ASC' THEN sec."SectionName"
                        WHEN (SELECT order_column FROM pagination) = 'headPerson' AND (SELECT order_direction FROM pagination) = 'ASC' THEN e."FullName"
                        WHEN (SELECT order_direction FROM pagination) = 'ASC' THEN r."StudentCode"
                    END ASC,
                    CASE
                        WHEN (SELECT order_column FROM pagination) = 'Code' AND (SELECT order_direction FROM pagination) = 'DESC' THEN r."StudentCode"
                        WHEN (SELECT order_column FROM pagination) = 'orgId' AND (SELECT order_direction FROM pagination) = 'DESC' THEN r."OrgStudentId"
                        WHEN (SELECT order_column FROM pagination) = 'fullName' AND (SELECT order_direction FROM pagination) = 'DESC' THEN r."FullName"
                        WHEN (SELECT order_column FROM pagination) = 'department' AND (SELECT order_direction FROM pagination) = 'DESC' THEN d."DepartmentName"
                        WHEN (SELECT order_column FROM pagination) = 'schoolYear' AND (SELECT order_direction FROM pagination) = 'DESC' THEN syl."Name"
                        WHEN (SELECT order_column FROM pagination) = 'section' AND (SELECT order_direction FROM pagination) = 'DESC' THEN sec."SectionName"
                        WHEN (SELECT order_column FROM pagination) = 'headPerson' AND (SELECT order_direction FROM pagination) = 'DESC' THEN e."FullName"
                        WHEN (SELECT order_direction FROM pagination) = 'DESC' THEN r."StudentCode"
                    END DESC
                ) AS row_num,
            COUNT(*) OVER() AS total_rows
            FROM dbo."Students" r
            LEFT JOIN dbo."Departments" d ON r."DepartmentId" = d."DepartmentId"
            LEFT JOIN dbo."SchoolYearLevels" syl ON r."SchoolYearLevelId" = syl."SchoolYearLevelId"
            LEFT JOIN dbo."StudentSection" ss ON r."StudentId" = ss."StudentId"
            LEFT JOIN dbo."Sections" sec ON ss."SectionId" = sec."SectionId"
            LEFT JOIN dbo."Employees" e ON sec."AdviserEmployeeId" = e."EmployeeId"
            LEFT JOIN dbo."Schools" sc ON sc."SchoolId" = r."SchoolId"`;
    const employeeQuery = `
           SELECT 
                r."EmployeeCode" as "Code",
                r."OrgEmployeeId",
                r."FullName",
                r."CardNumber",
                d."DepartmentName" AS "Department",
                syl."Name" AS "SchoolYear",
                sec."SectionName" AS "Section",
                r."FullName" AS "HeadPerson",
                sc."SchoolId",
                CASE 
                    WHEN EXISTS (
                        SELECT 1 
                        FROM dbo."TapLogs" tl 
                        WHERE tl."CardNumber" = r."CardNumber" 
                        AND tl."Date" = (SELECT today FROM CurrentDate)
                    ) THEN 'PRESENT'
                    ELSE 'ABSENT'
                END AS "Status",
                ROW_NUMBER() OVER (
                ORDER BY
                    CASE
                        WHEN (SELECT order_column FROM pagination) = 'Code' AND (SELECT order_direction FROM pagination) = 'ASC' THEN r."EmployeeCode"
                        WHEN (SELECT order_column FROM pagination) = 'orgId' AND (SELECT order_direction FROM pagination) = 'ASC' THEN r."OrgEmployeeId"
                        WHEN (SELECT order_column FROM pagination) = 'fullName' AND (SELECT order_direction FROM pagination) = 'ASC' THEN r."FullName"
                        WHEN (SELECT order_column FROM pagination) = 'department' AND (SELECT order_direction FROM pagination) = 'ASC' THEN d."DepartmentName"
                        WHEN (SELECT order_column FROM pagination) = 'schoolYear' AND (SELECT order_direction FROM pagination) = 'ASC' THEN syl."Name"
                        WHEN (SELECT order_column FROM pagination) = 'section' AND (SELECT order_direction FROM pagination) = 'ASC' THEN sec."SectionName"
                        WHEN (SELECT order_column FROM pagination) = 'headPerson' AND (SELECT order_direction FROM pagination) = 'ASC' THEN r."FullName"
                        WHEN (SELECT order_direction FROM pagination) = 'ASC' THEN r."EmployeeCode"
                    END ASC,
                    CASE
                        WHEN (SELECT order_column FROM pagination) = 'Code' AND (SELECT order_direction FROM pagination) = 'DESC' THEN r."EmployeeCode"
                        WHEN (SELECT order_column FROM pagination) = 'orgId' AND (SELECT order_direction FROM pagination) = 'DESC' THEN r."OrgEmployeeId"
                        WHEN (SELECT order_column FROM pagination) = 'fullName' AND (SELECT order_direction FROM pagination) = 'DESC' THEN r."FullName"
                        WHEN (SELECT order_column FROM pagination) = 'department' AND (SELECT order_direction FROM pagination) = 'DESC' THEN d."DepartmentName"
                        WHEN (SELECT order_column FROM pagination) = 'schoolYear' AND (SELECT order_direction FROM pagination) = 'DESC' THEN syl."Name"
                        WHEN (SELECT order_column FROM pagination) = 'section' AND (SELECT order_direction FROM pagination) = 'DESC' THEN sec."SectionName"
                        WHEN (SELECT order_column FROM pagination) = 'headPerson' AND (SELECT order_direction FROM pagination) = 'DESC' THEN r."FullName"
                        WHEN (SELECT order_direction FROM pagination) = 'DESC' THEN r."EmployeeCode"
                    END DESC
                ) AS row_num,
            COUNT(*) OVER() AS total_rows
            FROM dbo."Employees" r
            LEFT JOIN dbo."Departments" d ON r."DepartmentId" = d."DepartmentId"
            LEFT JOIN dbo."Sections" sec ON r."EmployeeId" = sec."AdviserEmployeeId"
            LEFT JOIN dbo."SchoolYearLevels" syl ON sec."SchoolYearLevelId" = syl."SchoolYearLevelId"
            LEFT JOIN dbo."Schools" sc ON sc."SchoolId" = r."SchoolId"`;
    const studentOrderQuery = `
                        r."StudentCode" ILIKE '%' || (SELECT searchKey FROM pagination) || '%' OR
                        r."OrgStudentId"::TEXT ILIKE '%' || (SELECT searchKey FROM pagination) || '%' OR
                        r."FullName" ILIKE '%' || (SELECT searchKey FROM pagination) || '%' OR
                        r."CardNumber" ILIKE '%' || (SELECT searchKey FROM pagination) || '%' OR
                        d."DepartmentName" ILIKE '%' || (SELECT searchKey FROM pagination) || '%' OR
                        syl."Name" ILIKE '%' || (SELECT searchKey FROM pagination) || '%' OR
                        sec."SectionName" ILIKE '%' || (SELECT searchKey FROM pagination) || '%' OR
                        r."FullName" ILIKE '%' || (SELECT searchKey FROM pagination) || '%'
                        `;
    const employeeOrderQuery = `
                        r."EmployeeCode" ILIKE '%' || (SELECT searchKey FROM pagination) || '%' OR
                        r."OrgEmployeeId"::TEXT ILIKE '%' || (SELECT searchKey FROM pagination) || '%' OR
                        r."FullName" ILIKE '%' || (SELECT searchKey FROM pagination) || '%' OR
                        r."CardNumber" ILIKE '%' || (SELECT searchKey FROM pagination) || '%' OR
                        d."DepartmentName" ILIKE '%' || (SELECT searchKey FROM pagination) || '%' OR
                        syl."Name" ILIKE '%' || (SELECT searchKey FROM pagination) || '%' OR
                        sec."SectionName" ILIKE '%' || (SELECT searchKey FROM pagination) || '%'
                    `;
    const query = `
        WITH 
            pagination AS( SELECT UPPER('${status}') as status, '${type}' as recordType, '${searchKey}' as searchkey, '${
      orderColumn && orderColumn !== "" ? orderColumn : ""
    }' as order_column, UPPER('${
      orderDirection && orderDirection !== "" ? orderDirection : "ASC"
    }') as order_direction),
            CurrentDate AS (
                SELECT 
                    '${currentDate}'::date AS today,  -- Parameterized current date
                    DATE_TRUNC('week', '${currentDate}'::date) AS week_start,  -- Start of the current week (Monday)
                    DATE_TRUNC('week', '${currentDate}'::date) + INTERVAL '4 days' AS week_end,  -- End of the current week (Friday)
                    DATE_TRUNC('month', '${firstDayOfMonth}'::date) AS month_start,  -- Start of the current month
                    '${currentDate}'::date AS month_end,  -- Current day
                    '${lastDayOfMonth}'::date AS actual_month_end  -- Last day of the month
            ),
            AttendanceRecords AS (
                -- Get the unique records data
                ${type === "STUDENT" ? studentQuery : employeeQuery}
                -- Condition
                WHERE sc."SchoolCode" = '${schoolCode}'
                AND ( 
                    CASE 
                        -- If status is PRESENT
                        WHEN (SELECT UPPER(status) FROM pagination) = 'PRESENT' 
                        THEN 
                            EXISTS (
                                SELECT 1 
                                FROM dbo."TapLogs" tl 
                                WHERE tl."CardNumber" = r."CardNumber" 
                                AND tl."Date" = (SELECT today FROM CurrentDate)
                            )
                        
                        -- If status is ABSENT
                        WHEN (SELECT UPPER(status) FROM pagination) = 'ABSENT' 
                        THEN 
                            NOT EXISTS (
                                SELECT 1 
                                FROM dbo."TapLogs" tl 
                                WHERE tl."CardNumber" = r."CardNumber" 
                                AND tl."Date" = (SELECT today FROM CurrentDate)
                            )

                        -- Default case when status is empty or blank (NULL or '')
                        ELSE 
                            -- Default logic here, for example, return all rows (true)
                            TRUE
                    END
                )
                AND ( 
                ${type === "STUDENT" ? studentOrderQuery : employeeOrderQuery}
                )
            ),
            BusinessDaysInMonth AS (
                -- Calculate the business days (weekdays) from month start to actual month end
                SELECT 
                    cd.month_start,
                    cd.actual_month_end,
                    COUNT(*) AS total_business_days
                FROM CurrentDate cd
                CROSS JOIN generate_series(cd.month_start, cd.actual_month_end, '1 day') AS dt
                WHERE EXTRACT(ISODOW FROM dt) < 6 -- Weekdays only (Monday to Friday)
                GROUP BY cd.month_start, cd.actual_month_end
            ),
            WeeklyAttendance AS (
                -- Calculate weekly attendance
                SELECT 
                    ar."Code",
                    COUNT(DISTINCT tl."Date") FILTER (WHERE tl."Date" BETWEEN cd.week_start AND cd.week_end) AS present_days,
                    GREATEST(0, 5 - COUNT(DISTINCT tl."Date") FILTER (WHERE tl."Date" BETWEEN cd.week_start AND cd.week_end)) AS absent_days,
                    CASE 
                        WHEN COUNT(DISTINCT tl."Date") FILTER (WHERE tl."Date" BETWEEN cd.week_start AND cd.week_end) = 5 
                            THEN 'All present (100%)'
                        ELSE CONCAT(
                            GREATEST(0, 5 - COUNT(DISTINCT tl."Date") FILTER (WHERE tl."Date" BETWEEN cd.week_start AND cd.week_end)), 
                            ' Absent (', 
                            ROUND((COUNT(DISTINCT tl."Date") FILTER (WHERE tl."Date" BETWEEN cd.week_start AND cd.week_end)) * 100 / 5.0, 0), 
                            '%)')
                    END AS "CurrentWeek"
                FROM AttendanceRecords ar
                LEFT JOIN dbo."TapLogs" tl ON ar."CardNumber" = tl."CardNumber"
                LEFT JOIN dbo."Machines" m ON m."MachineId" = tl."MachineId"
                CROSS JOIN CurrentDate cd
                GROUP BY ar."Code"
            ),
            MonthlyAttendance AS (
                -- Calculate monthly attendance
                SELECT 
                    ar."Code",
                    COUNT(DISTINCT tl."Date") FILTER (WHERE tl."Date" BETWEEN cd.month_start AND cd.actual_month_end) AS present_days,
                    b.total_business_days - COUNT(DISTINCT tl."Date") FILTER (WHERE tl."Date" BETWEEN cd.month_start AND cd.actual_month_end) AS absent_days,
                    CASE 
                        WHEN COUNT(DISTINCT tl."Date") FILTER (WHERE tl."Date" BETWEEN cd.month_start AND cd.actual_month_end) = b.total_business_days
                            THEN 'All present (100%)'
                        ELSE CONCAT(
                            b.total_business_days - COUNT(DISTINCT tl."Date") FILTER (WHERE tl."Date" BETWEEN cd.month_start AND cd.actual_month_end), 
                            ' Absent (', 
                            ROUND(COUNT(DISTINCT tl."Date") FILTER (WHERE tl."Date" BETWEEN cd.month_start AND cd.actual_month_end) * 100 / b.total_business_days, 0), 
                            '%)'  -- Corrected to reflect attendance percentage, not absence percentage
                        )
                    END AS "CurrentMonth"
                FROM AttendanceRecords ar
                LEFT JOIN dbo."TapLogs" tl ON ar."CardNumber" = tl."CardNumber" 
                LEFT JOIN dbo."Machines" m ON m."MachineId" = tl."MachineId"
                CROSS JOIN CurrentDate cd
                CROSS JOIN BusinessDaysInMonth b
                GROUP BY ar."Code", b.total_business_days, cd.month_start, cd.actual_month_end
            )

            -- Final output query
            SELECT 
                ${
                  type === "STUDENT"
                    ? 'ar."Code" as "code", ar."OrgStudentId" as "orgId", '
                    : 'ar."Code" as "code", ar."OrgEmployeeId" as "orgId",'
                }
                ar."FullName" as "fullName",
                ar."Status" as "status",
                wa."present_days" as "presentCurrentWeek",
                wa."absent_days" as "absentCurrentWeek",
                wa."CurrentWeek" as "currentWeek",
                ma."present_days" as "presentCurrentMonth",
                ma."absent_days" as "absentCurrentMonth",
                ma."CurrentMonth" as "currentMonth",
                ar."Department" as "department",
                ar."SchoolYear" as "schoolYear",
                ar."Section" as "section",
                ar."HeadPerson" as "headPerson",
                ar."total_rows"
            FROM AttendanceRecords ar
            LEFT JOIN WeeklyAttendance wa ON ar."Code" = wa."Code"
            LEFT JOIN MonthlyAttendance ma ON ar."Code" = ma."Code"
            WHERE ar.row_num BETWEEN ((${pageNumber} - 1) * ${pageSize} + 1) AND (${pageNumber} * ${pageSize})
            ORDER BY ar."row_num";
        `;
    return this.studentsRepo.manager.query(query).then((res: any[]) => {
      return {
        total: res.length > 0 ? res[0].total_rows : 0,
        results: res.map((x) => {
          delete x.total_rows;
          return x;
        }),
      };
    });
  }

  async getStudentAttendance(
    studentCode,
    targetYearMonth = moment().format("YYYY-MM")
  ) {
    return this.getAttendanceSheet(studentCode, "STUDENT", targetYearMonth);
  }

  async getEmployeeAttendance(
    employeeCode,
    targetYearMonth = moment().format("YYYY-MM")
  ) {
    return this.getAttendanceSheet(employeeCode, "EMPLOYEE", targetYearMonth);
  }

  async getAttendanceSheet(
    code = "",
    type: "STUDENT" | "EMPLOYEE",
    targetYearMonth
  ) {
    const query = `
    WITH Paramters AS (
    SELECT '${type ?? ""}' AS record_type,
           '${code}' AS code,
           '${targetYearMonth}' AS targetYearMonth
        ),
        TapLogData AS (
            SELECT
                tl."Date",
                tl."CardNumber",
                tl."Time",
                tl."Status",
                tl."Type",
                CASE 
                    WHEN tl."Time"::time < '12:00' THEN 'AM'
                    ELSE 'PM'
                END AS "TimePeriod",
                ROW_NUMBER() OVER (PARTITION BY tl."CardNumber", tl."Date" ORDER BY tl."Time" ASC) AS "RowIn",
                ROW_NUMBER() OVER (PARTITION BY tl."CardNumber", tl."Date" ORDER BY tl."Time" DESC) AS "RowOut"
            FROM dbo."TapLogs" tl
            INNER JOIN dbo."Machines" m ON tl."MachineId" = m."MachineId"
            INNER JOIN dbo."Schools" s ON m."SchoolId" = s."SchoolId"
            WHERE m."Active" = TRUE
            -- Year and month filter if provided
            AND (
                (SELECT targetYearMonth FROM Paramters) IS NULL OR
                (SELECT targetYearMonth FROM Paramters) = '' OR
                to_char(tl."Date", 'YYYY-MM') = (SELECT targetYearMonth FROM Paramters)
            )
        )
        SELECT 
            tld."Date" as "date",
            (tld."Date"::timestamp AT TIME ZONE 'UTC') AS "date",
            -- Get the earliest LOG IN event using MIN
            MIN(CASE WHEN tld."Status" = 'LOG IN' THEN tld."Time" ELSE NULL END) AS "timeIn",
            -- Get the latest LOG OUT event by using the MAX with proper time handling
            CASE WHEN MAX(tld."Status") = 'LOG OUT' THEN TO_CHAR(MAX(tld."Time"::time)::time, 'hh:mi AM') ELSE NULL END AS "timeOut",
            COUNT(CASE WHEN tld."Status" = 'LOG IN' AND tld."TimePeriod" = 'AM' THEN 1 ELSE NULL END)::bigint AS "numberOfTimeInAM",
            COUNT(CASE WHEN tld."Status" = 'LOG OUT' AND tld."TimePeriod" = 'AM' THEN 1 ELSE NULL END)::bigint::bigint AS "numberOfTimeOutAM",
            COUNT(CASE WHEN tld."Status" = 'LOG IN' AND tld."TimePeriod" = 'PM' THEN 1 ELSE NULL END)::bigint AS "numberOfTimeInPM",
            COUNT(CASE WHEN tld."Status" = 'LOG OUT' AND tld."TimePeriod" = 'PM' THEN 1 ELSE NULL END)::bigint AS "numberOfTimeOutPM"
        FROM TapLogData tld
        -- Join to students or employees based on the type parameter
        INNER JOIN (
            SELECT "StudentCode" AS "Code", "CardNumber"
            FROM dbo."Students"
            WHERE "Active" = TRUE
            AND (SELECT record_type FROM Paramters) = 'STUDENT'
            
            UNION ALL
            
            SELECT "EmployeeCode" AS "Code", "CardNumber"
            FROM dbo."Employees"
            WHERE "Active" = TRUE
            AND (SELECT record_type FROM Paramters) = 'EMPLOYEE'
        ) AS persons ON tld."CardNumber" = persons."CardNumber"
        -- Filter by student or employee code
        WHERE persons."Code" = (SELECT code FROM Paramters)
        GROUP BY tld."Date"
        ORDER BY tld."Date" DESC;
    `;
    return this.employeesRepo.manager.query(query).then((res: any[]) => {
      return res.map((x) => {
        x.numberOfTimeInAM = Number(x.numberOfTimeInAM);
        x.numberOfTimeOutAM = Number(x.numberOfTimeOutAM);
        x.numberOfTimeInPM = Number(x.numberOfTimeInPM);
        x.numberOfTimeOutPM = Number(x.numberOfTimeOutPM);
        return x;
      });
    });
  }
}
