// CourseDetail.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator
} from 'react-native';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getDatabase, ref, get, remove, onValue } from 'firebase/database';
import { initializeApp } from 'firebase/app'; // If you're initializing here
import { useRouter, useLocalSearchParams } from 'expo-router';
import app from './firebase'; // Import Firebase config
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faUserPlus, faPlus, faTrash, faEdit } from '@fortawesome/free-solid-svg-icons';

library.add(faUserPlus, faPlus, faTrash, faEdit);


interface CourseData {
  name: string;
  classroom: string;
  image?: string; // Optional image
}

interface Person { // Define interface for Person
  name: string;
  email?: string; // Email might not always be available
}

interface Question { //Define interface for question
    title: string;
    details: string;
    timestamp: string;
}

interface ForumPost {
    title: string;
    content: string;
    author: string;
    timestamp: number;
}


const CourseDetail: React.FC = () => {
  const { courseId } = useLocalSearchParams<{ courseId?: string }>();
  const [courseData, setCourseData] = useState<CourseData | null>(null);
  const [activeTab, setActiveTab] = useState<'stream' | 'question' | 'people'>('stream');
    const [people, setPeople] = useState<Record<string, Person>>({});  // Store people as an object
    const [questions, setQuestions] = useState<Record<string,Question>>({});
    const [forumPosts, setForumPosts] = useState<Record<string, ForumPost>>({}); // Add forum posts state
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const auth = getAuth(app);
  const db = getDatabase(app);

    const fetchCourseData = useCallback(async () => {
        if (!courseId) {
            Alert.alert("Error", "Course ID is required.");
            router.back();
            return;
        }

        const courseRef = ref(db, `courses/${courseId}`); // Assuming courses are directly under 'courses'
        try {
            const snapshot = await get(courseRef);
            if (snapshot.exists()) {
                setCourseData(snapshot.val());
            } else {
                Alert.alert("Error", "Course not found.");
                router.back();
            }
        } catch (error: any) {
            Alert.alert("Error", `Failed to fetch course data: ${error.message}`);
        }
    }, [courseId, db, router]);

  const loadPeople = useCallback(async () => {
    if (!courseId) return;

    const peopleRef = ref(db, `people/${courseId}`);
      try {
          const snapshot = await get(peopleRef); // Use onValue for real-time updates
          if (snapshot.exists()) {
            setPeople(snapshot.val());
          } else {
            setPeople({}); // No people in this course
          }

      } catch(error: any) {
          //console.error("Error fetching people:", error);
          //Alert.alert("Error", `Failed to load people data: ${error.message}`);
      }

  }, [courseId, db]);

  const loadQuestion = useCallback(async () => {
      if(!courseId) return;

      const questionsRef = ref(db, 'questions/' + courseId);
      try{
          const snapshot = await get(questionsRef);
          if (snapshot.exists()) {
              setQuestions(snapshot.val())
          } else {
              setQuestions({}); // No question in this course
          }
      } catch (error: any) {
          console.error("Error fetching question:", error);
          Alert.alert("Error", `Failed to load question data: ${error.message}`);
      }
  }, [courseId, db])

    const loadForumPosts = useCallback(async () => {
        if (!courseId) return;

        const forumRef = ref(db, `forum/${courseId}`);
        try {
            const snapshot = await get(forumRef);  //Use get() one-time
            if (snapshot.exists()) {
                setForumPosts(snapshot.val());
            } else {
                setForumPosts({}); // No forum posts
            }
        } catch (error: any) {
           console.error("Error fetching forum posts", error);
           Alert.alert("Error", `Failed to load forum posts: ${error.message}`);
        }

    }, [courseId, db]);



    const editPerson = (personId: string) => {
        if(!courseId) return;
      router.push(`/editPeople?courseId=<span class="math-inline">\{courseId\}&personId\=</span>{personId}`);
    };

    const deletePerson = async (personId: string) => {
      if (!courseId) return;
        Alert.alert(
            "Delete Person",
            "Are you sure you want to delete this person?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const personRef = ref(db, `people/<span class="math-inline">\{courseId\}/</span>{personId}`);
                            await remove(personRef);
                            // You could reload people here, but onValue will handle it
                              Alert.alert("Success", "Deleted")
                        } catch (error: any) {
                            console.error("Error deleting person:", error);
                            Alert.alert("Error", `Failed to delete person: ${error.message}`);
                        }
                    }
                }
            ]

        )

    };
      const editQuestion = (questionId: string) => {
          if(!courseId) return;
        router.push(`/editWork?courseId=<span class="math-inline">\{courseId\}&questionId\=</span>{questionId}`);
    };


    const deleteQuestion = async (questionId: string) => {
        if(!courseId) return;
      Alert.alert(
        "Delete Question",
        "Are you sure you want to delete this question?",
          [
              { text: "Cancel", style: "cancel" },
              {
                  text: "Delete",
                  style: "destructive",
                  onPress: async() => {
                      try {
                          const questionRef = ref(db, 'questions/' + courseId + '/' + questionId);
                          await remove(questionRef);
                          // onValue will handle updating the UI
                      } catch (error: any) {
                          console.error('Error deleting question:', error);
                          Alert.alert("Error",`Error deleting question: ${error.message}`);
                      }
                  }
              }
          ]
      )
    };



  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace('/'); // Redirect to login
      } else {
        setLoading(false);  // Set loading to false once auth is confirmed
      }
    });
      // Fetch course data and people data when component mounts or courseId changes.
        if(courseId){
            fetchCourseData();
            loadPeople();
            loadQuestion();
            loadForumPosts(); // Load forum posts
        }


    return () => {
      unsubscribe(); // Cleanup auth listener
    };
  }, [auth, courseId, router, fetchCourseData, loadPeople, loadQuestion, loadForumPosts]); // Include loadForumPosts

  const handleAddPeople = () => {
      if (!courseId) return; // Ensure courseId is available
      router.push(`/addPeople?courseId=${courseId}`);
  };
  const handleAddQuestion = () => {
        if (!courseId) return; // Ensure courseId is available
        router.push(`/askQuestion?courseId=${courseId}`);
  }

  const handleAddForumPost = () => {
    if (!courseId) return;
    router.push(`/addForumPost?courseId=${courseId}`);
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2CBFAE" />
      </View>
    );
  }


  return (
    <ScrollView style={styles.container}>

      <View style={styles.tabs}>
        <TouchableOpacity onPress={() => setActiveTab('stream')}>
          <Text style={[styles.tab, activeTab === 'stream' && styles.activeTab]}>Stream</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab('question')}>
          <Text style={[styles.tab, activeTab === 'question' && styles.activeTab]}>Question</Text>
        </TouchableOpacity>
      </View>

      {/* Content based on active tab */}
      {activeTab === 'stream' && (
        <View style={styles.content}>
          {courseData ? (
            <>
              <Text style={styles.courseName}>{courseData.name}</Text>
              {courseData.image && (
                <Image source={{ uri: courseData.image }} style={styles.courseImage} />
              )}
              <Text style={styles.courseClassroom}>Classroom: {courseData.classroom}</Text>
            </>
          ) : (
            <Text>Course data not found.</Text>
          )}

        {/* Display Forum Posts */}
        <View style={styles.forumSection}>
            <Text style={styles.sectionHeader}>Forum Posts</Text>
            {Object.keys(forumPosts).length > 0 ? (
                Object.entries(forumPosts).map(([postId, post]) => (
                <View key={postId} style={styles.forumPostItem}>
                    <Text style={styles.forumPostTitle}>{post.title}</Text>
                    <Text style={styles.forumPostContent}>{post.content}</Text>
                    <Text style={styles.forumPostAuthor}>
                    Posted by: {post.author} on {new Date(post.timestamp).toLocaleString()}
                    </Text>
                </View>
            ))
            ) : (
            <Text>No forum posts yet.</Text>
           )}
        </View>
            <TouchableOpacity style={styles.button} onPress={handleAddQuestion}>
              <FontAwesomeIcon icon={faPlus} size={20} color="white" />
              <Text style={styles.buttonText}>  Add Question</Text>
          </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => router.back()}>
              <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      )}

      {activeTab === 'question' && (
        <View style={styles.content}>
            <Text style={styles.sectionHeader}>Question</Text>
          {/* Display Questions */}
          {Object.keys(questions).length > 0 ? (
            Object.entries(questions).map(([questionId, question]) => (
                <View key={questionId} style={styles.questionItem}>
                    <Text style={styles.questionTitle}>{question.title}</Text>
                    <Text style={styles.questionDetails}>{question.details}</Text>
                    <Text style={styles.questionTimestamp}>{question.timestamp}</Text>
                </View>
            ))
          ) : (
            <Text>No questions available for this course.</Text>
          )}

        </View>
      )}

      {activeTab === 'people' && (
        <View style={styles.content}>
            <Text style={styles.sectionHeader}>People</Text>
          {/* Display People in the Course */}
          {Object.keys(people).length > 0 ? (
            Object.entries(people).map(([personId, person]) => (
              <View key={personId} style={styles.personItem}>
                  <Text style={styles.personName}>{person.name}</Text>
                  <Text style={styles.personEmail}>Email: {person.email || 'Not provided'}</Text>
                  <View style={styles.personActions}>
                    <TouchableOpacity style={[styles.button, styles.editButton]} onPress={()=>editPerson(personId)}>
                        <FontAwesomeIcon icon={faEdit} size={20} color="white"/>
                        <Text style={styles.buttonText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity  style={[styles.button, styles.deleteButton]} onPress={()=>deletePerson(personId)}>
                        <FontAwesomeIcon icon={faTrash} size={20} color="white"/>
                        <Text style={styles.buttonText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
              </View>

            ))
          ) : (
            <Text>No people added to this course yet.</Text>
          )}
        </View>
      )}
    </ScrollView>
  );
};
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#E0E7E9',
    },
    header: {
        backgroundColor: '#2CBFAE',
        padding: 15,
        textAlign: 'center',
        color: 'white',
        fontSize: 24,
    },
    tabs: {
        flexDirection: 'row',
        justifyContent: 'center',
        backgroundColor: 'white',
        paddingVertical: 10,
        borderBottomWidth: 2,
        borderBottomColor: '#ddd',
    },
    tab: {
        padding: 15,
        marginHorizontal: 10, // Use marginHorizontal for left/right spacing
        color: 'black',
        fontWeight: 'bold',
    },
    activeTab: {
        color: '#2CBFAE',
        borderBottomWidth: 3, // Underline active tab
        borderBottomColor: '#2CBFAE',
        paddingBottom: 7, // Adjust as needed
    },
    content: {
        padding: 20,
    },
      courseName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
        textAlign: 'center'
  },
  courseClassroom: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
        textAlign: 'center'
  },
    courseImage: {
        width: '100%', // or a specific width
        height: 200, // Set a fixed height
        resizeMode: 'cover',
        marginBottom: 20,
        borderRadius: 8
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 20,
    },
    button: {
        padding: 10,
        margin: 5,
        borderRadius: 5,
        backgroundColor: '#2CBFAE',
        flexDirection: 'row',
        alignItems: 'center', // Center icon and text
        justifyContent: 'center',
        minWidth: 100
    },
    buttonText:{
        color: 'white',
        marginLeft: 5,
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center'

    },
      addPeopleButton: {
    backgroundColor: '#5C6BC0',
    // Other styles
  },
  addQuestionButton: {
    backgroundColor: '#EC407A',
    // Other styles
  },
    goBackButton: {
    backgroundColor: '#673AB7',
    // Other styles
    },
    menuContainer: {
        position: 'absolute',
        top: 10,
        right: 10,
    },
    menuButton: {
        backgroundColor: '#E0E7E9',
        borderWidth: 0,
        fontSize: 24,
        padding: 10,
        borderRadius: 5,
    },
    dropdownMenu: {
        position: 'absolute',
        right: 0,
        top: 50,
        backgroundColor: 'white',
        width: 150,
        borderRadius: 5,
        display: 'none', // Hidden by default
        flexDirection: 'column',
    },
    show: {
        display: 'flex',
    },
   dropdownButton: {
    width: '100%',
    padding: 10,
    borderWidth: 0, // Use borderWidth instead of border
    backgroundColor: 'transparent',
    textAlign: 'left',
    cursor: 'pointer', // Not directly applicable in React Native, but good for web
  },
    sectionHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 20,
  },
  personItem: {
    backgroundColor: '#f9f9f9',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
    personName: {
        fontSize: 16,
        fontWeight: 'bold'
    },
    personEmail: {
    fontSize: 14,
    color: '#666',
  },
    personActions: {
    flexDirection: 'row',
    marginTop: 5,
  },
   questionItem: {
    backgroundColor: '#f9f9f9',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
      borderBottomWidth: 1,
      borderBottomColor: '#ddd',
    },
    questionTitle: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    questionDetails: {
      fontSize: 14,
      color: '#666',
    },
    questionTimestamp: {
      fontSize: 12,
      color: '#999',
    },
      questionActions: {
          flexDirection: 'row',
          marginTop: 5,
      },
      editButton: {
          backgroundColor: '#2CBFAE', // Example color, change as needed
          marginRight: 5,
      },

    deleteButton: {
        backgroundColor: '#f44336', // Example color (red), change as needed
  },
      loadingContainer: { // Style for loading indicator
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    forumSection: {
        marginTop: 20,
        padding: 10,
        backgroundColor: '#EEF1F0FF',
        borderRadius: 8,
    },
  forumPostItem: {
        backgroundColor: '#fff',
        padding: 10,
        marginBottom: 10,
        borderRadius: 5,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    forumPostTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    forumPostContent: {
         fontSize: 14,
    },
    forumPostAuthor: {
        fontSize: 12,
        color: '#888',
        marginTop: 4
    }
});

export default CourseDetail;