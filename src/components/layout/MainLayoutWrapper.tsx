"use client";

import { usePathname } from "next/navigation";

export default function MainLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isEditor = pathname?.startsWith("/editor");

  return (
    <main
      className={
        isEditor
          ? "flex-1 flex flex-col min-h-0 overflow-hidden"
          : "flex-1 overflow-auto container mx-auto px-4 py-4"
      }
    >
      {children}
    </main>
  );
}
