import { environment, showToast, Toast } from "@vicinae/api";
import { XMLParser } from "fast-xml-parser";
import fetch, { AbortError, type Response as FetchResponse } from "node-fetch";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useFetch } from "@raycast/utils";
import { API_HEADERS, BASE_URL } from "./config";
type Fetcher<R> = (signal: AbortSignal) => Promise<R>;

export function useNextcloudJsonArray<T>(base: string) {
  const { isLoading, data } = useFetch(`${BASE_URL}/apps/${base}`, {
    headers: {
      ...API_HEADERS,
      "OCS-APIRequest": "true",
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    mapResult(result: T[]) {
      return {
        data: result,
      };
    },
    initialData: [],
  });
  return { isLoading, data };
}

export function useQuery<R>(fetcher: Fetcher<R>, deps: React.DependencyList = []) {
  const [state, setState] = useState<{ data: R | null; isLoading: boolean }>({ data: null, isLoading: true });
  const cancelRef = useRef<AbortController | null>(null);
  const perform = useCallback(
    async function perform() {
      cancelRef.current?.abort();
      cancelRef.current = new AbortController();

      setState((oldState) => ({
        ...oldState,
        isLoading: true,
      }));

      try {
        const data = await fetcher(cancelRef.current.signal);

        setState((oldState) => ({
          ...oldState,
          data,
          isLoading: false,
        }));
      } catch (error) {
        setState((oldState) => ({
          ...oldState,
          isLoading: false,
        }));

        if (error instanceof AbortError) {
          return;
        }

        console.error("API error:", error);

        showToast({ style: Toast.Style.Failure, title: "API request failed", message: String(error) });
      }
    },
    [cancelRef, setState, fetcher]
  );

  useEffect(() => {
    perform();

    return () => {
      cancelRef.current?.abort();
    };
  }, deps);

  const { isLoading, data } = state;

  return {
    isLoading,
    data,
  };
}

export async function webdavRequest({
  signal,
  body,
  base = "",
  method,
}: {
  signal: AbortSignal;
  body: string;
  base?: string;
  method: string;
}) {
  let response: FetchResponse;
  try {
    response = await fetch(`${BASE_URL}/remote.php/dav/${encodeURI(base)}`, {
      method,
      headers: {
        ...API_HEADERS,
        "Content-Type": "text/xml",
      },
      body,
      signal,
    });
  } catch (error: unknown) {
    const err = error as { code?: string; errno?: string; message?: string };
    
    // Handle DNS/network errors
    if (err.code === "ENOTFOUND" || err.errno === "ENOTFOUND") {
      throw new Error(
        `Cannot resolve hostname. Please check your hostname configuration in extension preferences.`
      );
    }
    
    if (err.code === "ECONNREFUSED" || err.errno === "ECONNREFUSED") {
      throw new Error(
        `Connection refused. Please check if your Nextcloud server is running and accessible.`
      );
    }
    
    if (err.code === "ETIMEDOUT" || err.errno === "ETIMEDOUT") {
      throw new Error(
        `Connection timeout. Please check your network connection and server availability.`
      );
    }
    
    // Re-throw with more context
    throw new Error(
      `Network error: ${err.message || String(error)}. Please check your hostname and network connection.`
    );
  }

  const responseBody = await response.text();

  // Check for authentication errors
  if (response.status === 401) {
    throw new Error("Authentication failed. Please check your username and app password in extension preferences.");
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}. Response: ${responseBody.substring(0, 200)}`);
  }

  const parser = new XMLParser();
  const dom = parser.parse(responseBody);
  if (!("d:multistatus" in dom)) {
    throw new Error("Invalid response: " + responseBody);
  }

  // undefined -> No result
  // Object -> Single hit
  // Array -> Multiple hits
  const dres = dom["d:multistatus"]["d:response"] ?? [];
  return Array.isArray(dres) ? dres : [dres];
}
