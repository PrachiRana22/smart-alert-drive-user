import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../context/AuthContext";

export default function VehicleDetailsScreen({ navigation }) {
  const { user, updateUser, licenseData, saveVehicle } = useContext(AuthContext);

  const [mobile, setMobile] = useState("");
  const [emergency, setEmergency] = useState("");

  // Vehicles state with brand, model, year, and license plate
  const [vehicles, setVehicles] = useState([
    { vehicleType: "Car", make: "", model: "", year: "2024", vPrefix: "GJ", vRest: "" }
  ]);

  const [showSecond, setShowSecond] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleVehicleChange = (index, field, value) => {
    const updated = [...vehicles];
    updated[index][field] = value;
    setVehicles(updated);
  };

  const addVehicle = () => {
    setVehicles([...vehicles, { vehicleType: "Car", make: "", model: "", year: "2024", vPrefix: "GJ", vRest: "" }]);
    setShowSecond(true);
  };

  // ... (validateData function stays the same)
  const validateData = () => {
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(mobile)) {
      Alert.alert("Invalid Mobile", "Please enter a valid 10-digit mobile number.");
      return false;
    }
    if (!phoneRegex.test(emergency)) {
      Alert.alert("Invalid Emergency Contact", "Please enter a 10-digit emergency number.");
      return false;
    }
    for (const v of vehicles) {
      if (!v.make || !v.model || !v.year || !v.vRest) {
        Alert.alert("Missing Info", "Please fill all details (Make, Model, Year, Number) for your vehicle.");
        return false;
      }
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateData()) return;
    setIsSaving(true);

    try {
      // 1. UPDATE USER PROFILE (Mobile, Emergency)
      await updateUser({
        mobile_number: "+91" + mobile,
        emergency_contact: "+91" + emergency
      });

      // 2. SAVE VEHICLES (Mapping to Backend: make, model, year, license_plate)
      for (const v of vehicles) {
        if (v.vRest) {
          const payload = {
            make: v.make,
            model: v.model,
            year: parseInt(v.year),
            license_plate: (v.vPrefix + v.vRest).toUpperCase()
          };
          console.log("Saving Vehicle Payload:", payload);
          await saveVehicle(payload);
        }
      }

      navigation.replace("Home");
    } catch (error) {
      console.error("Save Error Response:", error.response?.data);
      let errorMsg = "Failed to save details.";
      
      if (error.response?.data) {
        const data = error.response.data;
        if (typeof data === 'object') {
          errorMsg = Object.entries(data)
            .map(([key, val]) => `${key}: ${val}`)
            .join("\n");
        } else {
          errorMsg = data.toString();
        }
      }
      
      Alert.alert("Registration Error", errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"} 
      style={{ flex: 1 }}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.replace("LicenseDetails")}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Vehicle Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <Text style={styles.sectionLabel}>Personal Information</Text>
      
      {/* Name & License (Disabled) */}
      <View style={styles.row}>
        <View style={{ flex: 1, marginRight: 10 }}>
          <Text style={styles.label}>User Name</Text>
          <TextInput value={licenseData?.name || ""} editable={false} style={[styles.input, styles.disabledInput]} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>License No.</Text>
          <TextInput value={licenseData?.licenseNumber || ""} editable={false} style={[styles.input, styles.disabledInput]} />
        </View>
      </View>

      {/* Mobile Number Split */}
      <Text style={styles.label}>Mobile Number</Text>
      <View style={styles.phoneRow}>
        <View style={styles.prefixBox}><Text style={styles.prefixText}>+91</Text></View>
        <TextInput
          placeholder="10-digit number"
          value={mobile}
          onChangeText={setMobile}
          keyboardType="numeric"
          maxLength={10}
          style={[styles.input, { flex: 1, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }]}
        />
      </View>

      {/* Emergency Contact Split */}
      <Text style={styles.label}>Emergency Contact</Text>
      <View style={styles.phoneRow}>
        <View style={styles.prefixBox}><Text style={styles.prefixText}>+91</Text></View>
        <TextInput
          placeholder="Family/Friend number"
          value={emergency}
          onChangeText={setEmergency}
          keyboardType="numeric"
          maxLength={10}
          style={[styles.input, { flex: 1, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }]}
        />
      </View>

      <Text style={styles.sectionLabel}>Vehicle Information</Text>

      {/* VEHICLES RENDERING */}
      {vehicles.map((v, index) => (
        <View key={index} style={styles.vehicleCard}>
          <Text style={styles.vehicleTitle}>Vehicle {index + 1}</Text>
          
          <View style={styles.typeRow}>
            {["2 Wheeler", "Car", "Bus", "Truck"].map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.typeBtn, v.vehicleType === type && styles.typeActive]}
                onPress={() => handleVehicleChange(index, "vehicleType", type)}
              >
                <Text style={{ color: v.vehicleType === type ? "#fff" : "#000", fontSize: 12 }}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* New Fields: Make & Model */}
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={styles.label}>Brand/Make</Text>
              <TextInput
                placeholder="e.g. Toyota"
                value={v.make}
                onChangeText={(text) => handleVehicleChange(index, "make", text)}
                style={styles.input}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Model Name</Text>
              <TextInput
                placeholder="e.g. Fortuner"
                value={v.model}
                onChangeText={(text) => handleVehicleChange(index, "model", text)}
                style={styles.input}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={styles.label}>Manufacture Year</Text>
              <TextInput
                placeholder="Year"
                value={v.year}
                onChangeText={(text) => handleVehicleChange(index, "year", text)}
                keyboardType="numeric"
                maxLength={4}
                style={styles.input}
              />
            </View>
            <View style={{ flex: 1.5 }}>
              <Text style={styles.label}>Vehicle Number</Text>
              <View style={styles.phoneRow}>
                <TextInput
                  value={v.vPrefix}
                  onChangeText={(text) => handleVehicleChange(index, "vPrefix", text)}
                  maxLength={4}
                  autoCapitalize="characters"
                  style={[styles.input, { width: 60, textAlign: 'center', fontWeight: 'bold' }]}
                />
                <TextInput
                  placeholder="AB12"
                  value={v.vRest}
                  onChangeText={(text) => handleVehicleChange(index, "vRest", text)}
                  maxLength={7}
                  autoCapitalize="characters"
                  style={[styles.input, { flex: 1, marginLeft: 5 }]}
                />
              </View>
            </View>
          </View>
          <Text style={styles.hint}>Example: GJ01 AB1234</Text>
        </View>
      ))}

      {!showSecond && (
        <TouchableOpacity onPress={addVehicle} style={styles.addBtnContainer}>
          <Ionicons name="add-circle-outline" size={20} color="#2563eb" />
          <Text style={styles.addBtnText}>Add Another Vehicle</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity 
        style={[styles.button, isSaving && { opacity: 0.7 }]} 
        onPress={handleSave}
        disabled={isSaving}
      >
        {isSaving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Finish Setup</Text>
        )}
      </TouchableOpacity>

      <View style={{ height: 100 }} />
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  contentContainer: { padding: 20, paddingTop: 50 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 25 },
  title: { fontSize: 22, fontWeight: "bold", color: "#1e293b" },
  sectionLabel: { fontSize: 16, fontWeight: "bold", color: "#2563eb", marginTop: 20, marginBottom: 10 },
  label: { fontSize: 13, color: "#64748b", marginBottom: 5, fontWeight: "600" },
  row: { flexDirection: "row", marginBottom: 15 },
  input: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 10, padding: 12, fontSize: 15, color: "#334155" },
  disabledInput: { backgroundColor: "#f1f5f9", color: "#94a3b8" },
  phoneRow: { flexDirection: "row", alignItems: "center", marginBottom: 15 },
  prefixBox: { backgroundColor: "#e2e8f0", padding: 13, borderTopLeftRadius: 10, borderBottomLeftRadius: 10, borderWidth: 1, borderColor: "#cbd5e1", borderRightWidth: 0 },
  prefixText: { fontWeight: "bold", color: "#475569" },
  vehicleCard: { backgroundColor: "#fff", padding: 15, borderRadius: 15, marginBottom: 15, elevation: 2, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 5 },
  vehicleTitle: { fontSize: 15, fontWeight: "bold", color: "#334155", marginBottom: 10 },
  typeRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: 15 },
  typeBtn: { borderWidth: 1, borderColor: "#e2e8f0", paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, marginRight: 8, marginBottom: 8 },
  typeActive: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  hint: { fontSize: 11, color: "#94a3b8", marginTop: 4, fontStyle: "italic" },
  addBtnContainer: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 10 },
  addBtnText: { color: "#2563eb", fontWeight: "bold", marginLeft: 5 },
  button: { backgroundColor: "#2563eb", padding: 16, borderRadius: 12, alignItems: "center", marginTop: 20, shadowColor: "#2563eb", shadowOpacity: 0.3, shadowRadius: 10 },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 17 }
});
