"use client";

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { FilePlus2, FolderOpen, Volume2, VolumeX } from 'lucide-react';

interface AppHeaderProps {
  isSoundOn: boolean;
  onSoundToggle: (checked: boolean) => void;
  onNewDocument: () => void;
  onOpen: () => void;
}

export function AppHeader({
  isSoundOn,
  onSoundToggle,
  onNewDocument,
  onOpen,
}: AppHeaderProps) {
  return (
    <header className="flex items-center justify-between p-4 border-b border-border shadow-sm flex-shrink-0">
      <h1 className="text-2xl font-headline font-bold">RetroType</h1>
      <div className="flex items-center gap-2 sm:gap-4">
        <Button variant="ghost" size="sm" onClick={onNewDocument}>
          <FilePlus2 className="mr-2 h-4 w-4" /> New
        </Button>
        <Button variant="ghost" size="sm" onClick={onOpen}>
          <FolderOpen className="mr-2 h-4 w-4" /> Open
        </Button>
        <div className="flex items-center space-x-2">
          <Switch
            id="sound-toggle"
            checked={isSoundOn}
            onCheckedChange={onSoundToggle}
            aria-label="Toggle sound effects"
          />
          <Label htmlFor="sound-toggle" className="cursor-pointer">
            {isSoundOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          </Label>
        </div>
      </div>
    </header>
  );
}
