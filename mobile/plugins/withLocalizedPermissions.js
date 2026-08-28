const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const STRINGS = require("../store/permissions-l10n.json");

/**
 * Writes an InfoPlist.strings file per locale so the photo/camera permission
 * prompts are localized on iOS (Apple loads InfoPlist.strings for the
 * device's active language automatically; no extra native code needed).
 */
function withLocalizedPermissions(config) {
  return withDangerousMod(config, [
    "ios",
    async (cfg) => {
      const projectRoot = cfg.modRequest.platformProjectRoot;
      for (const [locale, values] of Object.entries(STRINGS)) {
        const lprojDir = path.join(projectRoot, `${locale}.lproj`);
        fs.mkdirSync(lprojDir, { recursive: true });
        const contents = Object.entries(values)
          .map(([key, value]) => `"${key}" = "${value.replace(/"/g, '\\"')}";`)
          .join("\n");
        fs.writeFileSync(path.join(lprojDir, "InfoPlist.strings"), contents + "\n");
      }
      return cfg;
    },
  ]);
}

module.exports = withLocalizedPermissions;
