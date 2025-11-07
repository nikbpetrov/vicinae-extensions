/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {
  /** Internal Integration Secret - In Notion, go to Settings & members > My connections > Develop or manage integrations > New integration */
  "notion_token"?: string,
  /** Open Page in - Choose where to open Notion page. */
  "open_in"?: import("@raycast/api").Application,
  /** Properties in Previews - Show properties in page previews. */
  "properties_in_page_previews": boolean
}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `create-database-page` command */
  export type CreateDatabasePage = ExtensionPreferences & {
  /** undefined - This action will be set as the primary action (⌘ + ⏎). */
  "closeAfterCreate": boolean
}
  /** Preferences accessible in the `search-page` command */
  export type SearchPage = ExtensionPreferences & {
  /** Primary Action - Choose the primary action for the Notion Pages list. */
  "primaryAction": "notion" | "raycast"
}
  /** Preferences accessible in the `quick-capture` command */
  export type QuickCapture = ExtensionPreferences & {}
  /** Preferences accessible in the `add-text-to-page` command */
  export type AddTextToPage = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `create-database-page` command */
  export type CreateDatabasePage = {}
  /** Arguments passed to the `search-page` command */
  export type SearchPage = {}
  /** Arguments passed to the `quick-capture` command */
  export type QuickCapture = {}
  /** Arguments passed to the `add-text-to-page` command */
  export type AddTextToPage = {
  /** Text */
  "text": string
}
}

