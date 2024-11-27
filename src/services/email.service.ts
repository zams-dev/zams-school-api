import { Injectable } from "@nestjs/common";
import nodemailer from "nodemailer";
import { readFile } from "fs/promises"; // ES6 import for file system access
import { ConfigService } from "@nestjs/config";
import path from "path";
import { hash } from "src/common/utils/utils";

@Injectable()
export class EmailService {
  constructor(private readonly config: ConfigService) {}

  async sendEmailVerification(recipient, sessionId, otp) {
    try {
      const evEmail = this.config.get<string>("EV_EMAIL");
      const evPass = this.config.get<string>("EV_PASS");
      const evAddress = this.config.get<string>("EV_ADDRESS");
      const evSubject = this.config.get<string>("EV_SUBJECT");
      const evTempPath = this.config.get<string>("EV_TEMPLATE_PATH");
      const evCompany = this.config.get<string>("EV_COMPANY");
      const evVerifyURL = this.config.get<string>("EV_URL");
      const transporter = nodemailer.createTransport({
        service: "gmail", // Use 'gmail' for Google's SMTP
        auth: {
          user: evEmail, // Replace with your Gmail address
          pass: evPass.toString().trim(), // Replace with your Gmail App Password
        },
      });
      let emailTemplate = await readFile(
        path.join(__dirname, evTempPath),
        "utf-8"
      );
      emailTemplate = emailTemplate.replace("{{_OTP_}}", otp);
      const hashOTP = await hash(otp);
      emailTemplate = emailTemplate.replace(
        "{{_URL_}}",
        `${evVerifyURL}?sessionId=${sessionId}&code=${hashOTP}`
      );
      emailTemplate = emailTemplate.replace(
        "{{_YEAR_}}",
        new Date().getFullYear().toString()
      );
      emailTemplate = emailTemplate.replace("{{_COMPANY_}}", evCompany);
      const info = await transporter.sendMail({
        from: evAddress, // Sender address
        to: recipient, // List of recipients
        subject: evSubject, // Subject line
        html: emailTemplate, // HTML body
      });

      console.log("Message sent: %s", info.messageId);
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
      return true;
    } catch (ex) {
      throw ex;
    }
  }

  async sendResetPasswordOtp(recipient, userCode, otp) {
    try {
      const evEmail = this.config.get<string>("EV_EMAIL");
      const evPass = this.config.get<string>("EV_PASS");
      const evAddress = this.config.get<string>("EV_ADDRESS");
      const evSubject = this.config.get<string>("EV_RESET_SUBJECT");
      const evTempPath = this.config.get<string>("EV_RESET_TEMPLATE_PATH");
      const evCompany = this.config.get<string>("EV_COMPANY");
      const evVerifyURL = this.config.get<string>("EV_URL");
      const transporter = nodemailer.createTransport({
        service: "gmail", // Use 'gmail' for Google's SMTP
        auth: {
          user: evEmail, // Replace with your Gmail address
          pass: evPass.toString().trim(), // Replace with your Gmail App Password
        },
      });
      let emailTemplate = await readFile(
        path.join(__dirname, evTempPath),
        "utf-8"
      );
      emailTemplate = emailTemplate.replace("{{_OTP_}}", otp);
      const hastOTP = await hash(otp);
      emailTemplate = emailTemplate.replace(
        "{{_URL_}}",
        `${evVerifyURL}?user=${userCode}&code=${hastOTP}`
      );
      emailTemplate = emailTemplate.replace(
        "{{_YEAR_}}",
        new Date().getFullYear().toString()
      );
      emailTemplate = emailTemplate.replace("{{_COMPANY_}}", evCompany);
      const info = await transporter.sendMail({
        from: evAddress, // Sender address
        to: recipient, // List of recipients
        subject: evSubject, // Subject line
        html: emailTemplate, // HTML body
      });

      console.log("Message sent: %s", info.messageId);
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
      return true;
    } catch (ex) {
      throw ex;
    }
  }
}
