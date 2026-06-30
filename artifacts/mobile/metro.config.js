const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Exclude server-only packages (firebase-admin, google-gax, node-cron)
// from Metro's file watcher — they pull in temp dirs that cause ENOENT watch errors.
const blockList = config.resolver?.blockList ?? [];
const extraBlocks = [
  /node_modules\/.pnpm\/firebase-admin.*/,
  /node_modules\/.pnpm\/google-gax.*/,
  /node_modules\/.pnpm\/google-auth-library.*/,
  /node_modules\/.pnpm\/node-cron.*/,
];
config.resolver = {
  ...config.resolver,
  blockList: Array.isArray(blockList)
    ? [...blockList, ...extraBlocks]
    : extraBlocks,
};

module.exports = config;
