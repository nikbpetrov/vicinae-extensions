import { getPreferenceValues } from "@vicinae/api";

export function getPreferences() {
  return getPreferenceValues<Preferences>();
}
