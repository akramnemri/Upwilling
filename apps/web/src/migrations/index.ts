import * as migration_20261125_185819_initial from "./20261125_185819_initial";

export const migrations = [
  {
    up: migration_20261125_185819_initial.up,
    down: migration_20261125_185819_initial.down,
    name: "20261125_185819_initial",
  },
];
