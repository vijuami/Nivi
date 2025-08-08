@@ .. @@
 import React, { useState, useRef, useEffect } from 'react';
 import { useNavigate } from 'react-router-dom';
 import { useAuth } from '../contexts/AuthContext';
+import { apiClient } from '../lib/api';
 import { 
   Mic, 
   MicOff, 
@@ -23,19 +24,8 @@ import {
   AlertCircle,
   X
 } from 'lucide-react';
-import { saveUserVoiceDiaryEntries, loadUserVoiceDiaryEntries } from '../utils/supabaseStorage';

-interface DiaryEntry {
-  id: string;
-  title: string;
-  content: string;
-  date: Date;
-  duration?: number;
-  mood?: string;
-  tags: string[];
-}
-
-export const VoiceDiaryPage: React.FC = () => {
+export const VoiceDiaryPage = () => {
   const navigate = useNavigate();
   const { user, signOut } = useAuth();
   const [isRecording, setIsRecording] = useState(false);
-  const [recordingError, setRecordingError] = useState<string | null>(null);
-  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
+  const [recordingError, setRecordingError] = useState(null);
+  const [recognition, setRecognition] = useState(null);
   const [isListening, setIsListening] = useState(false);
   const [searchTerm, setSearchTerm] = useState('');
   const [selectedDate, setSelectedDate] = useState('');
   const [showNewEntry, setShowNewEntry] = useState(false);
-  const [currentEntry, setCurrentEntry] = useState<Partial<DiaryEntry>>({
+  const [currentEntry, setCurrentEntry] = useState({
     title: '',
     content: '',
     mood: 'neutral',
     tags: []
   });
-  const [editingId, setEditingId] = useState<string | null>(null);
+  const [editingId, setEditingId] = useState(null);

-  const recognitionRef = useRef<SpeechRecognition | null>(null);
+  const recognitionRef = useRef(null);

   // Initialize entries with data from localStorage
-  const [entries, setEntries] = useState<DiaryEntry[]>([]);
+  const [entries, setEntries] = useState([]);
   const [isEntriesLoaded, setIsEntriesLoaded] = useState(false);

   const moods = [
@@ -68,7 +58,7 @@ export const VoiceDiaryPage: React.FC = () => {
     { id: 'sad', name: 'Sad', emoji: '😢' }
   ];

-  // Load entries from localStorage on component mount
+  // Load entries from API on component mount
   useEffect(() => {
     const loadUserData = async () => {
       if (!user) return;

       try {
-        const loadedEntries = await loadUserVoiceDiaryEntries(user.id);
+        const loadedEntries = await apiClient.getVoiceDiaryEntries();
         setEntries(loadedEntries);
         setIsEntriesLoaded(true);
       } catch (error) {
@@ -86,11 +76,16 @@ export const VoiceDiaryPage: React.FC = () => {
     loadUserData();
   }, [user]);

-  // Save entries to database whenever entries change (but only after initial load)
+  // Save entries to API whenever entries change (but only after initial load)
   useEffect(() => {
     if (isEntriesLoaded && user) {
-      saveUserVoiceDiaryEntries(user.id, entries);
+      const saveData = async () => {
+        try {
+          await apiClient.updateVoiceDiaryEntries(entries);
+        } catch (error) {
+          console.error('Error saving voice diary entries:', error);
+        }
+      };
+      saveData();
     }
   }, [entries, isEntriesLoaded, user]);

@@ .. @@
   const handleSaveEntry = () => {
     if (editingId) {
       // Update existing entry
       setEntries(prev => prev.map(entry => 
         entry.id === editingId 
           ? { 
               ...entry, 
               title: currentEntry.title || entry.title,
               content: currentEntry.content || entry.content,
               mood: currentEntry.mood || entry.mood,
               tags: currentEntry.tags || entry.tags
             }
           : entry
       ));
       setEditingId(null);
     } else {
       // Add new entry
-      const newEntry: DiaryEntry = {
+      const newEntry = {
         id: Date.now().toString(),
         title: currentEntry.title || `Entry - ${new Date().toLocaleDateString()}`,
         content: currentEntry.content || '',
@@ -250,11 +245,11 @@ export const VoiceDiaryPage: React.FC = () => {
     }
   };

-  const handleDeleteEntry = (entryId: string) => {
+  const handleDeleteEntry = (entryId) => {
     if (window.confirm('Are you sure you want to delete this diary entry? This action cannot be undone.')) {
       setEntries(prev => prev.filter(entry => entry.id !== entryId));
     }
   };

-  const handleEditEntry = (entry: DiaryEntry) => {
+  const handleEditEntry = (entry) => {
     setCurrentEntry({
       title: entry.title,