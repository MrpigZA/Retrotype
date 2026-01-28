"use client";

import React, { useState } from 'react';
import type { Chapter } from '@/lib/document-manager';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash2, Edit, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChapterSidebarProps {
  chapters: Chapter[];
  activeChapterId: string | null;
  onSelectChapter: (id: string) => void;
  onNewChapter: () => void;
  onDeleteChapter: (id: string) => void;
  onRenameChapter: (id: string, newTitle: string) => void;
}

export function ChapterSidebar({
  chapters,
  activeChapterId,
  onSelectChapter,
  onNewChapter,
  onDeleteChapter,
  onRenameChapter,
}: ChapterSidebarProps) {
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const handleStartEditing = (chapter: Chapter) => {
    setEditingChapterId(chapter.id);
    setEditingTitle(chapter.title);
  };

  const handleSaveRename = () => {
    if (editingChapterId && editingTitle.trim() !== '') {
      onRenameChapter(editingChapterId, editingTitle);
    }
    setEditingChapterId(null);
    setEditingTitle('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSaveRename();
    }
    if (e.key === 'Escape') {
      setEditingChapterId(null);
      setEditingTitle('');
    }
  };


  return (
    <aside className="w-64 flex flex-col border-r bg-card h-full">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-lg font-semibold font-headline">Chapters</h2>
        <Button variant="ghost" size="icon" onClick={onNewChapter}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <ScrollArea className="flex-grow">
        <div className="p-2 space-y-1">
          {chapters.map((chapter) => (
            <div
              key={chapter.id}
              className={cn(
                "group flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors cursor-pointer",
                chapter.id === activeChapterId && "bg-muted"
              )}
            >
              {editingChapterId === chapter.id ? (
                 <Input
                    type="text"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onBlur={handleSaveRename}
                    onKeyDown={handleKeyDown}
                    className="h-8 flex-grow"
                    autoFocus
                 />
              ) : (
                <button
                  onClick={() => onSelectChapter(chapter.id)}
                  className="text-left flex-grow mr-2 truncate"
                >
                  {chapter.title}
                </button>
              )}
              
              <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                {editingChapterId === chapter.id ? (
                    <Button variant="ghost" size="icon" onClick={handleSaveRename}>
                        <Save className="h-4 w-4" />
                    </Button>
                ) : (
                    <Button variant="ghost" size="icon" onClick={() => handleStartEditing(chapter)}>
                        <Edit className="h-4 w-4" />
                    </Button>
                )}
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => onDeleteChapter(chapter.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </aside>
  );
}
