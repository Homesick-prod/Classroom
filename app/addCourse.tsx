import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  FlatList,
  ActivityIndicator
} from 'react-native';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getDatabase, ref, set, onValue, off, get } from 'firebase/database';
import { useRouter } from 'expo-router';
import app from './firebase';
// Import Ionicons or another icon library of your choice
import { Ionicons } from '@expo/vector-icons';

interface Course {
  courseId: string;
  name: string;
  classroom: string;
}

interface Props {}

const AddCourse: React.FC<Props> = () => {
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const auth = getAuth(app);
  const db = getDatabase(app);

  useEffect(() => {
    const coursesRef = ref(db, 'courses');

    const unsubscribeCourses = onValue(coursesRef, (snapshot) => {
      if (snapshot.exists()) {
        const coursesData = snapshot.val();
        const coursesArray: Course[] = Object.keys(coursesData).map(key => ({
          courseId: key,
          ...coursesData[key]
        }));
        setAvailableCourses(coursesArray);
      } else {
        setAvailableCourses([]);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching courses:", error);
      Alert.alert("Error", "Failed to fetch courses.");
      setLoading(false);
    });

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace('/');
      }
    });

    return () => {
      unsubscribeCourses();
      unsubscribeAuth();
    };
  }, [db, router]);

  const handleAddCourse = async (courseId: string, courseName: string, classroomName: string) => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Error", "User not signed in.");
      return;
    }

    try {
      const userCourseRef = ref(db, `users/${user.uid}/classroom/${courseId}`);

      const existingCourseSnapshot = await get(userCourseRef);
      if (existingCourseSnapshot.exists()) {
        Alert.alert("Error", "This course is already in your list.");
        return;
      }

      await set(userCourseRef, {
        courseId: courseId,
        name: courseName,
        classroom: classroomName,
      });
      Alert.alert("Success", "Course added to your list!");
      router.back();

    } catch (error: any) {
      console.error("Error adding course:", error);
      Alert.alert("Error", `Failed to add course: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2CBFAE" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.h2}>Select a Course to Add</Text>
      <FlatList
        data={availableCourses}
        keyExtractor={(item) => item.courseId}
        renderItem={({ item }) => (
          <View style={styles.courseItem}>
            <Text style={styles.courseName}>{item.name}</Text>
            <Text style={styles.courseClassroom}>{item.classroom}</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => handleAddCourse(item.courseId, item.name, item.classroom)}
            >
              <Text style={styles.buttonText}>Add</Text>
            </TouchableOpacity>
          </View>
        )}
      />
      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.replace('/dashboard')} // Use router.replace
      >
        <Ionicons name="arrow-back" size={24} color="white" />
        <Text style={styles.backButtonText}>Back to Dashboard</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#E0E7E9',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  h2: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#354649',
  },
  courseItem: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  courseName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  courseClassroom: {
    fontSize: 16,
    color: '#666',
  },
  addButton: {
    backgroundColor: '#2CBFAE',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    alignItems: 'center'
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold'
  },
  backButton: {  // Styles for the back button
    flexDirection: 'row', // Arrange icon and text horizontally
    backgroundColor: '#354649',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center', // Center the content
    marginTop: 20,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10, // Add space between icon and text
  },
});

export default AddCourse;