import React, { useState, useContext } from "react";
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Alert } from "react-native";
import { Star } from "lucide-react-native";
import { AuthContext } from "../context/AuthContext";

export default function TripFeedbackScreen({ navigation, route }) {
  
const { saveTrip } = useContext(AuthContext);
const { tripData } = route.params || {};

const [rating,setRating] = useState(0)
const [alertHelpful,setAlertHelpful] = useState(null)
const [feedback,setFeedback] = useState("")

const submitFeedback = () => {
    
    // Save trip if valid data exists
    if(tripData) {
        saveTrip({
            ...tripData,
            rating,
            alertHelpful,
            feedback
        });
    }

Alert.alert(
"Thank You",
"Thank you for using Smart Drive. Your feedback helps us improve driver safety.",
[
{
text:"OK",
onPress:()=>navigation.replace("Home")
}
]
)

}

return(

<View style={styles.container}>

<Text style={styles.title}>Trip Completed</Text>

<Text style={styles.message}>
Your trip has ended successfully. We hope Smart Drive helped you stay safe on the road.
</Text>

{/* RATING */}

<Text style={styles.label}>Rate Your Trip</Text>

<View style={styles.starRow}>

{[1,2,3,4,5].map((star)=>(
<TouchableOpacity key={star} onPress={()=>setRating(star)}>

<Star
size={30}
color={star <= rating ? "#facc15" : "#d1d5db"}
fill={star <= rating ? "#facc15" : "none"}
/>

</TouchableOpacity>
))}

</View>

{/* ALERT SYSTEM */}

<Text style={styles.label}>
Was the alert system helpful?
</Text>

<View style={styles.buttonRow}>

<TouchableOpacity
style={[
styles.optionButton,
alertHelpful === true && styles.selected
]}
onPress={()=>setAlertHelpful(true)}
>

<Text style={styles.optionText}>Yes</Text>

</TouchableOpacity>

<TouchableOpacity
style={[
styles.optionButton,
alertHelpful === false && styles.selected
]}
onPress={()=>setAlertHelpful(false)}
>

<Text style={styles.optionText}>No</Text>

</TouchableOpacity>

</View>

{/* DRIVER FEEDBACK */}

<Text style={styles.label}>
Did you feel safe while driving?
</Text>

<TextInput
style={styles.input}
placeholder="Share your feedback..."
value={feedback}
onChangeText={setFeedback}
multiline
/>

{/* SUBMIT BUTTON */}

<TouchableOpacity
style={styles.submitButton}
onPress={submitFeedback}
>

<Text style={styles.submitText}>
Submit Feedback
</Text>

</TouchableOpacity>

</View>

)

}

const styles = StyleSheet.create({

container:{
flex:1,
backgroundColor:"#f3f4f6",
padding:20,
justifyContent:"center"
},

title:{
fontSize:26,
fontWeight:"bold",
color:"#2563eb",
marginBottom:10,
textAlign:"center"
},

message:{
fontSize:15,
color:"#374151",
textAlign:"center",
marginBottom:30
},

label:{
fontSize:16,
fontWeight:"bold",
marginBottom:10
},

starRow:{
flexDirection:"row",
justifyContent:"center",
marginBottom:30
},

buttonRow:{
flexDirection:"row",
justifyContent:"space-between",
marginBottom:30
},

optionButton:{
backgroundColor:"#e5e7eb",
padding:12,
borderRadius:10,
width:"45%",
alignItems:"center"
},

selected:{
backgroundColor:"#2563eb"
},

optionText:{
fontWeight:"bold",
color:"#111827"
},

input:{
backgroundColor:"white",
borderRadius:10,
padding:12,
height:100,
textAlignVertical:"top",
marginBottom:30
},

submitButton:{
backgroundColor:"#16a34a",
padding:15,
borderRadius:12,
alignItems:"center"
},

submitText:{
color:"white",
fontSize:16,
fontWeight:"bold"
}

})
