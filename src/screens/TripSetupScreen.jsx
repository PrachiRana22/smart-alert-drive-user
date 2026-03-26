import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { MapPin, Navigation, ArrowLeft, Home, Map as MapIcon, Bell, Search } from 'lucide-react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { useColorScheme } from 'nativewind';
import polyline from '@mapbox/polyline';
import * as Location from 'expo-location';

// Remove Google Maps API key reference
// const GOOGLE_MAPS_APIKEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "";

export default function TripSetupScreen({ navigation }) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [startCoords, setStartCoords] = useState(null);
  const [endCoords, setEndCoords] = useState(null);
  const [distance, setDistance] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(false);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [startSuggestions, setStartSuggestions] = useState([]);
  const [endSuggestions, setEndSuggestions] = useState([]);
  const [showStartSuggestions, setShowStartSuggestions] = useState(false);
  const [showEndSuggestions, setShowEndSuggestions] = useState(false);
  const mapRef = useRef(null);

  // Debounced API Fetches for Autocomplete
  useEffect(() => {
    const delay = setTimeout(() => {
      if (showStartSuggestions && start.length > 2) {
        fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(start)}&format=json&addressdetails=1&limit=5&countrycodes=in`, {
          headers: {
            'User-Agent': 'SmartDriveApp/1.0 (contact@smartdrive.com)'
          }
        })
          .then(res => res.json())
          .then(data => setStartSuggestions(data))
          .catch(err => console.log(err));
      } else {
        setStartSuggestions([]);
      }
    }, 500);
    return () => clearTimeout(delay);
  }, [start, showStartSuggestions]);

  useEffect(() => {
    const delay = setTimeout(() => {
      if (showEndSuggestions && end.length > 2) {
        fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(end)}&format=json&addressdetails=1&limit=5&countrycodes=in`, {
          headers: {
            'User-Agent': 'SmartDriveApp/1.0 (contact@smartdrive.com)'
          }
        })
          .then(res => res.json())
          .then(data => setEndSuggestions(data))
          .catch(err => console.log(err));
      } else {
        setEndSuggestions([]);
      }
    }, 500);
    return () => clearTimeout(delay);
  }, [end, showEndSuggestions]);

  const handleSelectStart = (item) => {
    setStart(item.display_name);
    setStartCoords({ latitude: parseFloat(item.lat), longitude: parseFloat(item.lon) });
    setShowStartSuggestions(false);
  };

  const handleSelectEnd = (item) => {
    setEnd(item.display_name);
    setEndCoords({ latitude: parseFloat(item.lat), longitude: parseFloat(item.lon) });
    setShowEndSuggestions(false);
  };

  const fetchRoute = async () => {
    if (start === "" || end === "") {
      Alert.alert("Error", "Please enter start and destination locations.");
      return;
    }

    setLoading(true);
    setDistance(0);
    setDuration(0);
    setRouteCoordinates([]);

    try {
      let finalStart = startCoords;
      let finalEnd = endCoords;

      if (!finalStart || !finalEnd) {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert("Permission Denied", "Location permission is required to search addresses.");
          setLoading(false);
          return;
        }

        if (!finalStart) {
          const startResult = await Location.geocodeAsync(start);
          if (startResult.length > 0) {
            finalStart = { latitude: startResult[0].latitude, longitude: startResult[0].longitude };
            setStartCoords(finalStart);
          } else {
            Alert.alert("Not Found", "Could not coordinate start location.");
            setLoading(false);
            return;
          }
        }

        if (!finalEnd) {
          const endResult = await Location.geocodeAsync(end);
          if (endResult.length > 0) {
            finalEnd = { latitude: endResult[0].latitude, longitude: endResult[0].longitude };
            setEndCoords(finalEnd);
          } else {
            Alert.alert("Not Found", "Could not coordinate destination.");
            setLoading(false);
            return;
          }
        }
      }

      // 4. Fetch Route from OSRM
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${finalStart.longitude},${finalStart.latitude};${finalEnd.longitude},${finalEnd.latitude}?overview=full&geometries=polyline`;
      
      const response = await fetch(osrmUrl);
      const data = await response.json();

      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        
        // OSRM returns distance in meters, duration in seconds
        setDistance(route.distance / 1000); // convert to km
        setDuration(route.duration / 60); // convert to minutes

        // Decode the polyline using @mapbox/polyline
        const points = polyline.decode(route.geometry);
        const coords = points.map(point => ({
          latitude: point[0],
          longitude: point[1]
        }));
        
        setRouteCoordinates(coords);

        // Fit map to coordinates
        if (mapRef.current) {
          // adding a small delay to ensure map is ready to fit coordinates
          setTimeout(() => {
            mapRef.current.fitToCoordinates([
                finalStart,
                finalEnd,
                ...coords
            ], {
              edgePadding: { right: 50, bottom: 50, left: 50, top: 50 },
              animated: true,
            });
          }, 500);
        }
      } else {
        Alert.alert("Route Error", "Could not find a driving route between these locations.");
      }

    } catch (error) {
      console.error(error);
      Alert.alert("Error", "An error occurred while finding the route.");
    } finally {
      setLoading(false);
    }
  };

  const startTrip = () => {
    if (start === "" || end === "") {
      Alert.alert("Error", "Please enter start and destination");
      return;
    }

    navigation.navigate('DriverMonitor', {
      start: start,
      end: end,
      routeCoords: routeCoordinates,
      destinationCoords: endCoords
    });
  };

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-900 pt-16">
      <ScrollView 
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* Back Button & Title Row */}
        <View className="flex-row items-center mb-6">
          <TouchableOpacity onPress={() => navigation.navigate('Home')} className="mr-4">
            <ArrowLeft size={28} color={isDark ? "#60A5FA" : "#2563eb"} />
          </TouchableOpacity>
          <Text className="text-3xl font-bold text-blue-600 dark:text-blue-400">Smart Drive Alert</Text>
        </View>

        {/* Start Location */}
        <View className="bg-white dark:bg-slate-800 p-4 rounded-2xl mb-2 flex-row items-center shadow-sm z-50 border border-transparent dark:border-slate-700">
          <MapPin size={20} color={isDark ? "#60A5FA" : "#2563eb"} />
          <TextInput
            placeholder="Start Location (e.g., Paldi)"
            value={start}
            onChangeText={(text) => { setStart(text); setShowStartSuggestions(true); setStartCoords(null); }}
            onFocus={() => { if(start.length > 2) setShowStartSuggestions(true); setShowEndSuggestions(false); }}
            className="ml-3 flex-1 text-base text-slate-800 dark:text-gray-100"
            placeholderTextColor="#9ca3af"
          />
        </View>

        {showStartSuggestions && startSuggestions.length > 0 && (
          <View className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-gray-100 dark:border-slate-700 mb-4 overflow-hidden -mt-1 z-40">
            {startSuggestions.map((item, index) => (
              <TouchableOpacity
                key={index}
                className={`p-3 border-b border-gray-100 dark:border-slate-700 ${index === startSuggestions.length - 1 ? 'border-b-0' : ''}`}
                onPress={() => handleSelectStart(item)}
              >
                <Text className="text-slate-800 dark:text-gray-200 font-medium" numberOfLines={2}>{item.display_name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* End Location */}
        <View className={`bg-white dark:bg-slate-800 p-4 rounded-2xl flex-row items-center shadow-sm z-30 ${showStartSuggestions ? 'mt-2' : ''} mb-2 border border-transparent dark:border-slate-700`}>
          <Navigation size={20} color={isDark ? "#60A5FA" : "#2563eb"} />
          <TextInput
            placeholder="Destination (e.g., Vadodara)"
            value={end}
            onChangeText={(text) => { setEnd(text); setShowEndSuggestions(true); setEndCoords(null); }}
            onFocus={() => { if(end.length > 2) setShowEndSuggestions(true); setShowStartSuggestions(false); }}
            className="ml-3 flex-1 text-base text-slate-800 dark:text-gray-100"
            placeholderTextColor="#9ca3af"
          />
        </View>

        {showEndSuggestions && endSuggestions.length > 0 && (
          <View className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-gray-100 dark:border-slate-700 mb-6 overflow-hidden -mt-1 z-20">
            {endSuggestions.map((item, index) => (
              <TouchableOpacity
                key={index}
                className={`p-3 border-b border-gray-100 dark:border-slate-700 ${index === endSuggestions.length - 1 ? 'border-b-0' : ''}`}
                onPress={() => handleSelectEnd(item)}
              >
                <Text className="text-slate-800 dark:text-gray-200 font-medium" numberOfLines={2}>{item.display_name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Find Route Button */}
        <TouchableOpacity
          onPress={fetchRoute}
          disabled={loading}
          className={`py-3 rounded-xl mb-6 flex-row justify-center items-center shadow-sm ${loading ? 'bg-blue-400 dark:bg-blue-800' : 'bg-blue-100 dark:bg-blue-900/50'}`}
        >
          {loading ? (
            <ActivityIndicator color="#2563eb" />
          ) : (
            <>
              <Search size={18} color={isDark ? "#60A5FA" : "#2563eb"} />
              <Text className="text-blue-600 dark:text-blue-400 font-bold ml-2 text-base">Preview Route</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Map View */}
        {(startCoords && endCoords) && (
          <View className="bg-white dark:bg-slate-800 p-2 rounded-3xl mb-6 shadow-md border border-gray-100 dark:border-slate-700 overflow-hidden">
            <View style={{ height: 250, borderRadius: 20, overflow: 'hidden' }}>
              <MapView
                ref={mapRef}
                style={{ flex: 1 }}
                initialRegion={{
                  latitude: startCoords.latitude,
                  longitude: startCoords.longitude,
                  latitudeDelta: 0.1,
                  longitudeDelta: 0.1,
                }}
              >
                <Marker coordinate={startCoords} title="Start" pinColor="green" />
                <Marker coordinate={endCoords} title="Destination" pinColor="red" />

                {routeCoordinates.length > 0 && (
                  <Polyline
                    coordinates={routeCoordinates}
                    strokeWidth={4}
                    strokeColor="#2563eb"
                  />
                )}
              </MapView>
            </View>

            {/* Route Stats */}
            {distance > 0 && duration > 0 && (
              <View className="flex-row justify-between items-center px-4 py-3 bg-blue-50 mt-2 rounded-xl">
                <View>
                  <Text className="text-gray-500 text-xs font-semibold uppercase">Distance</Text>
                  <Text className="text-blue-700 font-bold text-lg">{distance.toFixed(1)} km</Text>
                </View>
                <View className="items-end">
                  <Text className="text-gray-500 text-xs font-semibold uppercase">Est. Time</Text>
                  <Text className="text-blue-700 font-bold text-lg">{Math.ceil(duration)} min</Text>
                </View>
              </View>
            )}

            {/* Route Stats */}
          </View>
        )}

        {/* GO BUTTON */}
        <TouchableOpacity
          onPress={startTrip}
          className="bg-blue-600 dark:bg-blue-500 py-4 rounded-2xl items-center shadow-lg shadow-blue-300 dark:shadow-blue-900/50 mt-2"
        >
          <Text className="text-white text-xl font-bold tracking-wide">
            START TRIP
          </Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Bottom Navigation */}
      <View className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-800 flex-row justify-around py-4 border-t border-gray-200 dark:border-slate-700 shadow-xl">
        <TouchableOpacity onPress={() => navigation.navigate('Home')} className="items-center">
          <Home size={24} color={isDark ? "#64748B" : "#9ca3af"} />
          <Text className="text-xs text-slate-500 dark:text-slate-400 mt-1">Home</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Trips')} className="items-center">
          <MapIcon size={24} color={isDark ? "#60A5FA" : "#2563eb"} />
          <Text className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-semibold">Trips</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Alerts')} className="items-center">
          <Bell size={24} color={isDark ? "#64748B" : "#9ca3af"} />
          <Text className="text-xs text-slate-500 dark:text-slate-400 mt-1">Alerts</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
