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
  const { emergencyContacts, addEmergencyContact, deleteEmergencyContact, updateEmergencyContact, sendEmergencyEmail, theme } = useContext(AuthContext);
  
  const [showAdd, setShowAdd] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [relation, setRelation] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const isDark = theme === 'dark';

  const validateData = () => {
    if (!name.trim()) return "Full Name is required.";
    const emailStr = email.trim();
    if (!emailStr) return "Email Address is required.";
    if (!/^\S+@\S+\.\S+$/.test(emailStr)) return "Please enter a valid email address.";
    if (!phone.trim() || phone.length < 10) return "Valid 10-digit phone number is required.";
    if (!relation.trim()) return "Relation (e.g. Brother) is required.";
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
      const contactData = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone_number: "+91" + phone.replace(/[^0-9]/g, ''),
        relation: relation.trim()
      };

      if (isEditing) {
        await updateEmergencyContact(editId, contactData);
      } else {
        await addEmergencyContact(contactData);
      }
      
      // Reset form
      setName("");
      setEmail("");
      setPhone("");
      setRelation("");
      setShowAdd(false);
      setIsEditing(false);
      setEditId(null);
    } catch (err) {
      Alert.alert("Error", `Could not ${isEditing ? 'update' : 'add'} emergency contact.`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (contact) => {
    setName(contact.name);
    setEmail(contact.email || "");
    // Extract 10 digits from phone number (removing +91)
    const phoneDigits = contact.phone_number.replace("+91", "").replace(/[^0-9]/g, '');
    setPhone(phoneDigits);
    setRelation(contact.relation);
    setEditId(contact.id || contact.pk);
    setIsEditing(true);
    setShowAdd(true);
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
                {contact.email ? (
                  <Text style={styles.contactEmail}>{contact.email}</Text>
                ) : (
                  <Text style={styles.missingInfoText}>⚠️ Missing Email - Tap Pencil to Fix</Text>
                )}
              </View>
              <View style={{ flexDirection: 'row' }}>
                <TouchableOpacity onPress={() => handleEdit(contact)} style={[styles.actionBtn, { backgroundColor: "#eff6ff", marginRight: 8 }]}>
                  <Ionicons name="pencil-outline" size={18} color="#3b82f6" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(contact.id || contact.pk)} style={[styles.actionBtn, { backgroundColor: "#fee2e2" }]}>
                  <Ionicons name="trash-outline" size={18} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        {showAdd ? (
          <View style={[styles.addForm, isDark && styles.darkCard]}>
            <Text style={[styles.formTitle, isDark && styles.darkTitle]}>{isEditing ? 'Edit Contact' : 'Add New Contact'}</Text>
            
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
                    <Ionicons name="mail" size={22} color={isDark ? "#3b82f6" : "#2563eb"} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Email Address</Text>
                    <TextInput
                      style={[styles.inputNoBorder, isDark && styles.darkInputText]}
                      placeholder="e.g. john@example.com"
                      placeholderTextColor="#94a3b8"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
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
  contactName: { fontSize: 16, fontWeight: "bold", color: "#1e293b", marginBottom: 2 },
  contactDetails: { fontSize: 13, color: "#64748b", marginBottom: 2 },
  contactEmail: { fontSize: 13, color: "#3b82f6" },
  missingInfoText: { fontSize: 11, color: "#ef4444", fontWeight: "bold", marginTop: 2 },
  actionBtn: { padding: 8, borderRadius: 10 },
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
