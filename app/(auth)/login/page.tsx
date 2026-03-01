import { Suspense } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import LoginForm from "./login-form";

type LoginPageProps = {
  searchParams: Promise<{ redirect?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { redirect } = await searchParams;
  const redirectTo = redirect ?? "/dashboard";

  return (
    <Suspense
      fallback={
        <Card>
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>Loading...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse space-y-4">
              <div className="h-9 rounded-md bg-muted" />
              <div className="h-9 rounded-md bg-muted" />
            </div>
          </CardContent>
        </Card>
      }
    >
      <LoginForm redirectTo={redirectTo} />
    </Suspense>
  );
}
