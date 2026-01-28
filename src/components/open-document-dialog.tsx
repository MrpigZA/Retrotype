"use client";

import type { Document } from '@/lib/document-manager';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

type DocumentMeta = Omit<Document, 'content'>;

interface OpenDocumentDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  documents: DocumentMeta[];
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export function OpenDocumentDialog({
  isOpen,
  onOpenChange,
  documents,
  onSelect,
  onDelete,
}: OpenDocumentDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px] bg-card text-card-foreground">
        <DialogHeader>
          <DialogTitle className="font-headline">Open Document</DialogTitle>
          <DialogDescription>
            Select a document to continue your work.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-2">
            {documents.length > 0 ? (
              documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 rounded-md border border-border hover:bg-muted/50 transition-colors group"
                >
                  <button
                    onClick={() => onSelect(doc.id)}
                    className="text-left flex-grow mr-4"
                  >
                    <p className="font-semibold font-body truncate">{doc.title}</p>
                    <p className="text-sm text-muted-foreground">
                      Last updated {formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}
                    </p>
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(doc.id);
                    }}
                    aria-label={`Delete document ${doc.title}`}
                    className="opacity-50 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-10">
                <p>No saved documents yet.</p>
                <p>Start typing to create your first one!</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
