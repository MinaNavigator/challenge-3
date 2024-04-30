import { Balance, Balances } from "@proto-kit/library";
import { ModulesConfig } from "@proto-kit/common";
import { Challenge } from "./challenge";

export const modules = {
  Balances
};

export const config: ModulesConfig<typeof modules> = {
  Balances: {}
};

export default {
  modules,
  config,
};
