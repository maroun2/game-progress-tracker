import deckyPlugin from "@decky/rollup";
import replace from "@rollup/plugin-replace";
import { readFileSync } from "fs";

// Read version from package.json for injection into the build
const pkg = JSON.parse(readFileSync("./package.json", "utf-8"));

export default deckyPlugin({
  plugins: [
    replace({
      preventAssignment: false,
      __PLUGIN_VERSION__: JSON.stringify(pkg.version)
    })
  ]
});
