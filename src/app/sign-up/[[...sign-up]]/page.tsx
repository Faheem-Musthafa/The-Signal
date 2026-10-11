import { SignUp } from "@clerk/nextjs";
import { AuthFrame } from "@/app/sign-in/_components/AuthFrame";
import { clerkAuthElements, clerkVariables } from "@/app/sign-in/_components/clerkAppearance";

export default function Page() {
  return (
    <AuthFrame mode="sign-up">
      <SignUp appearance={{ variables: clerkVariables, elements: clerkAuthElements }} />
    </AuthFrame>
  );
}
