import type { ComponentType } from "react";
import React from "react";
import { Platform, View } from "react-native";

// On native platforms we use the real MotiView from the library; on web we
// provide a simple passthrough so that components depending on it don’t
// crash.  The previous CommonJS `module.exports` style confused the JS
// loader and resulted in `MotiView` being undefined at runtime, which caused
// the “Cannot read property '$$typeof' of undefined” crash when React tried
// to render it.

let MotiView: ComponentType<any>;

if (Platform.OS === "web") {
  MotiView = (props: any) => {
    const { children, ...rest } = props;
    return React.createElement(View, rest, children);
  };
} else {
  // import lazily to avoid bundling issues on web
  const { MotiView: NativeMotiView } = require("moti");
  MotiView = NativeMotiView;
}

export { MotiView };

