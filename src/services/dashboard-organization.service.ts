import { Injectable, Query } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { USER_TYPE } from "src/common/constant/user-type.constant";
import { Users } from "src/db/entities/Users";
import { In, Repository } from "typeorm";
import { USER_ERROR_USER_NOT_FOUND } from "../common/constant/user-error.constant";
import { Students } from "src/db/entities/Students";
import { Employees } from "src/db/entities/Employees";
import moment from "moment-timezone";
import {
  getStartAndEndDate,
  getTotalDaysBetweenDates,
} from "src/common/utils/utils";

@Injectable()
export class DashboardOrganizationService {
  constructor(
    @InjectRepository(Students)
    private readonly studentsRepo: Repository<Students>,
    @InjectRepository(Employees)
    private readonly employeesRepo: Repository<Employees>
  ) {}

  async getDashboardSummary(
    schoolCode: string,
    type: "STUDENT" | "EMPLOYEE",
    targetDate: Date
  ) {
    const [
      total,
      currentAttendance,
      dailyAttendanceRate,
      dailyAttendanceRatePrev,
      weeklyAttendanceRate,
      weeklyAttendanceRatePrev,
      monthlyAttendanceRate,
      monthlyAttendanceRatePrev,
      annualAttendanceRate,
      annualAttendanceRatePrev,
    ] = await Promise.all([
      //total
      type === "STUDENT"
        ? this.studentsRepo.countBy({
            active: true,
            school: {
              schoolCode,
            },
          })
        : this.employeesRepo.countBy({
            active: true,
            school: {
              schoolCode,
            },
          }),
      //daily-count
      this.getAttendance(schoolCode, type, {
        startDate: new Date(moment(targetDate).format("YYYY-MM-DD")),
        endDate: new Date(moment(targetDate).format("YYYY-MM-DD")),
      }),
      //daily-rate
      this.getAttendanceRate(schoolCode, type, {
        startDate: new Date(moment(targetDate).format("YYYY-MM-DD")),
        endDate: new Date(moment(targetDate).format("YYYY-MM-DD")),
      }),
      //daily-rate-prev
      this.getAttendanceRate(
        schoolCode,
        type,
        getStartAndEndDate(
          "DAILY",
          moment(targetDate).format("YYYY-MM-DD"),
          true
        )
      ),
      //weekly-rate
      this.getAttendanceRate(
        schoolCode,
        type,
        getStartAndEndDate("WEEKLY", moment(targetDate).format("YYYY-MM-DD"))
      ),
      //weekly-rate-prev
      this.getAttendanceRate(
        schoolCode,
        type,
        getStartAndEndDate(
          "WEEKLY",
          moment(targetDate).format("YYYY-MM-DD"),
          true
        )
      ),
      //monthly-rate
      this.getAttendanceRate(
        schoolCode,
        type,
        getStartAndEndDate("MONTHLY", moment(targetDate).format("YYYY-MM-DD"))
      ),
      //monthly-rate-prev
      this.getAttendanceRate(
        schoolCode,
        type,
        getStartAndEndDate(
          "MONTHLY",
          moment(targetDate).format("YYYY-MM-DD"),
          true
        )
      ),
      //annual-rate
      this.getAttendanceRate(
        schoolCode,
        type,
        getStartAndEndDate("ANNUALLY", moment(targetDate).format("YYYY-MM-DD"))
      ),
      //annual-rate-prev
      this.getAttendanceRate(
        schoolCode,
        type,
        getStartAndEndDate(
          "ANNUALLY",
          moment(targetDate).format("YYYY-MM-DD"),
          true
        )
      ),
    ]);
    return {
      total,
      currentAttendance,
      dailyAttendanceRate,
      dailyAttendanceRatePrev,
      weeklyAttendanceRate,
      weeklyAttendanceRatePrev,
      monthlyAttendanceRate,
      monthlyAttendanceRatePrev,
      annualAttendanceRate,
      annualAttendanceRatePrev,
    };
  }

  async getAttendance(
    schoolCode = "",
    type: "STUDENT" | "EMPLOYEE",
    date: { startDate: Date; endDate: Date }
  ) {
    const { startDate, endDate } = date;
    return this.studentsRepo.manager
      .query(
        `
        WITH Present AS (
        SELECT 
          tl."CardNumber",
          tl."Date"
        FROM 
          dbo."TapLogs" tl
          LEFT JOIN dbo."Machines" m ON m."MachineId" = tl."MachineId"
          LEFT JOIN dbo."Schools" sc ON sc."SchoolId" = m."SchoolId"
        WHERE
          LOWER(tl."Type") = '${type.toLowerCase()}'
		      AND sc."SchoolCode" = '${schoolCode}'
          AND tl."Date" BETWEEN '${moment(startDate).format(
            "YYYY-MM-DD"
          )}' AND '${moment(endDate).format("YYYY-MM-DD")}'
        ),
        AttendanceSummary AS (
          SELECT 
            "CardNumber",
            COUNT(DISTINCT "Date") AS "AttendanceCount"
          FROM 
            Present
          GROUP BY 
            "CardNumber"
        )
      select count("AttendanceCount") as "attendance" from AttendanceSummary
    `
      )
      .then((res) => {
        return res[0]["attendance"];
      });
  }

  async getAttendanceRate(
    schoolCode = "",
    type: "STUDENT" | "EMPLOYEE",
    date: { startDate: Date; endDate: Date }
  ) {
    const { startDate, endDate } = date;
    const totalDays = getTotalDaysBetweenDates(startDate, endDate);
    const query = `
        WITH Presents AS (
        SELECT 
          tl."CardNumber",
          tl."Date"
        FROM 
          dbo."TapLogs" tl
          LEFT JOIN dbo."Machines" m ON m."MachineId" = tl."MachineId"
          LEFT JOIN dbo."Schools" sc ON sc."SchoolId" = m."SchoolId"
        WHERE
          LOWER(tl."Type") = '${type.toLowerCase()}'
		      AND sc."SchoolCode" = '${schoolCode}'
          AND tl."Date" BETWEEN '${moment(startDate).format(
            "YYYY-MM-DD"
          )}' AND '${moment(endDate).format("YYYY-MM-DD")}'
        ),
        AttendanceSummary AS (
          SELECT 
            "CardNumber",
            COUNT(DISTINCT "Date") AS "AttendanceCount"
          FROM 
            Presents
          GROUP BY 
            "CardNumber"
        ),
      totalCount AS (SELECT COUNT(t.*) as "count" from ${
        type === "STUDENT" ? 'dbo."Students" t' : 'dbo."Employees" t'
      } LEFT JOIN dbo."Schools" sc ON sc."SchoolId" = t."SchoolId"  
      where sc."SchoolCode" = '${schoolCode}' and t."Active" = true),
        AttendanceRatesTable as (
          SELECT 
            COALESCE(((SUM(asum."AttendanceCount") / (select "count" from totalCount))/${totalDays}) * 100, 0) AS "attendanceRate"
          FROM 
            AttendanceSummary asum
        )
      select "attendanceRate" from AttendanceRatesTable
    `;
    return this.studentsRepo.manager.query(query).then((res) => {
      return res[0]["attendanceRate"];
    });
  }

  async getAttendanceByRange(
    schoolCode = "",
    frequency: "RANGE" | "WEEKLY" | "MONTHLY" | "ANNUALLY" = "MONTHLY",
    type: "STUDENT" | "EMPLOYEE",
    date: { startDate: Date; endDate: Date }
  ) {
    const { startDate, endDate } = date;
    return this.studentsRepo.manager
      .query(
        `
        WITH FilteredLogs AS (
            SELECT "TapLogId", "Date"
            FROM dbo."TapLogs" tl
            LEFT JOIN dbo."Machines" m ON m."MachineId" = tl."MachineId"
            LEFT JOIN dbo."Schools" sc ON sc."SchoolId" = m."SchoolId"
            WHERE 
            LOWER(tl."Type") = '${type.toLowerCase()}'
            AND sc."SchoolCode" = '${schoolCode}'
            AND tl."Date" BETWEEN '${moment(startDate).format(
              "YYYY-MM-DD hh:mm A"
            )}' AND '${moment(endDate).format("YYYY-MM-DD hh:mm A")}'
        )
        SELECT
            CASE 
                WHEN '${frequency}' = 'ANNUALLY' THEN EXTRACT(YEAR FROM "Date")::TEXT
                WHEN '${frequency}' = 'MONTHLY' THEN TRIM(TO_CHAR("Date", 'Month'))::TEXT
                WHEN '${frequency}' = 'RANGE' THEN "Date"::TEXT
            END AS label,
            COUNT("TapLogId") AS value
        FROM FilteredLogs
        GROUP BY label
        ORDER BY label;
        `
      )
      .then((res) => {
        return res;
      });
  }

  async getAttendanceRatio(
    schoolCode = "",
    type: "STUDENT" | "EMPLOYEE",
    date: { startDate: Date; endDate: Date }
  ) {
    const { startDate, endDate } = date;
    const query = `
      WITH ActiveRecords AS (
        -- Count all active records
        SELECT r."CardNumber"
        FROM ${
          type.toLowerCase() === "student"
            ? 'dbo."Students"'
            : 'dbo."Employees"'
        } r
        LEFT JOIN dbo."Schools" sc ON sc."SchoolId" = r."SchoolId"
        WHERE r."Active" = true AND sc."SchoolCode" = '${schoolCode}'
        ),
        DateRange AS (
            -- Generate a series of dates within the specified date range, up to the current date
            SELECT generate_series(
                '${moment(startDate).format("YYYY-MM-DD hh:mm A")}'::date,  
                LEAST('${moment(endDate).format(
                  "YYYY-MM-DD hh:mm A"
                )}'::date, CURRENT_DATE), 
                '1 day'::interval
            )::date AS "Date"
        ),
        BusinessDays AS (
            -- Filter out weekends: 0 is Sunday, 6 is Saturday
            SELECT "Date"
            FROM DateRange
            WHERE EXTRACT(DOW FROM "Date") NOT IN (0, 6)
        ),
        DateMatrix AS (
            -- Create a matrix of each active records across all business days in the range
            SELECT 
                s."CardNumber",
                bd."Date"
            FROM ActiveRecords s
            CROSS JOIN BusinessDays bd
        ),
        TapLogs AS (
            SELECT t."CardNumber",
                      t."Date"
            FROM 	
            dbo."TapLogs" t
                  LEFT JOIN dbo."Machines" m ON m."MachineId" = t."MachineId"
                  LEFT JOIN dbo."Schools" sc ON sc."SchoolId" = m."SchoolId"
                  WHERE sc."SchoolCode" = '${schoolCode}' AND LOWER(t."Type") = '${type.toLowerCase()}'
        ),
        Taps AS (
            -- Left join the record-date matrix with the tap logs to check who tapped in
            SELECT 
                sd."CardNumber",
                sd."Date",
                CASE WHEN t."CardNumber" IS NOT NULL THEN 1 ELSE 0 END AS tapped_in
            FROM DateMatrix sd
            LEFT JOIN dbo."TapLogs" t
            ON sd."CardNumber" = t."CardNumber" AND sd."Date" = t."Date"
        ),
        DailyAttendance AS (
            -- For each business day, count the number of records who tapped in and those who didn't
            SELECT 
                s."Date",
                SUM(s.tapped_in) AS daily_present,
                COUNT(s."CardNumber") - SUM(s.tapped_in) AS daily_absent
            FROM Taps s
            GROUP BY s."Date"
        ),
        OverallAttendance AS (
            -- Calculate the overall present and absent percentage based on the business day data
            SELECT 
                COALESCE(ROUND(AVG(daily_present::decimal / total_records) * 100, 0), 0) AS overall_present_percentage,
                COALESCE(ROUND(AVG(daily_absent::decimal / total_records) * 100, 0), 0)  AS overall_absent_percentage
            FROM DailyAttendance, (SELECT COUNT(*) AS total_records FROM ActiveRecords) AS total
        )
        SELECT 
            overall_present_percentage as present_percentage,
            overall_absent_percentage as absent_percentage
        FROM OverallAttendance;
    `;
    return this.studentsRepo.manager.query(query).then((res) => {
      return res;
    });
  }
}
