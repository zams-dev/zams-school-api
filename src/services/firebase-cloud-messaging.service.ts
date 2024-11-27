import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MessagingDevicesResponse } from "firebase-admin/lib/messaging/messaging-api";
import { FirebaseProvider } from "src/core/provider/firebase/firebase-provider";

@Injectable()
export class FirebaseCloudMessagingService {
  messageConfig;
  constructor(
    private readonly config: ConfigService,
    private firebaseProvoder: FirebaseProvider
  ) {
    this.messageConfig = {
      android: {
        notification: {
          imageUrl: this.config.get<string>("FIREBASE_CLOUD_MESSAGING_IMAGE"),
        },
        priority: this.config.get<string>("FIREBASE_CLOUD_MESSAGING_PRIO"),
      },
      apns: {
        payload: {},
        fcmOptions: {
          imageUrl: this.config.get<string>("FIREBASE_CLOUD_MESSAGING_IMAGE"),
        },
      },
      webpush: {
        headers: {
          image: this.config.get<string>("FIREBASE_CLOUD_MESSAGING_IMAGE"),
        },
      },
    };
  }

  async sendToDevice(token, title, description) {
    const payload = {
      token,
      notification: {
        title: title,
        body: description,
      },
      ...this.messageConfig,
    };
    return await this.firebaseProvoder.app
      .messaging()
      .send(payload)
      .then(() => {
        console.log("Successfully sent message");
      })
      .catch((error) => {
        console.log(`Error sending notif! ${error.message}`);
      });
  }

  async firebaseSendToDevice(token, title, description) {
    return await this.firebaseProvoder.app
      .messaging()
      .sendToDevice(
        token,
        {
          notification: {
            title: title,
            body: description,
            sound: "notif_alert",
          },
        },
        {
          priority: "high",
          timeToLive: 60 * 24,
          android: { sound: "notif_alert" },
        }
      )
      .then((response: MessagingDevicesResponse) => {
        console.log("Successfully sent message:", response);
      })
      .catch((error) => {
        throw new HttpException(
          `Error sending notif! ${error.message}`,
          HttpStatus.BAD_REQUEST
        );
      });
  }
}
