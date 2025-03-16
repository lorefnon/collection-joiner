import { fn } from "overridable-fn";

export type Logger = Record<"debug" | "info" |"warn" | "error", (...args: any[]) => void>

export const getLogger = fn.memo((): Logger => {
    return console;
})
