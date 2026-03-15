import React, { useState, useContext } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, StyleSheet } from "react-native";
import { AuthContext } from "../context/AuthContext";

export default function VehicleDetailsScreen({ navigation }) {

  const { user, setUser } = useContext(AuthContext);

  const [mobile, setMobile] = useState("");
  const [emergency, setEmergency] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");

  const generateVehicleId = () => {
    return "VID" + Math.floor(1000 + Math.random() * 9000);
  };

  const handleSave = () => {

    if (!mobile || !vehicleType || !vehicleNumber) {
      alert("Please fill required fields");
      return;
    }

    const updatedUser = {
      ...user,
      mobile,
      emergency,
      vehicleType,
      vehicleNumber,
      licenseNumber
    };

    setUser(updatedUser);

    navigation.replace("Home");
  };


  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Vehicle Details</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>User Name</Text>
        <TextInput
          value={user?.name}
          editable={false}
          style={[styles.input, styles.disabledInput]}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Mobile Number</Text>
        <TextInput
          value={mobile}
          onChangeText={setMobile}
          keyboardType="phone-pad"
          style={styles.input}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Emergency Contact</Text>
        <TextInput
          value={emergency}
          onChangeText={setEmergency}
          keyboardType="phone-pad"
          style={styles.input}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Vehicle Type</Text>
        <TextInput
          placeholder="2 Wheeler / Car / Bus / Truck"
          placeholderTextColor="#999"
          value={vehicleType}
          onChangeText={setVehicleType}
          style={styles.input}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Vehicle Number</Text>
        <TextInput
          placeholder="GJ01AB1234"
          placeholderTextColor="#999"
          value={vehicleNumber}
          onChangeText={setVehicleNumber}
          style={styles.input}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>License Number (Optional)</Text>
        <TextInput
          value={licenseNumber}
          onChangeText={setLicenseNumber}
          style={styles.input}
        />
      </View>

      <TouchableOpacity onPress={handleSave} style={styles.button}>
        <Text style={styles.buttonText}>Save & Continue</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  contentContainer: {
    padding: 20,
    paddingTop: 40,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontFamily: "Outfit_700Bold",
    color: "#000",
    marginBottom: 25,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 15,
    fontFamily: "Outfit_500Medium",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: "Outfit_400Regular",
    color: "#000",
  },
  disabledInput: {
    backgroundColor: "#f9f9f9",
    color: "#666",
  },
  button: {
    backgroundColor: "#0d6efd",
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "Outfit_500Medium",
  },
});
