"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { cn } from "@/lib/utils";
import { Textarea } from '@/components/ui/textarea';
import { AppHeader } from '@/components/app-header';
import { AppFooter } from '@/components/app-footer';
import { OpenDocumentDialog } from '@/components/open-document-dialog';
import { ChapterSidebar } from '@/components/chapter-sidebar';
import * as docManager from '@/lib/document-manager';
import type { Document, DocumentMeta, Chapter } from '@/lib/document-manager';
import { useToast } from "@/hooks/use-toast";
import * as Tone from 'tone';

const AUTOSAVE_INTERVAL = 5 * 60 * 1000; // 5 minutes

export default function RetroTypePage() {
  const [hasMounted, setHasMounted] = useState(false);
  const [activeDocument, setActiveDocument] = useState<Document | null>(null);
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
  const [content, setContent] = useState(''); // content of the active chapter
  
  const [documents, setDocuments] = useState<DocumentMeta[]>([]);
  const [isSoundOn, setIsSoundOn] = useState<boolean>(true);
  const [isLined, setIsLined] = useState<boolean>(true);
  const [showChapters, setShowChapters] = useState<boolean>(true);

  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const synthRef = useRef<Tone.MembraneSynth | null>(null);
  const isInitialLoad = useRef(true);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    synthRef.current = new Tone.MembraneSynth({
      pitchDecay: 0.01,
      octaves: 2,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.2, sustain: 0.01, release: 0.05, attackCurve: 'exponential' }
    }).toDestination();
  }, []);

  const loadDocuments = useCallback(() => {
    const docs = docManager.getDocuments();
    setDocuments(docs);
    return docs;
  }, []);

  const updateActiveChapterContent = (newContent: string) => {
    setContent(newContent);
    if (!activeDocument || !activeChapterId) return;

    setActiveDocument(prevDoc => {
      if (!prevDoc) return null;
      return {
        ...prevDoc,
        chapters: prevDoc.chapters.map(chap => 
          chap.id === activeChapterId ? { ...chap, content: newContent } : chap
        ),
      };
    });
  };

  useEffect(() => {
    if (hasMounted && isInitialLoad.current) {
      isInitialLoad.current = false;
      const initialDocs = loadDocuments();
      if (initialDocs.length > 0) {
        const mostRecentDocId = initialDocs[0].id;
        const fullDoc = docManager.getDocument(mostRecentDocId);
        if (fullDoc) {
          setActiveDocument(fullDoc);
          const firstChapterId = fullDoc.chapters[0]?.id || null;
          setActiveChapterId(firstChapterId);
          setContent(fullDoc.chapters[0]?.content || '');
        }
      } else {
        const newDoc = docManager.createNewDocument();
        setActiveDocument(newDoc);
        const firstChapterId = newDoc.chapters[0]?.id || null;
        setActiveChapterId(firstChapterId);
        setContent(newDoc.chapters[0]?.content || '');
        loadDocuments();
      }
    }
  }, [hasMounted, loadDocuments]);

  const handleSave = useCallback(() => {
    if (activeDocument) {
      docManager.saveDocument(activeDocument);
      loadDocuments();
    }
  }, [activeDocument, loadDocuments]);

  useEffect(() => {
    const autoSave = () => {
      if (activeDocument && !isInitialLoad.current) {
        setIsSaving(true);
        handleSave();
        toast({ title: "Auto-saved!", description: "Your document has been saved." });
        setTimeout(() => setIsSaving(false), 1000);
      }
    };
    const intervalId = setInterval(autoSave, AUTOSAVE_INTERVAL);
    return () => clearInterval(intervalId);
  }, [activeDocument, handleSave, toast]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (activeDocument) {
        handleSave();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [activeDocument, handleSave]);

  const switchDocument = (doc: Document) => {
    handleSave();
    setActiveDocument(doc);
    const firstChapterId = doc.chapters[0]?.id || null;
    setActiveChapterId(firstChapterId);
    setContent(doc.chapters[0]?.content || '');
    loadDocuments();
  }

  const handleNewDocument = () => {
    const newDoc = docManager.createNewDocument();
    switchDocument(newDoc);
    toast({ title: "New Document", description: "Started a fresh page." });
  };

  const handleOpenDocument = (id: string) => {
    const doc = docManager.getDocument(id);
    if (doc) {
      switchDocument(doc);
    }
    setIsDialogOpen(false);
  };

  const handleDeleteDocument = (id: string) => {
    docManager.deleteDocument(id);
    const updatedDocs = loadDocuments();
    toast({ title: "Document Deleted", variant: "destructive" });
    
    if (activeDocument?.id === id) {
      if (updatedDocs.length > 0) {
        const docToOpen = docManager.getDocument(updatedDocs[0].id);
        if (docToOpen) {
          setActiveDocument(docToOpen);
          setActiveChapterId(docToOpen.chapters[0]?.id || null);
          setContent(docToOpen.chapters[0]?.content || '');
        }
      } else {
        const newDoc = docManager.createNewDocument();
        setActiveDocument(newDoc);
        setActiveChapterId(newDoc.chapters[0]?.id || null);
        setContent(newDoc.chapters[0]?.content || '');
        loadDocuments();
      }
    }
  };

  const playKeystrokeSound = useCallback(() => {
    if (isSoundOn && synthRef.current) {
      if (Tone.context.state !== 'running') {
        Tone.context.resume();
      }
      synthRef.current.triggerAttackRelease("C1", '32n');
    }
  }, [isSoundOn]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateActiveChapterContent(e.target.value);
    playKeystrokeSound();
  };

  const handleSelectChapter = (chapterId: string) => {
    setActiveChapterId(chapterId);
    setContent(activeDocument?.chapters.find(c => c.id === chapterId)?.content || '');
  }

  const handleNewChapter = () => {
    if (!activeDocument) return;
    const newChapter: Chapter = {
      id: Date.now().toString(),
      title: `Chapter ${activeDocument.chapters.length + 1}`,
      content: '',
    };
    const updatedDoc = {
      ...activeDocument,
      chapters: [...activeDocument.chapters, newChapter]
    };
    setActiveDocument(updatedDoc);
    setActiveChapterId(newChapter.id);
    setContent('');
  }

  const handleDeleteChapter = (chapterId: string) => {
    if (!activeDocument || activeDocument.chapters.length <= 1) {
      toast({ title: "Cannot delete the last chapter", variant: "destructive" });
      return;
    };
    
    const updatedChapters = activeDocument.chapters.filter(c => c.id !== chapterId);
    const updatedDoc = { ...activeDocument, chapters: updatedChapters };
    setActiveDocument(updatedDoc);

    if (activeChapterId === chapterId) {
      const newActiveChapter = updatedChapters[0];
      setActiveChapterId(newActiveChapter.id);
      setContent(newActiveChapter.content);
    }
  }

  const handleRenameChapter = (chapterId: string, newTitle: string) => {
    if (!activeDocument) return;
    const updatedChapters = activeDocument.chapters.map(c => 
      c.id === chapterId ? { ...c, title: newTitle } : c
    );
    setActiveDocument({ ...activeDocument, chapters: updatedChapters });
  }

  if (!hasMounted) {
    return null;
  }

  const activeDocMeta = documents.find(d => d.id === activeDocument?.id);

  return (
    <div className="flex flex-col h-svh bg-background text-foreground font-body">
      <AppHeader
        isSoundOn={isSoundOn}
        onSoundToggle={setIsSoundOn}
        onNewDocument={handleNewDocument}
        onOpen={() => setIsDialogOpen(true)}
        isLined={isLined}
        onToggleLined={() => setIsLined(p => !p)}
        showChapters={showChapters}
        onToggleChapters={() => setShowChapters(p => !p)}
      />

      <div className="flex flex-grow overflow-hidden">
        {showChapters && activeDocument && (
          <ChapterSidebar 
            chapters={activeDocument.chapters}
            activeChapterId={activeChapterId}
            onSelectChapter={handleSelectChapter}
            onNewChapter={handleNewChapter}
            onDeleteChapter={handleDeleteChapter}
            onRenameChapter={handleRenameChapter}
          />
        )}
        <main className="flex-grow flex justify-center p-4 sm:p-8 overflow-y-auto">
          <div className={cn("w-full max-w-4xl h-full relative", { "lined-paper-wrapper lined": isLined })}>
              <Textarea
                key={activeChapterId} // Re-mounts the textarea on chapter change
                value={content}
                onChange={handleTextChange}
                placeholder="Your story begins here..."
                className={cn(
                  "w-full h-full resize-none p-8 sm:p-12 text-lg bg-card border-none shadow-lg focus-visible:ring-0 focus-visible:ring-offset-0 typewriter-textarea",
                  { "lined-paper": isLined, "leading-loose": !isLined }
                )}
                aria-label="Text editor"
              />
          </div>
        </main>
      </div>
      
      <AppFooter
        isSaving={isSaving}
        lastSaved={activeDocMeta ? activeDocMeta.updatedAt : null}
      />

      <OpenDocumentDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        documents={documents}
        onSelect={handleOpenDocument}
        onDelete={handleDeleteDocument}
      />
    </div>
  );
}
