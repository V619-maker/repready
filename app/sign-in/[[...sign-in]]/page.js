import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex items-center justify-center w-full min-h-[calc(100vh-80px)] py-12">
      <SignIn forceRedirectUrl="/simulate" />
    </div>
  );
}
