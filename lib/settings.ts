import "server-only";
import clientPromise from "@/lib/mongodb";
import type { AppSettings } from "@/context/settings-context";
import type { DateRangeFilter } from "@/context/filters-context";

export type UserSettingsDocument = AppSettings & {
  user_id: string;
  date_range?: DateRangeFilter;
};

export async function getUserSettings(): Promise<UserSettingsDocument | null> {
  try {
    const client = await clientPromise;
    return await client
      .db("signal")
      .collection<UserSettingsDocument>("user_settings")
      .findOne({ user_id: "default" }, { projection: { _id: 0 } });
  } catch (error) {
    console.error("Failed to load user settings:", error);
    return null;
  }
}
