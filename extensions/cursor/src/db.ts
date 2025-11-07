import { Alert, Icon, Toast, confirmAlert, showToast } from "@vicinae/api";
import { homedir } from "os";
import { platform } from "process";
import path from "path";
import { EntryLike, RecentEntries } from "./types";
import fs from "fs";
import { isSameEntry } from "./utils";
import { execFilePromise } from "./utils/exec";
import { useState, useEffect } from "react";

export type RemoveMethods = {
  removeEntry: (entry: EntryLike) => Promise<void>;
  removeAllEntries: () => Promise<void>;
};

export function useRecentEntries() {
  const dbPath = getPath();
  const [data, setData] = useState<EntryLike[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<boolean>(false);
  const [revalidateCounter, setRevalidateCounter] = useState(0);
  
  useEffect(() => {
    let isMounted = true;

    async function loadEntries() {
      if (!fs.existsSync(dbPath)) {
        if (isMounted) {
          setData([]);
          setIsLoading(false);
          setError(true);
        }
        return;
      }
      
      try {
        const query = `SELECT json_extract(value, '$.entries') as entries FROM ItemTable WHERE key = 'history.recentlyOpenedPathsList';`;
        const result: any = await execFilePromise("sqlite3", [dbPath, query], { encoding: "utf8" });
        
        let resultStr = "";
        if (result && typeof result === "object" && "stdout" in result) {
          const stdout = result.stdout;
          resultStr = typeof stdout === "string" ? stdout.trim() : String(stdout).trim();
        } else if (typeof result === "string") {
          resultStr = result.trim();
        }
        
        if (resultStr && resultStr.length > 0) {
          try {
            const parsedEntries = JSON.parse(resultStr) as EntryLike[];
            if (isMounted) {
              setData(parsedEntries);
              setIsLoading(false);
              setError(false);
            }
          } catch (parseError) {
            if (isMounted) {
              setData([]);
              setIsLoading(false);
              setError(true);
            }
          }
        } else {
          if (isMounted) {
            setData([]);
            setIsLoading(false);
            setError(false);
          }
        }
      } catch (queryError) {
        if (isMounted) {
          setData([]);
          setIsLoading(false);
          setError(true);
        }
      }
    }

    loadEntries();

    return () => {
      isMounted = false;
    };
  }, [dbPath, revalidateCounter]);
  
  const revalidate = async () => {
    // Reload entries by incrementing counter to trigger useEffect
    setRevalidateCounter((prev) => prev + 1);
  };

  async function removeEntry(entry: EntryLike) {
    if (!data) {
      await showToast(Toast.Style.Failure, "No recent entries found");
      return;
    }

    try {
      await saveEntries(data.filter((currentEntry: EntryLike) => !isSameEntry(currentEntry, entry)));
      await revalidate();
      showToast(Toast.Style.Success, "Entry removed", `Restart Cursor to sync the list in Cursor (optional)`);
    } catch (error) {
      showToast(Toast.Style.Failure, "Failed to remove entry");
    }
  }

  async function removeAllEntries() {
    try {
      if (
        await confirmAlert({
          icon: Icon.Trash,
          title: "Remove all recent entries?",
          message: "This cannot be undone.",
          dismissAction: {
            title: "Cancel",
            style: Alert.ActionStyle.Cancel,
          },
          primaryAction: {
            title: "Remove",
            style: Alert.ActionStyle.Destructive,
          },
        })
      ) {
        await saveEntries([]);
        await revalidate();
        showToast(Toast.Style.Success, "All entries removed", `Restart Cursor to sync the list in Cursor (optional)`);
      }
    } catch (error) {
      showToast(Toast.Style.Failure, "Failed to remove entries");
    }
  }

  return { data, isLoading, error, removeEntry, removeAllEntries };
}

function getPath() {
  const home = homedir();
  
  if (platform === "darwin") {
    // macOS: ~/Library/Application Support/Cursor/User/globalStorage/state.vscdb
    return path.join(home, "Library", "Application Support", "Cursor", "User", "globalStorage", "state.vscdb");
  } else if (platform === "linux") {
    // Linux: Try multiple possible paths
    const possiblePaths = [
      path.join(home, ".config", "Cursor", "User", "globalStorage", "state.vscdb"), // Standard (capital C)
      path.join(home, ".config", "cursor", "User", "globalStorage", "state.vscdb"), // lowercase
      path.join(home, ".local", "share", "Cursor", "User", "globalStorage", "state.vscdb"),
      path.join(home, ".cursor", "User", "globalStorage", "state.vscdb"),
    ];
    
    // Return the first path that exists, or the first one as default
    for (const dbPath of possiblePaths) {
      if (fs.existsSync(dbPath)) {
        return dbPath;
      }
    }
    
    // Return the standard path even if it doesn't exist
    return possiblePaths[0];
  } else if (platform === "win32") {
    // Windows: %APPDATA%\Cursor\User\globalStorage\state.vscdb
    const appData = process.env.APPDATA || path.join(home, "AppData", "Roaming");
    return path.join(appData, "Cursor", "User", "globalStorage", "state.vscdb");
  }
  
  // Fallback: try Linux path as default
  return path.join(home, ".config", "Cursor", "User", "globalStorage", "state.vscdb");
}

async function saveEntries(entries: EntryLike[]) {
  const data = JSON.stringify({ entries });
  const query = `INSERT INTO ItemTable (key, value) VALUES ('history.recentlyOpenedPathsList', '${data}');`;
  await execFilePromise("sqlite3", [getPath(), query]);
}
