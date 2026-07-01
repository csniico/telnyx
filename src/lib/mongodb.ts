import "server-only";
import { MongoClient, type Db } from "mongodb";
import { env } from "./env";

/**
 * On Vercel every serverless invocation can spin up a fresh module scope, which
 * would open a brand new Mongo connection each time and quickly exhaust the
 * Atlas connection pool. We cache the client promise on `globalThis` so warm
 * invocations reuse the same pooled connection.
 */
declare global {
  // eslint-disable-next-line no-var
  var _telnyxMongoClientPromise: Promise<MongoClient> | undefined;
}

function getClientPromise(): Promise<MongoClient> {
  if (global._telnyxMongoClientPromise) {
    return global._telnyxMongoClientPromise;
  }
  const client = new MongoClient(env.mongoUri, { maxPoolSize: 10 });
  const promise = client.connect();
  // Cache across warm invocations (prod) and HMR reloads (dev).
  global._telnyxMongoClientPromise = promise;
  return promise;
}

export async function getDb(): Promise<Db> {
  const client = await getClientPromise();
  return client.db(env.mongoDb);
}
