import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <main className="min-h-screen bg-bg text-white flex items-center justify-center px-4 py-12">
      <SignIn
        appearance={{
          variables: {
            colorBackground: "#0f0f12",
            colorPrimary: "#ff453a",
            colorText: "#ffffff",
            colorInputBackground: "#17171b",
            colorInputText: "#ffffff",
          },
        }}
      />
    </main>
  );
}
