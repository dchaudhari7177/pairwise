import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <div className="w-full max-w-md animate-rise">
      <div className="card p-7 sm:p-8">
        <h1 className="text-3xl font-semibold">Welcome back</h1>
        <p className="mt-1.5 text-ink-2">Your picks for today are waiting.</p>
        <LoginForm />
      </div>
      <p className="mt-5 text-center text-sm text-ink-2">
        New here?{" "}
        <Link href="/join" className="font-semibold text-rose">
          Join Pairwise
        </Link>
      </p>
    </div>
  );
}
