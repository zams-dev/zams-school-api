export enum NOTIF_TYPE {
  ANNOUNCEMENT = "ANNOUNCEMENT",
  LINK_REQUEST = "LINK_STUDENT",
  STUDENT_LOG = "STUDENT_LOGIN_LOGOUT",
  EMPLOYEET_LOG = "EMPLOYEE_LOGIN_LOGOUT",
};
export enum NOTIF_TITLE {
  LINK_REQUEST_APPROVED = "Approved Request to Link Student!",
  LINK_REQUEST_REJECTED = "Rejected Link to Student Request!",

  STUDENT_LOG = "Student {student_name} log {status} today at {time}!",
};
