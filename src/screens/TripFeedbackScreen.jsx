import React, { useState, useContext } from "react";
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Alert, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { Star } from "lucide-react-native";
import { AuthContext } from "../context/AuthContext";

export default function TripFeedbackScreen({ navigation, route }) {
  const { updateTripStatus } = useContext(AuthContext);
  const { tripId, tripData, routeCoords, alertsDetails } = route.params || {};

  const [rating, setRating] = useState(0);
  const [alertHelpful, setAlertHelpful] = useState(null);
  const [feedback, setFeedback] = useState("");

  const submitFeedback = async () => {
    // Save trip if valid data exists
    if (tripId) {
        try {
            await updateTripStatus(tripId, {
                rating,
                alert_helpful: alertHelpful,
                feedback
            });
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to save trip feedback.");
            return;
        }
    }

    Alert.alert(
      "Thank You",
      "Thank you for using Smart Drive. Your feedback helps us improve driver safety.",
      [ { text: "OK", onPress: () => navigation.replace("Home") } ]
    );
  };

  const initialRegion = routeCoords && routeCoords.length > 0 ? {
    latitude: routeCoords[Math.floor(routeCoords.length / 2)].latitude,
    longitude: routeCoords[Math.floor(routeCoords.length / 2)].longitude,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  } : null;

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"} 
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} style={styles.container}>
      <Text style={styles.title}>Trip Analytics Dashboard</Text>
      
      <Text style={styles.message}>
        Your trip has ended safely! Review your driving analytics and event heatmap below.
      </Text>

      {/* HEATMAP / ROUTE RENDER */}
      {initialRegion ? (
        <View style={styles.mapWrapper}>
          <MapView
            style={styles.map}
            initialRegion={initialRegion}
          >
            {/* Draw The Polyline Path */}
            {routeCoords && routeCoords.length > 0 && (
              <Polyline
                coordinates={routeCoords}
                strokeWidth={5}
                strokeColor="#3b82f6" // Blue path
              />
            )}

            {/* Plot the Hazard Heatmap Markers */}
            {alertsDetails && alertsDetails.map((alert, index) => {
                if (!alert.latitude || !alert.longitude) return null;
                
                let markerColor = "orange"; // Moderate defaults
                if (alert.type === 'Critical') markerColor = "red";
                if (alert.type === 'Speeding') markerColor = "yellow";
                
                return (
                    <Marker 
                        key={index.toString()} 
                        coordinate={{ latitude: alert.latitude, longitude: alert.longitude }} 
                        pinColor={markerColor}
                        title={alert.type + " Event"}
                        description={alert.message}
                    />
                );
            })}
          </MapView>
        </View>
      ) : (
         <View style={styles.noMapBox}><Text style={{color: 'gray'}}>No Route Data Available for Heatmap</Text></View>
      )}

      {/* RATING */}
      <Text style={styles.label}>Rate Your Trip</Text>
      <View style={styles.starRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity key={star} onPress={() => setRating(star)}>
            <Star
              size={35}
              color={star <= rating ? "#facc15" : "#d1d5db"}
              fill={star <= rating ? "#facc15" : "none"}
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* ALERT SYSTEM */}
      <Text style={styles.label}>Was the alert interface helpful?</Text>
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.optionButton, alertHelpful === true && styles.selected]}
          onPress={() => setAlertHelpful(true)}
        >
          <Text style={[styles.optionText, alertHelpful === true && {color: 'white'}]}>Yes</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.optionButton, alertHelpful === false && styles.selected]}
          onPress={() => setAlertHelpful(false)}
        >
          <Text style={[styles.optionText, alertHelpful === false && {color: 'white'}]}>No</Text>
        </TouchableOpacity>
      </View>

      {/* DRIVER FEEDBACK */}
      <Text style={styles.label}>Log detailed notes regarding hazards:</Text>
      <TextInput
        style={styles.input}
        placeholder="Did you feel unsafe during a specific stretch? Share feedback..."
        value={feedback}
        onChangeText={setFeedback}
        multiline
      />

      {/* SUBMIT BUTTON */}
      <TouchableOpacity style={styles.submitButton} onPress={submitFeedback}>
        <Text style={styles.submitText}>Submit Report Data</Text>
      </TouchableOpacity>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  scrollContainer: { padding: 24, paddingVertical: 50 },
  title: { fontSize: 26, fontWeight: "800", color: "#1e293b", marginBottom: 8, textAlign: "center" },
  message: { fontSize: 14, color: "#64748b", textAlign: "center", marginBottom: 25, paddingHorizontal: 10, lineHeight: 20 },
  mapWrapper: { height: 280, borderRadius: 20, overflow: "hidden", marginBottom: 35, borderWidth: 1, borderColor: '#e2e8f0', elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  map: { flex: 1 },
  noMapBox: { height: 150, backgroundColor: '#e2e8f0', borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 35 },
  label: { fontSize: 17, fontWeight: "700", color: "#334155", marginBottom: 12 },
  starRow: { flexDirection: "row", justifyContent: "center", marginBottom: 35, gap: 10 },
  buttonRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 35 },
  optionButton: { backgroundColor: "#e2e8f0", paddingVertical: 14, borderRadius: 12, width: "48%", alignItems: "center" },
  selected: { backgroundColor: "#2563eb", shadowColor: "#2563eb", shadowOpacity: 0.4, shadowRadius: 8, elevation: 5 },
  optionText: { fontWeight: "700", color: "#475569", fontSize: 16 },
  input: { backgroundColor: "white", borderRadius: 12, padding: 16, height: 120, textAlignVertical: "top", marginBottom: 35, borderWidth: 1, borderColor: "#e2e8f0", fontSize: 15 },
  submitButton: { backgroundColor: "#10b981", paddingVertical: 16, borderRadius: 12, alignItems: "center", shadowColor: "#10b981", shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  submitText: { color: "white", fontSize: 18, fontWeight: "bold" }
}); 