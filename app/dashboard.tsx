import React, { useState, useEffect, useRef } from 'react'; // Import useRef
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Platform
} from 'react-native';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { getDatabase, ref, onValue, remove } from 'firebase/database';
//import { initializeApp } from 'firebase/app'; // REMOVE: Initialized in firebase.ts
import { useRouter } from 'expo-router';
import app from './firebase';  // Import correctly
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faPlus, faQrcode, faQuestion, faCheckSquare, faEdit, faTrash, faArrowRight, faBars, faUserEdit, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';

library.add(faPlus, faQrcode, faQuestion, faCheckSquare, faEdit, faTrash, faArrowRight, faBars, faUserEdit, faSignOutAlt);


interface Course {
  courseId: string;
  name: string;
  classroom: string;
  image?: string; // Image is optional
}

interface Props {}

const Dashboard: React.FC<Props> = () => {
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false); // State for showing/hiding menu
  const router = useRouter();
  const auth = getAuth(app);
  const db = getDatabase(app);
  const menuRef = useRef<View>(null); // Ref for the menu container


  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {


        const coursesRef = ref(db, `users/${user.uid}/classroom`);
        setUserName(user.displayName || 'User');
        setUserEmail(user.email || '');
        // Use onValue for real-time updates
        const unsubscribeCourses = onValue(coursesRef, (snapshot) => {
          if (snapshot.exists()) {
            const coursesData = snapshot.val();
            // Convert to array
            const coursesArray: Course[] = Object.keys(coursesData).map(key => ({
              courseId: key, // Use the key as courseId
              ...coursesData[key]
            }));
            setCourses(coursesArray);
          } else {
            setCourses([]); // No courses found
          }
          setLoading(false);
        }, (error) => { // Add error handling
          console.error("Error fetching courses:", error);
          Alert.alert("Error", "Failed to fetch courses.");
          setLoading(false);
        });

        return () => {
            unsubscribeCourses(); // Cleanup course listener
        };

      } else {
        router.replace('/'); // Redirect to login
      }
    });

    return () => unsubscribeAuth(); // Cleanup auth listener
  }, [auth, db, router]);



  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace('/');
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to log out.');
    }
  };

    const toggleMenu = () => {
        setShowMenu(!showMenu);
    };

    const handleDeleteCourse = async (courseId: string) => {
    Alert.alert(
      "Delete Course",
      "Are you sure you want to delete this course?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {  // Define onPress here
            try {
              const user = auth.currentUser;
              if (!user) {
                Alert.alert("Error", "User not signed in.");
                return;
              }
              const courseRef = ref(db, `users/${user.uid}/classroom/${courseId}`);
              await remove(courseRef);
              // onValue listener will handle updating the UI

            } catch (error: any) {
              console.error("Error deleting course:", error);
              Alert.alert("Error", `Failed to delete course: ${error.message}`);
            }
          }
        }
      ]
    );
  };
  const handleGoToCourse = (courseId: string) => {
      router.push(`/courseDetail?courseId=${courseId}`);
  };
  const handleAddCourse = () => {
      router.push('/addCourse');
  }
    const handleQuestion = (courseId: string) => {
    // **CORRECTED**: Added / before askQuestion
    router.push(`/askQuestion?courseId=${courseId}`); // Pass courseId
  };
    const handleEditCourse = (courseId: string) => {
    router.push(`/editCourse?courseId=${courseId}`);
  };
    const handleAttendance = (courseId: string) => {
      router.push(`/attendance?courseId=${courseId}`);
    };
    const handleQRCode = (courseId: string) => {
      router.replace(`/qrCode?courseId=${courseId}`); // CORRECT - passing the parameter
    };

 useEffect(() => {
    const handleClickOutside = (event: any) => {
        // Check if the click is outside the menu
        if (showMenu && menuRef.current && !menuRef.current.contains(event.target as Node)) {
            setShowMenu(false);
        }
    };

    // Listen for clicks on the window (for web) or on the root view (for native)
    const eventTarget: EventTarget = Platform.OS === 'web' ? window : menuRef.current;

    if (showMenu) {
       if (Platform.OS === 'web') {
            document.addEventListener('click', handleClickOutside); // Use document for web
        } else {
           //For React Native, use a different approach
            //We cannot directly add a click listener to the entire screen.
            //Instead, we rely on the wrapping <TouchableWithoutFeedback> in the render method.
        }
    }

    return () => {
        if (Platform.OS === 'web') {
        document.removeEventListener('click', handleClickOutside); // Cleanup for web
        }
    };
}, [showMenu]);  // Depend on showMenu

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
        <View style={styles.header}>
            <Text style={styles.headerText}>Dashboard</Text>
                <View style={styles.menuContainer} ref={menuRef}>
                    <TouchableOpacity style={styles.menuButton} onPress={toggleMenu}>
                        <FontAwesomeIcon icon="bars" size={24} color="#2cbfae" />
                    </TouchableOpacity>


                </View>

        </View>

        <View  style={[styles.dropdownMenu, showMenu ? styles.show : null]}>
                        <TouchableOpacity  style={styles.dropdownButton} onPress={() => router.replace('/editProfile')}>
                            <FontAwesomeIcon icon={faUserEdit} size={20}  />
                            <Text style={styles.dropdownButtonText}>Edit Profile</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.dropdownButton} onPress={handleAddCourse}>
                            <FontAwesomeIcon icon={faPlus} size={20}  />
                            <Text style={styles.dropdownButtonText}>Add Course</Text>
                        </TouchableOpacity>
                        <TouchableOpacity  style={styles.dropdownButton} onPress={handleLogout}>
                            <FontAwesomeIcon icon={faSignOutAlt} size={20}  />
                            <Text style={styles.dropdownButtonText}>Logout</Text>
                        </TouchableOpacity>
                    </View>
      <View style={styles.profileSection}>
        <Text style={styles.profileText}>Name: {userName}</Text>
        <Text style={styles.profileText}>Email: {userEmail}</Text>
      </View>

      <View style={styles.coursesSection}>
        <Text style={styles.coursesHeader}>Your Courses</Text>
        {courses.length === 0 ? (
          <Text style={styles.noCoursesText}>No courses found.</Text>
        ) : (
          courses.map((course) => (
            <View key={course.courseId} style={styles.courseContainer}>
              <Text style={styles.courseTitle}>{course.name}</Text>
              <Text style={styles.courseClassroom}>Classroom: {course.classroom}</Text>
              {/* Display Image with default */}
              {course.image ? (
                <Image source={{ uri: course.image }} style={styles.courseImage} />
              ) : (
                <View style={styles.noImageContainer}>
                  <Text style={styles.noImageText}>No Image</Text>
                </View>
              )}

              <View style={styles.buttonContainer}>
                <TouchableOpacity style={[styles.button, styles.questionButton]} onPress={() => handleQuestion(course.courseId)}>
                  <FontAwesomeIcon icon={faQuestion} size={20} color="white" />
                    <Text style={styles.buttonText}>Question</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, styles.attendanceButton]} onPress={() => handleAttendance(course.courseId)}>
                  <FontAwesomeIcon icon={faCheckSquare} size={20} color="white" />
                  <Text style={styles.buttonText}>Attendance</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, styles.deleteButton]} onPress={() => handleDeleteCourse(course.courseId)}>
                  <FontAwesomeIcon icon={faTrash} size={20} color="white" />
                    <Text style={styles.buttonText}>Delete</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, styles.goToCourseButton]} onPress={() => handleGoToCourse(course.courseId)}>
                  <FontAwesomeIcon icon={faArrowRight} size={20} color="white" />
                    <Text style={styles.buttonText}>Go</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f0f0',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
  header: {
    backgroundColor: '#2CBFAE',
    padding: 24,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    zIndex: 10
  },
  headerText: {
    color: 'white',
    fontSize: 24,
      textAlign: 'center',
    fontWeight: 'bold',
  },
  profileSection: {
    display: 'flex',
    position: 'relative',
    alignItems: 'flex-end',
    padding: 16,
    zIndex: 10,
  },
  profileText: {
    fontSize: 16,
    marginBottom: 8,
  },
  coursesSection: {
    padding: 16,
  },
  coursesHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  noCoursesText: {
    fontStyle: 'italic',
    color: '#888',
  },
  courseContainer: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
    shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  courseClassroom: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
    courseImage: {
        width: '100%', // Make image fill the container width
        height: 200,     // Set a fixed height (adjust as needed)
        resizeMode: 'cover', // Important for how the image scales
        marginBottom: 10,
        borderRadius: 8,
    },
    noImageContainer: {
        width: '100%',
        height: 200,
        backgroundColor: '#ddd',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
        borderRadius: 8,
    },
    noImageText: {
        color: '#666',
    },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap', // Allow buttons to wrap
    justifyContent: 'space-evenly', // Space out buttons
    marginTop: 10,
  },
  button: {
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,      // Space between rows
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40%',         // ~30% width for 3 columns
  },
    buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
        marginLeft: 8,

  },

  // Individual button styles
    qrCodeButton: {
        backgroundColor: '#6E3FC1FF',
    },
    questionButton: {
        backgroundColor: '#F3558AFF',
        width: '40%',
    },
    attendanceButton: {
        backgroundColor: '#5762A4FF',
        width: '40%',
    },
    editButton: {
        backgroundColor: '#2CBFAE',
        
    },
    deleteButton: {
        backgroundColor: '#DC3529FF',
        width: '40%',
    },
  goToCourseButton:{
        backgroundColor: '#F57F5BFF'
    },
    menuContainer: {
        position: 'absolute', // Absolute positioning
        top: 24,            // Adjust as needed
        left: 20,           // Adjust as needed
        zIndex: 100,            // Ensure menu is above other content
    },

    menuButton: {
      backgroundColor: '#ffffff',
        borderWidth: 0, // Remove border
        fontSize: 24,
        color: '#2cbfae',
        cursor: 'pointer',
        borderRadius: 5, // Add if you want rounded corners
        padding: 5,  // Add padding to make it easier to tap
        // Add other styles as needed
    },

    dropdownMenu: {
        display: 'none',      // Hidden by default
        position: 'absolute',
        backgroundColor: 'white',
        boxShadow: '0px 8px 16px 0px rgba(0,0,0,0.2)',
        minWidth: 250,      // Adjust as needed
        zIndex: 2000,               // Ensure it's above other content
        borderRadius: 5,        // Rounded corners
        top: 72,            // Adjust as needed
        left: 20,           // Adjust as needed
        zIndex: 100,
        flexDirection: 'column',
        width: 150,      // Example width, adjust as needed
        // Add other styles as needed
    },
    dropdownButton: {
      width: '100%', // Take up full width of the dropdown
      padding: 12,  // Vertical padding
      borderWidth: 0, // Remove border
      backgroundColor: 'transparent',
      textAlign: 'left', // Align text to the left
      cursor: 'pointer', // Show pointer cursor on hover
      flexDirection: 'row'
    },
    dropdownButtonText:{
      paddingLeft:10,
        color: 'black', // Change the color to your preferred color
        fontSize: 16, // Set the font size to your preference
    },

    show: {
        display: 'flex',
        flexDirection: 'column'
    }

});

export default Dashboard;