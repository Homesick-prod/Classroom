import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getDatabase, ref, push, set, get } from 'firebase/database'; //Import get
import { useRouter, useLocalSearchParams } from 'expo-router';
import app from './firebase'; // Import your Firebase configuration

interface Props {}

const AskQuestion: React.FC<Props> = () => {
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const router = useRouter();
  const { courseId } = useLocalSearchParams<{ courseId?: string }>(); // Get courseId

  const auth = getAuth(app);
  const db = getDatabase(app);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace('/'); // Redirect to login if not authenticated
      }
    });

    return () => unsubscribe();
  }, [auth, router]);


  const submitQuestion = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Error", "User not signed in.");
        return;
      }

      if (!courseId) {
        Alert.alert("Error", "No course selected.");
        router.back();
        return;
      }

      const questionsRef = ref(db, `questions/${courseId}`);
      const newQuestionRef = push(questionsRef); // Generate unique ID
      const questionId = newQuestionRef.key;
      if(!questionId) return;

      // Get user data for display name
      const userRef = ref(db, `users/${user.uid}`);
      const userSnapshot = await get(userRef);  // Use the imported get function

      if (!userSnapshot.exists()) { //Check user data
        Alert.alert("Error", "User data not found.");
        return;
      }
        const userData = userSnapshot.val();
        const userName = userData.name || 'Anonymous'; // Use the username if not empty.


      await set(newQuestionRef, { // Use set with newQuestionRef
        title: title,
        details: details,
        timestamp: new Date().toISOString(),
        userId: user.uid,
        userName: userName, // Store display name
        questionId: questionId //store question id
      });

      Alert.alert('Success', 'Your question has been submitted successfully!');
      router.back(); // Go back to the previous screen

    } catch (error: any) {
      console.error('Error submitting question:', error);
      Alert.alert('Error', `Failed to submit question: ${error.message}`);
    }
  };

    const handleCancel = () => {
        router.back();
    }


  return (
    <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.formContainer}>
          <Text style={styles.header}>Ask a Question</Text>

          <TextInput
            style={styles.input}
            placeholder="Question Title"
            value={title}
            onChangeText={setTitle}
             placeholderTextColor="#9e9e9e"
            required  // Consider making fields required
          />

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Question Details"
            value={details}
            onChangeText={setDetails}
            multiline
            numberOfLines={5}
            required
          />

          <TouchableOpacity style={styles.button} onPress={submitQuestion}>
            <Text style={styles.buttonText}>Submit Question</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={handleCancel}>
                <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1, // Important:  Use flexGrow with ScrollView
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#E0E7E9',
        paddingTop: 50, // Adjust if you have a header/tabs
    },
    formContainer: {
        backgroundColor: 'white',
        padding: 30,
        width: '90%', // Use percentage for responsiveness
        maxWidth: 500,   // Limit maximum width
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5, // For Android shadow
        alignItems: 'center' // Center the content horizontally.
    },
    header: {
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
        fontSize: 16 // Good practice to set font size
    },
    textArea: {
        height: 150, // More appropriate height for a text area
        textAlignVertical: 'top', // Important for multiline text
    },
   button: {
        backgroundColor: '#2CBFAE',
        padding: 15, // Make button larger
        borderRadius: 8,
        width: '100%', // Full width within its container
         marginTop: 10,
         alignItems: 'center'
    },
     cancelButton: {
        backgroundColor: '#808080', // Different color for cancel
         marginTop: 20,
    },
    buttonText: {
        color: 'white',
        textAlign: 'center',
        fontSize: 18,          // Make font size consistent
        fontWeight: 'bold'    // Add some weight
    },

});

export default AskQuestion;