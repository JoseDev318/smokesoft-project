import { Navbar } from "@/components/Navbar";

export default function PublicoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}