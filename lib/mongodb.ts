import "server-only";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error("Missing MONGODB_URI environment variable");
}

// Cache the connection promise across Turbopack/Next.js dev HMR reloads so
// each reload doesn't open a new connection against the same process.
const globalForMongo = globalThis as unknown as {
  _mongoClientPromise?: Promise<MongoClient>;
};

const clientPromise =
  globalForMongo._mongoClientPromise ?? new MongoClient(uri).connect();

if (process.env.NODE_ENV === "development") {
  globalForMongo._mongoClientPromise = clientPromise;
}

export default clientPromise;
