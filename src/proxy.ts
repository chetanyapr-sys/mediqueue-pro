import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Humne un rastaon (routes) ko chuna hai jo public hain
const isPublicRoute = createRouteMatcher(['/', '/onboarding(.*)']);

export default clerkMiddleware(async (auth, request) => {
  // Agar page public nahi hai, toh check karo
  if (!isPublicRoute(request)) {
    await auth.protect(); // Clerk ke naye version mein 'await' aur 'auth.protect()' bina bracket ke hota hai
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};