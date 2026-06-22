import colors from "@/constants/colors";

/**
 * Always returns dark palette — all screens use hardcoded dark backgrounds,
 * so light-mode card colors (#FFFFFF) cause white-box mismatches on Android.
 */
export function useColors() {
  return { ...colors.dark, radius: colors.radius };
}
