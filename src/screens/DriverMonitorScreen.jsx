import React, { useEffect, useState, useRef } from "react";
import { View, Text, TouchableOpacity, Alert, StyleSheet, ScrollView } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { AlertTriangle, Play, Square } from "lucide-react-native";

export default function DriverMonitorScreen({ navigation, route }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [location, setLocation] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const simulationIntervalRef = useRef(null);

  const { start, end, vehicleName, vehicleNumber } = route.params || {};

  useEffect(() => {
    startLiveLocation();
  }, []);

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
        [{ text: "I'm Awake", onPress: () => stopSimulation() }]
      );
    }
  };

  const startSimulation = () => {
    setIsSimulating(true);
    setAlerts([]);
    let step = 0;

    simulationIntervalRef.current = setInterval(() => {
      step++;
      if (step === 2) {
        addAlert('Normal', 'Attention: Eyes blinking frequently.');
      } else if (step === 5) {
        addAlert('Moderate', 'Warning: High drowsiness level detected!');
      } else if (step === 8) {
        addAlert('Critical', 'CRITICAL: Driver eyes closed! STOP IMMEDIATELY!');
        clearInterval(simulationIntervalRef.current);
      }
    }, 2000);
  };

  const stopSimulation = () => {
    setIsSimulating(false);
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
    }
  };

  const startLiveLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return;

    Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, timeInterval: 2000, distanceInterval: 1 },
      (loc) => setLocation(loc.coords)
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

          <TouchableOpacity
            onPress={isSimulating ? stopSimulation : startSimulation}
            style={[styles.simButton, { backgroundColor: isSimulating ? '#dc2626' : '#2563eb' }]}
          >
            {isSimulating ? <Square size={16} color="white" /> : <Play size={16} color="white" />}
            <Text style={styles.simButtonText}>
              {isSimulating ? " Stop Simulation" : " Start Demo Detection"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.cameraWrapper}>
          <CameraView facing="front" style={{ flex: 1 }} />
        </View>
      </View>

      {/* MAP */}
      <View style={styles.mapWrapper}>
        {location ? (
          <MapView
            style={{ flex: 1 }}
            showsUserLocation={true}
            initialRegion={{
              latitude: location.latitude,
              longitude: location.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
          >
            <Marker coordinate={location} title="Driver" />
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
  permissionButtonText: { color: 'white', fontWeight: 'bold' }
});
