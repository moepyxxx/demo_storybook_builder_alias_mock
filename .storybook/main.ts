import { TsconfigPathsPlugin } from "tsconfig-paths-webpack-plugin";

import type { StorybookConfig } from "@storybook/react-webpack5";
import path from "node:path";

const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [
    "@storybook/addon-essentials",
    "@storybook/preset-create-react-app",
    "@storybook/addon-onboarding",
    "@chromatic-com/storybook",
    "@storybook/addon-interactions",
  ],
  framework: {
    name: "@storybook/react-webpack5",
    options: {},
  },
  staticDirs: ["../public"],
  webpackFinal: async (config) => {
    if (!config.resolve) {
      config.resolve = {};
    }
    config.resolve.plugins = [new TsconfigPathsPlugin()];
    // config.resolve.alias = {
    //   ...config.resolve?.alias,
    //   "lib/session": path.resolve(__dirname, "../lib/session.mock.ts"),
    // };
    // console.log(config.resolve.alias);
    return config;
  },
};
export default config;
