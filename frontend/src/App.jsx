import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import StepIndicator from './components/StepIndicator';
import ErrorBanner from './components/ErrorBanner';
import Step1Upload from './components/Step1Upload';
import Step2Verify from './components/Step2Verify';
import Step3Drive from './components/Step3Drive';
import LoginPage from './components/LoginPage';
import RecentRoutesModal from './components/RecentRoutesModal';
import {
  extractAddresses,
  optimizeRoute,
  getActiveDrivers,
  checkBackendHealth,
} from './api/routesApi';
import {
  getStoredUser,
  logout,
} from './api/authApi';
import {
  loadFromStorage,
  saveToStorage,
  clearRouteStorage,
} from './utils/storage';

export default function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState(() => getStoredUser());

  // Restore persisted state or defaults
  const [manifest, setManifest] = useState(() => loadFromStorage('manifest', null));
  const [stops, setStops] = useState(() => loadFromStorage('stops', []));
  const [originAddress, setOriginAddress] = useState(() =>
    loadFromStorage('origin', '200 Medical Plaza, Los Angeles, CA 90095')
  );
  const [selectedDriverId, setSelectedDriverId] = useState(() =>
    loadFromStorage('driver_id', 1)
  );
  const [routeDate, setRouteDate] = useState(() =>
    loadFromStorage('route_date', new Date().toISOString().split('T')[0])
  );

  const [currentStep, setCurrentStep] = useState(() => {
    const savedStep = loadFromStorage('current_step', null);
    if (savedStep) return savedStep;
    const savedManifest = loadFromStorage('manifest', null);
    if (savedManifest) return 'drive';
    const savedStops = loadFromStorage('stops', []);
    if (savedStops && savedStops.length > 0) return 'verify';
    return 'upload';
  });

  const [files, setFiles] = useState([]);
  const [drivers, setDrivers] = useState([
    { driverId: 1, fullName: 'Primary Driver', isActive: true },
  ]);
  const [errorMessage, setErrorMessage] = useState(null);
  const [infoMessage, setInfoMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isRecentModalOpen, setIsRecentModalOpen] = useState(false);

  // Sync state changes to localStorage
  useEffect(() => {
    saveToStorage('current_step', currentStep);
  }, [currentStep]);

  useEffect(() => {
    saveToStorage('manifest', manifest);
  }, [manifest]);

  useEffect(() => {
    saveToStorage('stops', stops);
  }, [stops]);

  useEffect(() => {
    saveToStorage('origin', originAddress);
  }, [originAddress]);

  useEffect(() => {
    saveToStorage('driver_id', selectedDriverId);
  }, [selectedDriverId]);

  useEffect(() => {
    saveToStorage('route_date', routeDate);
  }, [routeDate]);

  // Check backend health on mount
  const checkHealth = useCallback(async () => {
    const alive = await checkBackendHealth();
    setIsOnline(alive);
    if (!alive) {
      setErrorMessage((prev) =>
        prev || 'Cannot connect to Spring Boot backend. Please ensure the backend server is running.'
      );
    }
  }, []);

  useEffect(() => {
    checkHealth();
    // Fetch drivers from DB
    getActiveDrivers().then((driverList) => {
      if (driverList && driverList.length > 0) {
        setDrivers(driverList);
        setSelectedDriverId((prev) => {
          // If logged in user matches a driver name, preselect that driver!
          if (currentUser?.fullName) {
            const matched = driverList.find(
              (d) => d.fullName.toLowerCase() === currentUser.fullName.toLowerCase()
            );
            if (matched) return matched.driverId;
          }
          const exists = driverList.some((d) => d.driverId === prev);
          return exists ? prev : driverList[0].driverId;
        });
      }
    });
  }, [checkHealth, currentUser]);

  const handleLogout = () => {
    logout();
    setCurrentUser(null);
  };

  // If user is not authenticated, render Login Page
  if (!currentUser) {
    return <LoginPage onLoginSuccess={setCurrentUser} />;
  }

  // Step navigation rules
  const canGoToVerify = stops.length > 0 || manifest !== null;
  const canGoToDrive = manifest !== null;
  const maxAllowedStep = manifest ? 3 : stops.length > 0 ? 2 : 1;

  // Step 1: Extract addresses using Gemini OCR (Appends to existing stops to avoid rescanning!)
  const handleExtract = async () => {
    if (files.length === 0) return;
    setIsLoading(true);
    setErrorMessage(null);
    setInfoMessage(null);

    try {
      const extracted = await extractAddresses(files);
      if (!extracted || extracted.length === 0) {
        setErrorMessage(
          'No addresses could be detected in the uploaded images. You can manually enter stops or try different photos.'
        );
        setIsLoading(false);
        return;
      }

      // Convert extracted address strings into stop objects
      const newExtractedStops = extracted.map((addr) => ({
        originalExtractedText: addr,
        correctedAddress: addr,
        isManuallyEdited: false,
      }));

      // Append new stops, filtering out duplicate addresses
      setStops((prevStops) => {
        if (!prevStops || prevStops.length === 0) {
          return newExtractedStops;
        }

        const existingAddresses = new Set(
          prevStops.map((s) => (s.correctedAddress || '').trim().toUpperCase())
        );

        const uniqueNew = newExtractedStops.filter(
          (s) => !existingAddresses.has(s.correctedAddress.trim().toUpperCase())
        );

        return [...prevStops, ...uniqueNew];
      });

      // Clear the selected file inputs now that extraction succeeded
      setFiles([]);
      setCurrentStep('verify');
    } catch (err) {
      console.error('Extract error:', err);
      let msg = err.message || 'Failed to extract addresses.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Recall a recent route manifest from database
  const handleSelectRecentManifest = (selectedManifest) => {
    if (!selectedManifest) return;

    setManifest(selectedManifest);

    if (selectedManifest.driverId) {
      setSelectedDriverId(selectedManifest.driverId);
    }

    if (selectedManifest.routeDate) {
      setRouteDate(selectedManifest.routeDate);
    }

    // Populate stops and origin
    if (selectedManifest.stops && selectedManifest.stops.length > 0) {
      const sortedStops = [...selectedManifest.stops].sort(
        (a, b) => (a.optimizedSequence ?? 0) - (b.optimizedSequence ?? 0)
      );

      // First stop is origin depot
      setOriginAddress(sortedStops[0].correctedAddress);

      // Remaining stops
      const deliveryStops = sortedStops.slice(1).map((s) => ({
        originalExtractedText: s.originalExtractedText || s.correctedAddress,
        correctedAddress: s.correctedAddress,
        isManuallyEdited: Boolean(s.isManuallyEdited),
        latitude: s.latitude,
        longitude: s.longitude,
        optimizedSequence: s.optimizedSequence,
      }));

      setStops(deliveryStops);
    }

    setErrorMessage(null);
    setIsRecentModalOpen(false);
    setCurrentStep('drive');
  };

  // Start manual entry directly without scanning photos
  const handleStartManualEntry = () => {
    if (!stops || stops.length === 0) {
      setStops([
        {
          originalExtractedText: '',
          correctedAddress: '',
          isManuallyEdited: true,
        },
      ]);
    }
    setErrorMessage(null);
    setInfoMessage(null);
    setCurrentStep('verify');
  };

  // Step 2: Optimize route with Google Routes API & Geocoding
  const handleOptimize = async () => {
    const validStops = stops
      .filter((s) => s.correctedAddress && s.correctedAddress.trim().length > 0)
      .map((s) => ({ ...s, correctedAddress: s.correctedAddress.trim() }));

    const combinedStops = [];
    if (originAddress && originAddress.trim()) {
      combinedStops.push({
        originalExtractedText: originAddress.trim(),
        correctedAddress: originAddress.trim(),
        isManuallyEdited: false,
      });
    }

    combinedStops.push(...validStops);

    if (combinedStops.length === 0) {
      setErrorMessage('Please provide at least one address or starting location to optimize.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setInfoMessage(null);

    try {
      const response = await optimizeRoute({
        driverId: selectedDriverId,
        createdBy: currentUser?.username || currentUser?.fullName,
        routeDate,
        stops: combinedStops,
      });

      setManifest(response);
      setCurrentStep('drive');
    } catch (err) {
      console.error('Optimize error:', err);
      setErrorMessage(err.message || 'Route optimization failed. Please verify your address inputs.');
    } finally {
      setIsLoading(false);
    }
  };

  // Clear existing stops if user wants to start a new list from Step 1
  const handleClearStops = () => {
    setStops([]);
    setFiles([]);
  };

  // Reset entire workflow back to Step 1
  const handleResetWorkflow = () => {
    clearRouteStorage();
    setManifest(null);
    setStops([]);
    setFiles([]);
    setErrorMessage(null);
    setInfoMessage(null);
    setCurrentStep('upload');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center">
      {/* Mobile-first centered container with crisp light theme */}
      <main className="w-full max-w-md min-h-screen bg-white shadow-xl flex flex-col border-x border-slate-200 relative">
        <Header
          isOnline={isOnline}
          onRefreshHealth={checkHealth}
          onOpenRecentRoutes={() => setIsRecentModalOpen(true)}
          currentUser={currentUser}
          onLogout={handleLogout}
        />

        <StepIndicator
          currentStep={currentStep}
          maxAllowedStep={maxAllowedStep}
          canGoToVerify={canGoToVerify}
          canGoToDrive={canGoToDrive}
          onStepClick={(stepKey) => {
            setErrorMessage(null);
            setInfoMessage(null);
            setCurrentStep(stepKey);
          }}
        />

        <ErrorBanner
          message={errorMessage}
          onDismiss={() => setErrorMessage(null)}
        />

        {currentStep === 'upload' && (
          <Step1Upload
            files={files}
            setFiles={setFiles}
            stops={stops}
            manifest={manifest}
            onExtract={handleExtract}
            onGoToVerify={() => {
              setErrorMessage(null);
              setCurrentStep('verify');
            }}
            onGoToDrive={() => {
              setErrorMessage(null);
              setCurrentStep('drive');
            }}
            onClearStops={handleClearStops}
            onOpenRecentRoutes={() => setIsRecentModalOpen(true)}
            onStartManualEntry={handleStartManualEntry}
            isLoading={isLoading}
          />
        )}

        {currentStep === 'verify' && (
          <Step2Verify
            originAddress={originAddress}
            setOriginAddress={setOriginAddress}
            stops={stops}
            setStops={setStops}
            drivers={drivers}
            selectedDriverId={selectedDriverId}
            setSelectedDriverId={setSelectedDriverId}
            routeDate={routeDate}
            setRouteDate={setRouteDate}
            manifest={manifest}
            onOptimize={handleOptimize}
            onBackToUpload={() => {
              setErrorMessage(null);
              setCurrentStep('upload');
            }}
            onGoToDrive={() => {
              setErrorMessage(null);
              setCurrentStep('drive');
            }}
            isLoading={isLoading}
          />
        )}

        {currentStep === 'drive' && (
          <Step3Drive
            manifest={manifest}
            onResetWorkflow={handleResetWorkflow}
            onBackToEdit={() => {
              setErrorMessage(null);
              setCurrentStep('verify');
            }}
            onBackToUpload={() => {
              setErrorMessage(null);
              setCurrentStep('upload');
            }}
            onOpenRecentRoutes={() => setIsRecentModalOpen(true)}
          />
        )}

        {/* Modal for Recalling Recent Routes */}
        <RecentRoutesModal
          isOpen={isRecentModalOpen}
          onClose={() => setIsRecentModalOpen(false)}
          onSelectManifest={handleSelectRecentManifest}
          currentUser={currentUser}
        />
      </main>
    </div>
  );
}
