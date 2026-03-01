export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          What We Will
        </h1>
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
