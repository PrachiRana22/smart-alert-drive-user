import React, { useEffect, useState, useRef } from "react";
import { View, Text, TouchableOpacity, Alert, StyleSheet, ScrollView, Vibration } from "react-native";
import { Camera, useCameraDevice, useCameraPermission, useFrameProcessor, runAsync } from 'react-native-vision-camera';
import { useFaceDetector } from 'react-native-vision-camera-face-detector';
import { Worklets } from 'react-native-worklets-core';
import MapView, { Marker, Polyline } from "react-native-maps";
import polyline from '@mapbox/polyline';
import * as Location from "expo-location";
import { Audio } from "expo-av";
import { AlertTriangle, ShieldCheck, Square } from "lucide-react-native";
import { AuthContext } from "../context/AuthContext";

export default function DriverMonitorScreen({ navigation, route }) {
  const { user } = React.useContext(AuthContext);

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

  const { start, end, vehicleName, vehicleNumber, routeCoords, destinationCoords } = route.params || {};

  const [routeCoordinates, setRouteCoordinates] = useState(routeCoords || []);
  const [endCoords, setEndCoords] = useState(destinationCoords || null);

  // Distance and Time Tracking
  const [startTime] = useState(Date.now());
  const [tripDistance, setTripDistance] = useState(0); // in meters

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
    return sound ? () => sound.unloadAsync() : undefined;
  }, [sound]);

  const playBeep = async (type) => {
    try {
      if (sound) {
        await sound.unloadAsync();
      }
      const { sound: newSound } = await Audio.Sound.createAsync(
        require('../../assets/alarm.mp3')
      );
      setSound(newSound);

      if (type === 'Critical') {
        Vibration.vibrate([0, 500, 200, 500], true);
        await newSound.setIsLoopingAsync(true);
      } else {
        Vibration.vibrate(500);
      }
      
      await newSound.playAsync();
    } catch (error) {
       console.log("Could not play sound", error);
    }
  };

  const stopBeep = async () => {
    Vibration.cancel();
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
      setSound(null);
    }
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

  const addAlert = (type, message) => {
    setActivePersona(type); // Dynamically change the persona displaying on screen to the alert type
    
    const newAlert = {
      id: Date.now().toString(),
      type, // 'Normal', 'Moderate', 'Critical'
      message,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setAlerts(prev => [newAlert, ...prev].slice(0, 5));

    if (type === 'Critical') {
      Alert.alert(
        "CRITICAL ALERT",
        message,
        [{ text: "I'm Awake", onPress: () => {
          setEyesClosedFrames(0);
          stopBeep();
        }}]
      );
    }
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
      default: return { bg: '#f3f4f6', text: '#4b5563', border: '#d1d5db' };
    }
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.title}>Smart Drive</Text>
        <View>
          <Text style={styles.boldText}>Vehicle : {vehicleName || "Car"}</Text>
          <Text style={styles.grayText}>Number : {vehicleNumber || "GJ-00-0000"}</Text>
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
        <Text style={{ fontSize: 12, color: 'gray', fontStyle: 'italic'}}>Current State: {testState}</Text>
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
         onPress={() => {
             const driveTimeMs = Date.now() - startTime;
             const tripData = {
                 date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
                 route: `${start || "Unknown"} → ${end || "Unknown"}`,
                 vehicle: `${vehicleName || user?.vehicleType || "Car"} (${vehicleNumber || user?.vehicleNumber || "Unknown"})`,
                 alertsCount: alerts.length,
                 driveTime: driveTimeMs,
                 distance: tripDistance
             };
             navigation.replace("TripFeedback", { tripData });
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
  testButtonTextActive: { color: 'white' }
});
