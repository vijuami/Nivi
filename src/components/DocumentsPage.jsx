@@ .. @@
 import React, { useState, useEffect } from 'react';
 import { useNavigate } from 'react-router-dom';
 import { useAuth } from '../contexts/AuthContext';
+import { apiClient } from '../lib/api';
 import { 
   FileText, 
   Upload, 
@@ -21,7 +22,6 @@ import {
   Check,
   AlertCircle
 } from 'lucide-react';
-import { saveUserDocuments, loadUserDocuments } from '../utils/supabaseStorage';

-interface Document {
-  id: string;
-  name: string;
-  category: string;
-  type: string;
-  size: string;
-  uploadDate: string;
-  tags: string[];
-  file?: File;
-  fileUrl?: string;
-}
-
-export const DocumentsPage: React.FC = () => {
+export const DocumentsPage = () => {
   const navigate = useNavigate();
   const { user, signOut } = useAuth();
   const [searchTerm, setSearchTerm] = useState('');
@@ -42,7 +32,7 @@ export const DocumentsPage: React.FC = () => {
   const [uploadTags, setUploadTags] = useState('');
   const [isUploading, setIsUploading] = useState(false);
-  const [viewingDocument, setViewingDocument] = useState<Document | null>(null);
-  const [pasteError, setPasteError] = useState<string | null>(null);
+  const [viewingDocument, setViewingDocument] = useState(null);
+  const [pasteError, setPasteError] = useState(null);
   const [showAddSubcategory, setShowAddSubcategory] = useState(false);
   const [newSubcategoryName, setNewSubcategoryName] = useState('');
   const [newSubcategoryParent, setNewSubcategoryParent] = useState('');
@@ -120,7 +110,7 @@ export const DocumentsPage: React.FC = () => {
   const [uploadSubcategory, setUploadSubcategory] = useState('');

   // Documents state - empty
-  const [documents, setDocuments] = useState<Document[]>([]);
+  const [documents, setDocuments] = useState([]);
   const [isDocumentsLoaded, setIsDocumentsLoaded] = useState(false);

-  // Load documents from localStorage on component mount
+  // Load documents from API on component mount
   useEffect(() => {
     const loadUserData = async () => {
       if (!user) return;

       try {
-        const loadedDocuments = await loadUserDocuments(user.id);
+        const loadedDocuments = await apiClient.getDocuments();
         setDocuments(loadedDocuments);
         setIsDocumentsLoaded(true);
       } catch (error) {
@@ -142,11 +132,16 @@ export const DocumentsPage: React.FC = () => {
     loadUserData();
   }, [user]);

-  // Save documents to database whenever documents change (but only after initial load)
+  // Save documents to API whenever documents change (but only after initial load)
   useEffect(() => {
     if (isDocumentsLoaded && user) {
-      saveUserDocuments(user.id, documents);
+      const saveData = async () => {
+        try {
+          await apiClient.updateDocuments(documents);
+        } catch (error) {
+          console.error('Error saving documents:', error);
+        }
+      };
+      saveData();
     }
   }, [documents, isDocumentsLoaded, user]);

@@ .. @@
   const handlePaste = async (e) => {
     await processClipboardContent();
   };

   const processClipboardContent = async () => {
     setPasteError(null);
     
     try {
       // Check if clipboard API is available
       if (!navigator.clipboard || !navigator.clipboard.read) {
         setPasteError('Clipboard API not supported in this browser. Please use Ctrl+V or drag and drop files instead.');
         return;
       }

       const clipboardItems = await navigator.clipboard.read();
-      const pastedFiles: File[] = [];
+      const pastedFiles = [];
       
       for (const clipboardItem of clipboardItems) {
         // Handle images from clipboard
@@ -220,7 +215,7 @@ export const DocumentsPage: React.FC = () => {
     }
   };

-  const handleKeyDown = (e: KeyboardEvent) => {
+  const handleKeyDown = (e) => {
     if ((e.ctrlKey || e.metaKey) && e.key === 'v' && showUploadModal) {
       e.preventDefault();
       processClipboardContent();
@@ -238,7 +233,7 @@ export const DocumentsPage: React.FC = () => {
     }
   }, [showUploadModal]);

-  const handleDrag = (e: React.DragEvent) => {
+  const handleDrag = (e) => {
     e.preventDefault();
     e.stopPropagation();
     if (e.type === 'dragenter' || e.type === 'dragover') {
@@ -248,7 +243,7 @@ export const DocumentsPage: React.FC = () => {
     }
   };

-  const handleDrop = (e: React.DragEvent) => {
+  const handleDrop = (e) => {
     e.preventDefault();
     e.stopPropagation();
     setDragActive(false);
@@ -290,7 +285,7 @@ export const DocumentsPage: React.FC = () => {
       uploadDate: new Date().toISOString().split('T')[0],
       tags: uploadTags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
       file: file,
       fileUrl: URL.createObjectURL(file)
     }));
     
     setDocuments(prev => [...newDocuments, ...prev]);
@@ -318,7 +313,7 @@ export const DocumentsPage: React.FC = () => {
     }
   };

-  const handleDeleteDocument = (documentId: string) => {
+  const handleDeleteDocument = (documentId) => {
     if (window.confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
       setDocuments(prev => prev.filter(doc => doc.id !== documentId));
     }
   };

-  const handleDownloadDocument = (document: Document) => {
+  const handleDownloadDocument = (document) => {
     if (document.file) {
       // Create download link for uploaded files
       const url = URL.createObjectURL(document.file);
@@ -340,7 +335,7 @@ export const DocumentsPage: React.FC = () => {
     }
   };

-  const handleViewDocument = (document: Document) => {
+  const handleViewDocument = (document) => {
     setViewingDocument(document);
   };
}