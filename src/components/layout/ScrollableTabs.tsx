import React from "react";

export default function ScrollableTabs({children}:{children:React.ReactNode}) {
  return (
    <div className="-mx-4 px-4 overflow-x-auto">
      <div className="flex gap-2 min-w-max">{children}</div>
    </div>
  );
}