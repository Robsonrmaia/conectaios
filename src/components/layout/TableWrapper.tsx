import React from "react";

export default function TableWrapper({children}:{children:React.ReactNode}) {
  return <div className="-mx-4 px-4 overflow-x-auto">{children}</div>;
}