import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Platform,
  ActivityIndicator // Import ActivityIndicator
} from 'react-native';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getDatabase, ref, set, get } from 'firebase/database'; // Remove onValue (not needed here)
import { useRouter, useLocalSearchParams } from 'expo-router';
import app from './firebase';
import RNPickerSelect from 'react-native-picker-select'; // Import

interface Props {}

const AttendancePage: React.FC<Props> = () => {
  const [attendanceStatus, setAttendanceStatus] = useState<string>('present'); // Use string type
  const [courseName, setCourseName] = useState('');
  const { courseId } = useLocalSearchParams<{ courseId?: string }>();
  const [loading, setLoading] = useState(true); // Loading state

  const router = useRouter();
  const auth = getAuth(app);
  const db = getDatabase(app);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace('/');
        return; // Important: Return to prevent further execution
      }

      if (!courseId) {
        Alert.alert("Error", "No course selected.");
        router.back();
        return; // Important: Return to prevent further execution
      }

      // Fetch course name
      const courseRef = ref(db, `courses/${courseId}`);
      try {
        const snapshot = await get(courseRef);
        if (snapshot.exists()) {
          const courseData = snapshot.val();
          setCourseName(courseData.name);
        } else {
          Alert.alert("Error", "Course not found.");
          router.back();
          return; // Important: Return after error
        }
      } catch (error: any) {
        Alert.alert("Error", "Fetch course data error: " + error.message);
        return; // Important: Return after error
      } finally {
          setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [auth, db, router, courseId]);

  const handleAttendanceSubmit = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Error", "User not signed in.");
        return; // Important: Return to prevent further execution
      }

      if (!courseId) {
        Alert.alert("Error", "No course selected.");
        return; // Important: Return to prevent further execution
      }

      const today = new Date().toISOString().split('T')[0];
      const attendanceRef = ref(db, `attendances/${courseId}/${today}/${user.uid}`);
      await set(attendanceRef, {
        status: attendanceStatus,
        timestamp: new Date().toISOString(),
        userName: user.displayName || 'Anonymous',
      });

      Alert.alert('Success', 'Attendance recorded successfully!');
    } catch (error: any) {
      console.error('Error submitting attendance:', error);
      Alert.alert('Error', `Failed to submit attendance: ${error.message}`);
    }
  };

    const handleBack = () => {
        router.back();
    }

    if (loading) {
        return (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2CBFAE"/>
        </View>
        );
    }


  return (
    <ScrollView style={styles.container}>

      <View style={styles.formContainer}>
       <Text style={styles.header}>Attendance for {courseName}</Text>
        <Text style={styles.label}>Select Attendance Status:</Text>
        <RNPickerSelect
            onValueChange={(value) => setAttendanceStatus(value as string)} //Typescript casting
            items={[
                { label: 'Present', value: 'present' },
                { label: 'Absent', value: 'absent' },
                { label: 'Excused', value: 'excused' },
            ]}
            value={attendanceStatus} // Controlled component
            style={pickerSelectStyles} // Use a separate style object
            placeholder={{}} //Removes default place holder.
            useNativeAndroidPickerStyle={false} // Important for consistent styling

        />

        <TouchableOpacity style={styles.button} onPress={handleAttendanceSubmit}>
          <Text style={styles.buttonText}>Submit Attendance</Text>
        </TouchableOpacity>

          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Text style={styles.buttonText}>Back</Text>
          </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#E0E7E9',
     paddingTop: 50,
  },
    header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#354649', // Dark grey for contrast
    textAlign: 'center'
    },
  formContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 8,
      width: '90%', // Use percentages for responsiveness
    maxWidth: 500,   // Limit maximum width
     shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
    shadowRadius: 4,
      elevation: 3, // For Android shadow
     alignSelf: 'center'
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
  },
  button: {
    backgroundColor: '#2CBFAE',
    padding: 15,
    borderRadius: 5,
    marginBottom: 10,
      alignItems: 'center'
  },
    backButton: {
      backgroundColor: '#808080', // Or any color you prefer for a "cancel/back" action.
      padding: 15,
      borderRadius: 5,
      alignItems: 'center'
    },
    buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center' // Center the button text.
    },
    loadingContainer: { // Add loading container styles
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E0E7E9'
  }

});
//Separate style for picker, due to react-native-picker-select's styling limitations.
const pickerSelectStyles = StyleSheet.create({
  inputIOS: { // Style for iOS
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    color: 'black',
    paddingRight: 30, // to ensure the text is never behind the icon
    marginBottom: 20,
     textAlign: 'center',
     zIndex: 99,
  },
  inputAndroid: { // Style for Android
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    color: 'black',
    marginBottom: 20,
     textAlign: 'center'
  },
});

export default AttendancePage;