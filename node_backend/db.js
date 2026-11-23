import mongoose from "mongoose";
import { MONGO_URI } from "./config.js";

let memoryServer = null;

/**
 * Connects to MongoDB. In docker-compose MONGO_URI points at the `mongo`
 * service. For local development without MongoDB installed, an in-memory
 * server is started instead (dev dependency; data is lost on restart).
 */
export async function connectDatabase() {
  let uri = MONGO_URI;

  if (!uri) {
    try {
      const { MongoMemoryServer } = await import("mongodb-memory-server");
      memoryServer = await MongoMemoryServer.create();
      uri = memoryServer.getUri("imagesr");
      console.warn(
        "[db] MONGO_URI is not set. Using an in-memory MongoDB: all accounts and jobs are lost when the server stops."
      );
    } catch (err) {
      throw new Error(
        "MONGO_URI is not set and mongodb-memory-server is unavailable. Set MONGO_URI (e.g. mongodb://localhost:27017/imagesr)."
      );
    }
  }

  await mongoose.connect(uri);
  console.log("[db] connected");
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
  if (memoryServer) await memoryServer.stop();
}
