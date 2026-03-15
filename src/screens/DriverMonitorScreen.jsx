import React, { useEffect, useState, useRef } from "react";
import { View, Text, TouchableOpacity, Alert, StyleSheet, ScrollView } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import MapView, { Marker, Polyline } from "react-native-maps";
import polyline from '@mapbox/polyline';
import * as Location from "expo-location";
import { Audio } from "expo-av";
// expo-face-detector cannot be used in Expo Go as it lacks the native module in recent SDKs.
// To use real face detection, you need a custom Development Build (npx expo run:android).
// import * as FaceDetector from 'expo-face-detector';
import { AlertTriangle, ShieldCheck, Square } from "lucide-react-native";

export default function DriverMonitorScreen({ navigation, route }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [location, setLocation] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [isSimulating, setIsSimulating] = useState(true); // Active by default
  const [testState, setTestState] = useState("Normal"); // Normal, Drowsy, Sleep
  const testStateRef = useRef(testState);

  useEffect(() => {
    testStateRef.current = testState;
  }, [testState]);

  const [eyesClosedFrames, setEyesClosedFrames] = useState(0); 
  const [faceStatusText, setFaceStatusText] = useState("Status: Monitoring");
  
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

  useEffect(() => {
    startLiveLocation();
    if ((!routeCoords || routeCoords.length === 0) && start && end) {
      fetchRouteData();
    }
  }, []);

  // Manual frame capture interval since onFacesDetected is deprecated in SDK 51+
  useEffect(() => {
    let isActive = isSimulating;
    
    const processFrame = async () => {
      if (!isActive) return;
      if (cameraRef.current && !isProcessingRef.current) {
        isProcessingRef.current = true;
        try {
          // -- SIMULATION FOR TESTING IN EXPO GO --
          let emulateEyesClosed = false;

          // Rather than Math.random() or time, we use the manual button state!
          if (testStateRef.current === "Normal") {
            emulateEyesClosed = false;
          } else if (testStateRef.current === "Drowsy") {
            // Rapid blinking emulation
            emulateEyesClosed = (Date.now() % 400) > 200; 
          } else if (testStateRef.current === "Sleep") {
            // Completely closed tracking
            emulateEyesClosed = true;
          }

          const mockResult = {
            faces: [{
              leftEyeOpenProbability: emulateEyesClosed ? 0.1 : 0.9,
              rightEyeOpenProbability: emulateEyesClosed ? 0.1 : 0.9,
            }]
          };
          handleFacesDetected(mockResult);
        } catch (e) {
           // Silently fail if camera busy
        } finally {
          isProcessingRef.current = false;
        }
      }
      
      if (isActive) setTimeout(processFrame, 800); // Check approx every ~800ms
    };

    if (isActive) {
      processFrame();
    } else {
      setEyesClosedFrames(0);
      setFaceStatusText("Detection Paused");
      setBlinkTimestamps([]);
    }

    return () => { isActive = false; };
  }, [isSimulating]);

  // Monitor prolonged eye closure based on slow frames (1 frame = 800ms)
  useEffect(() => {
    if (!isSimulating) return;

    if (eyesClosedFrames === 0) {
      if (!wasEyesClosedLastFrame) {
        setFaceStatusText("Eyes Open - Safe");
      }
    } else if (eyesClosedFrames >= 37) { // 37 frames * 800ms = ~30 seconds -> CRITICAL
      addAlert('Critical', 'CRITICAL: Driver asleep! Wake up immediately!');
      setFaceStatusText("CRITICAL - ASLEEP!");
      playBeep();
      // reset to prevent spamming until they press "I'm Awake" or open their eyes
      setEyesClosedFrames(0);
    }
  }, [eyesClosedFrames, isSimulating]);

  // Cleanup Sound
  useEffect(() => {
    return sound ? () => sound.unloadAsync() : undefined;
  }, [sound]);

  const playBeep = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/beep.mp3') // We will need a generic beep or fallback
      );
      setSound(sound);
      await sound.playAsync();
    } catch (error) {
       console.log("Could not play sound", error);
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
        }
      }
    } catch (error) {
       console.log("Route fetch error:", error);
    }
  };

  const addAlert = (type, message) => {
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
        }}]
      );
    }
  };

  const handleFacesDetected = ({ faces }) => {
    if (!isSimulating || faces.length === 0) return;

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

            if (blinkCount >= 4) { // Increased to 4 blinks in 7s to avoid false positives
              addAlert('Moderate', 'Warning: Continuous rapid blinking (Drowsy)!');
              setFaceStatusText("Warning - Frequent Blinks");
              playBeep();
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

  if (!permission) return <View />;

  if (!permission.granted) {
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
          <CameraView 
            ref={cameraRef}
            facing="front" 
            style={{ flex: 1 }} 
          />
        </View>
      </View>
      
      <View style={{ marginBottom: 10, paddingHorizontal: 4, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontWeight: 'bold', color: isSimulating ? '#16a34a' : 'gray', fontSize: 12 }}>
          {faceStatusText}
        </Text>
        <Text style={{ fontSize: 12, color: 'gray', fontStyle: 'italic'}}>Current State: {testState}</Text>
      </View>

      {/* MANUAL TEST CONTROLS */}
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
      <TouchableOpacity onPress={() => navigation.navigate("Home")} style={styles.stopButton}>
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
