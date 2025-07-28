import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  FileText, 
  Upload, 
  Search, 
  Filter, 
  Home,
  LogOut,
  Plus, 
  Folder, 
  File as FileIcon,
  Calendar,
  Tag,
  Download,
  Trash2,
  X,
  Check,
  AlertCircle
} from 'lucide-react';
import { saveUserDocuments, loadUserDocuments } from '../utils/supabaseStorage';

interface Document {
  id: string;
  name: string;
  category: string;
  type: string;
  size: string;
  uploadDate: string;
  tags: string[];
  file?: File;
  fileUrl?: string;
}

export const DocumentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploadCategory, setUploadCategory] = useState('identity');
  const [uploadTags, setUploadTags] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<Document | null>(null);
  const [pasteError, setPasteError] = useState<string | null>(null);
  const [showAddSubcategory, setShowAddSubcategory] = useState(false);
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [newSubcategoryParent, setNewSubcategoryParent] = useState('');

  // Document categories with dynamic counts
  const documentCategories = [
    { id: 'all', name: 'All Documents' },
    { id: 'identity', name: 'Identity Documents' },
    { id: 'address', name: 'Address Documents' },
    { id: 'employment', name: 'Employment Documents' },
    { id: 'health', name: 'Health Documents' },
    { id: 'educational', name: 'Educational Documents' },
    { id: 'vehicle', name: 'Vehicle Documents' },
    { id: 'property', name: 'Property Documents' },
    { id: 'social-welfare', name: 'Social Welfare Documents' },
    { id: 'tax', name: 'Tax Documents' },
    { id: 'travel', name: 'Travel Documents' },
    { id: 'other', name: 'Other Documents' }
  ];

  // Subcategories for each main category
  const [subcategories, setSubcategories] = useState<{[key: string]: string[]}>({
    identity: [
      'Aadhaar Card (UIDAI)',
      'Passport (Regional Passport Office)',
      'Voter ID Card (Election Commission of India)',
      'Driving License (Regional Transport Office - RTO)',
      'PAN Card (Income Tax Department)',
      'Ration Card (Public Distribution System - PDS)'
    ],
    address: [
      'Electricity Bill (Electricity Board)',
      'Water Bill (Water Supply Board)',
      'Gas Connection (Gas Authority)',
      'Bank Statement (Bank)',
      'Rent Agreement (Owner/Landlord)',
      'Telephone Bill (Telecom Provider)'
    ],
    employment: [
      'Employee ID Card (Employer)',
      'Service Certificate (Employer)',
      'Experience Certificate (Employer)',
      'Professional Certificates (e.g., CA, Engineer) (Respective Councils)',
      'Pension Documents (Central/State Governments)',
      'Salary Slips'
    ],
    health: [
      'Health Insurance Policy (Insurance Company)',
      'Medical Certificate (Registered Medical Practitioner)',
      'Disability Certificate (Medical Board)',
      'Birth Certificate (Municipal Corporation/Birth Registration Office)',
      'Death Certificate (Municipal Corporation/Death Registration Office)'
    ],
    educational: [
      'Degree Certificate (University/College)',
      'Diploma Certificate (University/College)',
      'Marksheet/Transcript (University/College)',
      'School Leaving Certificate (School)',
      'Migration Certificate (University/College)'
    ],
    vehicle: [
      'Vehicle Registration Certificate (RTO)',
      'Fitness Certificate (RTO)',
      'Insurance Policy (Insurance Company)',
      'Pollution Under Control Certificate (RTO)',
      'Driving License (RTO)'
    ],
    property: [
      'Sale Deed (Sub-Registrar Office)',
      'Property Registration Document (Sub-Registrar Office)',
      'Building Plan Approval (Municipal Corporation)',
      'Property Tax Receipt (Municipal Corporation)',
      'Lease Agreement (Owner/Landlord)'
    ],
    'social-welfare': [
      'Ration Card (Public Distribution System - PDS)',
      'Below Poverty Line (BPL) Card (State Governments)',
      'Antyodaya Anna Yojana (AAY) Card (State Governments)',
      'Widow Pension Documents (State Governments)',
      'Disability Pension Documents (State Governments)'
    ],
    tax: [
      'PAN Card (Income Tax Department)',
      'TAN Card (Income Tax Department)',
      'GST Registration Certificate (GSTN)',
      'Income Tax Returns (Income Tax Department)',
      'Property Tax Receipt (Municipal Corporation)'
    ],
    travel: [
      'Passport (Regional Passport Office)',
      'Visa (Embassy/Consulate)',
      'Travel Insurance Policy (Insurance Company)',
      'Flight Tickets (Airlines)',
      'Hotel Booking Documents (Hotel)'
    ],
    other: [
      'Arms License (District Magistrate)',
      'Passport for Minors (Regional Passport Office)',
      'Police Verification Certificate (Police Department)',
      'Character Certificate (Police Department)',
      'No Objection Certificate (NOC)'
    ]
  });

  const [uploadSubcategory, setUploadSubcategory] = useState('');

  // Documents state - empty
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isDocumentsLoaded, setIsDocumentsLoaded] = useState(false);

  // Load documents from localStorage on component mount
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return;

      try {
        const loadedDocuments = await loadUserDocuments(user.id);
        setDocuments(loadedDocuments);
        setIsDocumentsLoaded(true);
      } catch (error) {
        console.error('Error loading user documents:', error);
        setDocuments([]);
        setIsDocumentsLoaded(true);
      }
    };

    loadUserData();
  }, [user]);

  // Save documents to database whenever documents change (but only after initial load)
  useEffect(() => {
    if (isDocumentsLoaded && user) {
      saveUserDocuments(user.id, documents);
    }
  }, [documents, isDocumentsLoaded, user]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Calculate category counts dynamically
  const getCategoryCount = (categoryId: string) => {
    if (categoryId === 'all') return documents.length;
    return documents.filter(doc => doc.category === categoryId).length;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileType = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf': return 'PDF';
      case 'jpg':
      case 'jpeg': return 'JPEG';
      case 'png': return 'PNG';
      case 'doc':
      case 'docx': return 'DOC';
      case 'txt': return 'TXT';
      default: return 'FILE';
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => {
      // Accept common document types
      const validTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/jpg',
        'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      return validTypes.includes(file.type) || file.name.toLowerCase().endsWith('.pdf');
    });
    
    setUploadFiles(prev => [...prev, ...validFiles]);
  };

  const handlePaste = async (e: ClipboardEvent) => {
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
      const pastedFiles: File[] = [];
      
      for (const clipboardItem of clipboardItems) {
        // Handle images from clipboard
        for (const type of clipboardItem.types) {
          if (type.startsWith('image/')) {
            const blob = await clipboardItem.getType(type);
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const extension = type.split('/')[1] || 'png';
            const fileName = `pasted-image-${timestamp}.${extension}`;
            const file = new File([blob], fileName, { type });
            pastedFiles.push(file);
          }
        }
      }
      
      if (pastedFiles.length > 0) {
        setUploadFiles(prev => [...prev, ...pastedFiles]);
      } else {
        setPasteError('No supported content found in clipboard. Try copying an image or screenshot.');
      }
    } catch (error) {
      console.error('Paste error:', error);
      if (error instanceof Error && error.message.includes('permission denied')) {
        setPasteError('Clipboard access denied. Please allow clipboard permissions in your browser settings, or use Ctrl+V keyboard shortcut instead.');
      } else {
        setPasteError('Unable to access clipboard. Please try using Ctrl+V keyboard shortcut or drag and drop files instead.');
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'v' && showUploadModal) {
      e.preventDefault();
      processClipboardContent();
    }
  };

  // Add event listeners for paste functionality
  React.useEffect(() => {
    if (showUploadModal) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [showUploadModal]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const removeUploadFile = (index: number) => {
    setUploadFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (uploadFiles.length === 0) return;
    
    setIsUploading(true);
    
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Add files to documents
    const newDocuments = uploadFiles.map(file => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: file.name.replace(/\.[^/.]+$/, ""), // Remove extension from display name
      category: uploadCategory,
      type: getFileType(file.name),
      size: formatFileSize(file.size),
      uploadDate: new Date().toISOString().split('T')[0],
      tags: uploadTags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
      file: file,
      fileUrl: URL.createObjectURL(file)
    }));
    
    setDocuments(prev => [...newDocuments, ...prev]);
    
    // Reset upload state
    setUploadFiles([]);
    setUploadTags('');
    setUploadCategory('identity');
    setUploadSubcategory('');
    setShowUploadModal(false);
    setIsUploading(false);
  };

  const handleAddSubcategory = () => {
    if (newSubcategoryName.trim() && newSubcategoryParent) {
      setSubcategories(prev => ({
        ...prev,
        [newSubcategoryParent]: [...(prev[newSubcategoryParent] || []), newSubcategoryName.trim()]
      }));
      setNewSubcategoryName('');
      setNewSubcategoryParent('');
      setShowAddSubcategory(false);
    }
  };

  const handleDeleteDocument = (documentId: string) => {
    if (window.confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
    }
  };

  const handleDownloadDocument = (document: Document) => {
    if (document.file) {
      // Create download link for uploaded files
      const url = URL.createObjectURL(document.file);
      const a = document.createElement('a');
      a.href = url;
      a.download = document.file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else if (document.fileUrl) {
      // For demo files, open in new tab
      window.open(document.fileUrl, '_blank');
    } else {
      alert(`Downloading: ${document.name}`);
    }
  };

  const handleViewDocument = (document: Document) => {
    setViewingDocument(document);
  };

  const renderDocumentViewer = () => {
    if (!viewingDocument) return null;

    const isImage = ['JPEG', 'PNG', 'JPG'].includes(viewingDocument.type);
    const isPDF = viewingDocument.type === 'PDF';
    const isText = viewingDocument.type === 'TXT';

    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                {viewingDocument.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {viewingDocument.type} • {viewingDocument.size}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleDownloadDocument(viewingDocument)}
                className="p-2 text-blue-600 hover:text-blue-800 transition-colors"
                title="Download"
              >
                <Download className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewingDocument(null)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 max-h-[calc(90vh-120px)] overflow-auto">
            {isImage && viewingDocument.fileUrl && (
              <div className="text-center">
                <img
                  src={viewingDocument.fileUrl}
                  alt={viewingDocument.name}
                  className="max-w-full max-h-full object-contain rounded-lg"
                />
              </div>
            )}

            {isPDF && viewingDocument.fileUrl && (
              <div className="w-full h-96">
                <iframe
                  src={viewingDocument.fileUrl}
                  className="w-full h-full border-0 rounded-lg"
                  title={viewingDocument.name}
                />
              </div>
            )}

            {isText && viewingDocument.file && (
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <pre className="whitespace-pre-wrap text-sm text-gray-800 dark:text-white">
                  {/* Text content would be loaded here */}
                  This is a text file preview. In a real application, the file content would be loaded and displayed here.
                </pre>
              </div>
            )}

            {!isImage && !isPDF && !isText && (
              <div className="text-center py-12">
                <FileIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
                  Preview Not Available
                </h4>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  This file type cannot be previewed in the browser.
                </p>
                <button
                  onClick={() => handleDownloadDocument(viewingDocument)}
                  className="flex items-center space-x-2 bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors mx-auto"
                >
                  <Download className="h-5 w-5" />
                  <span>Download to View</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

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
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
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
            <div className="bg-blue-500 p-3 rounded-lg">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Documents</h1>
              <p className="text-gray-600 dark:text-gray-300">
                Store and organize your important documents
                {user && (
                  <span className="block text-sm mt-1">
                    Welcome back, {user.user_metadata?.full_name?.split(' ')[0] || 'User'}!
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Upload Button */}
          <div className="flex justify-end">
            <button 
              onClick={() => setShowUploadModal(true)}
              className="flex items-center space-x-2 bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Upload className="h-5 w-5" />
              <span>Upload Document</span>
            </button>
          </div>
        </div>

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Upload Documents</h2>
                  <button
                    onClick={() => setShowUploadModal(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Paste Instructions */}
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-blue-500 flex-shrink-0" />
                    <div className="text-sm text-blue-700 dark:text-blue-200">
                      <p className="font-medium mb-1">Quick Paste Options:</p>
                      <ul className="text-xs space-y-1">
                        <li>• Press <kbd className="px-1 py-0.5 bg-blue-200 dark:bg-blue-800 rounded text-xs">Ctrl+V</kbd> to paste screenshots or copied images</li>
                        <li>• Take a screenshot and paste it directly</li>
                        <li>• Copy images from web pages and paste them here</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Paste Error */}
                {pasteError && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                    <p className="text-sm text-red-700 dark:text-red-200">{pasteError}</p>
                  </div>
                )}

                {/* File Drop Zone */}
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
                    Drop files, paste images, or click to browse
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Supports PDF, Images, Word documents, text files, and clipboard content
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.txt"
                    onChange={(e) => handleFileSelect(e.target.files)}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="inline-flex items-center space-x-2 bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Choose Files</span>
                  </label>
                    <button
                      type="button"
                      onClick={processClipboardContent}
                      className="inline-flex items-center space-x-2 bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <span>Paste from Clipboard</span>
                    </button>
                  </div>
                </div>

                {/* Selected Files */}
                {uploadFiles.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-800 dark:text-white mb-3">
                      Selected Files ({uploadFiles.length})
                    </h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {uploadFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                          <div className="flex items-center space-x-3">
                            {file.type.startsWith('image/') ? (
                              <div className="w-8 h-8 rounded overflow-hidden bg-gray-200 dark:bg-gray-600">
                                <img 
                                  src={URL.createObjectURL(file)} 
                                  alt="Preview" 
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <File className="h-4 w-4 text-blue-500" />
                            )}
                            <div>
                              <p className="text-sm font-medium text-gray-800 dark:text-white truncate max-w-xs">
                                {file.name}
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-300">
                                {formatFileSize(file.size)} • {file.type.startsWith('image/') ? 'Pasted Image' : getFileType(file.name)}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => removeUploadFile(index)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upload Settings */}
                <div className="mt-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Category
                    </label>
                    <select
                      value={uploadCategory}
                      onChange={(e) => setUploadCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      {documentCategories.filter(cat => cat.id !== 'all').map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Document Type (Optional)
                    </label>
                    <select
                      value={uploadSubcategory}
                      onChange={(e) => setUploadSubcategory(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Select document type...</option>
                      {uploadCategory && subcategories[uploadCategory] && subcategories[uploadCategory].map((subcategory, index) => (
                        <option key={index} value={subcategory}>
                          {subcategory}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tags (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={uploadTags}
                      onChange={(e) => setUploadTags(e.target.value)}
                      placeholder="important, monthly, utility"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Upload Actions */}
                <div className="mt-6 flex space-x-3">
                  <button
                    onClick={handleUpload}
                    disabled={uploadFiles.length === 0 || isUploading}
                    className="flex-1 bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        <span>Upload {uploadFiles.length} File{uploadFiles.length !== 1 ? 's' : ''}</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowUploadModal(false);
                      setUploadFiles([]);
                      setUploadTags('');
                      setUploadCategory('identity');
                      setUploadSubcategory('');
                      setPasteError(null);
                    }}
                    disabled={isUploading}
                    className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Subcategory Modal */}
        {showAddSubcategory && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Add New Document Type</h2>
                  <button
                    onClick={() => setShowAddSubcategory(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Category
                    </label>
                    <select
                      value={newSubcategoryParent}
                      onChange={(e) => setNewSubcategoryParent(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    >
                      <option value="">Select category...</option>
                      {documentCategories.filter(cat => cat.id !== 'all').map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Document Type Name
                    </label>
                    <input
                      type="text"
                      value={newSubcategoryName}
                      onChange={(e) => setNewSubcategoryName(e.target.value)}
                      placeholder="e.g., Custom Certificate (Issuing Authority)"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    />
                  </div>
                </div>

                <div className="mt-6 flex space-x-3">
                  <button
                    onClick={handleAddSubcategory}
                    disabled={!newSubcategoryName.trim() || !newSubcategoryParent}
                    className="flex-1 bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add Document Type
                  </button>
                  <button
                    onClick={() => {
                      setShowAddSubcategory(false);
                      setNewSubcategoryName('');
                      setNewSubcategoryParent('');
                    }}
                    className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Categories</h3>
                <button
                  onClick={() => setShowAddSubcategory(true)}
                  className="p-1 text-blue-500 hover:text-blue-700 transition-colors"
                  title="Add new subcategory"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-2">
                {documentCategories.map(category => (
                  <div
                    key={category.id}
                  >
                    <button
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                        selectedCategory === category.id
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Folder className="h-4 w-4" />
                        <span className="text-sm">{category.name}</span>
                      </div>
                      <span className="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded-full">
                        {getCategoryCount(category.id)}
                      </span>
                    </button>
                    
                    {/* Show subcategories for selected category */}
                    {selectedCategory === category.id && category.id !== 'all' && subcategories[category.id] && (
                      <div className="ml-6 mt-2 space-y-1">
                        {subcategories[category.id].map((subcategory, index) => (
                          <div key={index} className="text-xs text-gray-600 dark:text-gray-400 py-1 px-2 bg-gray-50 dark:bg-gray-700 rounded">
                            {subcategory}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Search and Filter */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="flex-1 relative">
                  <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search documents..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <Filter className="h-4 w-4" />
                  <span>Filter</span>
                </button>
              </div>
            </div>

            {/* Documents Grid */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                  Documents ({filteredDocuments.length})
                </h3>
              </div>

              {filteredDocuments.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
                    No Documents Found
                  </h4>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    {searchTerm || selectedCategory !== 'all' 
                      ? "Try adjusting your search or filter criteria."
                      : "Upload your first document to get started."
                    }
                  </p>
                  <button 
                    onClick={() => setShowUploadModal(true)}
                    className="flex items-center space-x-2 bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors mx-auto"
                  >
                    <Plus className="h-5 w-5" />
                    <span>Upload Document</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredDocuments.map(doc => (
                    <div key={doc.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="bg-red-100 dark:bg-red-900 p-2 rounded-lg">
                            <FileIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-800 dark:text-white truncate">
                              {doc.name}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              {doc.type} • {doc.size}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-1">
                          <button 
                            onClick={() => handleDownloadDocument(doc)}
                            className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleViewDocument(doc)}
                            className="p-1 text-green-600 hover:text-green-800 transition-colors"
                            title="View document"
                          >
                            <FileText className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="p-1 text-red-600 hover:text-red-800 transition-colors"
                            title="Delete document"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400 mb-3">
                        <span className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(doc.uploadDate).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap gap-1">
                        {doc.tags.map(tag => (
                          <span key={tag} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                            <Tag className="h-3 w-3 mr-1" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Document Viewer Modal */}
      {renderDocumentViewer()}
    </div>
  );
};