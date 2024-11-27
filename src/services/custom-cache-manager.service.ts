import { Injectable } from "@nestjs/common";
import NodeCache from "node-cache";
import { FirebaseProvider } from "src/core/provider/firebase/firebase-provider";
import * as admin from "firebase-admin";

@Injectable()
export class CustomCacheManagerService {
  private cache = new NodeCache();
  private readonly db: admin.database.Reference;
  private readonly isProduction;
  constructor(private firebaseProvoder: FirebaseProvider) {
    const env = process?.env?.NODE_ENV || "development";
    // this.isProduction = env !== "development";
    this.isProduction = false;
    this.db = this.firebaseProvoder.db.ref("cache");
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      if (this.isProduction) {
        // Use Firebase Realtime Database for production
        const expirationTime = Date.now() + ttl * 1000;
        await this.db.child(key).set({ value, expirationTime });
      } else {
        this.cache.set(key, value, ttl);
      }
    } catch (ex) {
      throw ex;
    }
  }

  async get<T>(key: string): Promise<T | undefined> {
    try {
      if (this.isProduction) {
        const snapshot = await this.db.child(key).once("value");
        const data = snapshot.val();

        if (!data) return null;

        if (data.expirationTime < Date.now()) {
          await this.db.child(key).remove(); // Remove expired cache
          return null;
        }

        return data.value;
      } else {
        return this.cache.get<T>(key);
      }
    } catch (ex) {
      throw ex;
    }
  }

  async del(keyPattern: string): Promise<void> {
    if (this.isProduction) {
      if (keyPattern.includes("*")) {
        const pattern = new RegExp(`^${keyPattern.replace(/\*/g, ".*")}$`);
        // Delete keys from Firebase Realtime Database
        const snapshot = await this.db.once("value");
        const allKeys = snapshot.val() || {};
        const keysToDelete = Object.keys(allKeys).filter((dbKey) =>
          pattern.test(dbKey)
        );

        for (const dbKey of keysToDelete) {
          await this.db.child(dbKey).remove();
        }
      } else {
        // Use Firebase Realtime Database for production
        await this.db.child(keyPattern).remove();
      }
    } else {
      const keys = this.cache.keys();
      const matchingKeys = keys.filter((key) =>
        key.startsWith(keyPattern.replace("*", ""))
      );
      matchingKeys.forEach((key) => this.cache.del(key));
    }
  }

  async getAllKeys(): Promise<string[]> {
    if (this.isProduction) {
      const snapshot = await this.db.once("value");
      return snapshot.val() || {};
    } else {
      return this.cache.keys();
    }
  }

  reset(): void {
    if (this.isProduction) {
    } else {
      this.cache.flushAll();
    }
  }
}
