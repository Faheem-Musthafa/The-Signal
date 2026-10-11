import { SignIn } from "@clerk/nextjs";
import { AuthFrame } from "../_components/AuthFrame";
import { clerkAuthElements, clerkVariables } from "../_components/clerkAppearance";

export default function Page() {
  return (
    <AuthFrame mode="sign-in">
      <SignIn appearance={{ variables: clerkVariables, elements: clerkAuthElements }} />
    </AuthFrame>
  );
}
