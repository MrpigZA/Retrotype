"use client";

export interface Chapter {
  id: string;
  title: string;
  content: string;
}

export interface Document {
  id:string;
  title: string;
  chapters: Chapter[];
  createdAt: number;
  updatedAt: number;
}

export type DocumentMeta = Omit<Document, 'chapters'>;

const DOC_LIST_KEY = 'retrotype_documents';
const getDocumentKey = (id: string) => `retrotype_doc_v2_${id}`;

const migrateDocument = (doc: any): Document => {
  const newDoc: Document = {
    id: doc.id,
    title: doc.title,
    chapters: [{
      id: Date.now().toString(),
      title: 'Chapter 1',
      content: doc.content || ''
    }],
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
  window.localStorage.setItem(getDocumentKey(newDoc.id), JSON.stringify(newDoc));
  
  // Clean up old key if it exists
  const oldKey = `retrotype_doc_${doc.id}`;
  if (window.localStorage.getItem(oldKey) !== null) {
    window.localStorage.removeItem(oldKey);
  }

  return newDoc;
}

export const getDocuments = (): DocumentMeta[] => {
  if (typeof window === 'undefined') return [];
  const list = window.localStorage.getItem(DOC_LIST_KEY);
  return list ? JSON.parse(list) : [];
};

export const getDocument = (id: string): Document | null => {
  if (typeof window === 'undefined') return null;
  const docString = window.localStorage.getItem(getDocumentKey(id));
  
  if (docString) {
    const doc = JSON.parse(docString);
    // This is a safety check for documents that might have been saved without chapters somehow
    if (!doc.chapters || doc.chapters.length === 0) {
      return migrateDocument(doc);
    }
    return doc as Document;
  }

  // Migration logic for old documents
  const docList = getDocuments();
  const docMeta = docList.find(d => d.id === id);
  if (docMeta) {
    const oldContentKey = `retrotype_doc_${id}`;
    const oldContent = window.localStorage.getItem(oldContentKey);
    if(oldContent !== null) {
      const oldDoc = { ...docMeta, content: oldContent };
      return migrateDocument(oldDoc);
    }
  }

  return null;
};

export const saveDocument = (doc: Document): DocumentMeta => {
  if (typeof window === 'undefined') throw new Error('Cannot save on server');
  
  const now = Date.now();
  const title = doc.title || (doc.chapters[0]?.title) || 'Untitled Document';

  const updatedDoc: Document = {
    ...doc,
    title,
    updatedAt: now,
  };

  const newDocMeta: DocumentMeta = { 
    id: updatedDoc.id,
    title: updatedDoc.title,
    createdAt: updatedDoc.createdAt,
    updatedAt: updatedDoc.updatedAt
  };

  let docList = getDocuments();
  const docIndex = docList.findIndex(d => d.id === updatedDoc.id);

  if (docIndex > -1) {
    docList[docIndex] = newDocMeta;
  } else {
    docList.push(newDocMeta);
  }

  window.localStorage.setItem(getDocumentKey(updatedDoc.id), JSON.stringify(updatedDoc));
  window.localStorage.setItem(DOC_LIST_KEY, JSON.stringify(docList.sort((a, b) => b.updatedAt - a.updatedAt)));
  
  return newDocMeta;
};

export const createNewDocument = (): Document => {
    const now = Date.now();
    const id = now.toString();
    const newDoc: Document = {
      id,
      title: 'Untitled Document',
      chapters: [{ id: (now + 1).toString(), title: 'Chapter 1', content: '' }],
      createdAt: now,
      updatedAt: now,
    };
    saveDocument(newDoc);
    return newDoc;
};

export const deleteDocument = (id: string): void => {
  if (typeof window === 'undefined') return;

  const docList = getDocuments();
  const updatedList = docList.filter(d => d.id !== id);
  
  window.localStorage.removeItem(getDocumentKey(id));
  window.localStorage.setItem(DOC_LIST_KEY, JSON.stringify(updatedList));
};
