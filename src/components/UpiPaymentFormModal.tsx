import React, { useState } from 'react';
import { CreditCard, X, Smartphone, AlertCircle, CheckCircle, User, DollarSign, MessageSquare, Camera, Loader2, ScanLine, QrCode } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import QRCode from 'react-qr-code';

interface UpiPaymentFormModalProps {
  onClose: () => void;
  onPaymentInitiated?: (paymentData: {
    vpa: string;
    amount: string;
    description: string;
  }) => void;
}

export const UpiPaymentFormModal: React.FC<UpiPaymentFormModalProps> = ({
  onClose,
  onPaymentInitiated
}) => {
  const [formData, setFormData] = useState({
    vpa: '',
    amount: '',
    description: ''
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isScanningImage, setIsScanningImage] = useState(false);
  const [isLiveScannerActive, setIsLiveScannerActive] = useState(false);
  const [html5QrCode, setHtml5QrCode] = useState<Html5Qrcode | null>(null);
  const [activeMode, setActiveMode] = useState<'form' | 'scanner' | 'generate'>('form');
  const [scannedPaymentData, setScannedPaymentData] = useState<{
    vpa: string;
    amount?: string;
    name?: string;
    description?: string;
  } | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const qrReaderRef = React.useRef<HTMLDivElement>(null);

  // Validate VPA format
  const validateVPA = (vpa: string): boolean => {
    const vpaRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/;
    return vpaRegex.test(vpa);
  };

  // Validate form data
  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.vpa.trim()) {
      newErrors.vpa = 'VPA is required';
    } else if (!validateVPA(formData.vpa)) {
      newErrors.vpa = 'Invalid VPA format (e.g., user@bank)';
    }

    if (!formData.amount.trim()) {
      newErrors.amount = 'Amount is required';
    } else {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        newErrors.amount = 'Amount must be a positive number';
      } else if (amount > 100000) {
        newErrors.amount = 'Amount cannot exceed ₹1,00,000';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setPaymentStatus('processing');
    setErrorMessage('');

    try {
      // Construct UPI deep link
      const upiUrl = new URL('upi://pay');
      upiUrl.searchParams.set('pa', formData.vpa.trim());
      upiUrl.searchParams.set('am', formData.amount.trim());
      upiUrl.searchParams.set('cu', 'INR');
      
      if (formData.description.trim()) {
        upiUrl.searchParams.set('tn', formData.description.trim());
      }

      const finalUpiUrl = upiUrl.toString();
      console.log('Opening UPI URL:', finalUpiUrl);

      // Try to open the UPI app
      window.location.href = finalUpiUrl;

      // Call the callback if provided
      if (onPaymentInitiated) {
        onPaymentInitiated({
          vpa: formData.vpa.trim(),
          amount: formData.amount.trim(),
          description: formData.description.trim()
        });
      }

      // Set success status after a short delay
      setTimeout(() => {
        setPaymentStatus('success');
      }, 1000);

    } catch (error) {
      console.error('Error opening UPI app:', error);
      setPaymentStatus('error');
      setErrorMessage('Unable to open UPI app. Please ensure you have a UPI app installed.');
    }
  };

  // Start live camera scanning
  const startLiveScanning = async (mode: 'form' | 'scanner' = 'form') => {
    setIsLiveScannerActive(true);
    setErrorMessage('');
    setActiveMode(mode);

    try {
      const qrCodeScanner = new Html5Qrcode("qr-reader");
      setHtml5QrCode(qrCodeScanner);

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      };

      await qrCodeScanner.start(
        { facingMode: "environment" }, // Use back camera
        config,
        (decodedText) => {
          // Success callback - QR code detected
          handleQrCodeDetected(decodedText);
          stopLiveScanning();
        },
        (errorMessage) => {
          // Error callback - can be ignored for continuous scanning
          console.log('QR scan error (can be ignored):', errorMessage);
        }
      );
    } catch (error) {
      console.error('Error starting camera:', error);
      setErrorMessage('Unable to access camera. Please ensure camera permissions are granted and try again.');
      setIsLiveScannerActive(false);
    }
  };

  // Stop live camera scanning
  const stopLiveScanning = async () => {
    if (html5QrCode) {
      try {
        await html5QrCode.stop();
        html5QrCode.clear();
      } catch (error) {
        console.error('Error stopping camera:', error);
      }
      setHtml5QrCode(null);
    }
    setIsLiveScannerActive(false);
  };

  // Handle QR code detection (common for both image and live scanning)
  const handleQrCodeDetected = (qrCodeMessage: string) => {
    let extractedData: {
      vpa: string;
      amount?: string;
      name?: string;
      description?: string;
    } | null = null;
    
    if (qrCodeMessage.startsWith('upi://pay')) {
      // Parse UPI URL format
      const url = new URL(qrCodeMessage);
      const vpa = url.searchParams.get('pa') || '';
      const amount = url.searchParams.get('am') || '';
      const name = url.searchParams.get('pn') || '';
      const description = url.searchParams.get('tn') || '';
      
      if (vpa && validateVPA(vpa)) {
        extractedData = { vpa, amount, name, description };
      }
    } else if (validateVPA(qrCodeMessage)) {
      // Direct VPA format
      extractedData = { vpa: qrCodeMessage };
    }
    
    if (extractedData && validateVPA(extractedData.vpa)) {
      if (activeMode === 'scanner') {
        // In scanner mode, show payment confirmation
        setScannedPaymentData(extractedData);
      } else {
        // In form mode, populate the form
        setFormData(prev => ({
          ...prev,
          vpa: extractedData.vpa,
          amount: extractedData.amount || prev.amount,
          description: extractedData.description || prev.description
        }));
      }
      // Clear any existing VPA errors
      if (errors.vpa) {
        setErrors(prev => ({ ...prev, vpa: '' }));
      }
    } else {
      setErrorMessage('No valid UPI ID found in the QR code. Please try again or enter manually.');
    }
  };

  // Handle QR code image upload and scanning
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsScanningImage(true);
    setErrorMessage('');

    try {
      // Scan QR code from the uploaded image
      const qrCodeMessage = await Html5Qrcode.scanFile(file, true);
      handleQrCodeDetected(qrCodeMessage);
    } catch (error) {
      console.error('QR code scanning error:', error);
      setErrorMessage('Unable to scan QR code from image. Please ensure the image contains a valid UPI QR code.');
    } finally {
      setIsScanningImage(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Trigger file input click
  const handleScanFromImage = () => {
    fileInputRef.current?.click();
  };

  // Reset form
  const resetForm = () => {
    setFormData({ vpa: '', amount: '', description: '' });
    setErrors({});
    setPaymentStatus('idle');
    setErrorMessage('');
    setActiveMode('form');
    setScannedPaymentData(null);
    if (isLiveScannerActive) {
      stopLiveScanning();
    }
  };

  // Handle input changes
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Cleanup on component unmount
  React.useEffect(() => {
    return () => {
      if (html5QrCode) {
        html5QrCode.stop().catch(console.error);
      }
    };
  }, [html5QrCode]);

  // Handle payment from scanned QR code
  const handleScannedPayment = () => {
    if (!scannedPaymentData) return;
    
    setPaymentStatus('processing');
    setErrorMessage('');

    try {
      // Construct UPI deep link
      const upiUrl = new URL('upi://pay');
      upiUrl.searchParams.set('pa', scannedPaymentData.vpa);
      if (scannedPaymentData.amount) {
        upiUrl.searchParams.set('am', scannedPaymentData.amount);
      }
      upiUrl.searchParams.set('cu', 'INR');
      if (scannedPaymentData.description) {
        upiUrl.searchParams.set('tn', scannedPaymentData.description);
      }
      if (scannedPaymentData.name) {
        upiUrl.searchParams.set('pn', scannedPaymentData.name);
      }

      const finalUpiUrl = upiUrl.toString();
      console.log('Opening UPI URL from scan:', finalUpiUrl);

      // Try to open the UPI app
      window.location.href = finalUpiUrl;

      // Call the callback if provided
      if (onPaymentInitiated) {
        onPaymentInitiated({
          vpa: scannedPaymentData.vpa,
          amount: scannedPaymentData.amount || '0',
          description: scannedPaymentData.description || ''
        });
      }

      // Set success status after a short delay
      setTimeout(() => {
        setPaymentStatus('success');
        // Update form data for success display
        setFormData({
          vpa: scannedPaymentData.vpa,
          amount: scannedPaymentData.amount || '0',
          description: scannedPaymentData.description || ''
        });
      }, 1000);

    } catch (error) {
      console.error('Error opening UPI app:', error);
      setPaymentStatus('error');
      setErrorMessage('Unable to open UPI app. Please ensure you have a UPI app installed.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-500 p-2 rounded-lg">
              <CreditCard className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">UPI Payment</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            disabled={isLiveScannerActive}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4">
          {/* Mode Selection */}
          {paymentStatus === 'idle' && !isLiveScannerActive && (
            <div className="mb-6">
              <div className="flex rounded-lg bg-gray-100 dark:bg-gray-700 p-1">
                <button
                  onClick={() => setActiveMode('form')}
                  className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    activeMode === 'form'
                      ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100'
                  }`}
                >
                  <CreditCard className="h-4 w-4" />
                  <span>Enter Details</span>
                </button>
                <button
                  onClick={() => setActiveMode('scanner')}
                  className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    activeMode === 'scanner'
                      ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100'
                  }`}
                >
                  <ScanLine className="h-4 w-4" />
                  <span>Scan QR</span>
                </button>
                <button
                  onClick={() => setActiveMode('generate')}
                  className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    activeMode === 'generate'
                      ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100'
                  }`}
                >
                  <QrCode className="h-4 w-4" />
                  <span>Generate QR</span>
                </button>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-200">{errorMessage}</p>
            </div>
          )}

          {/* QR Scanner Mode */}
          {paymentStatus === 'idle' && activeMode === 'scanner' && !scannedPaymentData && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <ScanLine className="h-12 w-12 text-blue-500 mx-auto mb-2" />
                <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-1">
                  Scan QR Code to Pay
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Use your camera to scan a UPI payment QR code
                </p>
              </div>

              {!isLiveScannerActive && (
                <div className="space-y-3">
                  <button
                    onClick={() => startLiveScanning('scanner')}
                    className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2 font-medium"
                  >
                    <Camera className="h-5 w-5" />
                    <span>Start Camera Scanner</span>
                  </button>
                  
                  <div className="text-center">
                    <span className="text-gray-500 dark:text-gray-400 text-sm">or</span>
                  </div>
                  
                  <button
                    onClick={handleScanFromImage}
                    disabled={isScanningImage}
                    className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center space-x-2 font-medium disabled:opacity-50"
                  >
                    {isScanningImage ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Scanning Image...</span>
                      </>
                    ) : (
                      <>
                        <Camera className="h-5 w-5" />
                        <span>Upload QR Image</span>
                      </>
                    )}
                  </button>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
              )}

              {/* Live QR Scanner for Scanner Mode */}
              {isLiveScannerActive && (
                <div className="mb-4">
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-800 dark:text-white">
                        QR Code Scanner
                      </h4>
                      <button
                        type="button"
                        onClick={stopLiveScanning}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div 
                      id="qr-reader" 
                      ref={qrReaderRef}
                      className="w-full rounded-lg overflow-hidden"
                    ></div>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-2 text-center">
                      Point your camera at a UPI QR code to scan and pay
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Scanned Payment Confirmation */}
          {paymentStatus === 'idle' && activeMode === 'scanner' && scannedPaymentData && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-1">
                  QR Code Scanned Successfully
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Review payment details and confirm
                </p>
              </div>

              {/* Payment Details */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Pay To:</span>
                  <span className="text-sm font-semibold text-gray-800 dark:text-white">{scannedPaymentData.vpa}</span>
                </div>
                
                {scannedPaymentData.name && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Name:</span>
                    <span className="text-sm font-semibold text-gray-800 dark:text-white">{scannedPaymentData.name}</span>
                  </div>
                )}
                
                {scannedPaymentData.amount && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Amount:</span>
                    <span className="text-lg font-bold text-green-600 dark:text-green-400">₹{parseFloat(scannedPaymentData.amount).toLocaleString()}</span>
                  </div>
                )}
                
                {scannedPaymentData.description && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Description:</span>
                    <span className="text-sm font-semibold text-gray-800 dark:text-white">{scannedPaymentData.description}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={handleScannedPayment}
                  className="flex-1 bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2 font-medium"
                >
                  <Smartphone className="h-4 w-4" />
                  <span>Pay Now</span>
                </button>
                <button
                  onClick={() => {
                    setScannedPaymentData(null);
                    setActiveMode('scanner');
                  }}
                  className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Scan Again
                </button>
              </div>
            </div>
          )}

          {/* QR Code Generator Mode */}
          {paymentStatus === 'idle' && activeMode === 'generate' && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <QrCode className="h-12 w-12 text-blue-500 mx-auto mb-2" />
                <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-1">
                  Generate Payment QR Code
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Create a QR code for others to scan and pay you
                </p>
              </div>

              {/* QR Generation Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Your UPI ID *
                  </label>
                  <input
                    type="text"
                    value={formData.vpa}
                    onChange={(e) => handleInputChange('vpa', e.target.value)}
                    placeholder="your-upi-id@bank"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                      errors.vpa ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    required
                  />
                  {errors.vpa && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.vpa}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Amount (Optional)
                  </label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => handleInputChange('amount', e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    step="0.01"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Payment for..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                {/* Generated QR Code */}
                {formData.vpa && validateVPA(formData.vpa) && (
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-6 text-center">
                    <h4 className="text-sm font-medium text-gray-800 dark:text-white mb-4">
                      Your Payment QR Code
                    </h4>
                    <div className="inline-block p-4 bg-white rounded-lg">
                      <QRCode
                        value={(() => {
                          const upiUrl = new URL('upi://pay');
                          upiUrl.searchParams.set('pa', formData.vpa);
                          if (formData.amount && parseFloat(formData.amount) > 0) {
                            upiUrl.searchParams.set('am', formData.amount);
                          }
                          upiUrl.searchParams.set('cu', 'INR');
                          if (formData.description) {
                            upiUrl.searchParams.set('tn', formData.description);
                          }
                          return upiUrl.toString();
                        })()}
                        size={200}
                      />
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-4">
                      Others can scan this QR code to pay you
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Payment Form Mode */}
          {paymentStatus === 'idle' && activeMode === 'form' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="text-center mb-6">
                <CreditCard className="h-12 w-12 text-blue-500 mx-auto mb-2" />
                <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-1">
                  Send Money via UPI
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Enter payment details to launch your UPI app
                </p>
              </div>

              {/* VPA Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <User className="h-4 w-4 inline mr-1" />
                  Payee VPA (UPI ID) *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.vpa}
                    onChange={(e) => handleInputChange('vpa', e.target.value)}
                    placeholder="example@paytm, user@ybl, merchant@icici"
                    className={`w-full px-3 py-2 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                      errors.vpa ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    required
                  />
                  <button
                    type="button"
                    onClick={handleScanFromImage}
                    disabled={isScanningImage || isLiveScannerActive}
                    className="absolute right-10 top-1/2 transform -translate-y-1/2 p-1 text-blue-500 hover:text-blue-700 disabled:text-gray-400 transition-colors"
                    title="Scan QR code from image"
                  >
                    {isScanningImage ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={isLiveScannerActive ? stopLiveScanning : startLiveScanning}
                    disabled={isScanningImage}
                    className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-1 transition-colors ${
                      isLiveScannerActive 
                        ? 'text-red-500 hover:text-red-700' 
                        : 'text-green-500 hover:text-green-700'
                    } disabled:text-gray-400`}
                    title={isLiveScannerActive ? "Stop camera scanning" : "Scan QR code with camera"}
                  >
                    <ScanLine className="h-4 w-4" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
                {errors.vpa && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.vpa}</p>
                )}
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Enter the recipient's UPI ID, scan from image (📷), or use live camera (📱)
                </p>
              </div>

              {/* Live QR Scanner */}
              {isLiveScannerActive && activeMode === 'form' && (
                <div className="mb-4">
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-800 dark:text-white">
                        Camera QR Scanner
                      </h4>
                      <button
                        type="button"
                        onClick={stopLiveScanning}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div 
                      id="qr-reader" 
                      ref={qrReaderRef}
                      className="w-full rounded-lg overflow-hidden"
                    ></div>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-2 text-center">
                      Point your camera at a UPI QR code to auto-fill the form
                    </p>
                  </div>
                </div>
              )}

              {/* Amount Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <DollarSign className="h-4 w-4 inline mr-1" />
                  Amount (₹) *
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  placeholder="0.00"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                    errors.amount ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  step="0.01"
                  min="0.01"
                  max="100000"
                  required
                />
                {errors.amount && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.amount}</p>
                )}
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Maximum amount: ₹1,00,000
                </p>
              </div>

              {/* Description Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <MessageSquare className="h-4 w-4 inline mr-1" />
                  Description (Optional)
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Payment for..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  maxLength={50}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Optional note for the transaction (max 50 characters)
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLiveScannerActive}
                className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2 font-medium"
              >
                <Smartphone className="h-4 w-4" />
                <span>{isLiveScannerActive ? 'Close camera to continue' : 'Pay with UPI App'}</span>
              </button>

              {/* Popular UPI Apps */}
              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Compatible UPI Apps:
                </p>
                <div className="flex flex-wrap gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <span className="bg-white dark:bg-gray-600 px-2 py-1 rounded">Google Pay</span>
                  <span className="bg-white dark:bg-gray-600 px-2 py-1 rounded">PhonePe</span>
                  <span className="bg-white dark:bg-gray-600 px-2 py-1 rounded">Paytm</span>
                  <span className="bg-white dark:bg-gray-600 px-2 py-1 rounded">CRED</span>
                  <span className="bg-white dark:bg-gray-600 px-2 py-1 rounded">BHIM</span>
                  <span className="bg-white dark:bg-gray-600 px-2 py-1 rounded">Amazon Pay</span>
                </div>
              </div>
            </form>
          )}

          {/* Processing State */}
          {paymentStatus === 'processing' && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
                Opening UPI App...
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Please complete the payment in your UPI app
              </p>
            </div>
          )}

          {/* Success State */}
          {paymentStatus === 'success' && (
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
                Payment Initiated
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Complete the payment in your UPI app to finish the transaction
              </p>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-6">
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">To:</span>
                    <span className="font-medium text-gray-800 dark:text-white">{formData.vpa}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Amount:</span>
                    <span className="font-medium text-green-600 dark:text-green-400">₹{parseFloat(formData.amount).toLocaleString()}</span>
                  </div>
                  {formData.description && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Note:</span>
                      <span className="font-medium text-gray-800 dark:text-white">{formData.description}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={resetForm}
                  className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Make Another Payment
                </button>
                <button
                  onClick={onClose}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* Error State */}
          {paymentStatus === 'error' && (
            <div className="text-center py-8">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
                Payment Failed
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Unable to open UPI app. Please ensure you have a UPI app installed.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setPaymentStatus('idle')}
                  className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={onClose}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        {paymentStatus === 'idle' && activeMode === 'form' && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <h4 className="text-sm font-medium text-gray-800 dark:text-white mb-2">How it works:</h4>
            <ul className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
              <li>• Enter the recipient's UPI ID and payment amount</li>
              <li>• Use the 📱 icon to scan QR codes with your camera in real-time</li>
              <li>• Use the 📷 icon to upload and scan QR code images from your device</li>
              <li>• Click "Pay with UPI App" to launch your UPI application</li>
              <li>• Complete the payment using your preferred UPI app</li>
              <li>• Grant camera permission when prompted for live QR scanning</li>
            </ul>
          </div>
        )}

        {/* Scanner Mode Instructions */}
        {paymentStatus === 'idle' && activeMode === 'scanner' && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <h4 className="text-sm font-medium text-gray-800 dark:text-white mb-2">Scanner Mode:</h4>
            <ul className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
              <li>• Use "Start Camera Scanner" to scan QR codes in real-time</li>
              <li>• Use "Upload QR Image" to scan QR codes from saved images</li>
              <li>• Payment details will be extracted automatically from the QR code</li>
              <li>• Review the details and click "Pay Now" to launch your UPI app</li>
              <li>• Grant camera permission when prompted for live scanning</li>
            </ul>
          </div>
        )}

        {/* Generator Mode Instructions */}
        {paymentStatus === 'idle' && activeMode === 'generate' && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <h4 className="text-sm font-medium text-gray-800 dark:text-white mb-2">QR Generator:</h4>
            <ul className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
              <li>• Enter your UPI ID to generate a payment QR code</li>
              <li>• Optionally set a fixed amount and description</li>
              <li>• Others can scan your QR code to pay you directly</li>
              <li>• Save or share the generated QR code as needed</li>
              <li>• Leave amount empty for flexible payment amounts</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};