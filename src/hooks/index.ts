/**
 * Hooks index - export all custom hooks
 */

// Re-export the main data hook (Appwrite-backed)
export { useData } from "./use-data";

// Re-export all Appwrite hooks for direct usage
export * from "./use-appwrite";
