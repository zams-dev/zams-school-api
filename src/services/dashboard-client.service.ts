import { CustomCacheManagerService } from "./custom-cache-manager.service";
import { Injectable, Query } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import moment from "moment";
import { Announcements } from "src/db/entities/Announcements";
import { Clients } from "src/db/entities/Clients";
import { Students } from "src/db/entities/Students";
import { TapLogs } from "src/db/entities/TapLogs";
import { Users } from "src/db/entities/Users";
import { Brackets, In, Repository } from "typeorm";

@Injectable()
export class DashboardClientService {
  constructor(
    @InjectRepository(Clients)
    private readonly clientRepo: Repository<Clients>,
    @InjectRepository(Announcements)
    private readonly announcementsRepo: Repository<Announcements>,
    private customCacheManagerService: CustomCacheManagerService
  ) {}

  async getAnnouncementDashboardFeed(clientCode) {
    const cacheKey = `${clientCode}_dashboard_client_announcements_feed`;
    let results = await this.customCacheManagerService.get<any>(cacheKey);
    if (!results || (results && results.length === 0)) {
      const query = `
      WITH client AS ( 
          SELECT s."SchoolYearLevelId", ssec."SectionId", s."SchoolId"
          FROM dbo."Clients" c
          LEFT JOIN dbo."ClientStudent" cs ON c."ClientId" = cs."ClientId"
          LEFT JOIN dbo."Students" s ON cs."StudentId" = s."StudentId"
          LEFT JOIN dbo."Departments" d ON s."DepartmentId" = d."DepartmentId"
          LEFT JOIN dbo."SchoolYearLevels" syl ON s."SchoolYearLevelId" = syl."SchoolYearLevelId"
          LEFT JOIN dbo."StudentSection" ssec ON s."StudentId" = ssec."StudentId"
          LEFT JOIN dbo."Sections" sec ON ssec."SectionId" = sec."SectionId"
          WHERE c."ClientCode" = '000006'
          AND cs."StudentId" IS NOT NULL
			    AND cs."Active" = true
      ),
      client_org AS (
          SELECT e."DepartmentId", e."EmployeePositionId", e."SchoolId"
          FROM dbo."Clients" c
          LEFT JOIN dbo."Employees" e ON c."OrgEmployeeId" = e."OrgEmployeeId"
          WHERE c."ClientCode" = '${clientCode}'
      ),
      announcement_logs AS (
          SELECT 
              avl."AnnouncementId",
              COALESCE(SUM(avl."VisitCount"), 0) AS total_visit_count,
              COALESCE(MAX(avl."LastDateVisited"), '1970-01-01') AS last_visit_date
          FROM dbo."AnnouncementVisitLogs" avl
			    LEFT JOIN dbo."Announcements" a ON avl."AnnouncementId" = a."AnnouncementId"
          WHERE a."SchoolId" IN (SELECT a."SchoolId" FROM client) OR a."SchoolId" IN (SELECT "SchoolId" FROM client_org)
          GROUP BY avl."AnnouncementId"
      ),
      filtered_announcements AS (
          SELECT 
              a."AnnouncementId",
              a."AnnouncementCode",
              a."DateTimeSent",
              a."Title",
              a."Description",
              sc."SchoolId",
              sc."SchoolCode",
              sc."OrgSchoolCode",
              sc."SchoolName",
              sc."SchoolAddress",
              al.total_visit_count,
              al.last_visit_date,
              ROW_NUMBER() OVER (
                  ORDER BY 
                      al.total_visit_count ASC,     -- Prioritize fewer visits
                      a."DateTimeSent" DESC        -- Most recent announcements as tie-breaker
              ) AS row_num
          FROM dbo."Announcements" a
          LEFT JOIN dbo."Schools" sc ON a."SchoolId" = sc."SchoolId"
          LEFT JOIN announcement_logs al ON a."AnnouncementId" = al."AnnouncementId"
          WHERE (
              a."AudienceMode" = 'SEND_TO_ALL'
              OR (
                  EXISTS (
                      SELECT 1
                      FROM json_array_elements_text(a."EmployeeFilter"->'employeeTitleIds') AS elem
                      WHERE elem::int = ANY(ARRAY(SELECT "DepartmentId" FROM client_org))
                  )
                  AND EXISTS (
                      SELECT 1
                      FROM json_array_elements_text(a."EmployeeFilter"->'departmentIds') AS elem
                      WHERE elem::int = ANY(ARRAY(SELECT "EmployeePositionId" FROM client_org))
                  )
              )
              OR (
                  EXISTS (
                      SELECT 1
                      FROM json_array_elements_text(a."StudentPrimaryFilter"->'schoolYearLevelIds') AS elem
                      WHERE elem::int = ANY(ARRAY(SELECT "SchoolYearLevelId" FROM client))
                  )
                  AND EXISTS (
                      SELECT 1
                      FROM json_array_elements_text(a."StudentPrimaryFilter"->'sectionIds') AS elem
                      WHERE elem::int = ANY(ARRAY(SELECT "SectionId" FROM client))
                  )
              )
              OR (
                  a."TargetRecipient" IS NULL
                  OR (
                      (a."TargetRecipient"->>'TYPE') = 'STUDENT' 
                      AND (a."TargetRecipient"->>'ID')::int = ANY(ARRAY(SELECT "StudentId" FROM dbo."Students"))
                  )
                  OR (
                      (a."TargetRecipient"->>'TYPE') = 'EMPLOYEE' 
                      AND (a."TargetRecipient"->>'ID')::int = ANY(ARRAY(SELECT "EmployeeId" FROM dbo."Employees"))
                  )
              )
          ) AND 
            (
                  a."SchoolId" IN (SELECT "SchoolId" FROM client) OR a."SchoolId" IN (SELECT "SchoolId" FROM client_org)
            )
      )
      SELECT 
          "AnnouncementId" AS "announcementId",
          "AnnouncementCode" AS "announcementCode",
          "DateTimeSent" AS "dateTimeSent",
          "Title" AS "title",
          "Description" AS "description",
          "SchoolId" AS "schoolId",
          "SchoolCode" AS "schoolCode",
          "OrgSchoolCode" AS "orgSchoolCode",
          "SchoolName" AS "schoolName",
          "SchoolAddress" AS "schoolAddress"
      FROM filtered_announcements
      ORDER BY row_num
      LIMIT 3;
    `;
      results = await this.announcementsRepo.query(query).then((res: []) => {
        return res && res.length > 0
          ? res.map((x: any) => {
              return {
                announcementId: x["announcementId"],
                announcementCode: x["announcementCode"],
                dateTimeSent: x["dateTimeSent"],
                title: x["title"],
                description: x["description"],
                school: {
                  schoolId: x["schoolId"],
                  schoolCode: x["schoolCode"],
                  orgSchoolCode: x["orgSchoolCode"],
                  schoolAddress: x["schoolAddress"],
                  schoolName: x["schoolName"],
                },
              };
            })
          : [];
      });
    } else {
      await this.customCacheManagerService.del(cacheKey);
    }
    await this.customCacheManagerService.set(cacheKey, results, 300);
    return results;
  }

  async getClientAnnouncement({ clientCode, searchKey, pageSize, pageIndex }) {
    const cacheKey = `${clientCode}_dashboard_client_announcements_page_${pageSize}_${pageIndex}_${searchKey}`;
    let cacheData = await this.customCacheManagerService.get<any>(cacheKey);
    if (!cacheData || (cacheData && cacheData.length === 0)) {
      if (!searchKey || searchKey === undefined || searchKey === null) {
        searchKey = "";
      }
      searchKey.trim();
      const CTE_QUERY = `
        WITH client AS ( 
            SELECT s."SchoolYearLevelId", ssec."SectionId", s."SchoolId"
            FROM dbo."Clients" c
            LEFT JOIN dbo."ClientStudent" cs ON c."ClientId" = cs."ClientId"
            LEFT JOIN dbo."Students" s ON cs."StudentId" = s."StudentId"
            LEFT JOIN dbo."Departments" d ON s."DepartmentId" = d."DepartmentId"
            LEFT JOIN dbo."SchoolYearLevels" syl ON s."SchoolYearLevelId" = syl."SchoolYearLevelId"
            LEFT JOIN dbo."StudentSection" ssec ON s."StudentId" = ssec."StudentId"
            LEFT JOIN dbo."Sections" sec ON ssec."SectionId" = sec."SectionId"
            WHERE c."ClientCode" = '${clientCode}'
			      AND cs."StudentId" IS NOT NULL
			      AND cs."Active" = true
        ),
        client_org AS (
            SELECT e."DepartmentId", e."EmployeePositionId", e."SchoolId"
            FROM dbo."Clients" c
            LEFT JOIN dbo."Employees" e ON c."OrgEmployeeId" = e."OrgEmployeeId"
            WHERE c."ClientCode" = '${clientCode}'
        ),
        announcement_logs AS (
            SELECT 
                avl."AnnouncementId",
                COALESCE(SUM("VisitCount"), 0) AS total_visit_count,
                COALESCE(MAX("LastDateVisited"), '1970-01-01') AS last_visit_date
            FROM dbo."AnnouncementVisitLogs" avl
            LEFT JOIN dbo."Announcements" a ON avl."AnnouncementId" = a."AnnouncementId"
            WHERE a."SchoolId" IN (SELECT a."SchoolId" FROM client) OR a."SchoolId" IN (SELECT "SchoolId" FROM client_org)
            GROUP BY avl."AnnouncementId"
        ),
        filtered_announcements AS (
            SELECT 
                a."AnnouncementId",
                a."Title",
                a."Description",
                a."DateTimeSent",
                a."TargetRecipient",
                al.total_visit_count,
                al.last_visit_date,
                ROW_NUMBER() OVER (
                    ORDER BY 
                        total_visit_count ASC,  -- Prioritize fewer visits
                        a."DateTimeSent" DESC   -- Most recent announcements within same visit count
                ) AS row_num
            FROM dbo."Announcements" a
            LEFT JOIN announcement_logs al ON a."AnnouncementId" = al."AnnouncementId"
            WHERE 
                (
                    a."AudienceMode" = 'SEND_TO_ALL'
                    OR (
                        EXISTS (
                            SELECT 1
                            FROM json_array_elements_text(a."EmployeeFilter"->'employeeTitleIds') AS elem
                            WHERE elem::int = ANY(ARRAY(SELECT "DepartmentId" FROM client_org))
                        )
                        AND EXISTS (
                            SELECT 1
                            FROM json_array_elements_text(a."EmployeeFilter"->'departmentIds') AS elem
                            WHERE elem::int = ANY(ARRAY(SELECT "EmployeePositionId" FROM client_org))
                        )
                    )
                    OR (
                        EXISTS (
                            SELECT 1
                            FROM json_array_elements_text(a."StudentPrimaryFilter"->'schoolYearLevelIds') AS elem
                            WHERE elem::int = ANY(ARRAY(SELECT "SchoolYearLevelId" FROM client))
                        )
                        AND EXISTS (
                            SELECT 1
                            FROM json_array_elements_text(a."StudentPrimaryFilter"->'sectionIds') AS elem
                            WHERE elem::int = ANY(ARRAY(SELECT "SectionId" FROM client))
                        )
                    )
                    OR (
                        a."TargetRecipient" IS NULL
                        OR (
                            (a."TargetRecipient"->>'TYPE') = 'STUDENT' 
                            AND (a."TargetRecipient"->>'ID')::int = ANY(ARRAY(SELECT "StudentId" FROM dbo."Students"))
                        )
                        OR (
                            (a."TargetRecipient"->>'TYPE') = 'EMPLOYEE' 
                            AND (a."TargetRecipient"->>'ID')::int = ANY(ARRAY(SELECT "EmployeeId" FROM dbo."Employees"))
                        )
                    )
                )
                AND (
                    LOWER(TRIM(a."Title")) LIKE LOWER(TRIM('%${searchKey}%')) 
                    OR LOWER(TRIM(a."Description")) LIKE LOWER(TRIM('%${searchKey}%'))
                )
                AND (
                    al.total_visit_count <= 3
                    OR al.last_visit_date > NOW() - INTERVAL '2 days'
                    OR al.total_visit_count IS NULL
                ) AND 
                  (
                        a."SchoolId" IN (SELECT "SchoolId" FROM client) OR a."SchoolId" IN (SELECT "SchoolId" FROM client_org)
                  )
        )
    `;

      pageIndex =
        !isNaN(Number(pageIndex)) && Number(pageIndex) >= 1 ? pageIndex : 1;
      pageSize =
        !isNaN(Number(pageSize)) && Number(pageSize) >= 1 ? pageSize : 10;
      const [results, total] = await Promise.all([
        this.announcementsRepo
          .query(
            `
      ${CTE_QUERY}
      SELECT row_num, "AnnouncementId"
      FROM filtered_announcements
      ORDER BY row_num ASC
      LIMIT ${pageSize} OFFSET (${pageIndex} - 1) * ${pageSize};
      `
          )
          .then(async (res) => {
            const data = await this.announcementsRepo.find({
              where: {
                announcementId: In(
                  res && res.length > 0
                    ? res.map((x) => x["AnnouncementId"])
                    : []
                ),
              },
              relations: {
                school: true,
              },
            });

            // Reorder data based on originalArray row_num
            return res.map(({ AnnouncementId }) => {
              // Find the corresponding data entry for the ID
              return data.find(
                (item) => Number(item.announcementId) === Number(AnnouncementId)
              );
            });
          }),
        this.announcementsRepo
          .query(
            `
      ${CTE_QUERY}
      select count("AnnouncementId") as total from filtered_announcements
      `
          )
          .then((res) => {
            return res && res.length > 0 ? res[0]["total"] : 0;
          }),
      ]);
      cacheData = {
        results,
        total,
      };
    } else {
      await this.customCacheManagerService.del(cacheKey);
    }
    await this.customCacheManagerService.set(cacheKey, cacheData, 300);
    return cacheData;
  }

  async getClientStudents(clientCode, date, searchKey = "") {
    const cacheKey = `${clientCode}_dashboard_client_students_${moment(
      date
    ).format("YYYY-MM-DD")}_${searchKey}`;
    let results = await this.customCacheManagerService.get<any>(cacheKey);
    if (!results || (results && results.length === 0)) {
      if (!searchKey || searchKey === undefined || searchKey === null) {
        searchKey = "";
      }
      searchKey.trim();
      date = moment(date).format("YYYY-MM-DD");
      const query = `
      WITH client_logs AS (
        SELECT
            s."StudentId",
            array_to_json(array_agg(
                json_build_object(
                    'tapLogId', t."TapLogId",
                    'status', t."Status",
                    'time', t."Time",
                    'dateTime', (
                        CASE
                            WHEN t."Date" IS NOT NULL AND t."Time" IS NOT NULL 
                            THEN (CONCAT(t."Date", ' ', t."Time")::timestamp AT TIME ZONE 'Asia/Manila')
                            ELSE NULL
                        END)
                )
            )) AS "logs"
          FROM dbo."Students" s
          LEFT JOIN dbo."TapLogs" t ON s."CardNumber" = t."CardNumber"
          LEFT JOIN dbo."ClientStudent" ps ON s."StudentId" = ps."StudentId"
          LEFT JOIN dbo."Clients" p ON ps."ClientId" = p."ClientId"
          WHERE p."ClientCode" = '${clientCode}'   -- Filter by client code
            AND ps."Active" = true                 -- Only include active ClientStudent relationships
            AND (t."Date" = '${date}' OR t."Date" IS NULL)  -- Allow NULL dates for students with no TapLogs
          GROUP BY s."StudentId"
        )
        SELECT DISTINCT ON (s."StudentId")
            s."StudentId" AS "studentId",
            s."StudentCode" AS "studentCode",
            s."FirstName" AS "firstName",
            s."MiddleInitial" AS "middleInitial",
            s."LastName" AS "lastName",
            s."CardNumber" AS "cardNumber",
            s."MobileNumber" AS "mobileNumber",
            s."Email" AS "email",
            s."Address" AS "address",
            s."RegistrationDate" AS "registrationDate",
            s."FullName" AS "fullName",
            syl."Name" AS "schoolYearLevel",
            sec."SectionName" AS "section",
            sc."SchoolName" AS "schoolName",
            COALESCE(cl."logs", '[]'::json) AS "logs"  -- Use an empty array if no logs are found
        FROM dbo."Students" s
        LEFT JOIN client_logs cl ON s."StudentId" = cl."StudentId"
        LEFT JOIN dbo."ClientStudent" ps ON s."StudentId" = ps."StudentId"
        LEFT JOIN dbo."Clients" p ON ps."ClientId" = p."ClientId"
        LEFT JOIN dbo."SchoolYearLevels" syl ON s."SchoolYearLevelId" = syl."SchoolYearLevelId"
        LEFT JOIN dbo."StudentSection" ssec ON s."StudentId" = ssec."StudentId"
        LEFT JOIN dbo."Sections" sec ON ssec."SectionId" = sec."SectionId"
        LEFT JOIN dbo."Schools" sc ON s."SchoolId" = sc."SchoolId"
        WHERE p."ClientCode" = '${clientCode}'
          AND ps."Active" = true
          AND 
              (
                LOWER(TRIM(s."FirstName")) like LOWER(TRIM('%${searchKey}%')) OR 
                LOWER(TRIM(s."MiddleInitial")) like LOWER(TRIM('%${searchKey}%')) OR 
                LOWER(TRIM(s."LastName")) like LOWER(TRIM('%${searchKey}%')) OR 
                LOWER(TRIM(s."FullName")) like LOWER(TRIM('%${searchKey}%'))
              )
        ORDER BY s."StudentId", s."RegistrationDate" DESC;

      `;
      const res: any[] = await this.clientRepo.manager.query(query);
      results = res.map((x) => {
        x.logs.sort((a, b) => {
          return (
            new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
          );
        });
        const log = x.logs.length > 1 ? x.logs[x.logs.length - 1] : x.logs[0];
        if (log) {
          x.status = log.status;
          x.recentTapTime = log.time;
          x.arrivedTime = x.logs[0].time;
        }
        return x;
      });
    } else {
      await this.customCacheManagerService.del(cacheKey);
    }
    await this.customCacheManagerService.set(cacheKey, results, 300);
    return results;
  }

  async getStudentsTapsByClientCode(clientCode, date) {
    date = moment(date).format("YYYY-MM-DD");
    const cacheKey = `${clientCode}_dashboard_client_students_taps_by_client_${date}`;
    let results = await this.customCacheManagerService.get<any>(cacheKey);
    if (!results || (results && results.length === 0)) {
      const res: any[] = await this.clientRepo.manager.query(`
      WITH client_logs AS (
        SELECT
            s."StudentId",
            array_to_json(array_agg(
                json_build_object(
                    'tapLogId', t."TapLogId",
                    'status', t."Status",
                    'time', t."Time",
                    'dateTime', (CONCAT(t."Date", ' ', t."Time")::timestamp AT TIME ZONE 'Asia/Manila')
                )
            )) AS "logs"
        FROM dbo."Students" s
        LEFT JOIN dbo."TapLogs" t ON s."CardNumber" = t."CardNumber"
        LEFT JOIN dbo."ClientStudent" ps ON s."StudentId" = ps."StudentId"
        LEFT JOIN dbo."Clients" p ON ps."ClientId" = p."ClientId"
        WHERE t."Date" = '${date}'             -- Filter for specific date in TapLogs
          AND p."ClientCode" = '${clientCode}'  -- Filter by client code
          AND ps."Active" = true                -- Only include active ClientStudent relationships
        GROUP BY s."StudentId"
      )
      SELECT DISTINCT ON (s."StudentId")
          s."StudentId" AS "studentId",
          s."StudentCode" AS "studentCode",
          s."FirstName" AS "firstName",
          s."MiddleInitial" AS "middleInitial",
          s."LastName" AS "lastName",
          s."CardNumber" AS "cardNumber",
          s."MobileNumber" AS "mobileNumber",
          s."Email" AS "email",
          s."Address" AS "address",
          s."RegistrationDate" AS "registrationDate",
          s."FullName" AS "fullName",
          syl."Name" AS "schoolYearLevel",
          sec."SectionName" AS "section",
          sc."SchoolName" AS "schoolName",
          cl."logs"
      FROM dbo."Students" s
      LEFT JOIN client_logs cl ON s."StudentId" = cl."StudentId"
      LEFT JOIN dbo."SchoolYearLevels" syl ON s."SchoolYearLevelId" = syl."SchoolYearLevelId"
      LEFT JOIN dbo."StudentSection" ssec ON s."StudentId" = ssec."StudentId"
      LEFT JOIN dbo."Sections" sec ON ssec."SectionId" = sec."SectionId"
      LEFT JOIN dbo."Schools" sc ON s."SchoolId" = sc."SchoolId"
      WHERE cl."logs" IS NOT NULL  -- Only return students with log entries
      ORDER BY s."StudentId", s."RegistrationDate" DESC;
  
      `);
      results = res.map((x) => {
        x.logs.sort((a, b) => {
          return (
            new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
          );
        });
        const log = x.logs.length > 1 ? x.logs[x.logs.length - 1] : x.logs[0];
        if (log) {
          x.status = log.status;
          x.recentTapTime = log.time;
          x.arrivedTime = x.logs[0].time;
        }
        return x;
      });
    } else {
      await this.customCacheManagerService.del(cacheKey);
    }
    await this.customCacheManagerService.set(cacheKey, results, 300);
    return results;
  }

  async getStudentsTapsByStudentCode(studentCode, date) {
    date = moment(date).format("YYYY-MM-DD");
    const cacheKey = `${studentCode}_dashboard_client_students_taps_by_student_${date}`;
    let results = await this.customCacheManagerService.get<any>(cacheKey);
    if (!results || (results && results.length === 0)) {
      results = await this.clientRepo.manager.query(`
        Select 
        tl."TapLogId" AS "tapLogId",
        tl."Status" AS "status",
        tl."Time" AS "time",
        t."DateTime" AS "date"
        from (
        select "TapLogId" as "tapLogId",
        ((CONCAT("Date",' ',"Time")::timestamp WITH TIME ZONE AT TIME ZONE 'Asia/Manila') AT TIME ZONE 'Asia/Manila'::text) as "DateTime" 
        from dbo."TapLogs"
        ) t 
        LEFT JOIN dbo."TapLogs" tl ON t."tapLogId" = tl."TapLogId"
        LEFT JOIN dbo."Students" s ON tl."CardNumber" = s."CardNumber"
        WHERE s."StudentCode" = '${studentCode}'
        AND tl."Date" = '${date}'
        ORDER BY t."DateTime" ASC
      `);
    }
    return results;
  }

  async clientRequestNewDashboard(
    clientCode,
    type: "ANNOUNCEMENT" | "LINK_STUDENT" | "STUDENT_LOGIN_LOGOUT"
  ) {
    if (type === "ANNOUNCEMENT") {
      await this.customCacheManagerService.del(
        `${clientCode}_dashboard_client_announcements_*`
      );
    } else if (type === "STUDENT_LOGIN_LOGOUT") {
      await this.customCacheManagerService.del(
        `${clientCode}_dashboard_client_students_*`
      );
    } else if (type === "LINK_STUDENT") {
    }
    const user = await this.clientRepo.manager.findOne(Users, {
      where: {
        clients: {
          clientCode,
        },
      },
    });
    await this.customCacheManagerService.del(`notifications_${user.userId}*`);
    return true;
  }
}
