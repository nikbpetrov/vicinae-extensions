import { environment } from "@vicinae/api";
import { getPreferences } from "./preferences";

const { hostname, username, password } = getPreferences();
// Normalize hostname by removing protocol if present
const normalizedHostname = hostname.replace(/^https?:\/\//, "").trim();
export const BASE_URL = `https://${normalizedHostname}`;
export const API_HEADERS = {
	Authorization:
		"Basic " + Buffer.from(username + ":" + password).toString("base64"),
	"User-Agent": `Vicinae/${environment.vicinaeVersion.tag || "unknown"}`,
};
