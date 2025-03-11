// AddCourse.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getDatabase, ref, push, set } from 'firebase/database';
import { initializeApp } from 'firebase/app';  // Import if initializing here (better in firebase.ts)
import * as ImagePicker from 'expo-image-picker';
import { MediaTypeOptions } from 'expo-image-picker'; // Import MediaTypeOptions separately
import { useRouter } from 'expo-router';
import app from './firebase'; // Import the initialized app

interface Props {}

const AddCourse: React.FC<Props> = () => {
  const [courseName, setCourseName] = useState('');
  const [classroomName, setClassroomName] = useState('');
  const [image, setImage] = useState<string | null>('default-course.jpg'); // Store image URI. default-course.jpg should be in assets folder
  const [loading, setLoading] = useState(true);  // Add a loading state
  const router = useRouter();
  const auth = getAuth(app);  // Get auth from initialized app
  const db = getDatabase(app); // Get db from initialized app


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace('/'); // Redirect to login/signup
      } else {
        setLoading(false); // User is authenticated, stop loading
      }
    });
    return () => unsubscribe(); // Cleanup
  }, [auth, router]);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: MediaTypeOptions.Images, 
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
      base64: true, 
    });

      if (!result.canceled && result.assets && result.assets.length > 0) {
          // Use the base64 string from the first asset in the assets array.
        setImage('data:image/jpeg;base64,' + result.assets[0].base64);
    }
  };

  const saveCourse = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
          Alert.alert("Error", "User not signed in."); // Use Alert from react-native
          return;
      }

      const courseRef = ref(db, `users/${user.uid}/classroom`);
      const newCourseRef = push(courseRef); // Firebase creates a unique ID
      const courseId = newCourseRef.key; // Get the generated courseId

      let imageToSave = image;
      if (!imageToSave || imageToSave === 'default-course.jpg') {
          imageToSave = 'default-course.jpg'; // Or some default URL, or just leave it undefined
      }

      await set(newCourseRef, {
        courseId: courseId, // Save the courseId
        name: courseName,
        classroom: classroomName,
        image: imageToSave, // Save base64 string
      });

      Alert.alert('Success', 'Course saved successfully!');
      router.replace('/dashboard'); // Use expo-router
    } catch (error: any) {
      console.error('Error saving course:', error);
      Alert.alert('Error', `Error saving course: ${error.message}`);
    }
  };

   if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }


  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.h2}>Add New Course</Text>

        <TextInput
          style={styles.input}
          placeholder="Course Name"
          value={courseName}
          onChangeText={setCourseName}
          placeholderTextColor="#9e9e9e"  // Good practice for placeholders
        />

        <TextInput
          style={styles.input}
          placeholder="Classroom Name"
          value={classroomName}
          onChangeText={setClassroomName}
          placeholderTextColor="#9e9e9e"
        />

        <TouchableOpacity style={styles.fileInput} onPress={pickImage}>
          <Text style={styles.fileInputText}>Choose Course Image</Text>
        </TouchableOpacity>

        <Image source={{ uri: image || 'default-course.jpg' }} style={styles.previewImage} />


        <TouchableOpacity style={styles.button} onPress={saveCourse}>
          <Text style={styles.buttonText}>Save Course</Text>
        </TouchableOpacity>

      </View>
    </ScrollView>
  );
};
const styles = StyleSheet.create({
    container: {
        flexGrow: 1, // Important:  Use flexGrow with ScrollView
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#E0E7E9',
        paddingTop: 50, // Add padding for content below the tabs (if you keep the tabs)
    },
    formContainer: {
        backgroundColor: 'white',
        padding: 30,
        width: '90%', // Responsive width
        maxWidth: 500,   // But limit the maximum width
        borderRadius: 8,
        boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)', // Use string for boxShadow
        alignItems: 'center' // Center the content horizontally.
    },
    h2: {
        marginBottom: 30,       // More margin
        color: '#354649',
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center' // Add this
    },
    input: {
        width: '100%',
        padding: 12,
        marginVertical: 10,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 5,
        textAlign: 'center',
        fontSize: 16, // Good practice to set font size
        boxSizing: 'border-box', // Include padding and border
    },
    button: {
        backgroundColor: '#2CBFAE',
        padding: 15,
        borderRadius: 8,
        width: '100%', // Full width within its container
        marginTop: 20,
    },
      buttonText: {
        color: 'white',
        textAlign: 'center',
        fontSize: 18,          // Make font size consistent
        fontWeight: 'bold'    // Add some weight
    },
    fileInput: {
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        maxWidth: 250,
        marginVertical: 10, // Use marginVertical
        borderWidth: 2,
        borderColor: '#2CBFAE',
        borderStyle: 'dashed',
        borderRadius: 10,
        padding: 10,
        backgroundColor: 'white',
    },
    fileInputText: {
      color: '#2CBFAE',
      fontWeight: 'bold'
    },
    previewImage: {
        width: 150,
        height: 150,  // Set explicit height
        marginTop: 10,
        resizeMode: 'cover', // Or 'contain', depending on needs
        borderRadius: 8 // consistent with form elements
    },

});

export default AddCourse;