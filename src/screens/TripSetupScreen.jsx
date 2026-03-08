import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { MapPin, Navigation, ArrowLeft, Home, Map, Bell } from 'lucide-react-native';

export default function TripSetupScreen({ navigation }) {

  const [start,setStart] = useState("");
  const [end,setEnd] = useState("");

  const startTrip = () => {

    if(start === "" || end === ""){
      alert("Please enter start and destination");
      return;
    }

    navigation.navigate('DriverMonitor',{
      start:start,
      end:end
    });

  };

  return (
    <View className="flex-1 bg-gray-100 px-6 pt-16">

      {/* Back Button */}
      <TouchableOpacity 
        onPress={() => navigation.navigate('Home')}
        className="absolute left-6 top-16"
      >
        <ArrowLeft size={28} color="#2563eb"/>
      </TouchableOpacity>

      {/* Logo */}
      <View className="items-center mb-10">
        <Text className="text-3xl font-bold text-blue-600">
          Smart Drive Alert
        </Text>
      </View>

      {/* Start Location */}
      <View className="bg-white p-4 rounded-2xl mb-6 flex-row items-center">
        <MapPin size={20} color="#2563eb"/>
        <TextInput
          placeholder="Start Location"
          value={start}
          onChangeText={setStart}
          className="ml-3 flex-1"
        />
      </View>

      {/* End Location */}
      <View className="bg-white p-4 rounded-2xl mb-10 flex-row items-center">
        <Navigation size={20} color="#2563eb"/>
        <TextInput
          placeholder="Destination"
          value={end}
          onChangeText={setEnd}
          className="ml-3 flex-1"
        />
      </View>

      {/* GO BUTTON */}
      <TouchableOpacity
        onPress={startTrip}
        className="bg-blue-600 py-4 rounded-2xl items-center"
      >
        <Text className="text-white text-lg font-bold">
          GO
        </Text>
      </TouchableOpacity>

      {/* Bottom Navigation */}
      <View className="absolute bottom-0 left-0 right-0 bg-white flex-row justify-around py-4 border-t border-gray-200">

        <TouchableOpacity onPress={()=>navigation.navigate('Home')} className="items-center">
          <Home size={24} color="#2563eb"/>
          <Text className="text-xs text-blue-600">Home</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={()=>navigation.navigate('Trips')} className="items-center">
          <Map size={24} color="#2563eb"/>
          <Text className="text-xs text-blue-600">Trips</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={()=>navigation.navigate('Alerts')} className="items-center">
          <Bell size={24} color="#2563eb"/>
          <Text className="text-xs text-blue-600">Alerts</Text>
        </TouchableOpacity>

      </View>

    </View>
  );
}
