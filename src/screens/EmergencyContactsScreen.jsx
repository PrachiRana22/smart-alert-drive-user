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

export default function EmergencyContactsScreen({ navigation }) {
  const { emergencyContacts, addEmergencyContact, deleteEmergencyContact, theme } = useContext(AuthContext);
  
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [relation, setRelation] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const isDark = theme === 'dark';

  const validateData = () => {
    if (!name.trim()) return "Please enter a name.";
    if (!phone.trim() || phone.length < 10) return "Please enter a valid phone number.";
    if (!relation.trim()) return "Please enter a relation (e.g. Brother, Wife).";
    return null;
  };

  const handleSave = async () => {
    const error = validateData();
    if (error) {
      Alert.alert("Invalid Input", error);
      return;
    }

    setIsSaving(true);
    try {
      await addEmergencyContact({
        name: name.trim(),
        phone_number: "+91" + phone.replace(/[^0-9]/g, ''),
        relation: relation.trim()
      });
      
      // Reset form
      setName("");
      setPhone("");
      setRelation("");
      setShowAdd(false);
    } catch (err) {
      Alert.alert("Error", "Could not add emergency contact.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (id) => {
    Alert.alert(
      "Delete Contact",
      "Are you sure you want to remove this emergency contact?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              await deleteEmergencyContact(id);
            } catch (err) {
              Alert.alert("Error", "Could not delete contact.");
            }
          }
        }
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView 
        style={[styles.container, isDark && styles.darkContainer]} 
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={isDark ? "#fff" : "#000"} />
          </TouchableOpacity>
          <Text style={[styles.title, isDark && styles.darkTitle]}>Emergency Contacts</Text>
          <View style={{ width: 24 }} />
        </View>

        <Text style={styles.sectionLabel}>Your Contacts</Text>

        {emergencyContacts.length === 0 ? (
          <View style={[styles.emptyCard, isDark && styles.darkCard]}>
            <Ionicons name="shield-checkmark" size={40} color="#cbd5e1" style={{ marginBottom: 10 }} />
            <Text style={styles.emptyText}>No emergency contacts added yet.</Text>
            <Text style={styles.emptySubtext}>Add contacts so the application can notify them in case of critical risk occurrences.</Text>
          </View>
        ) : (
          emergencyContacts.map((contact, index) => (
            <View key={contact.id || contact.pk || index} style={[styles.contactCard, isDark && styles.darkCard]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.contactName, isDark && styles.darkTitle]}>{contact.name}</Text>
                <Text style={styles.contactDetails}>{contact.relation} • {contact.phone_number}</Text>
              </View>
              <TouchableOpacity onPress={() => handleDelete(contact.id || contact.pk)} style={styles.deleteBtn}>
                <Ionicons name="trash-outline" size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ))
        )}

        {showAdd ? (
          <View style={[styles.addForm, isDark && styles.darkCard]}>
            <Text style={[styles.formTitle, isDark && styles.darkTitle]}>Add New Contact</Text>
            
            <View style={[styles.inputContainer, isDark && styles.darkInputContainer]}>
                <View style={styles.iconBubble}>
                    <Ionicons name="person" size={22} color={isDark ? "#3b82f6" : "#2563eb"} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Full Name</Text>
                    <TextInput
                      style={[styles.inputNoBorder, isDark && styles.darkInputText]}
                      placeholder="e.g. John Doe"
                      placeholderTextColor="#94a3b8"
                      value={name}
                      onChangeText={setName}
                    />
                </View>
            </View>

            <View style={[styles.inputContainer, isDark && styles.darkInputContainer]}>
                <View style={styles.iconBubble}>
                    <Ionicons name="call" size={22} color={isDark ? "#3b82f6" : "#2563eb"} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Phone Number</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={styles.prefixTextModern}>+91</Text>
                        <TextInput
                          style={[styles.inputNoBorder, isDark && styles.darkInputText, { flex: 1 }]}
                          placeholder="10-digit number"
                          placeholderTextColor="#94a3b8"
                          value={phone}
                          onChangeText={setPhone}
                          keyboardType="numeric"
                          maxLength={10}
                        />
                    </View>
                </View>
            </View>

            <View style={[styles.inputContainer, isDark && styles.darkInputContainer]}>
                <View style={styles.iconBubble}>
                    <Ionicons name="people" size={22} color={isDark ? "#3b82f6" : "#2563eb"} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Relation</Text>
                    <TextInput
                      style={[styles.inputNoBorder, isDark && styles.darkInputText]}
                      placeholder="e.g. Brother, Friend"
                      placeholderTextColor="#94a3b8"
                      value={relation}
                      onChangeText={setRelation}
                    />
                </View>
            </View>

            <View style={styles.formActions}>
              <TouchableOpacity 
                style={styles.cancelBtn} 
                onPress={() => setShowAdd(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.saveBtn, isSaving && { opacity: 0.7 }]} 
                onPress={handleSave}
                disabled={isSaving}
              >
                {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.addButton} 
            onPress={() => setShowAdd(true)}
          >
            <Ionicons name="add" size={24} color="#fff" />
            <Text style={styles.addButtonText}>Add New Contact</Text>
          </TouchableOpacity>
        )}

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  darkContainer: { backgroundColor: "#0f172a" },
  contentContainer: { padding: 20, paddingTop: 50, paddingBottom: 100 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 25 },
  title: { fontSize: 22, fontWeight: "bold", color: "#1e293b" },
  darkTitle: { color: "#fff" },
  sectionLabel: { fontSize: 16, fontWeight: "bold", color: "#2563eb", marginBottom: 15 },
  
  emptyCard: { backgroundColor: "#fff", padding: 30, borderRadius: 15, alignItems: "center", elevation: 2, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 5 },
  emptyText: { fontSize: 16, color: "#334155", fontWeight: "bold", marginTop: 10 },
  emptySubtext: { fontSize: 13, color: "#64748b", textAlign: "center", marginTop: 5 },
  
  contactCard: { flexDirection: "row", backgroundColor: "#fff", padding: 16, borderRadius: 15, marginBottom: 15, alignItems: "center", elevation: 2, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 5 },
  darkCard: { backgroundColor: "#1e293b", shadowColor: "transparent" },
  contactName: { fontSize: 16, fontWeight: "bold", color: "#1e293b", marginBottom: 4 },
  contactDetails: { fontSize: 14, color: "#64748b" },
  deleteBtn: { padding: 10, backgroundColor: "#fee2e2", borderRadius: 10 },
  
  addButton: { flexDirection: "row", backgroundColor: "#2563eb", padding: 16, borderRadius: 12, alignItems: "center", justifyContent: "center", marginTop: 10, shadowColor: "#2563eb", shadowOpacity: 0.3, shadowRadius: 10 },
  addButtonText: { color: "#fff", fontWeight: "bold", fontSize: 16, marginLeft: 8 },
  
  addForm: { backgroundColor: "#fff", padding: 20, borderRadius: 15, marginTop: 10, elevation: 3, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 8 },
  formTitle: { fontSize: 18, fontWeight: "bold", color: "#1e293b", marginBottom: 20 },
  inputContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderWidth: 1, borderColor: "#f1f5f9", borderRadius: 28, paddingHorizontal: 20, paddingVertical: 12, marginBottom: 16, shadowColor: "#cbd5e1", shadowOpacity: 0.2, shadowRadius: 10, elevation: 2 },
  darkInputContainer: { backgroundColor: "#1e293b", borderColor: "#334155", shadowColor: "transparent" },
  iconBubble: { backgroundColor: "rgba(37, 99, 235, 0.1)", padding: 10, borderRadius: 16, marginRight: 16 },
  inputNoBorder: { padding: 0, fontSize: 16, color: "#1e293b", marginTop: 4 },
  darkInputText: { color: "#fff" },
  prefixTextModern: { fontSize: 16, fontWeight: "bold", color: "#64748b", marginRight: 8, marginTop: 4 },
  label: { fontSize: 12, color: "#94a3b8", fontWeight: "600" },
  
  formActions: { flexDirection: "row", justifyContent: "flex-end", marginTop: 10 },
  cancelBtn: { padding: 12, paddingHorizontal: 20, marginRight: 10 },
  cancelBtnText: { color: "#64748b", fontWeight: "bold" },
  saveBtn: { backgroundColor: "#2563eb", padding: 12, paddingHorizontal: 24, borderRadius: 10 },
  saveBtnText: { color: "#fff", fontWeight: "bold" }
});
