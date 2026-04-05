import React, { useEffect, useState, useRef } from "react";
import { View, Text, TouchableOpacity, Alert, StyleSheet, ScrollView, Vibration } from "react-native";
import { Camera, useCameraDevice, useCameraPermission, useFrameProcessor, runAsync } from 'react-native-vision-camera';
import { useFaceDetector } from 'react-native-vision-camera-face-detector';
import { Worklets } from 'react-native-worklets-core';
import MapView, { Marker, Polyline } from "react-native-maps";
import polyline from '@mapbox/polyline';
import * as Location from "expo-location";
import { Audio } from "expo-av";
import * as Speech from "expo-speech";
import { AlertTriangle, ShieldCheck, Square } from "lucide-react-native";
import { AuthContext } from "../context/AuthContext";

export default function DriverMonitorScreen({ navigation, route }) {
  const { user, reportAlert, updateTripStatus, resolveAlert } = React.useContext(AuthContext);

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
  const durationAlertedCountRef = useRef(0);
  const [aiCoachStatus, setAiCoachStatus] = useState("Optimal");
  const [weatherCondition, setWeatherCondition] = useState(null);
  const weatherAlertCooldownRef = useRef(0);

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
    if (!isSim && faces && faces.length > 0) {
      const mapped = {
        faces: faces.map(f => ({
          leftEyeOpenProbability: f.leftEyeOpenProbability,
          rightEyeOpenProbability: f.rightEyeOpenProbability
        }))
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
        if (faces.length > 0) {
          handleFacesDetectedJS(faces, isSimulating);
        }
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
      const mockResult = {
        faces: [{
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
      addAlert('Critical', 'CRITICAL: Driver asleep! Wake up immediately!');
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
        // WMO Codes: 51-67 (Rain), 71-77 (Snow), 80-86 (Showers), 95-99 (Thunderstorm)
        if (code >= 51 && code <= 99) {
          return "Hazardous (Rain/Snow/Storm)";
        }
      }
      return "Clear";
    } catch (error) {
      console.log("Weather error:", error);
      return "Unknown";
    }
  };

  const addAlert = (type, message, specificAlertType = null) => {
    // Track incident for AI Frequency analysis
    incidentHistoryRef.current.push(Date.now());

    // Speeding is styled as 'Speeding', but should just reflect 'Moderate' visually on the primary Persona layout
    setActivePersona(type === 'Speeding' ? 'Moderate' : type);

    const newAlert = {
      id: Date.now().toString(),
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
        Alert.alert(
          "CRITICAL ALERT",
          message,
          [{
            text: "I'm Awake", onPress: () => {
              setEyesClosedFrames(0);
              stopBeep();
              if (backendId) resolveAlert(backendId);
            }
          }]
        );
      }
    };
    reportAndAlert();
  };

  const handleFacesDetected = ({ faces }) => {
    if (faces.length === 0) {
      // No face detected, assume eyes closed or log missing face
      return;
    }

    const face = faces[0];
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
              addAlert('Moderate', 'Warning: Continuous rapid blinking (Drowsy)!');
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

          // 1. Duration Check (every 30 mins)
          const driveMins = Math.floor((now - startTime) / 60000);
          const alertSlot = Math.floor(driveMins / 30);
          if (alertSlot > durationAlertedCountRef.current) {
            durationAlertedCountRef.current = alertSlot;
            playBeep('AI_COACH', `Ronit, you have been driving for ${driveMins} minutes. Consider taking a short break to stay sharp.`);
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
            fetchRealWeather(loc.coords.latitude, loc.coords.longitude).then(cond => {
              setWeatherCondition(cond);
              if (cond.includes("Hazardous") || weatherCondition === "MOCKED_RAIN") {
                playBeep('AI_COACH', `Adverse weather detected in your route. Please reduce your typical cruising speed and maintain a safe following distance.`);
                setAiCoachStatus("Weather Hazard");
                weatherAlertCooldownRef.current = now;
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
      <View style={styles.center}>
        <Text style={styles.permissionText}>Camera permission required for safety monitoring</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const getAlertStyle = (type) => {
    switch (type) {
      case 'Critical': return { bg: '#fee2e2', text: '#dc2626', border: '#fca5a5' };
      case 'Moderate': return { bg: '#ffedd5', text: '#ea580c', border: '#fdba74' };
      case 'Speeding': return { bg: '#fef3c7', text: '#d97706', border: '#fde68a' }; // Amber
      default: return { bg: '#f3f4f6', text: '#4b5563', border: '#d1d5db' };
    }
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.title}>Smart Drive</Text>
        <View>
          <Text style={styles.boldText}>Vehicle : {vehicleName || user?.vehicleType || "Car"}</Text>
          <Text style={styles.grayText}>Number : {vehicleNumber || "Not Set"}</Text>
        </View>
      </View>

      {/* TRIP INFO + CAMERA */}
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.infoText}>Start : {start || "Unknown"}</Text>
          <Text style={styles.infoText}>Destination : {end || "Unknown"}</Text>
          <Text>Status : <Text style={styles.drivingStatus}>Driving</Text></Text>
        </View>

        <View style={styles.cameraWrapper}>
          {device != null ? (
            <Camera
              ref={cameraRef}
              style={{ flex: 1 }}
              device={device}
              isActive={true}
              frameProcessor={frameProcessor}
            />
          ) : (
            <View style={styles.center}><Text style={{ color: 'white' }}>No Camera</Text></View>
          )}
        </View>
      </View>

      <View style={{ marginBottom: 10, paddingHorizontal: 4, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontWeight: 'bold', color: isSimulating ? '#16a34a' : 'gray', fontSize: 12 }}>
          {faceStatusText}
        </Text>
        <Text style={{ fontSize: 12, color: 'gray', fontStyle: 'italic' }}>Current State: {testState}</Text>
      </View>

      {/* AI SAFETY COACH HUD */}
      <View style={[styles.aiCoachCard, { borderColor: aiCoachStatus === 'Optimal' ? '#10b981' : '#f59e0b' }]}>
         <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={[styles.statusDot, { backgroundColor: aiCoachStatus === 'Optimal' ? '#10b981' : '#f59e0b' }]} />
            <Text style={styles.aiCoachLabel}>AI SAFETY COACH : </Text>
            <Text style={[styles.aiCoachStatusText, { color: aiCoachStatus === 'Optimal' ? '#059669' : '#d97706' }]}>{aiCoachStatus.toUpperCase()}</Text>
         </View>
         {weatherCondition && (
           <Text style={styles.weatherText}>📍 Weather: {weatherCondition}</Text>
         )}
      </View>

      {/* PERSONA DISPLAY */}
      <View style={{ paddingHorizontal: 16, marginBottom: 10 }}>
        <Text style={{ fontSize: 13, color: '#4b5563', fontWeight: 'bold' }}>
          Active Persona (State): <Text style={{ color: activePersona === 'Normal' ? '#16a34a' : activePersona === 'Moderate' ? '#ea580c' : '#dc2626', fontSize: 16 }}>{activePersona}</Text>
        </Text>
      </View>

      {/* MANUAL TEST CONTROLS (Hidden when testing real face detection) */}
      {isSimulating && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 }}>
          <TouchableOpacity
            onPress={() => setTestState("Normal")}
            style={[styles.testButton, testState === "Normal" && styles.testButtonActive]}
          >
            <Text style={[styles.testButtonText, testState === "Normal" && styles.testButtonTextActive]}>Normal</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setTestState("Drowsy")}
            style={[styles.testButton, testState === "Drowsy" && styles.testButtonActive]}
          >
            <Text style={[styles.testButtonText, testState === "Drowsy" && styles.testButtonTextActive]}>Drowsy</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setTestState("Sleep")}
            style={[styles.testButton, testState === "Sleep" && styles.testButtonActive]}
          >
            <Text style={[styles.testButtonText, testState === "Sleep" && styles.testButtonTextActive]}>Asleep</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setWeatherCondition("MOCKED_RAIN");
              playBeep('AI_COACH', `Simulating Rain Hazard. AI Safety Coach evaluating route conditions.`);
            }}
            style={[styles.testButton, weatherCondition === "MOCKED_RAIN" && styles.testButtonActive]}
          >
            <Text style={[styles.testButtonText, weatherCondition === "MOCKED_RAIN" && styles.testButtonTextActive]}>Simulate Rain</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* MAP */}
      <View style={styles.mapWrapper}>
        {location ? (
          <MapView
            ref={mapRef}
            style={{ flex: 1 }}
            showsUserLocation={true}
            showsMyLocationButton={true}
            showsTraffic={true}
            followsUserLocation={true}
            showsCompass={true}
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
                strokeWidth={4}
                strokeColor="#2563eb"
              />
            )}
          </MapView>
        ) : (
          <View style={styles.center}><Text>Loading Live Map...</Text></View>
        )}
      </View>

      {/* ALERT PANEL */}
      <View style={styles.alertPanel}>
        <View style={styles.alertHeader}>
          <AlertTriangle size={20} color="#dc2626" />
          <Text style={styles.alertTitle}>Alerts During Trip</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {alerts.length === 0 ? (
            <Text style={styles.emptyAlerts}>No alerts yet. Stay safe!</Text>
          ) : (
            alerts.map((alert) => {
              const style = getAlertStyle(alert.type);
              return (
                <View key={alert.id} style={[styles.alertCard, { backgroundColor: style.bg, borderColor: style.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.alertTypeText, { color: style.text }]}>{alert.type.toUpperCase()}</Text>
                    <Text style={styles.alertMessageText}>{alert.message}</Text>
                  </View>
                  <Text style={styles.alertTimeText}>{alert.time}</Text>
                </View>
              );
            })
          )}
        </ScrollView>
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
        style={styles.stopButton}
      >
        <Text style={styles.stopButtonText}>Stop Trip</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3f4f6", paddingTop: 60, paddingHorizontal: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  title: { fontSize: 24, fontWeight: "bold", color: "#2563eb" },
  boldText: { fontWeight: "bold", fontSize: 16 },
  grayText: { color: "gray" },
  row: { flexDirection: "row", marginBottom: 16 },
  infoText: { marginBottom: 4, fontStyle: 'italic' },
  drivingStatus: { color: '#16a34a', fontWeight: 'bold' },
  cameraWrapper: { height: 130, width: 100, backgroundColor: "black", borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: '#d1d5db' },
  mapWrapper: { height: 200, borderRadius: 20, overflow: "hidden", marginBottom: 16, borderWidth: 1, borderColor: '#d1d5db' },
  alertPanel: { backgroundColor: "white", padding: 16, borderRadius: 12, marginBottom: 16, flex: 1 },
  alertHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  alertTitle: { marginLeft: 8, fontWeight: "bold", color: "#dc2626", fontSize: 16 },
  emptyAlerts: { color: 'gray', textAlign: 'center', marginTop: 20 },
  alertCard: { padding: 12, borderRadius: 10, marginBottom: 10, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  alertTypeText: { fontWeight: 'bold', fontSize: 12 },
  alertMessageText: { color: '#374151', fontSize: 14, marginTop: 2 },
  alertTimeText: { fontSize: 10, color: 'gray', marginLeft: 8 },
  stopButton: { backgroundColor: "#dc2626", padding: 16, borderRadius: 12, alignItems: "center", marginBottom: 30 },
  stopButtonText: { color: "white", fontSize: 18, fontWeight: "bold" },
  simButton: { flexDirection: 'row', alignItems: 'center', padding: 8, borderRadius: 8, marginTop: 12, alignSelf: 'flex-start' },
  simButtonText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  permissionText: { marginBottom: 20, color: 'gray', textAlign: 'center' },
  permissionButton: { backgroundColor: '#2563eb', padding: 12, borderRadius: 8 },
  permissionButtonText: { color: 'white', fontWeight: 'bold' },
  testButton: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, backgroundColor: '#e5e7eb', borderWidth: 1, borderColor: '#d1d5db' },
  testButtonActive: { backgroundColor: '#2563eb', borderColor: '#1d4ed8' },
  testButtonText: { fontSize: 12, color: '#4b5563', fontWeight: 'bold' },
  testButtonTextActive: { color: 'white' },
  aiCoachCard: { 
    backgroundColor: 'white', 
    marginHorizontal: 16, 
    marginBottom: 12, 
    padding: 12, 
    borderRadius: 12, 
    borderWidth: 1, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  aiCoachLabel: { fontSize: 11, fontWeight: '900', color: '#64748b', letterSpacing: 0.5 },
  aiCoachStatusText: { fontSize: 13, fontWeight: 'bold' },
  weatherText: { fontSize: 11, color: '#64748b', marginTop: 4, fontStyle: 'italic' }
});
