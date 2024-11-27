import { filter } from "rxjs";
import { type } from "os";
/* eslint-disable @typescript-eslint/no-var-requires */
import {
  getConnectionOptions,
  getConnection,
  Between,
  ILike,
  Raw,
  Not,
  ArrayOverlap,
  In,
  IsNull,
} from "typeorm";
import * as bcrypt from "bcrypt";
import * as fs from "fs";
import * as path from "path";
import { Transform } from "class-transformer";
import moment from "moment-timezone";
import secretManagerConfig from "src/core/secret-manager/secret-manager.config";
import { randomInt } from "crypto";

export const toPromise = <T>(data: T): Promise<T> => {
  return new Promise<T>((resolve) => {
    resolve(data);
  });
};

export const getDbConnectionOptions = async (connectionName = "default") => {
  const options = await getConnectionOptions(
    process.env.NODE_ENV || "development"
  );
  return {
    ...options,
    name: connectionName,
  };
};

export const getDbConnection = async (connectionName = "default") => {
  return await getConnection(connectionName);
};

export const runDbMigrations = async (connectionName = "default") => {
  const conn = await getDbConnection(connectionName);
  await conn.runMigrations();
};

export const hash = async (value) => {
  return await bcrypt.hash(value, 10);
};

export const compare = async (newValue, hashedValue) => {
  return await bcrypt.compare(hashedValue, newValue);
};

export const getAge = async (birthDate: Date) => {
  const timeDiff = Math.abs(Date.now() - birthDate.getTime());
  return Math.floor(timeDiff / (1000 * 3600 * 24) / 365.25);
};

export const addHours = (numOfHours, date: Date) => {
  date.setTime(date.getTime() + numOfHours * 60 * 60 * 1000);
  return date;
};

export const round = (number) => {
  return Math.round((number + Number.EPSILON) * 100);
};

export function getEnvPath(dest: string): string {
  // const env: string | undefined = process.env.NODE_ENV;
  const env: string | undefined = process.env["NODE" + "_ENV"];
  const fallback: string = path.resolve(`${dest}/.env`);
  const filename: string = env ? `${env}.env` : "development.env";
  let filePath: string = path.resolve(`${dest}/${filename}`);

  if (!fs.existsSync(filePath)) {
    filePath = fallback;
  }

  return filePath;
}

export function createConfig(): any {
  const env = process.env.NODE_ENV || "development";
  if (env && env !== "development") {
    return {
      load: [secretManagerConfig],
    };
  } else {
    const filename: string = env ? `${env}.env` : "development.env";
    const filePath: string = path.resolve(
      __dirname,
      `../../common/envs/${filename}`
    );

    return {
      envFilePath: filePath,
    };
  }
}

export function ToBoolean(): (target: any, key: string) => void {
  return Transform((value: any) => value.obj[value.key]);
}

export function formatId(value: any, args?: any): unknown {
  let s = value + "";
  while (s.length < args) {
    s = "0" + s;
  }
  return s;
}

export const convertColumnNotationToObject = (notation, nestedValue) => {
  const object = {};
  let pointer = object;
  notation.split(".").map((key, index, arr) => {
    pointer = pointer[key] = index == arr.length - 1 ? nestedValue : {};
  });
  return object;
};

export const getFullName = (
  firstName: string,
  middleInitial = "",
  lastName: string
) => {
  if (middleInitial && middleInitial !== "") {
    return `${firstName} ${middleInitial} ${lastName}`;
  } else {
    return `${firstName} ${lastName}`;
  }
};

export const columnDefToTypeORMCondition = (columnDef) => {
  const conditionMapping = [];
  for (var col of columnDef) {
    if (col.type === "date") {
      if (
        moment(new Date(col.filter), "MMM DD, YYYY", true).isValid() ||
        moment(new Date(col.filter), "MMMM DD, YYYY", true).isValid() ||
        moment(new Date(col.filter), "YYYY-MM-DD", true).isValid()
      ) {
        conditionMapping.push(
          convertColumnNotationToObject(
            col.apiNotation,
            moment(new Date(col.filter), "YYYY-MM-DD")
          )
        );
      }
    } else if (col.type === "date-range") {
      const range: any[] =
        col.filter && col.filter.split(",").length > 0
          ? col.filter.split(",").filter((x) => x)
          : [];
      range[1] = range.length === 1 ? range[0] : range[1];
      if (
        moment(new Date(range[0]), "YYYY-MM-DD", true).isValid() &&
        moment(new Date(range[1]), "YYYY-MM-DD", true).isValid()
      ) {
        conditionMapping.push(
          convertColumnNotationToObject(
            col.apiNotation,
            Between(range[0], range[1])
          )
        );
      }
    } else if (col.type === "option-yes-no") {
      if (
        col.filter &&
        col.filter !== "" &&
        ["yes", "no"].some(
          (x) =>
            x.toString().toLowerCase() ===
            col.filter.toString().toLowerCase().trim()
        )
      ) {
        const value = col.filter.toString().toLowerCase().trim() === "yes";
        conditionMapping.push(
          convertColumnNotationToObject(col.apiNotation, In([value]))
        );
      }
    } else if (col.type === "number-range") {
      const range = col.filter.split("-").map((x) => x?.trim());

      conditionMapping.push(
        convertColumnNotationToObject(
          col.apiNotation,
          Between(range[0], range[1])
        )
      );
    } else if (col.type === "precise") {
      conditionMapping.push(
        convertColumnNotationToObject(col.apiNotation, col.filter)
      );
    } else if (col.type === "not" || col.type === "except") {
      conditionMapping.push(
        convertColumnNotationToObject(col.apiNotation, Not(col.filter))
      );
    } else if (col.type === "in" || col.type === "includes") {
      conditionMapping.push(
        convertColumnNotationToObject(col.apiNotation, In(col.filter))
      );
    } else if (col.type === "null") {
      conditionMapping.push(
        convertColumnNotationToObject(col.apiNotation, IsNull())
      );
    } else {
      conditionMapping.push(
        convertColumnNotationToObject(col.apiNotation, ILike(`%${col.filter}%`))
      );
    }
  }
  const newArr = [];
  for (const item of conditionMapping) {
    const name = Object.keys(item)[0];
    if (newArr.some((x) => x[name])) {
      const index = newArr.findIndex((x) => x[name]);
      const res = Object.keys(newArr[index]).map((key) => newArr[index][key]);
      res.push(item[name]);
      newArr[index] = {
        [name]: Object.assign({}, ...res),
      };
      res.push(newArr[index]);
    } else {
      newArr.push(item);
    }
  }
  return Object.assign({}, ...newArr);
};

export const generateIndentityCode = (id) => {
  return String(id).padStart(6, "0");
};

export const getStartAndEndDate = (
  frequency: "DAILY" | "WEEKLY" | "MONTHLY" | "ANNUALLY",
  targetDate: string,
  isPrev = false
): { startDate: Date; endDate: Date } => {
  const date = new Date(targetDate);
  let startDate: Date;
  let endDate: Date;

  try {
    if (!isPrev) {
      switch (frequency) {
        case "DAILY":
          startDate = new Date(date);
          endDate = new Date(date);
          break;

        case "WEEKLY":
          // Find the closest Monday (start of the week)
          const dayOfWeek = date.getDay(); // 0 (Sunday) - 6 (Saturday)
          const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Calculate how far the given day is from Monday
          const daysToSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek; // Calculate how far the given day is from Sunday

          startDate = new Date(date);
          startDate.setDate(date.getDate() - daysToMonday); // Adjust date to the previous Monday

          endDate = new Date(date);
          endDate.setDate(date.getDate() + daysToSunday); // Adjust date to the next Sunday
          break;

        case "MONTHLY":
          // Get the start of the month and end of the month
          startDate = new Date(date.getFullYear(), date.getMonth(), 2); // Start of the month
          endDate = new Date(date.getFullYear(), date.getMonth() + 1, 1); // End of the month (0 returns the last day of the previous month)
          break;

        case "ANNUALLY":
          // Get the start of the year and end of the year
          startDate = new Date(date.getFullYear(), 0, 1); // Start of the year
          endDate = new Date(date.getFullYear(), 11, 31); // End of the year
          break;

        default:
          throw new Error("Unsupported frequency type");
      }
    } else {
      switch (frequency) {
        case "DAILY":
          startDate = new Date(date);
          startDate.setDate(date.getDate() - 1);
          endDate = new Date(date);
          endDate.setDate(date.getDate() - 1);
          break;

        case "WEEKLY":
          // Get the day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
          const dayOfWeek = date.getDay(); // Get the day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)

          // Calculate how many days we need to go back to get to the Monday of the **previous** week
          startDate = new Date(date);
          const daysSincePreviousMonday = dayOfWeek === 0 ? 7 : dayOfWeek; // If it's Sunday (0), go back 7 days, otherwise go back by dayOfWeek

          startDate.setDate(date.getDate() - daysSincePreviousMonday - 6); // This will always give the Monday of the previous week

          // End date is the Sunday of the previous week
          endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 6); // Add 6 days to Monday to get the Sunday of that week

          break;

        case "MONTHLY":
          // Start date: First day of the previous month
          startDate = new Date(date.getFullYear(), date.getMonth() - 1, 2);

          // End date: Last day of the previous month
          endDate = new Date(date.getFullYear(), date.getMonth(), 1);
          break;

        case "ANNUALLY":
          // Start date: 1st January of the previous year
          startDate = new Date(date.getFullYear() - 1, 0, 2);

          // End date: 31st December of the previous year
          endDate = new Date(date.getFullYear() - 1, 12, 1);
          break;
        default:
          throw new Error("Unsupported frequency: " + frequency);
      }
    }

    return { startDate, endDate };
  } catch (ex) {
    throw ex;
  }
};

export const getTotalDaysBetweenDates = (date1: Date, date2: Date): number => {
  // Normalize both dates to midnight to ignore time differences
  const start = new Date(
    date1.getFullYear(),
    date1.getMonth(),
    date1.getDate()
  );
  const end = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());

  // Ensure start date is before end date
  if (start > end) {
    throw new Error("Start date must be before end date");
  }

  // Helper function to calculate total business days in a given month
  const getBusinessDaysInMonth = (year: number, month: number): number => {
    let businessDaysCount = 0;
    const daysInMonth = new Date(year, month + 1, 0).getDate(); // Get the number of days in the month

    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day);
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        // Exclude weekends (0 = Sunday, 6 = Saturday)
        businessDaysCount++;
      }
    }
    return businessDaysCount;
  };

  // Helper function to calculate business days in a range
  const getBusinessDaysInRange = (start: Date, end: Date): number => {
    let businessDaysCount = 0;
    const currentDate = new Date(start);

    while (currentDate <= end) {
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        // Exclude weekends
        businessDaysCount++;
      }
      currentDate.setDate(currentDate.getDate() + 1); // Move to the next day
    }
    return businessDaysCount;
  };

  // Check if we're calculating for the entire month
  const isFullMonthLogic =
    start.getDate() === 1 &&
    end.getDate() ===
      new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate() &&
    start.getMonth() === end.getMonth() &&
    start.getFullYear() === end.getFullYear();

  if (isFullMonthLogic) {
    // Calculate business days for the entire month
    return getBusinessDaysInMonth(start.getFullYear(), start.getMonth());
  }

  // Otherwise, calculate business days for the range between the two dates
  return getBusinessDaysInRange(start, end);
};

// Generate a 6-digit OTP with low probability of repeating
export const generateOTP = () => {
  let otp;
  const uniqueOTPs = new Set();

  // Ensure the OTP is not a duplicate with 1 in 1000 odds
  do {
    otp = randomInt(100000, 1000000).toString(); // Generate a 6-digit OTP
  } while (uniqueOTPs.has(otp));

  // Store the OTP to track uniqueness within the 1000 scope
  uniqueOTPs.add(otp);

  // If we exceed 1000 unique OTPs, clear the set to maintain the odds
  if (uniqueOTPs.size > 1000) {
    uniqueOTPs.clear();
  }

  return otp;
};
export const normalizeCacheKey = (baseKey: string, params: any) => {
  const normalizedParams = JSON.stringify(params, Object.keys(params).sort());
  return `${baseKey}_${normalizedParams}`;
}
