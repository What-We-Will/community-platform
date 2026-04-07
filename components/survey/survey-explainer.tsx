interface SurveyExplainerProps {
  companyName: string;
  description: string;
}

export function SurveyExplainer({ companyName, description }: SurveyExplainerProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Worker Experience Survey</h1>
        <p className="mt-2 text-muted-foreground">{description}</p>
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-5 dark:border-blue-800 dark:bg-blue-950/30">
        <h2 className="mb-3 text-base font-semibold text-blue-900 dark:text-blue-100">
          Your Rights Under Federal Law
        </h2>
        <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
          <p>
            The National Labor Relations Act (NLRA) protects workers&apos; rights to organize,
            discuss working conditions, and take collective action — regardless of whether you
            are in a union.
          </p>
          <p>
            Completing this survey is a protected activity. {companyName} cannot legally
            retaliate against you for participating in collective action or organizing efforts.
          </p>
          <p>
            <strong>Completing this survey does not commit you to anything.</strong> Your
            responses help us understand the scope of what workers are experiencing and connect
            those who want to take action together.
          </p>
        </div>
      </div>
    </div>
  );
}
