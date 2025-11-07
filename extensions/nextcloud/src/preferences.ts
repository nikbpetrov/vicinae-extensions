import { getPreferenceValues } from "@vicinae/api";

export interface Preferences {
	hostname: string;
	username: string;
	password: string;
	scope?: string;
}

export function getPreferences() {
	return getPreferenceValues<Preferences>();
}
