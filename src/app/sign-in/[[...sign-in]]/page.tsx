import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <main className="min-h-screen bg-paper-soft text-ink flex items-center justify-center px-4 py-12">
      <SignIn
        appearance={{
          variables: {
            colorBackground: "#ffffff",
            colorPrimary: "#2563eb",
            colorText: "#09090b",
            colorTextSecondary: "#71717a",
            colorInputBackground: "#ffffff",
            colorInputText: "#09090b",
            borderRadius: "0.5rem",
            fontFamily: "var(--font-geist)",
          },
          elements: {
            card: "border border-rule shadow-sm rounded-xl",
          },
        }}
      />
    </main>
  );
}
