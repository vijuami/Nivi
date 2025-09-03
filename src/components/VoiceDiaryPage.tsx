import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Mic, 
  MicOff, 
  Play, 
  Pause, 
  Square, 
  Home,
  LogOut,
  Calendar, 
  Search,
  Filter,
  Plus,
  BookOpen,
  Volume2,
  Edit3,
  Trash2,
  Save,
  AlertCircle,
  X
} from 'lucide-react';
import { saveUserVoiceDiaryEntries, loadUserVoiceDiaryEntries } from '../utils/supabaseStorage';

interface DiaryEntry {
  id: string;
  title: string;
  content: string;
  date: Date;
  duration?: number;
  mood?: string;
  tags: string[];
}

export const VoiceDiaryPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<Partial<DiaryEntry>>({
    title: '',
    content: '',
    mood: 'neutral',
    tags: []
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Initialize entries with data from localStorage
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [isEntriesLoaded, setIsEntriesLoaded] = useState(false);

  const moods = [
    { id: 'happy', name: 'Happy', emoji: '😊' },
    { id: 'grateful', name: 'Grateful', emoji: '🙏' },
    { id: 'excited', name: 'Excited', emoji: '🎉' },
    { id: 'neutral', name: 'Neutral', emoji: '😐' },
    { id: 'thoughtful', name: 'Thoughtful', emoji: '🤔' },
    { id: 'sad', name: 'Sad', emoji: '😢' }
  ];

  // Load entries from localStorage on component mount
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return;

      try {
        const loadedEntries = await loadUserVoiceDiaryEntries(user.id);
        setEntries(loadedEntries);
        setIsEntriesLoaded(true);
      } catch (error) {
        console.error('Error loading user voice diary entries:', error);
        setEntries([]);
        setIsEntriesLoaded(true);
      }
    };

    loadUserData();
  }, [user]);

  // Save entries to database whenever entries change (but only after initial load)
  useEffect(() => {
    if (isEntriesLoaded && user) {
      saveUserVoiceDiaryEntries(user.id, entries);
    }
  }, [entries, isEntriesLoaded, user]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const filteredEntries = entries.filter(entry => {
    // Search in title, content, and tags for specific words
    const searchWords = searchTerm.toLowerCase().split(' ').filter(word => word.trim().length > 0);
    const matchesSearch = searchWords.length === 0 || searchWords.every(word => 
      entry.title.toLowerCase().includes(word) ||
      entry.content.toLowerCase().includes(word) ||
      entry.tags.some(tag => tag.toLowerCase().includes(word))
    );
    
    // Filter by selected date if specified
    const matchesDate = selectedDate === '' || 
      new Date(entry.date).toISOString().split('T')[0] === selectedDate;
    
    return matchesSearch && matchesDate;
  });

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;
      
      recognition.onstart = () => {
        setIsListening(true);
        setRecordingError(null);
      };
      
      let finalTranscriptAccumulator = '';
      
      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        // Only add new final transcript that hasn't been added before
        if (finalTranscript) {
          // Check if this is new content by comparing with accumulator
          if (finalTranscript !== finalTranscriptAccumulator) {
            const newContent = finalTranscript.replace(finalTranscriptAccumulator, '');
            if (newContent.trim()) {
              setCurrentEntry(prev => ({
                ...prev,
                content: (prev.content || '') + newContent + ' '
              }));
              finalTranscriptAccumulator = finalTranscript;
            }
          }
        }
      };
      
      recognition.onerror = (event) => {
        if (event.error === 'no-speech' || event.error === 'aborted') {
          console.log('Speech recognition event:', event.error);
        } else {
          console.error('Speech recognition error:', event.error);
        }
        setIsListening(false);
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          setRecordingError(`Speech recognition error: ${event.error}. Please try again.`);
        }
      };
      
      recognition.onend = () => {
        setIsListening(false);
        finalTranscriptAccumulator = '';
      };
      
      recognitionRef.current = recognition;
      setRecognition(recognition);
    } else {
      setRecordingError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
    }
  }, []);
  const startVoiceRecognition = () => {
    if (recognitionRef.current && !isListening) {
      setRecordingError(null);
      try {
        // Clear any previous recognition state
        recognitionRef.current.abort();
        setTimeout(() => {
          if (recognitionRef.current) {
            recognitionRef.current.start();
          }
        }, 100);
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        setRecordingError('Unable to start voice recognition. Please try again.');
      }
    }
  };

  const stopVoiceRecognition = () => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.abort();
      } catch (error) {
        console.error('Error stopping speech recognition:', error);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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
      const newEntry: DiaryEntry = {
        id: Date.now().toString(),
        title: currentEntry.title || `Entry - ${new Date().toLocaleDateString()}`,
        content: currentEntry.content || '',
        date: new Date(),
        mood: currentEntry.mood || 'neutral',
        tags: currentEntry.tags || []
      };
      setEntries(prev => [newEntry, ...prev]);
    }
    
    // Reset form
    setShowNewEntry(false);
    setCurrentEntry({ title: '', content: '', mood: 'neutral', tags: [] });
    setRecordingError(null);
    if (isListening) {
      stopVoiceRecognition();
    }
  };

  const handleDeleteEntry = (entryId: string) => {
    if (window.confirm('Are you sure you want to delete this diary entry? This action cannot be undone.')) {
      setEntries(prev => prev.filter(entry => entry.id !== entryId));
    }
  };

  const handleEditEntry = (entry: DiaryEntry) => {
    setCurrentEntry({
      title: entry.title,
      content: entry.content,
      mood: entry.mood,
      tags: entry.tags
    });
    setEditingId(entry.id);
    setShowNewEntry(true);
  };

  useEffect(() => {
    return () => {
      if (recognitionRef.current && isListening) {
        recognitionRef.current.abort();
      }
    };
  }, [isListening]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigate('/')}
                className="p-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                title="Back to Home"
              >
                <Home className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* User Info */}
              {user && (
                <div className="hidden sm:flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-1">
                  <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
                    <span className="text-xs text-white font-medium">
                      {user.user_metadata?.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <span className="text-sm text-gray-700 dark:text-gray-200">
                    {user.user_metadata?.full_name || user.email}
                  </span>
                </div>
              )}
              
              {/* Sign Out Button */}
              <button
                onClick={handleSignOut}
                className="p-2 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                title="Sign Out"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 mb-6">
            <div className="bg-purple-500 p-3 rounded-lg">
              <Mic className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Voice Diary</h1>
              <p className="text-gray-600 dark:text-gray-300">
                Record your thoughts and daily experiences
                {user && (
                  <span className="block text-sm mt-1">
                    Welcome back, {user.user_metadata?.full_name?.split(' ')[0] || 'User'}!
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* New Entry Button */}
          <div className="flex justify-end">
            <button 
              onClick={() => setShowNewEntry(true)}
              className="flex items-center space-x-2 bg-purple-500 text-white px-6 py-3 rounded-lg hover:bg-purple-600 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>New Entry</span>
            </button>
          </div>
        </div>

        {/* New Entry Modal */}
        {showNewEntry && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white">New Diary Entry</h2>
                  <button
                    onClick={() => setShowNewEntry(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Recording Controls */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-6">
                  {/* Error Message */}
                  {recordingError && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center space-x-2">
                      <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                      <p className="text-sm text-red-700 dark:text-red-200">{recordingError}</p>
                    </div>
                  )}

                  <div className="text-center">
                    <div className="mb-4">
                      <button
                        onClick={isListening ? stopVoiceRecognition : startVoiceRecognition}
                        disabled={!recognition}
                        className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
                          isListening
                            ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                            : 'bg-purple-500 hover:bg-purple-600'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {isListening ? (
                          <Square className="h-8 w-8 text-white" />
                        ) : (
                          <Mic className="h-8 w-8 text-white" />
                        )}
                      </button>
                    </div>
                    <p className="text-lg font-medium text-gray-800 dark:text-white mb-2">
                      {isListening ? 'Listening...' : 'Ready to Listen'}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                      {isListening 
                        ? 'Speak now and your words will appear in the text area below'
                        : 'Click the microphone to start voice-to-text input'
                      }
                    </p>
                  </div>
                </div>

                {/* Entry Form */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Entry Title
                    </label>
                    <input
                      type="text"
                      value={currentEntry.title || ''}
                      onChange={(e) => setCurrentEntry(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Give your entry a title..."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Content {isListening && <span className="text-green-600">(Listening...)</span>}
                    </label>
                    <textarea
                      value={currentEntry.content || ''}
                      onChange={(e) => setCurrentEntry(prev => ({ ...prev, content: e.target.value }))}
                      placeholder={isListening ? "Speak now and your words will appear here..." : "Your voice will be transcribed here, or you can type directly..."}
                      rows={6}
                      className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${isListening ? 'border-green-400 ring-2 ring-green-200' : ''}`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Mood
                    </label>
                    <select
                      value={currentEntry.mood || 'neutral'}
                      onChange={(e) => setCurrentEntry(prev => ({ ...prev, mood: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      {moods.filter(mood => mood.id !== 'all').map(mood => (
                        <option key={mood.id} value={mood.id}>
                          {mood.emoji} {mood.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={handleSaveEntry}
                      className="flex-1 bg-purple-500 text-white py-3 rounded-lg hover:bg-purple-600 transition-colors flex items-center justify-center space-x-2"
                    >
                      <Save className="h-4 w-4" />
                      <span>{editingId ? 'Update Entry' : 'Save Entry'}</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowNewEntry(false);
                        setEditingId(null);
                        setCurrentEntry({ title: '', content: '', mood: 'neutral', tags: [] });
                        if (isListening) {
                          stopVoiceRecognition();
                        }
                      }}
                      className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Filter by Date</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Date
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                {selectedDate && (
                  <button
                    onClick={() => setSelectedDate('')}
                    className="w-full bg-gray-500 text-white px-3 py-2 rounded-lg hover:bg-gray-600 transition-colors text-sm"
                  >
                    Clear Date Filter
                  </button>
                )}
                
                {/* Entry Statistics */}
                <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <h4 className="text-sm font-medium text-purple-800 dark:text-purple-200 mb-2">
                    Statistics
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-purple-700 dark:text-purple-300">Total Entries:</span>
                      <span className="font-semibold text-purple-800 dark:text-purple-200">{entries.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-purple-700 dark:text-purple-300">Filtered:</span>
                      <span className="font-semibold text-purple-800 dark:text-purple-200">{filteredEntries.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Search */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Search by Words
                  </label>
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search for specific words in your entries..."
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Search in titles, content, and tags. Use spaces to search for multiple words.
                  </p>
                </div>
                
                {/* Search Results Info */}
                {(searchTerm || selectedDate) && (
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                    <p className="text-sm text-purple-700 dark:text-purple-300">
                      {filteredEntries.length === 0 
                        ? "No entries found matching your search criteria"
                        : `Found ${filteredEntries.length} ${filteredEntries.length === 1 ? 'entry' : 'entries'} matching your search`
                      }
                    </p>
                    {(searchTerm || selectedDate) && (
                      <button
                        onClick={() => {
                          setSearchTerm('');
                          setSelectedDate('');
                        }}
                        className="mt-2 text-xs text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200 underline"
                      >
                        Clear all filters
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Entries */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                  Diary Entries ({filteredEntries.length})
                </h3>
              </div>

              {filteredEntries.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
                    No Entries Found
                  </h4>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    {searchTerm || selectedDate
                      ? "Try adjusting your search criteria or date filter."
                      : "Start recording your first diary entry to capture your thoughts and experiences."
                    }
                  </p>
                  <button 
                    onClick={() => setShowNewEntry(true)}
                    className="flex items-center space-x-2 bg-purple-500 text-white px-6 py-3 rounded-lg hover:bg-purple-600 transition-colors mx-auto"
                  >
                    <Mic className="h-5 w-5" />
                    <span>Record First Entry</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredEntries.map(entry => {
                    const mood = moods.find(m => m.id === entry.mood);
                    return (
                      <div key={entry.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="text-lg font-semibold text-gray-800 dark:text-white">
                                {entry.title}
                              </h4>
                              {mood && (
                                <span className="flex items-center space-x-1 px-2 py-1 bg-purple-100 dark:bg-purple-900 rounded-full text-sm">
                                  <span>{mood.emoji}</span>
                                  <span className="text-purple-700 dark:text-purple-300">{mood.name}</span>
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-300 mb-3">
                              <span className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                {entry.date.toLocaleDateString('en-US', { 
                                  weekday: 'short',
                                  year: 'numeric', 
                                  month: 'short', 
                                  day: 'numeric' 
                                })}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {entry.date.toLocaleTimeString('en-US', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </span>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => handleEditEntry(entry)}
                              className="p-2 text-blue-600 hover:text-blue-800 transition-colors"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteEntry(entry.id)}
                              className="p-2 text-red-600 hover:text-red-800 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                          {entry.content}
                        </p>
                        
                        {entry.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {entry.tags.map(tag => (
                              <span key={tag} className="px-2 py-1 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-full text-xs">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};