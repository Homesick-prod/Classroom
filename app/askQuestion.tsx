// askQuestion.tsx
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
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getDatabase, ref, push } from 'firebase/database';
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
          router.replace('/dashboard')
          return;
      }

      const questionsRef = ref(db, `questions/${courseId}`);
      await push(questionsRef, {
        title: title,
        details: details,
        timestamp: new Date().toISOString(),
        userId: user.uid, // Store the user ID
        userName: user.displayName || 'Anonymous', // Store user's display name or a default
      });

      Alert.alert('Success', 'Your question has been submitted successfully!');
      router.replace('/dashboard') // Go back to the previous screen (likely the course detail)


    } catch (error:any) {
      console.error('Error submitting question:', error);
      Alert.alert('Error', `Failed to submit question: ${error.message}`);
    }
  };

    const handleCancel = () => {
        router.replace('/dashboard')
    }


  return (
    <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"} // Adjust behavior based on OS
        style={styles.container}
        >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.formContainer}>
          <Text style={styles.header}>Ask a Question</Text>

          <TextInput
            style={styles.input}
            placeholder="Question Title"
            value={title}
            onChangeText={setTitle}
            required
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
        flex: 1,
        backgroundColor: '#E0E7E9',
        justifyContent: 'center', // Vertically center (for KeyboardAvoidingView)
    },
    scrollContainer: {
      flexGrow: 1, // Important for ScrollView to work within KeyboardAvoidingView
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: 50,
    },
    formContainer: {
        backgroundColor: 'white',
        padding: 30,
        width: '90%', // Use percentage for responsiveness
        maxWidth: 500,   // Limit maximum width
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5, // for Android shadow
    },
  header: {
    marginBottom: 20, // Added a bit more margin
    color: '#354649',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center', // Ensure text is centered
  },
  input: {
    width: '100%',
    padding: 12,
    marginVertical: 10, // Use marginVertical for top/bottom spacing
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
     textAlign: 'center',
  },
  textArea: {
    height: 150, // More appropriate height for a text area
    textAlignVertical: 'top', // Important for multiline text
  },
  button: {
    backgroundColor: '#2CBFAE',
    padding: 12,
    borderRadius: 5,
    marginTop: 10,
    alignItems: 'center', // Center text horizontally
  },
    cancelButton: {
     backgroundColor: '#808080',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },

});

export default AskQuestion;