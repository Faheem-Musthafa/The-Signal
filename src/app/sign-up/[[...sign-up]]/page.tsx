import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <main className="min-h-screen bg-bg text-text flex items-center justify-center px-4 py-12">
      <SignUp
        appearance={{
          variables: {
            colorBackground: "#0c0c10",
            colorPrimary: "#6366f1",
            colorText: "#f5f6f8",
            colorTextSecondary: "#9aa0a8",
            colorInputBackground: "#07070a",
            colorInputText: "#f5f6f8",
            borderRadius: "0.625rem",
            fontFamily: "var(--font-inter)",
          },
          elements: {
            card: "border border-white/10 shadow-2xl shadow-black/40",
          },
        }}
      />
    </main>
  );
}
