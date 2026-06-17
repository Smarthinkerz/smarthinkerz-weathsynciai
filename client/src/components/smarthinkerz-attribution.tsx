export function SmarthinkerzAttribution({ className = "" }: { className?: string }) {
  return (
    <div
      className={`w-full border-t bg-muted/30 py-3 px-4 text-center text-xs text-muted-foreground ${className}`}
      data-testid="smarthinkerz-attribution"
    >
      Part of the{" "}
      <a
        href="https://www.smarthinkerz.com"
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-primary hover:underline"
        data-testid="link-smarthinkerz-hub-footer"
      >
        SmarThinkerz Unified Intelligence Hub
      </a>
    </div>
  );
}
