import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  // By default, Clerk locks everything. We tell it to leave these open:
  publicRoutes: [
    "/",
    "/pricing",
    "/sign-in(.*)",
    "/sign-up(.*)",
    "/api(.*)" // Allows your webhooks and generic APIs to pass through
  ]
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
