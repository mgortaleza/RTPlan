import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import StepIndicator from './components/StepIndicator';
import ErrorBanner from './components/ErrorBanner';
import Step1Upload from './components/Step1Upload';
import Step2Verify, { DEFAULT_PRESETS } from './components/Step2Verify';
import Step3Drive from './components/Step3Drive';
import LoginPage from './components/LoginPage';
import RecentRoutesModal from './components/RecentRoutesModal';
import AdminPage from './components/AdminPage';
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
  clearAllUserStorage,
} from './utils/storage';

export default function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState(() => getStoredUser());

  // Restore persisted state or defaults
  const [manifest, setManifest] = useState(() => loadFromStorage('manifest', null));
  const [stops, setStops] = useState(() => loadFromStorage('stops', []));
  const [originAddress, setOriginAddress] = useState(() =>
    loadFromStorage('origin', '')
  );
  const [presets, setPresets] = useState(() =>
    loadFromStorage('origin_presets', DEFAULT_PRESETS)
  );
  const [selectedDriverId, setSelectedDriverId] = useState(() =>
    loadFromStorage('driver_id', 1)
  );
  const [routeDate, setRouteDate] = useState(() =>
    loadFromStorage('route_date', new Date().toISOString().split('T')[0])
  );

  const [currentStep, setCurrentStep] = useState(() => {
    const savedManifest = loadFromStorage('manifest', null);
    const savedStops = loadFromStorage('stops', []);
    const validSavedStops = (savedStops || []).filter(
      (s) => s && s.correctedAddress && s.correctedAddress.trim().length > 0
    );
    const savedOrigin = loadFromStorage('origin', '');
    const savedStep = loadFromStorage('current_step', null);

    if (savedStep === 'drive' && savedManifest) return 'drive';
    if (savedStep === 'verify' && (validSavedStops.length > 0 || (savedOrigin && savedOrigin.trim().length > 0))) {
      return 'verify';
    }
    if (savedStep === 'upload') return 'upload';

    if (savedManifest) return 'drive';
    if (validSavedStops.length > 0) return 'verify';
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
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // Sync state changes to localStorage
  useEffect(() => {
    saveToStorage('current_step', currentStep);
  }, [currentStep]);

  useEffect(() => {
    saveToStorage('manifest', manifest);
  }, [manifest]);

  useEffect(() => {
    const valid = (stops || []).filter(
      (s) => s && s.correctedAddress && s.correctedAddress.trim().length > 0
    );
    saveToStorage('stops', valid.length > 0 ? stops : []);
  }, [stops]);

  useEffect(() => {
    const clean = (originAddress || '').trim();
    saveToStorage('origin', clean);
  }, [originAddress]);

  useEffect(() => {
    saveToStorage('driver_id', selectedDriverId);
  }, [selectedDriverId]);

  useEffect(() => {
    saveToStorage('route_date', routeDate);
  }, [routeDate]);

  useEffect(() => {
    saveToStorage('origin_presets', presets);
  }, [presets]);

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
              (d) => (d?.fullName || '').toLowerCase() === (currentUser.fullName || '').toLowerCase()
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
    clearAllUserStorage();
    setManifest(null);
    setStops([]);
    setFiles([]);
    setOriginAddress('');
    setPresets(DEFAULT_PRESETS);
    setSelectedDriverId(1);
    setRouteDate(new Date().toISOString().split('T')[0]);
    setCurrentStep('upload');
    setErrorMessage(null);
    setInfoMessage(null);
    setIsAdminOpen(false);
    setIsRecentModalOpen(false);
    setCurrentUser(null);
  };

  // If user is not authenticated, render Login Page
  if (!currentUser) {
    return <LoginPage onLoginSuccess={setCurrentUser} />;
  }

  // Prune blank/empty stop entries to prevent false positives when returning to Upload
  const pruneEmptyStops = () => {
    setStops((prev) =>
      (prev || []).filter((s) => s && s.correctedAddress && s.correctedAddress.trim().length > 0)
    );
    setOriginAddress((prev) => (prev ? prev.trim() : ''));
  };

  // Step navigation rules (strictly based on non-empty stops or origin)
  const validStopsCount = (stops || []).filter(
    (s) => s && s.correctedAddress && s.correctedAddress.trim().length > 0
  ).length;
  const hasValidOrigin = Boolean(originAddress && originAddress.trim().length > 0);
  const canGoToVerify = validStopsCount > 0 || manifest !== null || hasValidOrigin;
  const canGoToDrive = manifest !== null;
  const maxAllowedStep = manifest ? 3 : (validStopsCount > 0 || hasValidOrigin) ? 2 : 1;

  // Step 1: Extract addresses using Gemini OCR (Appends to existing stops to avoid rescanning!)
  const handleExtract = async () => {
    if (files.length === 0) return;
    setIsLoading(true);
    setErrorMessage(null);
    setInfoMessage(null);

    try {
      const extractionResult = await extractAddresses(files);

      // Robust extraction of delivery addresses (supports v2 AddressExtractionResponse, legacy Array, or object alias)
      let rawDelivery = [];
      if (Array.isArray(extractionResult)) {
        rawDelivery = extractionResult;
      } else if (Array.isArray(extractionResult?.deliveryAddresses)) {
        rawDelivery = extractionResult.deliveryAddresses;
      } else if (Array.isArray(extractionResult?.addresses)) {
        rawDelivery = extractionResult.addresses;
      } else if (typeof extractionResult?.deliveryAddresses === 'string') {
        rawDelivery = [extractionResult.deliveryAddresses];
      }

      const deliveryAddrs = rawDelivery
        .filter((addr) => addr && typeof addr === 'string' && addr.trim().length > 0)
        .map((addr) => addr.trim());

      const primaryFrom = !Array.isArray(extractionResult)
        ? (extractionResult?.primaryFromAddress || null)
        : null;
      const rawFroms = !Array.isArray(extractionResult) && Array.isArray(extractionResult?.fromAddresses)
        ? extractionResult.fromAddresses
        : [];

      if (deliveryAddrs.length === 0 && !primaryFrom) {
        setErrorMessage(
          'No addresses could be detected in the uploaded images. You can manually enter stops or try different photos.'
        );
        setIsLoading(false);
        return;
      }

      // Convert extracted delivery address strings into stop objects
      const newExtractedStops = deliveryAddrs.map((addr) => ({
        originalExtractedText: addr,
        correctedAddress: addr,
        isManuallyEdited: false,
      }));

      // Append new delivery stops, filtering out duplicate addresses
      setStops((prevStops) => {
        const safePrev = Array.isArray(prevStops) ? prevStops : [];
        if (safePrev.length === 0) {
          return newExtractedStops;
        }

        const existingAddresses = new Set(
          safePrev
            .filter((s) => s && s.correctedAddress)
            .map((s) => String(s.correctedAddress).trim().toUpperCase())
        );

        const uniqueNew = newExtractedStops.filter(
          (s) => !existingAddresses.has(s.correctedAddress.trim().toUpperCase())
        );

        return [...safePrev, ...uniqueNew];
      });

      // 1. If From location is available, populate on the from field
      if (primaryFrom && primaryFrom.trim()) {
        setOriginAddress(primaryFrom.trim());
      }

      // 2. Add all detected From locations as presets
      if (rawFroms.length > 0) {
        setPresets((prevPresets) => {
          const current = Array.isArray(prevPresets) ? prevPresets : [];
          const existingAddresses = new Set(
            current
              .filter((p) => p && p.address)
              .map((p) => String(p.address).trim().toLowerCase())
          );

          const toAdd = [];
          rawFroms.forEach((item) => {
            if (!item) return;
            const addr = (typeof item === 'string' ? item : item.address || '').trim();
            const label = (typeof item === 'object' && item.label ? item.label : addr.split(',')[0]).trim();
            if (addr && !existingAddresses.has(addr.toLowerCase())) {
              existingAddresses.add(addr.toLowerCase());
              toAdd.push({
                id: `preset_scan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                label: label || 'Origin Facility',
                address: addr,
              });
            }
          });

          return toAdd.length > 0 ? [...toAdd, ...current] : current;
        });
      }

      if (primaryFrom && rawFroms.length > 1) {
        setInfoMessage(
          `Detected ${rawFroms.length} origin facilities. Selected "${primaryFrom.split(',')[0]}" as Starting Origin, and added all ${rawFroms.length} to Presets.`
        );
      } else if (primaryFrom) {
        setInfoMessage(
          `Detected Starting Origin: "${primaryFrom.split(',')[0]}" (added to Origin Presets).`
        );
      }

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
    // Reset origin address
    setOriginAddress('');
    // Remove previous blank items and add a single empty row ready for typing
    setStops((prev) => {
      const valid = (prev || []).filter(
        (s) => s && s.correctedAddress && s.correctedAddress.trim().length > 0
      );
      if (valid.length === 0) {
        return [
          {
            originalExtractedText: '',
            correctedAddress: '',
            isManuallyEdited: true,
          },
        ];
      }
      return valid;
    });
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
          onOpenAdmin={() => setIsAdminOpen(true)}
          currentUser={currentUser}
          onLogout={handleLogout}
        />

        {isAdminOpen ? (
          <AdminPage
            currentUser={currentUser}
            onClose={() => setIsAdminOpen(false)}
          />
        ) : (
          <>
            <StepIndicator
              currentStep={currentStep}
              maxAllowedStep={maxAllowedStep}
              canGoToVerify={canGoToVerify}
              canGoToDrive={canGoToDrive}
              onStepClick={(stepKey) => {
                setErrorMessage(null);
                setInfoMessage(null);
                if (stepKey === 'upload') {
                  pruneEmptyStops();
                }
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
                  pruneEmptyStops();
                  setCurrentStep('upload');
                }}
                onGoToDrive={() => {
                  setErrorMessage(null);
                  setCurrentStep('drive');
                }}
                isLoading={isLoading}
                presets={presets}
                setPresets={setPresets}
                currentUser={currentUser}
              />
            )}

            {currentStep === 'drive' && (
              manifest ? (
                <Step3Drive
                  manifest={manifest}
                  onResetWorkflow={handleResetWorkflow}
                  onBackToEdit={() => {
                    setErrorMessage(null);
                    setCurrentStep('verify');
                  }}
                  onBackToUpload={() => {
                    setErrorMessage(null);
                    pruneEmptyStops();
                    setCurrentStep('upload');
                  }}
                  onOpenRecentRoutes={() => setIsRecentModalOpen(true)}
                />
              ) : (
                <div className="p-8 text-center space-y-3">
                  <p className="text-xs text-slate-500 font-medium">No active route found.</p>
                  <button
                    type="button"
                    onClick={() => setCurrentStep('upload')}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
                  >
                    Start New Route
                  </button>
                </div>
              )
            )}
          </>
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
