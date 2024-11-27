import { Injectable } from "@nestjs/common";
import { CronTime } from "cron";
import moment from "moment-timezone";
@Injectable()
export class DateTimeCheckerService {
  constructor() {}

  fromUTCToDesiredTimezone(date, timezone) {
    const localTime = moment(date).tz(timezone);
    const minute = localTime.minutes();
    const hour = localTime.hours();
    const day = localTime.date();
    const month = localTime.month() + 1; // Cron months are 1-based
    const cronTime = `${minute} ${hour} ${day} ${month} *`;
    return {
      utc: moment.utc(date).tz("UTC").format("YYYY-MM-DD HH:mm:ss"),
      result: moment.utc(date).tz(timezone).format("YYYY-MM-DD HH:mm:ss"),
      cronTime: cronTime.toString(),
    };
  }
}
