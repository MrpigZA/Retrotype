"use client";

interface AppFooterProps {
  isSaving: boolean;
  lastSaved: number | null;
}

export function AppFooter({ isSaving, lastSaved }: AppFooterProps) {
  const getStatusText = () => {
    if (isSaving) {
      return 'Saving...';
    }
    if (lastSaved) {
      return `Last saved: ${new Date(lastSaved).toLocaleTimeString()}`;
    }
    return 'Start writing to save your first draft.';
  }

  return (
    <footer className="p-2 text-center text-xs text-muted-foreground border-t flex-shrink-0">
      <p>{getStatusText()}</p>
    </footer>
  );
}
