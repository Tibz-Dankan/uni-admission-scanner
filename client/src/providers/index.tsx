import type { ReactNode } from "react";
import ReactQuery from "./ReactQuery";

export default function Providers({ children }: { children: ReactNode }) {
  return <ReactQuery>{children}</ReactQuery>;
}
