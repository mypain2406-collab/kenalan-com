import Navbar from "@/components/Navbar";

export default function DaftarLayout({ children }: { children: React.ReactNode }) {
    return (
          <>
            <Navbar />
      {children}
          </>
        );
}
