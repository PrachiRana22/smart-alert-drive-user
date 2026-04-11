import React, { useEffect, useState, useRef } from "react";
import { View, Text, TouchableOpacity, Alert, StyleSheet, ScrollView, Vibration, AppState, Modal } from "react-native";
import { Camera, useCameraDevice, useCameraPermission, useFrameProcessor, runAsync } from 'react-native-vision-camera';
import { useFaceDetector } from 'react-native-vision-camera-face-detector';
import { Worklets } from 'react-native-worklets-core';
import MapView, { Marker, Polyline } from "react-native-maps";
import polyline from '@mapbox/polyline';
import * as Location from "expo-location";
import { Audio } from "expo-av";
import * as Speech from "expo-speech";
import { AlertTriangle, ShieldCheck, Square, Smartphone, Clock, Activity } from "lucide-react-native";
import { AuthContext } from "../context/AuthContext";

export default function DriverMonitorScreen({ navigation, route }) {
  const { user, reportAlert, updateTripStatus, resolveAlert, sendEmergencyEmail } = React.useContext(AuthContext);

  const { tripId, start, end, vehicleName, vehicleNumber, routeCoords, destinationCoords } = route.params || {};
  const persona = user?.persona || 'Normal';
  const getThresholds = () => {
    switch (persona) {
      case 'Moderate':
        return { blinkLimit: 2, sleepFrames: 20 };
      case 'Critical':
        return { blinkLimit: 6, sleepFrames: 50 };
      case 'Normal':
      default:
        return { blinkLimit: 4, sleepFrames: 37 };
    }
  };
  const { blinkLimit, sleepFrames } = getThresholds();

  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('front');

  const [location, setLocation] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [allTripAlerts, setAllTripAlerts] = useState([]); // Persistent full trip log for Maps
  const [isSimulating, setIsSimulating] = useState(false); // Make real detection default now
  const [testState, setTestState] = useState("Normal"); // Normal, Drowsy, Sleep
  const testStateRef = useRef(testState);

  useEffect(() => {
    testStateRef.current = testState;
  }, [testState]);

  const [eyesClosedFrames, setEyesClosedFrames] = useState(0);
  const [faceStatusText, setFaceStatusText] = useState("Status: Monitoring");
  const [activePersona, setActivePersona] = useState("Normal"); // Dynamic persona state

  // Face Tracking Loss + SOS states
  const [missingFaceFrames, setMissingFaceFrames] = useState(0);
  const [consecutiveFaceLossAlerts, setConsecutiveFaceLossAlerts] = useState(0);
  const [consecutiveCriticalAlerts, setConsecutiveCriticalAlerts] = useState(0);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [emergencyTimer, setEmergencyTimer] = useState(0);

  // Blink tracking
  const [blinkTimestamps, setBlinkTimestamps] = useState([]);
  const [wasEyesClosedLastFrame, setWasEyesClosedLastFrame] = useState(false);
  const [sound, setSound] = useState(null);

  const mapRef = useRef(null);
  const cameraRef = useRef(null);
  const isProcessingRef = useRef(false);
  const locationSubscriptionRef = useRef(null);

  const [routeCoordinates, setRouteCoordinates] = useState(routeCoords || []);
  const [endCoords, setEndCoords] = useState(destinationCoords || null);

  // Distance and Time Tracking
  const [startTime] = useState(Date.now());
  const [tripDistance, setTripDistance] = useState(0); // in meters
  const liveTripSpeedRef = useRef(0); // For live tracking to avoid naming clashes
  const lastSpeedAlertTimeRef = useRef(0);
  const SPEED_LIMIT = 80; // km/h limit (default)

  // AI Safety Coach States & Refs
  const lastAIAlertTimeRef = useRef(0);
  const incidentHistoryRef = useRef([]); // Timestamps of alerts for spike detection
  const drowsinessEventsWindowRef = useRef([]); // Timestamps of specifically drowsiness
  const durationAlertedCountRef = useRef(0);
  const [aiCoachStatus, setAiCoachStatus] = useState("Optimal");
  const [weatherCondition, setWeatherCondition] = useState(null);
  const weatherAlertCooldownRef = useRef(0);

  // Live Telemetry
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [drivingTimeStr, setDrivingTimeStr] = useState("00:00:00");
  const [phoneUsageCount, setPhoneUsageCount] = useState(0);
  const appState = useRef(AppState.currentState);
  
  // Distraction / Focus tracking
  const lastFaceDetectedTimeRef = useRef(Date.now());
  const isFocusAlertActiveRef = useRef(false);

  useEffect(() => {
    const timer = setInterval(() => {
      const s = Math.floor((Date.now() - startTime) / 1000);
      const hrs = Math.floor(s / 3600).toString().padStart(2, '0');
      const mins = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
      const secs = (s % 60).toString().padStart(2, '0');
      setDrivingTimeStr(`${hrs}:${mins}:${secs}`);
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        setPhoneUsageCount(prev => prev + 1);
        addAlert('Moderate', '⚠️ Phone usage detected. Please focus on the road.', 'Phone Usage');
        playBeep('Moderate', 'Phone usage detected. Please focus on the road.');
      }
      appState.current = nextAppState;
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    startLiveLocation();
    if ((!routeCoords || routeCoords.length === 0) && start && end) {
      fetchRouteData();
    }
  }, []);

  const { detectFaces } = useFaceDetector({
    performanceMode: 'fast',
    contourMode: 'none',
    landmarkMode: 'none',
    classificationMode: 'all',
  });

  const handleFacesDetectedJS = Worklets.createRunOnJS((faces, isSim) => {
    // Transform formatting to match the old expected format
    if (!isSim) {
      const mapped = {
        faces: faces ? faces.map(f => ({
          leftEyeOpenProbability: f.leftEyeOpenProbability,
          rightEyeOpenProbability: f.rightEyeOpenProbability,
          yawAngle: f.yawAngle,
          pitchAngle: f.pitchAngle
        })) : []
      };
      handleFacesDetected(mapped);
    }
  });

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    if (!isSimulating) {
      runAsync(frame, () => {
        'worklet';
        const faces = detectFaces(frame);
        handleFacesDetectedJS(faces, isSimulating);
      });
    }
  }, [isSimulating, handleFacesDetectedJS]);

  // Simulation mode check loops (only active if simulating)
  useEffect(() => {
    if (!isSimulating) return;

    let isActive = true;
    const processFrame = () => {
      if (!isActive) return;
      let emulateEyesClosed = false;
      if (testStateRef.current === "Normal") {
        emulateEyesClosed = false;
      } else if (testStateRef.current === "Drowsy") {
        emulateEyesClosed = (Date.now() % 400) > 200;
      } else if (testStateRef.current === "Sleep") {
        emulateEyesClosed = true;
      }
      const isLost = testStateRef.current === "Lost";
      const mockResult = {
        faces: isLost ? [] : [{
          leftEyeOpenProbability: emulateEyesClosed ? 0.1 : 0.9,
          rightEyeOpenProbability: emulateEyesClosed ? 0.1 : 0.9,
        }]
      };
      handleFacesDetected(mockResult);
      if (isActive) setTimeout(processFrame, 800);
    };
    if (isActive) processFrame();
    return () => { isActive = false; };
  }, [isSimulating]);

  // Monitor prolonged eye closure based on slow frames

  // Monitor missing face frames
  useEffect(() => {
    // Face not detected logic - trigger every 50 frames of absence (~2 seconds)
    if (missingFaceFrames > 0 && missingFaceFrames % 50 === 0) {
       // Silencing the 2-second repeated alert as per 10-second focus requirement
       // addAlert('Moderate', '⚠️ Face not detected in camera. Please face forward.', 'Face Not Detected');
       setFaceStatusText("Monitoring - Waiting for Face");
       // playBeep('Moderate', 'Face not detected in camera. Please face forward.');
    }
  }, [missingFaceFrames, showEmergencyModal]);

  // Emergency SOS Countdown Timer
  useEffect(() => {
    if (showEmergencyModal && emergencyTimer > 0) {
       const id = setTimeout(() => setEmergencyTimer(prev => prev - 1), 1000);
       return () => clearTimeout(id);
    } else if (showEmergencyModal && emergencyTimer === 0) {
       // Dispatch email!
       setShowEmergencyModal(false);
       if (sendEmergencyEmail) {
           sendEmergencyEmail({
               trip: tripId,
               location: `Lat: ${location?.latitude}, Lon: ${location?.longitude}`,
               alert_type: 'No Driver Detected (SOS Protocol)'
           });
       }
       Alert.alert("SOS Dispatched", "Emergency alert dispatched to registered phone numbers and mail IDs.");
    }
  }, [showEmergencyModal, emergencyTimer, location, tripId]);
  useEffect(() => {
    if (eyesClosedFrames === 0) {
      if (!wasEyesClosedLastFrame) {
        setFaceStatusText("Eyes Open - Safe");
        // Revert active persona gradually to normal when eyes are open and safe
        if (activePersona !== "Normal") {
          setActivePersona("Normal");
        }
      }
    } else if (eyesClosedFrames >= sleepFrames) { // dynamic threshold based on persona
      const now = Date.now();
      drowsinessEventsWindowRef.current = [...drowsinessEventsWindowRef.current, now].filter(t => now - t < 60000);
      const times = drowsinessEventsWindowRef.current.length;
      
      addAlert('Critical', `⚠️ Drowsiness detected ${times} time${times > 1 ? 's' : ''} in the last minute. (Asleep)`);
      setFaceStatusText("CRITICAL - ASLEEP!");
      setActivePersona("Critical");
      playBeep('Critical');
      // reset to prevent spamming until they press "I'm Awake" or open their eyes
      setEyesClosedFrames(0);
    }
  }, [eyesClosedFrames]);

  // Cleanup Sound
  useEffect(() => {
    return () => {
      stopBeep();
      if (locationSubscriptionRef.current) {
        locationSubscriptionRef.current.remove();
      }
    };
  }, []);

  const playBeep = async (type, customMessage = null) => {
    try {
      // Conversational Assistant Synthesis
      const userName = user?.first_name || "Driver";
      let speechPhrase = customMessage;

      if (!speechPhrase) {
        if (type === 'Critical') {
          speechPhrase = `Critical Alert, ${userName}! Wake up immediately!`;
        } else if (type === 'Speeding') {
          speechPhrase = `Warning ${userName}, you are over the speed limit. Please slow down!`;
        } else if (type === 'Moderate') {
          speechPhrase = `Warning ${userName}, your eyes seem tired. Please focus on the road.`;
        } else if (type === 'AI_COACH') {
          speechPhrase = `Attention ${userName}. Safety assessment in progress.`;
        }
      }

      // Speak with slightly different tones based on severity
      if (speechPhrase) {
        if (type === 'Critical') {
          Speech.speak(speechPhrase, { rate: 1.1, pitch: 1.2 });
          Vibration.vibrate([0, 500, 200, 500], true);
        } else if (type === 'AI_COACH') {
          Speech.speak(speechPhrase, { rate: 0.9, pitch: 1.0 }); // Calmer for AI Coach
          Vibration.vibrate(200);
        } else {
          Speech.speak(speechPhrase, { rate: 1.0, pitch: 1.0 });
          Vibration.vibrate(500);
        }
      }
    } catch (error) {
      console.log("Speech Error:", error);
    }
  };

  const stopBeep = async () => {
    Vibration.cancel();
    Speech.stop();
  };

  const fetchRouteData = async () => {
    try {
      const startResult = await Location.geocodeAsync(start);
      const endResult = await Location.geocodeAsync(end);

      if (startResult.length > 0 && endResult.length > 0) {
        setEndCoords({ latitude: endResult[0].latitude, longitude: endResult[0].longitude });

        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${startResult[0].longitude},${startResult[0].latitude};${endResult[0].longitude},${endResult[0].latitude}?overview=full&geometries=polyline`;

        const response = await fetch(osrmUrl);
        const data = await response.json();

        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
          const points = polyline.decode(data.routes[0].geometry);
          const coords = points.map(point => ({ latitude: point[0], longitude: point[1] }));
          setRouteCoordinates(coords);
          setTripDistance(data.routes[0].distance || 0);
        }
      }
    } catch (error) {
      console.log("Route fetch error:", error);
    }
  };

  const fetchRealWeather = async (lat, lon) => {
    try {
      const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
      const data = await response.json();
      if (data && data.current_weather) {
        const code = data.current_weather.weathercode;
        const temp = data.current_weather.temperature;
        
        const wmoMapping = {
          0: "Clear Sky",
          1: "Mainly Clear", 2: "Partly Cloudy", 3: "Overcast",
          45: "Foggy", 48: "Depositing Rime Fog",
          51: "Light Drizzle", 53: "Moderate Drizzle", 55: "Dense Drizzle",
          61: "Slight Rain", 63: "Moderate Rain", 65: "Heavy Rain",
          71: "Slight Snowfall", 73: "Moderate Snowfall", 75: "Heavy Snowfall",
          80: "Slight Rain Showers", 81: "Moderate Rain Showers", 82: "Violent Rain Showers",
          95: "Thunderstorm", 96: "Thunderstorm with Hail", 99: "Heavy Hailstorm"
        };

        const status = wmoMapping[code] || "Clear";
        const isHazardous = code >= 51 && code <= 99;

        return { 
          status, 
          temperature: temp, 
          isHazardous 
        };
      }
      return { status: "Unknown", temperature: "--", isHazardous: false };
    } catch (error) {
      console.log("Weather error:", error);
      return { status: "Unknown", temperature: "--", isHazardous: false };
    }
  };

  const addAlert = (type, message, specificAlertType = null) => {
    // Track incident for AI Frequency analysis
    incidentHistoryRef.current.push(Date.now());

    // Speeding is styled as 'Speeding', but should just reflect 'Moderate' visually on the primary Persona layout
    setActivePersona(type === 'Speeding' ? 'Moderate' : type);

    const newAlert = {
      id: Date.now().toString() + Math.random().toString(),
      type, // 'Normal', 'Moderate', 'Critical', 'Speeding'
      message,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      latitude: location?.latitude,
      longitude: location?.longitude
    };
    setAlerts(prev => [newAlert, ...prev].slice(0, 5)); // UI HUD list
    setAllTripAlerts(prev => [...prev, newAlert]); // Full heatmap analytics list

    const reportAndAlert = async () => {
      let backendId = null;
      if (tripId) {
        const res = await reportAlert({
          trip: tripId,
          alert_type: specificAlertType ? specificAlertType : (type === 'Critical' ? 'Sleep' : 'Drowsy'),
          severity: type === 'Critical' ? 'CRITICAL_RISK' : 'MODERATE_RISK',
          latitude: location?.latitude,
          longitude: location?.longitude,
          location: `Lat: ${location?.latitude}, Lon: ${location?.longitude}`,
          vehicle_speed: liveTripSpeedRef.current
        });
        if (res) backendId = res.id;
      }

      if (type === 'Critical') {
        setConsecutiveCriticalAlerts(prev => {
            const next = prev + 1;
            if (next >= 3 && !showEmergencyModal) {
               setShowEmergencyModal(true);
               setEmergencyTimer(5);
               return 0;
            }
            return next;
        });
      }
    };
    reportAndAlert();
  };

  const handleFacesDetected = ({ faces }) => {
    const now = Date.now();

    const face = faces && faces.length > 0 ? faces[0] : null;
    // Distracted if no face OR head turned significantly (Yaw > 20 degrees)
    const isDistracted = !face || Math.abs(face.yawAngle || 0) > 20 || Math.abs(face.pitchAngle || 0) > 20;

    if (isDistracted) {
      // No valid/focused face detected
      setMissingFaceFrames(prev => prev + 1);
      
      // Check for 5-second distraction (Eye/Face not visible)
      const distractionTime = now - lastFaceDetectedTimeRef.current;
      if (distractionTime > 5000 && !isFocusAlertActiveRef.current) {
        isFocusAlertActiveRef.current = true;
        addAlert('Moderate', '⚠️ Eyes are not visible to the camera.', 'Focus Alert');
        playBeep('Moderate', 'Eyes are not visible to the camera.');
        setFaceStatusText("Eyes not visible");

        // Integrated SOS Logic: Trigger after 3 focus alerts
        setConsecutiveFaceLossAlerts(prev => {
            const next = prev + 1;
            if (next >= 3 && !showEmergencyModal) {
               setShowEmergencyModal(true);
               setEmergencyTimer(5);
               return 0;
            }
            return next;
        });
      }
      return;
    }

    // Face is detected! reset trackers
    lastFaceDetectedTimeRef.current = now;
    isFocusAlertActiveRef.current = false;
    setMissingFaceFrames(0);
    setConsecutiveFaceLossAlerts(0);

    const leftEye = face.leftEyeOpenProbability;
    const rightEye = face.rightEyeOpenProbability;

    if (leftEye !== undefined && rightEye !== undefined) {
      // Threshold for eyes being closed: probability below 0.3 means highly likely closed/drowsy
      const isClosedNow = (leftEye <= 0.3 && rightEye <= 0.3);

      if (isClosedNow) {
        setEyesClosedFrames(prev => prev + 1);
        setWasEyesClosedLastFrame(true);
      } else {
        // Eyes are Open
        setEyesClosedFrames(0);

        // Did they just open after being closed? That's a BLINK.
        if (wasEyesClosedLastFrame) {
          const now = Date.now();

          setBlinkTimestamps(prev => {
            // Keep only blinks from the last 7 seconds to calculate rapid blink rate safely
            const recentBlinks = [...prev, now].filter(t => now - t < 7000);
            const blinkCount = recentBlinks.length;

            if (blinkCount >= blinkLimit) { // dynamic blink threshold based on persona
              drowsinessEventsWindowRef.current = [...drowsinessEventsWindowRef.current, now].filter(t => now - t < 60000);
              const times = drowsinessEventsWindowRef.current.length;

              addAlert('Moderate', `⚠️ Drowsiness detected ${times} time${times > 1 ? 's' : ''} in the last minute.`);
              setFaceStatusText("Warning - Frequent Blinks");
              playBeep('Moderate');
              return []; // Reset after alerting to avoid spam
            } else if (blinkCount === 1) {
              // Do not add normal alert to avoid UI clutter
              setFaceStatusText("Status: Normal");
            }

            return recentBlinks;
          });
        }
        setWasEyesClosedLastFrame(false);
      }
    }
  };

  const startLiveLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return;

    Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, timeInterval: 2000, distanceInterval: 1 },
      (loc) => {
        setLocation(loc.coords);
        const currentSpeedKmh = Math.max(0, (loc.coords.speed || 0) * 3.6);
        // Lowered threshold: Only ignore tiny micro-drifts under 0.5 km/h, allow walking speed
        const displaySpeed = currentSpeedKmh < 0.5 ? 0 : currentSpeedKmh;
        setCurrentSpeed(displaySpeed);
        liveTripSpeedRef.current = currentSpeedKmh; // Convert m/s to km/h

        // Speeding Check
        const now = Date.now();
        if (currentSpeedKmh > SPEED_LIMIT) {
          if (now - lastSpeedAlertTimeRef.current > 30000) { // 30 sec cooldown
            lastSpeedAlertTimeRef.current = now;
            addAlert('Speeding', `Warning: You are overspeeding at ${currentSpeedKmh.toFixed(0)} km/h. Please slow down!`, 'Speeding');
            playBeep('Moderate'); // Double beep for overspeeding
            setFaceStatusText(`Overspeeding (${currentSpeedKmh.toFixed(0)} km/h)`);
          }
        }

        // AI Safety Coach Loop (Check every 60s approx)
        if (now - lastAIAlertTimeRef.current > 60000) {
          lastAIAlertTimeRef.current = now;

          // 1. Duration Check (every 2 hours)
          const driveMins = Math.floor((now - startTime) / 60000);
          const alertSlot = Math.floor(driveMins / 120);
          if (alertSlot > durationAlertedCountRef.current) {
            durationAlertedCountRef.current = alertSlot;
            playBeep('AI_COACH', `⚠️ You have been driving for ${alertSlot * 2} hours. Consider taking a break.`);
            setAiCoachStatus("Suggesting Break");
          }

          // 2. Frequency Spike Check (>2 alerts in 5 mins)
          const fiveMinsAgo = now - 300000;
          incidentHistoryRef.current = incidentHistoryRef.current.filter(t => t > fiveMinsAgo);
          if (incidentHistoryRef.current.length >= 3) {
            playBeep('AI_COACH', `Warning Ronit. High frequency of drowsiness triggers detected. Your fatigue levels are rising. Please pull over safely.`);
            setAiCoachStatus("High Fatigue Risk");
            incidentHistoryRef.current = []; // Reset after coach warning
          }

        // 3. Weather Risk Evaluation
        if (now - weatherAlertCooldownRef.current > 600000) { // Every 10 mins
          fetchRealWeather(loc.coords.latitude, loc.coords.longitude).then(data => {
            setWeatherCondition(data);
            if (data.isHazardous || weatherCondition?.status?.includes("Rain")) {
              playBeep('AI_COACH', `⚠️ ${data.status} detected in your route. Reduce speed.`);
              setAiCoachStatus("Weather Hazard");
              weatherAlertCooldownRef.current = now;
            } else {
              setAiCoachStatus("Optimal");
            }
          });
        }
        }

        if (mapRef.current) {
          mapRef.current.animateCamera({
            center: {
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
            },
            pitch: 45, // 3D perspective
            heading: loc.coords.heading > 0 ? loc.coords.heading : 0, // Rotate based on movement
            altitude: 1000,
            zoom: 17, // Closer zoom like navigation
          }, { duration: 1000 });
        }
      }
    );
  };

  if (!hasPermission) {
    return (
      <View className="flex-1 bg-slate-50 justify-center items-center px-6">
        <View className="bg-white p-8 rounded-[32px] border border-slate-200 items-center w-full shadow-xl shadow-slate-200">
            <View className="w-16 h-16 rounded-full bg-blue-50 items-center justify-center mb-6 border border-blue-100">
                <ShieldCheck size={32} color="#2563EB" />
            </View>
            <Text className="text-xl font-black text-slate-800 tracking-wider mb-2 uppercase text-center">Camera Access</Text>
            <Text className="text-slate-500 text-center mb-8 font-medium leading-5">The AI Safety Coach requires camera permission to monitor driver fatigue and distraction levels continuously.</Text>
            
            <TouchableOpacity 
                className="bg-blue-600 w-full py-4 rounded-2xl items-center shadow-lg shadow-blue-600/30 active:scale-95 transition-transform" 
                onPress={requestPermission}
            >
                <Text className="text-white font-black tracking-widest uppercase text-sm">Grant Permission</Text>
            </TouchableOpacity>
        </View>
      </View>
    );
  }

  const getAlertStyle = (type) => {
    switch (type) {
      case 'Critical': return { bg: 'rgba(220, 38, 38, 0.1)', text: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' };
      case 'Moderate': return { bg: 'rgba(234, 88, 12, 0.1)', text: '#f97316', border: 'rgba(249, 115, 22, 0.3)' };
      case 'Speeding': return { bg: 'rgba(217, 119, 6, 0.1)', text: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)' }; // Amber
      default: return { bg: 'rgba(71, 85, 105, 0.2)', text: '#94a3b8', border: 'rgba(71, 85, 105, 0.3)' };
    }
  };

  return (
    <View className="flex-1 bg-slate-50 pt-14 px-2">
      {/* EMERGENCY SOS POPUP OVERLAY */}
      {showEmergencyModal && (
        <Modal visible={true} transparent={true} animationType="fade">
            <View className="flex-1 bg-red-600/95 justify-center items-center px-6">
                <AlertTriangle size={64} color="#ffffff" className="mb-6" />
                <Text className="text-4xl font-black text-white uppercase tracking-widest text-center mb-2">Driver Unresponsive</Text>
                <Text className="text-lg text-red-100 font-medium text-center mb-8 px-4">Face not detected for a prolonged period. Emergency SOS protocol initiated.</Text>
                
                <View className="w-40 h-40 bg-white/20 rounded-full justify-center items-center mb-10 border border-white/50">
                    <Text className="text-7xl font-black text-white">{emergencyTimer}</Text>
                </View>
                
                <Text className="text-white/80 font-bold mb-4 uppercase tracking-[0.2em] text-xs">Press button to cancel auto-dispatch</Text>
                
                <TouchableOpacity
                   onPress={() => {
                       setShowEmergencyModal(false);
                       setConsecutiveFaceLossAlerts(0);
                       setConsecutiveCriticalAlerts(0);
                       setMissingFaceFrames(0);
                       setEyesClosedFrames(0);
                       stopBeep();
                   }}
                   className="bg-white px-12 py-5 rounded-full shadow-xl shadow-black/50 active:scale-95"
                >
                    <Text className="text-red-600 font-black text-xl tracking-[0.1em] uppercase">I'M OK</Text>
                </TouchableOpacity>
            </View>
        </Modal>
      )}

      {/* HEADER HUD */}
      <View className="flex-row justify-between items-center px-4 mb-5">
        <View>
            <Text className="text-2xl font-black tracking-widest text-primary uppercase mb-1">Smart Drive</Text>
            <View className="flex-row items-center border border-emerald-100 bg-emerald-50 px-2 py-1 rounded-full self-start">
                <View className="w-1.5 h-1.5 rounded-full bg-[#10B981] mr-1.5 shadow-sm shadow-[#10b981]" />
                <Text className="text-[10px] font-bold text-emerald-700 tracking-wider uppercase">Active Rider</Text>
            </View>
        </View>
        <View className="bg-white px-4 py-2 rounded-2xl border border-slate-200 items-center shadow-sm">
          <Text className="text-[9px] font-bold text-slate-400 tracking-widest uppercase mb-0.5">Vehicle</Text>
          <Text className="font-bold text-slate-700 text-xs">{vehicleNumber || "NOT SET"}</Text>
        </View>
      </View>

      {/* TRIP INFO + CAMERA */}
      <View className="flex-row px-4 mb-4 gap-4">
        {/* Info Panel */}
        <View className="flex-1 bg-white rounded-[28px] p-5 border border-slate-200 justify-center shadow-sm">
            <View className="mb-4">
                <Text className="text-[10px] font-black text-slate-400 tracking-widest uppercase mb-1">Origin</Text>
                <Text className="text-slate-800 text-sm font-medium" numberOfLines={1}>{start || "Unknown"}</Text>
            </View>
            <View>
                <Text className="text-[10px] font-black text-slate-400 tracking-widest uppercase mb-1">Destination</Text>
                <Text className="text-slate-800 text-sm font-medium" numberOfLines={1}>{end || "Unknown"}</Text>
            </View>
        </View>

        {/* Camera PIP */}
        <View className="w-28 h-40 bg-black rounded-[28px] overflow-hidden border border-slate-600 relative shadow-lg shadow-black/80">
          {device != null ? (
            <Camera
              ref={cameraRef}
              style={{ flex: 1 }}
              device={device}
              isActive={true}
              frameProcessor={frameProcessor}
            />
          ) : (
            <View className="flex-1 justify-center items-center"><Text className="text-slate-500 text-xs text-center px-2">No Cam</Text></View>
          )}
          {/* Status Overlay on Cam */}
          <View className="absolute bottom-3 w-full items-center px-1">
              <View className="bg-black/70 px-2 py-1 rounded-full border border-white/20">
                  <Text className={`text-[9px] font-black tracking-wider uppercase ${isSimulating ? 'text-emerald-400' : 'text-slate-300'}`} numberOfLines={1}>
                    {faceStatusText.replace("Status: ", "")}
                  </Text>
              </View>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
      {/* LIVE TELEMETRY */}
      <View className="mx-4 mb-4 flex-row gap-3">
        <View className="flex-1 bg-white rounded-2xl p-3 border border-slate-200 items-center justify-center shadow-sm">
            <Activity size={18} color="#2563EB" className="mb-2" />
            <Text className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Speed</Text>
            <Text className="text-xl font-black text-slate-800 tracking-widest">{currentSpeed.toFixed(0)}<Text className="text-[10px] text-slate-400 font-bold ml-1">km/h</Text></Text>
        </View>
        <View className="flex-1 bg-white rounded-2xl p-3 border border-slate-200 items-center justify-center shadow-sm">
            <Clock size={18} color="#10B981" className="mb-2" />
            <Text className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Time</Text>
            <Text className="text-sm font-black text-slate-800 tracking-widest mt-1">{drivingTimeStr}</Text>
        </View>
        <View className="flex-1 bg-white rounded-2xl p-3 border border-slate-200 items-center justify-center shadow-sm">
            <Smartphone size={18} color="#f97316" className="mb-2" />
            <Text className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Phone</Text>
            <Text className="text-xl font-black text-slate-800 tracking-widest">{phoneUsageCount}</Text>
        </View>
      </View>

      {/* AI SAFETY COACH HUD */}
      <View className={`mx-4 mb-4 p-4 rounded-[24px] border shadow-md ${aiCoachStatus === 'Optimal' ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
         <View className="flex-row items-center">
            <View className={`w-2 h-2 rounded-full mr-3 shadow-md ${aiCoachStatus === 'Optimal' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            <Text className="text-[10px] font-black tracking-widest text-slate-500">AI COACH :</Text>
            <Text className={`ml-2 text-xs font-black tracking-widest uppercase ${aiCoachStatus === 'Optimal' ? 'text-emerald-600' : 'text-amber-600'}`}>{aiCoachStatus}</Text>
         </View>
         {weatherCondition && (
           <Text className="text-[11px] text-slate-500 mt-2 font-medium ml-5">📍 Weather: {weatherCondition.status} • {weatherCondition.temperature}°C</Text>
         )}
      </View>

      {/* PERSONA DISPLAY */}
      <View className="px-4 mb-4 flex-row justify-between items-center">
        <Text className="text-xs font-bold text-slate-500 tracking-wider">
          Persona State:
        </Text>
        <View className={`px-3 py-1.5 rounded-full border ${activePersona === 'Normal' ? 'bg-emerald-50 border-emerald-100' : activePersona === 'Moderate' ? 'bg-orange-50 border-orange-100' : 'bg-red-50 border-red-100'}`}>
            <Text className={`text-[10px] font-black uppercase tracking-widest ${activePersona === 'Normal' ? 'text-emerald-600' : activePersona === 'Moderate' ? 'text-orange-600' : 'text-red-600'}`}>
              {activePersona}
            </Text>
        </View>
      </View>

      {/* MANUAL TEST CONTROLS */}
      {isSimulating && (
        <View className="flex-row justify-between px-4 mb-4 gap-2">
          {["Normal", "Drowsy", "Sleep", "Lost"].map(state => (
            <TouchableOpacity
                key={state}
                onPress={() => setTestState(state)}
                className={`flex-1 py-3 rounded-2xl items-center border ${testState === state ? 'bg-blue-600/20 border-blue-500' : 'bg-slate-800/40 border-slate-700/50'}`}
            >
                <Text className={`text-[10px] font-black tracking-wider uppercase ${testState === state ? 'text-blue-400' : 'text-slate-400'}`}>{state}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            onPress={() => {
              setPhoneUsageCount(prev => prev + 1);
              addAlert('Moderate', '⚠️ Phone usage detected. Please focus on the road.', 'Phone Usage');
              playBeep('Moderate', 'Phone usage detected. Please focus on the road.');
            }}
            className="flex-1 py-3 rounded-2xl items-center border bg-slate-800/40 border-slate-700/50"
          >
            <Text className="text-[10px] font-black tracking-wider uppercase text-slate-400">Phone</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              const mockRain = { status: "Heavy Rain", temperature: 18, isHazardous: true };
              setWeatherCondition(mockRain);
              playBeep('AI_COACH', `⚠️ ${mockRain.status} detected in your route. Reduce speed.`);
              setAiCoachStatus("Weather Hazard");
            }}
            className={`flex-1 py-3 rounded-2xl items-center border ${weatherCondition?.status === "Heavy Rain" ? 'bg-blue-600/20 border-blue-500' : 'bg-slate-800/40 border-slate-700/50'}`}
          >
            <Text className={`text-[10px] font-black tracking-wider uppercase ${weatherCondition?.status === "Heavy Rain" ? 'text-blue-400' : 'text-slate-400'}`}>Rain</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* MAP */}
      <View className="mx-4 h-[220px] rounded-[28px] overflow-hidden border border-slate-200 shadow-lg shadow-slate-200 mb-4 bg-slate-100">
        {location ? (
          <MapView
            ref={mapRef}
            style={{ flex: 1 }}
            showsUserLocation={true}
            showsMyLocationButton={true}
            showsTraffic={true}
            followsUserLocation={true}
            showsCompass={true}
            userInterfaceStyle="light"
            initialRegion={{
              latitude: location.latitude,
              longitude: location.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
          >
            <Marker coordinate={location} title="Driver (You)" />
            {endCoords && <Marker coordinate={endCoords} title="Destination" pinColor="red" />}
            {routeCoordinates.length > 0 && (
              <Polyline
                coordinates={routeCoordinates}
                strokeWidth={5}
                strokeColor="#2563EB"
              />
            )}
          </MapView>
        ) : (
          <View className="flex-1 justify-center items-center"><Text className="text-slate-400 text-xs font-bold tracking-widest uppercase">Initializing Radar...</Text></View>
        )}
      </View>

      {/* ALERT PANEL */}
      <View className="bg-white mx-4 mb-4 rounded-[28px] p-5 border border-slate-200 shadow-sm">
        <View className="flex-row items-center mb-4">
          <ShieldCheck size={18} color="#2563EB" />
          <Text className="ml-2 text-xs font-black text-primary tracking-[0.2em] uppercase">Live Trip Log</Text>
        </View>

        <View>
          {alerts.length === 0 ? (
            <Text className="text-slate-500 text-center mt-6 text-sm font-medium">All tracking metrics nominal.</Text>
          ) : (
            alerts.map((alert) => {
              const style = getAlertStyle(alert.type);
              return (
                <View key={alert.id} style={{ backgroundColor: style.bg, borderColor: style.border }} className="p-3 rounded-2xl mb-3 border flex-row justify-between items-center">
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: style.text }} className="font-black text-[10px] tracking-widest uppercase opacity-80">{alert.type}</Text>
                    <Text className="text-slate-700 text-xs font-medium mt-1 leading-4 mr-2">{alert.message}</Text>
                  </View>
                  <Text className="text-[10px] text-slate-500 font-bold tracking-wider">{alert.time}</Text>
                </View>
              );
            })
          )}
        </View>
      </View>

      {/* STOP BUTTON */}
      <TouchableOpacity
        onPress={async () => {
          stopBeep();
          if (locationSubscriptionRef.current) {
            locationSubscriptionRef.current.remove();
          }
          const driveTimeMs = Date.now() - startTime;
          const tripDistanceKm = tripDistance / 1000;
          const isCancelled = driveTimeMs < 60000 && tripDistanceKm < 0.1;

          const tripData = {
            end_time: new Date().toISOString(),
            status: isCancelled ? 'CANCELLED' : 'COMPLETED',
            distance_km: tripDistanceKm
          };

          if (tripId) {
            await updateTripStatus(tripId, tripData);
          }

          if (isCancelled) {
            Alert.alert("Trip Cancelled", "The trip was very short and has been cancelled.");
            navigation.replace("Home");
            return;
          }

          const feedbackData = {
            date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
            route: `${start || "Unknown"} → ${end || "Unknown"}`,
            vehicle: `${vehicleName || user?.vehicleType || "Car"} (${vehicleNumber || "Unknown"})`,
            alertsCount: alerts.length,
            driveTime: driveTimeMs,
            distance: tripDistance
          };
          navigation.replace("TripFeedback", {
            tripData: feedbackData,
            tripId: tripId,
            routeCoords: routeCoordinates,
            alertsDetails: allTripAlerts
          });
        }}
        className="mx-4 mb-10 mt-2 active:scale-95 transition-transform"
        activeOpacity={0.8}
      >
        <View className="bg-red-600 rounded-[24px] py-4 items-center shadow-xl shadow-red-600/60 border border-red-500 overflow-hidden relative">
            <View className="absolute top-0 w-full h-[50%] bg-white/10" />
            <View className="flex-row items-center z-10 py-1">
                <View className="w-8 h-8 rounded-full bg-white/20 items-center justify-center mr-3 border border-white/30">
                    <Square size={12} color="#ffffff" fill="#ffffff" />
                </View>
                <Text className="text-white text-[15px] font-black tracking-[0.25em] uppercase" style={{ textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 }}>End Trip & Analyze</Text>
            </View>
        </View>
      </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({});
