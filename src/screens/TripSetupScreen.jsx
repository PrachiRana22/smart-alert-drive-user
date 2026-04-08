import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { MapPin, Navigation, ArrowLeft, Home, Map as MapIcon, Bell, Search, X, Map } from 'lucide-react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { useColorScheme } from 'nativewind';
import polyline from '@mapbox/polyline';
import { AuthContext } from '../context/AuthContext';
import * as Location from 'expo-location';

// Remove Google Maps API key reference
// const GOOGLE_MAPS_APIKEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "";

export default function TripSetupScreen({ navigation }) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { saveTrip, vehicles, fetchVehicles, user } = React.useContext(AuthContext);
  
  useEffect(() => {
    fetchVehicles();
  }, []);
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
  const [isSearchingStart, setIsSearchingStart] = useState(false);
  const [isSearchingEnd, setIsSearchingEnd] = useState(false);
  const mapRef = useRef(null);

  // Debounced API Fetches for Autocomplete
  useEffect(() => {
    const delay = setTimeout(async () => {
      if (showStartSuggestions && start.length > 2 && !startCoords) {
        setIsSearchingStart(true);
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(start)}&format=json&addressdetails=1&limit=5&countrycodes=in`, {
            headers: { 'User-Agent': 'SmartDrive_UserSide/1.0 (contact@smartdrive.com)' }
          });
          const data = await response.json();
          setStartSuggestions(data);
        } catch (err) {
          console.log("Start Search Error:", err);
        } finally {
          setIsSearchingStart(false);
        }
      } else {
        setStartSuggestions([]);
      }
    }, 600);
    return () => clearTimeout(delay);
  }, [start, showStartSuggestions]);

  useEffect(() => {
    const delay = setTimeout(async () => {
      if (showEndSuggestions && end.length > 2 && !endCoords) {
        setIsSearchingEnd(true);
        try {
          let url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(end)}&format=json&addressdetails=1&limit=5&countrycodes=in`;
          
          if (startCoords) {
            // Prioritize results near the start location using a ~50km bounding box
            const lonGap = 0.5; 
            const latGap = 0.5;
            url += `&viewbox=${startCoords.longitude - lonGap},${startCoords.latitude - latGap},${startCoords.longitude + lonGap},${startCoords.latitude + latGap}`;
          }

          const response = await fetch(url, {
            headers: { 'User-Agent': 'SmartDrive_UserSide/1.0 (contact@smartdrive.com)' }
          });
          const data = await response.json();
          setEndSuggestions(data);
        } catch (err) {
          console.log("End Search Error:", err);
        } finally {
          setIsSearchingEnd(false);
        }
      } else {
        setEndSuggestions([]);
      }
    }, 600);
    return () => clearTimeout(delay);
  }, [end, showEndSuggestions, startCoords]);

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

  const useCurrentLocation = async () => {
    setLoading(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permission Denied", "Location permission is required.");
        setLoading(false);
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      const coords = { latitude: location.coords.latitude, longitude: location.coords.longitude };
      setStartCoords(coords);
      
      // Reverse geocode to get city/area name
      const reverse = await Location.reverseGeocodeAsync(coords);
      if (reverse.length > 0) {
        const addr = reverse[0];
        setStart(`${addr.name || addr.street || ""}, ${addr.city || addr.region || ""}`.trim().replace(/^,/, ''));
      } else {
        setStart("Current Location");
      }
      
      setShowStartSuggestions(false);
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Could not get current location.");
    } finally {
      setLoading(false);
    }
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

  const startTrip = async () => {
    if (start === "" || end === "") {
      Alert.alert("Error", "Please enter start and destination");
      return;
    }

    if (vehicles.length === 0) {
      Alert.alert("No Vehicle Found", "Please add a vehicle in your profile settings before starting a trip.");
      return;
    }

    setLoading(true);
    try {
      const tripData = {
        vehicle: vehicles[0].id, // Default to first vehicle
        start_time: new Date().toISOString(),
        start_location: start,
        end_location: end,
        distance_km: distance || 0,
        status: 'ONGOING'
      };

      const savedTrip = await saveTrip(tripData);

      navigation.navigate('DriverMonitor', {
        tripId: savedTrip.id,
        start: start,
        end: end,
        routeCoords: routeCoordinates,
        destinationCoords: endCoords,
        vehicleId: vehicles[0].id,
        vehicleName: `${vehicles[0].make} ${vehicles[0].model}`.trim() || vehicles[0].make || 'Unknown',
        vehicleNumber: vehicles[0].license_plate || 'Not Set'
      });
    } catch (error) {
      Alert.alert("Trip Error", "Could not start trip on backend. Please try again.");
    } finally {
      setLoading(false);
    }
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

        {/* Start Location Input */}
        <View className="z-50 mb-4">
          <View className="bg-white dark:bg-slate-800 p-4 rounded-2xl flex-row items-center shadow-sm border border-transparent dark:border-slate-700">
            <MapPin size={20} color={isDark ? "#60A5FA" : "#2563eb"} />
            <TextInput
              placeholder="Start Location (e.g., Paldi)"
              value={start}
              onChangeText={(text) => { setStart(text); setShowStartSuggestions(true); setStartCoords(null); }}
              onFocus={() => { if(start.length > 2) setShowStartSuggestions(true); setShowEndSuggestions(false); }}
              className="ml-3 flex-1 text-base text-slate-800 dark:text-gray-100"
              placeholderTextColor="#9ca3af"
            />
            {isSearchingStart ? (
               <ActivityIndicator size="small" color="#2563eb" className="ml-2" />
            ) : start.length > 0 && (
              <TouchableOpacity onPress={() => { setStart(""); setStartSuggestions([]); setStartCoords(null); }}>
                <X size={20} color="#94a3af" />
              </TouchableOpacity>
            )}
          </View>

          {/* Start Suggestions */}
          {showStartSuggestions && (startSuggestions.length > 0 || isSearchingStart) && (
            <View className="absolute top-[60px] left-0 right-0 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 overflow-hidden z-[100]">
              {isSearchingStart && startSuggestions.length === 0 ? (
                 <View className="p-4 items-center">
                   <Text className="text-slate-400">Searching locations...</Text>
                 </View>
              ) : (
                startSuggestions.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    className="p-4 border-b border-gray-50 dark:border-slate-700 flex-row items-center"
                    onPress={() => handleSelectStart(item)}
                  >
                    <Map size={18} color="#94a3af" className="mr-3" />
                    <View className="flex-1">
                      <Text className="text-slate-800 dark:text-gray-100 font-medium" numberOfLines={1}>
                        {item.display_name.split(',')[0]}
                      </Text>
                      <Text className="text-slate-400 text-xs" numberOfLines={1}>
                        {item.display_name.split(',').slice(1).join(',').trim()}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}

          {/* Current Location Button */}
          <TouchableOpacity 
            onPress={useCurrentLocation} 
            className="flex-row items-center mt-2 px-1"
          >
            <View className="bg-blue-50 dark:bg-blue-900/40 p-1.5 rounded-full mr-2">
              <Navigation size={14} color="#2563eb" />
            </View>
            <Text className="text-blue-600 dark:text-blue-400 font-medium text-sm">Use Current Location</Text>
          </TouchableOpacity>
        </View>

        {/* End Location Input */}
        <View className="z-40 mb-6">
          <View className="bg-white dark:bg-slate-800 p-4 rounded-2xl flex-row items-center shadow-sm border border-transparent dark:border-slate-700">
            <Navigation size={20} color={isDark ? "#60A5FA" : "#2563eb"} />
            <TextInput
              placeholder="Destination (e.g., Vadodara)"
              value={end}
              onChangeText={(text) => { setEnd(text); setShowEndSuggestions(true); setEndCoords(null); }}
              onFocus={() => { if(end.length > 2) setShowEndSuggestions(true); setShowStartSuggestions(false); }}
              className="ml-3 flex-1 text-base text-slate-800 dark:text-gray-100"
              placeholderTextColor="#9ca3af"
            />
            {isSearchingEnd ? (
               <ActivityIndicator size="small" color="#2563eb" className="ml-2" />
            ) : end.length > 0 && (
              <TouchableOpacity onPress={() => { setEnd(""); setEndSuggestions([]); setEndCoords(null); }}>
                <X size={20} color="#94a3af" />
              </TouchableOpacity>
            )}
          </View>

          {/* End Suggestions */}
          {showEndSuggestions && (endSuggestions.length > 0 || isSearchingEnd) && (
            <View className="absolute top-[60px] left-0 right-0 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 overflow-hidden z-[100]">
              {isSearchingEnd && endSuggestions.length === 0 ? (
                 <View className="p-4 items-center">
                   <Text className="text-slate-400">Searching locations...</Text>
                 </View>
              ) : (
                endSuggestions.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    className="p-4 border-b border-gray-50 dark:border-slate-700 flex-row items-center"
                    onPress={() => handleSelectEnd(item)}
                  >
                    <Map size={18} color="#94a3af" className="mr-3" />
                    <View className="flex-1">
                      <Text className="text-slate-800 dark:text-gray-100 font-medium" numberOfLines={1}>
                        {item.display_name.split(',')[0]}
                      </Text>
                      <Text className="text-slate-400 text-xs" numberOfLines={1}>
                        {item.display_name.split(',').slice(1).join(',').trim()}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}
        </View>

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
