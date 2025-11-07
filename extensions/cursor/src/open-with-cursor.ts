import {
	showToast,
	Toast,
	open,
	closeMainWindow,
	getSelectedFinderItems,
	getFrontmostApplication,
} from "@vicinae/api";
import { runAppleScript } from "@raycast/utils";
import { platform } from "process";
import { exec } from "child_process";
import { promisify } from "util";
import { homedir } from "os";
import { getCurrentFinderPath } from "./utils/apple-scripts";

const execAsync = promisify(exec);

// Function to get selected Path Finder items (macOS only)
const getSelectedPathFinderItems = async () => {
	if (platform !== "darwin") {
		return [];
	}
	const script = `
    tell application "Path Finder"
      set thePaths to {}
      repeat with pfItem in (get selection)
        set the end of thePaths to POSIX path of pfItem
      end repeat
      return thePaths
    end tell
  `;

	const paths = await runAppleScript(script);
	return paths.split(","); // Assuming the paths are comma-separated
};

// Note: On Linux, getting selected files from file managers is complex and varies by file manager.
// The Vicinae API's getSelectedFinderItems() should ideally handle this, but if it doesn't,
// we fall back to opening the current directory or home directory.

// Get current directory for Linux fallback
const getCurrentDirectoryLinux = async (): Promise<string | null> => {
	if (platform !== "linux") {
		return null;
	}

	try {
		// Try to get the current working directory from the shell
		// This is a simple fallback - in practice, we'd want to get it from the file manager
		const { stdout } = await execAsync("pwd");
		return stdout.trim();
	} catch {
		// Fallback to home directory
		return homedir();
	}
};

export default async function main() {
	try {
		let selectedItems: { path: string }[] = [];
		const currentApp = await getFrontmostApplication();

		// Try to get selected items - this should work cross-platform via Vicinae API
		try {
			selectedItems = await getSelectedFinderItems();
		} catch (error) {
			// If getSelectedFinderItems fails, try platform-specific methods
			if (platform === "darwin") {
				if (currentApp.name === "Finder") {
					// Already tried getSelectedFinderItems above
				} else if (currentApp.name === "Path Finder") {
					const paths = await getSelectedPathFinderItems();
					selectedItems = paths.map((p) => ({ path: p }));
				}
			} else if (platform === "linux") {
				// On Linux, getSelectedFinderItems() from Vicinae API should work if supported
				// If it doesn't, we'll fall back to current directory below
				// Note: File manager integration on Linux is complex and varies by desktop environment
			}
		}

		if (selectedItems.length === 0) {
			// No items selected, try to get current directory
			let currentPath: string | null = null;

			if (platform === "darwin") {
				currentPath = await getCurrentFinderPath();
			} else if (platform === "linux") {
				currentPath = await getCurrentDirectoryLinux();
			}

			if (!currentPath || currentPath.length === 0) {
				throw new Error(
					"No items selected and could not determine current directory",
				);
			}

			await open(currentPath, "Cursor");
		} else {
			for (const item of selectedItems) {
				await open(item.path, "Cursor");
			}
		}

		await closeMainWindow();
	} catch (error) {
		await showToast({
			title: "Failed opening selected item",
			style: Toast.Style.Failure,
			message: error instanceof Error ? error.message : String(error),
		});
	}
}
