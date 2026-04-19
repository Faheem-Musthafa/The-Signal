declare module "react-awesome-loaders" {
  import * as React from "react";

  export type LoaderProps = {
    primaryColor?: string;
    background?: string;
    [key: string]: unknown;
  };

  export const WifiLoader: React.ComponentType<LoaderProps>;
  export const ScatterBoxLoader: React.ComponentType<LoaderProps>;
}
