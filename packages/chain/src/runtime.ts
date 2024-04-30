import { Balance } from "@proto-kit/library";
import { Balances } from "./balances";
import { ModulesConfig } from "@proto-kit/common";
import { Challenge } from "./challenge";

export const modules = {
  Challenge,
};

export const config: ModulesConfig<typeof modules> = {
  Challenge: {
  },
};

export default {
  modules,
  config,
};
