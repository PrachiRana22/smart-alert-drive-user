import React, { useState, useContext, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { AuthContext } from "../context/AuthContext";

export default function LicenseDetails({ navigation }) {
  const { setIsLicenseDone, setLicenseData, updateLicense, logout, user } = useContext(AuthContext);

  // Split License States for Gujarat Format
  const [licensePrefix, setLicensePrefix] = useState("GJ"); // e.g., GJ12
  const [licenseRest, setLicenseRest] = useState(""); // e.g., 20230012345

  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [showIssuePicker, setShowIssuePicker] = useState(false);
  const [validDate, setValidDate] = useState("");
  const [image, setImage] = useState(null);
  const [licenseType, setLicenseType] = useState("LL");
  const [status, setStatus] = useState("");
  const [isFetchingInfo, setIsFetchingInfo] = useState(false);

  useEffect(() => {
    if (licensePrefix.length === 4 && licenseRest.length === 11) {
      const fullLicense = (licensePrefix + licenseRest).toUpperCase().replace(/\s/g, "");
      const regex = /^[A-Z]{2}[0-9]{2}[0-9]{11}$/;

      if (regex.test(fullLicense)) {
        setIsFetchingInfo(true);
        setTimeout(() => {
          setIsFetchingInfo(false);
          // Pull name from user context if available, otherwise fallback
          const autoName = user?.first_name 
            ? `${user.first_name} ${user.last_name || ""}`.trim()
            : "Rahul Sharma";
            
          setName(autoName);
          setDob("1998-05-15");
          setLicenseType("DL");
          const mockIssueDate = "2023-01-10";
          setIssueDate(mockIssueDate);
          
          let d = new Date(mockIssueDate);
          d.setFullYear(d.getFullYear() + 20); // DL validity is usually 20 years
          const formatted = d.toISOString().split("T")[0];
          setValidDate(formatted);
          setStatus(d >= new Date() ? "Valid ✅" : "Expired ❌");
        }, 1500);
      }
    }
  }, [licensePrefix, licenseRest, user]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5, // Slightly lower quality for smaller Base64 size
      base64: true,
    });
    if (!result.canceled) {
      setImage(result.assets[0].base64);
    }
  };

  const calculateValidDate = (date) => {
    let d = new Date(date);
    if (licenseType === "LL") {
      d.setMonth(d.getMonth() + 6);
    } else {
      d.setFullYear(d.getFullYear() + 20);
    }
    const formatted = d.toISOString().split("T")[0];
    setValidDate(formatted);
    setStatus(d >= new Date() ? "Valid ✅" : "Expired ❌");
  };

  const handleSubmit = async () => {
    const fullLicense = (licensePrefix + licenseRest).toUpperCase().replace(/\s/g, "");
    
    // Regex: 2 State Letters + 2 digits + 11 digits = 15 Total
    const regex = /^[A-Z]{2}[0-9]{2}[0-9]{11}$/;

    if (!licensePrefix || !licenseRest || !name || !dob || !issueDate || !image) {
      Alert.alert("Error", "Please fill all fields and upload a photo.");
      return;
    }

    if (!regex.test(fullLicense)) {
      Alert.alert("Invalid Format", "Please enter a valid License number.\nExample: GJ12 + 20230012345 (State Code + 13 Digits)");
      return;
    }

    try {
      // SAVE TO BACKEND (Now includes profile_image as Base64, and added issue_date and license_type)
      await updateLicense({
        full_name: name,
        license_number: fullLicense,
        dob: dob,
        issue_date: issueDate,
        license_type: licenseType,
        profile_image: image // This is now the Base64 string
      });

      setLicenseData({ name, licenseNumber: fullLicense, image });
      setIsLicenseDone(true);
      navigation.replace("VehicleDetails");
    } catch (error) {
      Alert.alert("Error", "Failed to save license details to server.");
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"} 
      style={{ flex: 1 }}
    >
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => logout()}>
          <Ionicons name="log-out-outline" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>License Details</Text>
        <Ionicons name="card-outline" size={24} color="#2563eb" />
      </View>

      {/* Profile Image */}
      <View style={styles.imageContainer}>
        <TouchableOpacity onPress={pickImage}>
          <View style={styles.imageWrapper}>
            {image ? (
              <Image source={{ uri: `data:image/jpeg;base64,${image}` }} style={styles.image} />
            ) : (
              <Ionicons name="person-circle-outline" size={90} color="#94a3b8" />
            )}
          </View>
        </TouchableOpacity>
        <Text style={styles.uploadText}>Upload Your Photo</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>License Type</Text>
        <View style={styles.radioGroup}>
          <TouchableOpacity onPress={() => setLicenseType("LL")} style={styles.radio}>
            <Ionicons name={licenseType === "LL" ? "radio-button-on" : "radio-button-off"} size={20} color="#2563eb" />
            <Text style={styles.radioText}>Learning (LL)</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setLicenseType("DL")} style={styles.radio}>
            <Ionicons name={licenseType === "DL" ? "radio-button-on" : "radio-button-off"} size={20} color="#2563eb" />
            <Text style={styles.radioText}>Permanent (DL)</Text>
          </TouchableOpacity>
        </View>

        {/* License Number Input with Hint */}
        <Text style={styles.label}>License Number</Text>
        <View style={styles.rowInputContainer}>
          <TextInput
            placeholder="GJ12"
            value={licensePrefix}
            onChangeText={setLicensePrefix}
            maxLength={4}
            autoCapitalize="characters"
            style={[styles.input, { flex: 0.3, textAlign: 'center', fontWeight: 'bold' }]}
          />
          <TextInput
            placeholder="20230012345"
            value={licenseRest}
            onChangeText={setLicenseRest}
            maxLength={11}
            keyboardType="numeric"
            style={[styles.input, { flex: 0.7, marginLeft: 10 }]}
          />
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
          <Text style={styles.suggestionText}>Format: RTO Code (e.g. GJ12) +  Serial No.</Text>
          {isFetchingInfo && <ActivityIndicator color="#2563eb" size="small" />}
        </View>

        <Text style={styles.label}>Full Name</Text>
        <TextInput
          placeholder="As per driving license"
          value={name}
          onChangeText={setName}
          style={styles.input}
        />

        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text style={styles.label}>Date of Birth</Text>
            <TouchableOpacity onPress={() => setShowDobPicker(true)} style={styles.input}>
              <Text style={{ color: dob ? "#334155" : "#94a3b8" }}>{dob || "YYYY-MM-DD"}</Text>
            </TouchableOpacity>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Issue Date</Text>
            <TouchableOpacity onPress={() => setShowIssuePicker(true)} style={styles.input}>
              <Text style={{ color: issueDate ? "#334155" : "#94a3b8" }}>{issueDate || "YYYY-MM-DD"}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.label}>Validity & Status</Text>
        <View style={styles.statusBox}>
          <Text style={styles.statusText}>Expires on: <Text style={{fontWeight: 'bold'}}>{validDate || "---"}</Text></Text>
          <Text style={styles.statusText}>Status: <Text style={{fontWeight: 'bold', color: status.includes('Valid') ? '#16a34a' : '#dc2626'}}>{status || "---"}</Text></Text>
        </View>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Save & Continue</Text>
      </TouchableOpacity>

      {/* Date Pickers */}
      {showDobPicker && (
        <DateTimePicker
          value={new Date(2000, 0, 1)}
          mode="date"
          display="default"
          onChange={(e, d) => { setShowDobPicker(false); if(d) setDob(d.toISOString().split("T")[0]); }}
        />
      )}
      {showIssuePicker && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          display="default"
          onChange={(e, d) => { 
            setShowIssuePicker(false); 
            if(d) {
              const dateStr = d.toISOString().split("T")[0];
              setIssueDate(dateStr);
              calculateValidDate(d);
            }
          }}
        />
      )}
      <View style={{ height: 100 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc", padding: 16 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 40, marginBottom: 20 },
  title: { fontSize: 22, fontWeight: "bold", color: "#1e293b" },
  imageContainer: { alignItems: "center", marginBottom: 20 },
  imageWrapper: { borderRadius: 50, backgroundColor: "#e2e8f0", overflow: 'hidden' },
  image: { width: 90, height: 90 },
  uploadText: { color: "#2563eb", marginTop: 8, fontWeight: "600" },
  form: { backgroundColor: "#fff", padding: 20, borderRadius: 16, elevation: 4, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10 },
  label: { fontSize: 14, color: "#64748b", marginTop: 15, fontWeight: "600" },
  input: { borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 10, padding: 12, marginTop: 6, fontSize: 15, color: "#334155" },
  rowInputContainer: { flexDirection: "row", alignItems: "center" },
  suggestionText: { fontSize: 11, color: "#94a3b8", marginTop: 4, fontStyle: "italic" },
  radioGroup: { flexDirection: "row", marginTop: 10 },
  radio: { flexDirection: "row", alignItems: "center", marginRight: 25 },
  radioText: { marginLeft: 6, fontSize: 15, color: "#334155" },
  row: { flexDirection: "row", justifyContent: "space-between" },
  statusBox: { backgroundColor: "#f1f5f9", padding: 12, borderRadius: 10, marginTop: 10, borderLeftWidth: 4, borderLeftColor: "#2563eb" },
  statusText: { fontSize: 14, color: "#475569" },
  button: { backgroundColor: "#2563eb", padding: 16, borderRadius: 12, marginTop: 25, shadowColor: "#2563eb", shadowOpacity: 0.3, shadowRadius: 5 },
  buttonText: { color: "#fff", textAlign: "center", fontWeight: "bold", fontSize: 18 }
});
