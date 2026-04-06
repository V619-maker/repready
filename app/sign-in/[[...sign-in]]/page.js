import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0D0D1A]">
      <SignIn forceRedirectUrl="/simulate" />
    </div>
  );
}
