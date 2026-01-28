"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { AppHeader } from '@/components/app-header';
import { AppFooter } from '@/components/app-footer';
import { OpenDocumentDialog } from '@/components/open-document-dialog';
import * as docManager from '@/lib/document-manager';
import type { Document } from '@/lib/document-manager';
import { useToast } from "@/hooks/use-toast";
import * as Tone from 'tone';

type DocumentMeta = Omit<Document, 'content'>;

const AUTOSAVE_INTERVAL = 5 * 60 * 1000; // 5 minutes

export default function RetroTypePage() {
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [content, setContent] = useState<string>('');
  const [documents, setDocuments] = useState<DocumentMeta[]>([]);
  const [isSoundOn, setIsSoundOn] = useState<boolean>(true);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const synthRef = useRef<Tone.MembraneSynth | null>(null);
  const isInitialLoad = useRef(true);

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

  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      const initialDocs = loadDocuments();
      if (initialDocs.length > 0) {
        const mostRecentDoc = initialDocs[0];
        const fullDoc = docManager.getDocument(mostRecentDoc.id);
        if (fullDoc) {
            setActiveDocId(fullDoc.id);
            setContent(fullDoc.content);
        }
      } else {
        const newId = docManager.createNewDocument();
        setActiveDocId(newId);
        setContent('');
        loadDocuments();
      }
    }
  }, [loadDocuments]);

  const handleSave = useCallback(() => {
    if (activeDocId) {
      docManager.saveDocument(activeDocId, content);
      setDocuments(docManager.getDocuments());
    }
  }, [activeDocId, content]);

  useEffect(() => {
    const autoSave = () => {
      if (activeDocId && !isInitialLoad.current) {
        setIsSaving(true);
        handleSave();
        toast({ title: "Auto-saved!", description: "Your document has been saved." });
        setTimeout(() => setIsSaving(false), 1000);
      }
    };
    const intervalId = setInterval(autoSave, AUTOSAVE_INTERVAL);
    return () => clearInterval(intervalId);
  }, [activeDocId, handleSave, toast]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (activeDocId) {
        handleSave();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [activeDocId, handleSave]);

  const handleSaveAndSwitch = useCallback((newDocId: string, newContent: string) => {
    handleSave();
    setActiveDocId(newDocId);
    setContent(newContent);
    loadDocuments();
  }, [handleSave, loadDocuments]);

  const handleNewDocument = () => {
    const newId = docManager.createNewDocument();
    handleSaveAndSwitch(newId, '');
    toast({ title: "New Document", description: "Started a fresh page." });
  };

  const handleOpenDocument = (id: string) => {
    const doc = docManager.getDocument(id);
    if (doc) {
      handleSaveAndSwitch(doc.id, doc.content);
    }
    setIsDialogOpen(false);
  };

  const handleDeleteDocument = (id: string) => {
    const currentActiveId = activeDocId;
    docManager.deleteDocument(id);
    const updatedDocs = loadDocuments();
    toast({ title: "Document Deleted", variant: "destructive" });
    
    if (currentActiveId === id) {
      if (updatedDocs.length > 0) {
        const docToOpen = docManager.getDocument(updatedDocs[0].id);
        setActiveDocId(docToOpen?.id || null);
        setContent(docToOpen?.content || '');
      } else {
        const newId = docManager.createNewDocument();
        setActiveDocId(newId);
        setContent('');
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
    setContent(e.target.value);
    playKeystrokeSound();
  };
  
  const activeDoc = documents.find(d => d.id === activeDocId);

  return (
    <div className="flex flex-col h-svh bg-background text-foreground font-body">
      <AppHeader
        isSoundOn={isSoundOn}
        onSoundToggle={setIsSoundOn}
        onNewDocument={handleNewDocument}
        onOpen={() => setIsDialogOpen(true)}
      />

      <main className="flex-grow flex justify-center p-4 sm:p-8 overflow-y-auto">
        <div className="w-full max-w-4xl h-full">
            <Textarea
              value={content}
              onChange={handleTextChange}
              placeholder="Your story begins here..."
              className="w-full h-full resize-none p-8 sm:p-12 text-lg leading-loose bg-card border-none shadow-lg focus-visible:ring-0 focus-visible:ring-offset-0 typewriter-textarea"
              aria-label="Text editor"
            />
        </div>
      </main>
      
      <AppFooter
        isSaving={isSaving}
        lastSaved={activeDoc ? activeDoc.updatedAt : null}
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
