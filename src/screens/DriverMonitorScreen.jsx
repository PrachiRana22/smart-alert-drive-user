import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { AlertTriangle } from "lucide-react-native";

export default function DriverMonitorScreen({ navigation, route }) {

  const [permission, requestPermission] = useCameraPermissions();
  const [location, setLocation] = useState(null);
  const [alertCount, setAlertCount] = useState(0);

  const { start, end, vehicleName, vehicleNumber } = route.params || {};

  useEffect(() => {
    startLiveLocation();
  }, []);

  useEffect(() => {

    if (alertCount >= 3) {
      Alert.alert(
        "Driver Check",
        "Are you okay?",
        [
          { text: "Yes", onPress: () => setAlertCount(0) },
          { text: "No", onPress: () => console.log("Driver not OK") }
        ]
      );
    }

  }, [alertCount]);

  // LIVE LOCATION
  const startLiveLocation = async () => {

    let { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== "granted") {
      Alert.alert("Location permission required");
      return;
    }

    Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 2000,
        distanceInterval: 1,
      },
      (loc) => {
        setLocation(loc.coords);
      }
    );

  };

  if (!permission) return <View />;

  if (!permission.granted) {
    return (
      <View style={{flex:1,justifyContent:"center",alignItems:"center"}}>
        <Text>Camera permission required</Text>

        <TouchableOpacity onPress={requestPermission}>
          <Text>Grant Permission</Text>
        </TouchableOpacity>

      </View>
    );
  }

  return (

    <View style={{flex:1,backgroundColor:"#f3f4f6",paddingTop:60,paddingHorizontal:16}}>

      {/* HEADER */}
      <View style={{flexDirection:"row",justifyContent:"space-between",marginBottom:16}}>

        <Text style={{fontSize:22,fontWeight:"bold",color:"#2563eb"}}>
          Smart Drive
        </Text>

        <View>
          <Text style={{fontWeight:"bold"}}>
            Vehicle : {vehicleName || "Car"}
          </Text>

          <Text style={{color:"gray"}}>
            Number : {vehicleNumber || "GJ-00-0000"}
          </Text>
        </View>

      </View>


      {/* TRIP INFO + CAMERA */}
      <View style={{flexDirection:"row",marginBottom:16}}>

        <View style={{flex:1}}>

          <Text style={{marginBottom:4}}>
            Start : {start || "Unknown"}
          </Text>

          <Text style={{marginBottom:4}}>
            Destination : {end || "Unknown"}
          </Text>

          <Text>
            Status : Driving
          </Text>

        </View>

        <View style={{
          height:130,
          width:90,
          backgroundColor:"black",
          borderRadius:12,
          overflow:"hidden"
        }}>

          <CameraView
            facing="front"
            style={{flex:1}}
          />

        </View>

      </View>


      {/* MAP */}
      <View style={{
        height:260,
        borderRadius:20,
        overflow:"hidden",
        marginBottom:16
      }}>

        {location ? (

          <MapView
            style={{flex:1}}
            showsUserLocation={true}
            zoomEnabled={true}
            scrollEnabled={true}
            rotateEnabled={true}
            pitchEnabled={true}
            initialRegion={{
              latitude: location.latitude,
              longitude: location.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
          >

            <Marker
              coordinate={{
                latitude: location.latitude,
                longitude: location.longitude,
              }}
              title="Driver Location"
            />

          </MapView>

        ) : (

          <View style={{flex:1,justifyContent:"center",alignItems:"center"}}>
            <Text>Loading Live Map...</Text>
          </View>

        )}

      </View>


      {/* ALERT PANEL */}
      <View style={{
        backgroundColor:"white",
        padding:16,
        borderRadius:12,
        marginBottom:16
      }}>

        <View style={{flexDirection:"row",alignItems:"center",marginBottom:8}}>
          <AlertTriangle size={20} color="red" />
          <Text style={{marginLeft:8,fontWeight:"bold",color:"red"}}>
            Alerts During Trip
          </Text>
        </View>

        <TouchableOpacity
          onPress={()=>setAlertCount(alertCount+1)}
          style={{backgroundColor:"#f3f4f6",padding:10,borderRadius:8,marginBottom:6}}
        >
          <Text>Alert 1</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={()=>setAlertCount(alertCount+1)}
          style={{backgroundColor:"#f3f4f6",padding:10,borderRadius:8,marginBottom:6}}
        >
          <Text>Alert 2</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={()=>setAlertCount(alertCount+1)}
          style={{backgroundColor:"#f3f4f6",padding:10,borderRadius:8}}
        >
          <Text>Alert 3</Text>
        </TouchableOpacity>

      </View>


      {/* STOP BUTTON */}
      <TouchableOpacity
        onPress={()=>navigation.navigate("Home")}
        style={{
          backgroundColor:"#dc2626",
          padding:16,
          borderRadius:12,
          alignItems:"center"
        }}
      >

        <Text style={{color:"white",fontSize:18,fontWeight:"bold"}}>
          Stop Trip
        </Text>

      </TouchableOpacity>

    </View>
  );
}
