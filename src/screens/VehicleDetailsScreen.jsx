import React, { useState, useContext } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from "react-native";
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

    <ScrollView style={{flex:1,padding:20}}>

      <Text style={{fontSize:24,fontWeight:"bold",marginBottom:20}}>
        Vehicle Details
      </Text>

      <Text>Driver Name</Text>
      <TextInput
        value={user?.name}
        editable={false}
        style={input}
      />

      <Text>Mobile Number</Text>
      <TextInput
        value={mobile}
        onChangeText={setMobile}
        keyboardType="phone-pad"
        style={input}
      />

      <Text>Emergency Contact</Text>
      <TextInput
        value={emergency}
        onChangeText={setEmergency}
        keyboardType="phone-pad"
        style={input}
      />

      <Text>Vehicle Type</Text>
      <TextInput
        placeholder="2 Wheeler / Car / Bus / Truck"
        value={vehicleType}
        onChangeText={setVehicleType}
        style={input}
      />

      <Text>Vehicle Number</Text>
      <TextInput
        placeholder="GJ01AB1234"
        value={vehicleNumber}
        onChangeText={setVehicleNumber}
        style={input}
      />

      <Text>License Number (Optional)</Text>
      <TextInput
        value={licenseNumber}
        onChangeText={setLicenseNumber}
        style={input}
      />

      <TouchableOpacity
        onPress={handleSave}
        style={button}
      >
        <Text style={{color:"white",fontSize:18}}>Save & Continue</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const input = {
  borderWidth:1,
  borderColor:"#ccc",
  padding:12,
  borderRadius:8,
  marginBottom:15
}

const button = {
  backgroundColor:"#2563eb",
  padding:15,
  borderRadius:10,
  alignItems:"center",
  marginTop:10
}
