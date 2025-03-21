import { fn } from "@storybook/test";
import * as actual from "./session";

export const getLocalStorageItem = fn(actual.getLocalStorageItem).mockName(
  "getLocalStorageItem"
);
export const setLocalStorageItem = fn(actual.setLocalStorageItem).mockName(
  "setLocalStorageItem"
);
