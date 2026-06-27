import { useContext } from "react";
import { StudentPortalContext } from "./studentPortalContextValue";

export function useStudentPortal() {
  const value = useContext(StudentPortalContext);
  if (!value) {
    throw new Error("useStudentPortal must be used inside StudentPortalProvider");
  }
  return value;
}
