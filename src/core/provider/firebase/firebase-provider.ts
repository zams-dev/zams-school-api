import { Injectable } from "@nestjs/common";
import * as admin from "firebase-admin";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class FirebaseProvider {
  public readonly app: admin.app.App;
  public readonly db: admin.database.Database;
  constructor(private readonly config: ConfigService) {
    const firebaseConfig = {
      type: this.config.get<string>("FIREBASE_TYPE"),
      projectId: this.config.get<string>("FIREBASE_PROJECT_ID"),
      privateKeyId: this.config.get<string>("FIREBASE_PRIVATE_KEY_ID"),
      privateKey: this.config
        .get<string>("FIREBASE_PRIVATE_KEY")
        .split(String.raw`\n`)
        .join("\n"),
      clientEmail: this.config.get<string>("FIREBASE_CLIENT_EMAIL"),
      clientId: this.config.get<string>("FIREBASE_CLIENT_ID"),
      authUri: this.config.get<string>("FIREBASE_AUTH_URI"),
      tokenUri: this.config.get<string>("FIREBASE_TOKEN_URI"),
      authProviderX509CertUrl: this.config.get<string>(
        "FIREBASE_AUTH_PROVIDER_X509_CERT_URL"
      ),
      clientC509CertUrl: this.config.get<string>(
        "FIREBASE_CLIENT_X509_CERT_URL"
      ),
    };
    this.app = admin.initializeApp({
      credential: admin.credential.cert(firebaseConfig),
      storageBucket: this.config.get<string>("FIREBASE_BUCKET"),
      databaseURL: this.config.get<string>("FIREBASE_DATABASE_URL"),
    });
    this.db = admin.database();
  }
}
