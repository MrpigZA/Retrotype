"use client";

export interface Document {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export type DocumentMeta = Omit<Document, 'content'>;

const DOC_LIST_KEY = 'retrotype_documents';

const getDocumentKey = (id: string) => `retrotype_doc_${id}`;

export const getDocuments = (): DocumentMeta[] => {
  if (typeof window === 'undefined') return [];
  const list = window.localStorage.getItem(DOC_LIST_KEY);
  return list ? JSON.parse(list) : [];
};

export const getDocument = (id: string): Document | null => {
  if (typeof window === 'undefined') return null;
  const docContent = window.localStorage.getItem(getDocumentKey(id));
  const docList = getDocuments();
  const docMeta = docList.find(d => d.id === id);

  if (docContent === null || !docMeta) return null;

  return { ...docMeta, content: docContent };
};

export const saveDocument = (id: string, content: string): DocumentMeta => {
  if (typeof window === 'undefined') throw new Error('Cannot save on server');
  
  const docList = getDocuments();
  const docIndex = docList.findIndex(d => d.id === id);
  const now = Date.now();
  const title = content.trim().split('\n')[0].trim() || 'Untitled';

  let newDocMeta: DocumentMeta;

  if (docIndex > -1) {
    newDocMeta = { ...docList[docIndex], title, updatedAt: now };
    docList[docIndex] = newDocMeta;
  } else {
    newDocMeta = { id, title, createdAt: now, updatedAt: now };
    docList.push(newDocMeta);
  }

  window.localStorage.setItem(getDocumentKey(id), content);
  window.localStorage.setItem(DOC_LIST_KEY, JSON.stringify(docList.sort((a, b) => b.updatedAt - a.updatedAt)));
  
  return newDocMeta;
};

export const createNewDocument = (): string => {
  const id = Date.now().toString();
  saveDocument(id, '');
  return id;
};

export const deleteDocument = (id: string): void => {
  if (typeof window === 'undefined') return;

  const docList = getDocuments();
  const updatedList = docList.filter(d => d.id !== id);
  
  window.localStorage.removeItem(getDocumentKey(id));
  window.localStorage.setItem(DOC_LIST_KEY, JSON.stringify(updatedList));
};
