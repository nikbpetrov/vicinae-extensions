import { Toast, closeMainWindow, showToast } from "@vicinae/api";
import { runAppleScript } from "@raycast/utils";
import { spawn } from "child_process";
import { platform } from "process";

const makeNewWindowMacOS = async () => {
	await runAppleScript(`
    tell application "Cursor"
	    activate
    end tell
    delay(0.5)
    tell application "Cursor"
	    activate
    end tell

    tell application "System Events"
	    tell process "Cursor"
		    click menu item "New Window" of menu "File" of menu bar 1
	    end tell
    end tell
  `);
};

const makeNewWindowLinux = async () => {
	return new Promise<void>((resolve, reject) => {
		// Launch cursor - running cursor without arguments opens a new window
		const child = spawn("cursor", [], {
			detached: true,
			stdio: "ignore",
		});

		child.on("error", (error) => {
			reject(
				new Error(
					`Failed to launch Cursor: ${error.message}. Make sure Cursor is installed and available in PATH.`,
				),
			);
		});

		// Spawn succeeded - cursor is launching
		child.unref();
		resolve();
	});
};

const makeNewWindow = async () => {
	if (platform === "darwin") {
		await makeNewWindowMacOS();
	} else if (platform === "linux") {
		await makeNewWindowLinux();
	} else {
		// Windows or other platforms - try using cursor command
		await makeNewWindowLinux();
	}
};

export default async function command() {
	try {
		await closeMainWindow();
		await makeNewWindow();
	} catch (error) {
		await showToast({
			title: "Failed opening new window",
			style: Toast.Style.Failure,
			message: error instanceof Error ? error.message : String(error),
		});
	}
}
