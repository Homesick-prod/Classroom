import React, { useState, useRef, useEffect } from 'react';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  FacebookAuthProvider,
  signInWithPopup,
  PhoneAuthProvider,
  RecaptchaVerifier,
  signInWithCredential, GoogleAuthProvider,
} from 'firebase/auth';
import { getDatabase, ref, set } from 'firebase/database';
import { initializeApp } from 'firebase/app';
import { updateUserProfile, app, auth, database } from './firebase';  // Import correctly
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, Platform, KeyboardAvoidingView, Alert, Image, useWindowDimensions } from 'react-native'; // Import and use Dimensions
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import * as ImagePicker from 'expo-image-picker'; // Import ImagePicker


// Font Awesome Imports and Library Setup:
import { library } from '@fortawesome/fontawesome-svg-core';
import { faEye, faEyeSlash, faTimes, faPhone } from '@fortawesome/free-solid-svg-icons';
import { faGoogle, faFacebook } from '@fortawesome/free-brands-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';

library.add(faEye, faEyeSlash, faTimes, faGoogle, faFacebook, faPhone); // Add icons

// Add this line *outside* your component:
WebBrowser.maybeCompleteAuthSession();

interface Props {}

const App: React.FC<Props> = () => {
  // --- State Variables ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [signupUsername, setSignupUsername] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupError, setSignupError] = useState('');
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string | null>(null); // Use string for URI  //This is already there, just showing context


  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [showVerificationCodeInput, setShowVerificationCodeInput] = useState(false);

  const [showSignupForm, setShowSignupForm] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [loading, setLoading] = useState(true); // Add loading state

  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const confirmationResultRef = useRef<any | null>(null);

  const router = useRouter();
    const { width } = useWindowDimensions(); // Get screen width

  // --- Google Sign-In Setup (expo-auth-session) ---
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest(
    {
      clientId: 'YOUR_WEB_CLIENT_ID', // Web Client ID
      iosClientId: 'YOUR_IOS_CLIENT_ID', // iOS Client ID
      androidClientId: 'YOUR_ANDROID_CLIENT_ID', // Android Client ID
    },
  );

    useEffect(() => {
        // Use auth directly here
        const unsubscribe = auth.onAuthStateChanged(user => {
            if (user) {
                // User is signed in
                router.replace("/dashboard")
            }
            setLoading(false); // Stop loading in either case
        });

        return () => unsubscribe(); // Cleanup on unmount
    }, [auth, router]);



  // --- Google Sign-In Handler ---
    useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;

      if (id_token) {
        const credential = GoogleAuthProvider.credential(id_token);
        signInWithCredential(auth, credential)
        .then((result) => {
            const user = result.user;
            console.log("Google login success:", user);
            const userRef = ref(database, `users/${user.uid}`);
                set(userRef, {
                name: user.displayName || 'Google User',
                email: user.email || '',
                photo: user.photoURL || '',
                classroom: {}
                });

            router.replace('/dashboard');

          }).catch((error) => {
          console.error("Google login error:", error);
          setLoginError(`Error: ${error.message}`);
          // Handle errors here, such as displaying a user-friendly message
        });
      }
    }
  }, [response, auth, database, router]); // Correct dependencies

  // --- Helper Functions ---
   const handleTogglePassword = (fieldId: string) => {
    //For React native you do not need handle togle password function.
    //just set secureTextEntry. it handle the hide and unhide.
    //I keep the function for you in case you need, but do not use it.
        if (fieldId == 'password'){
            setPasswordVisible(!passwordVisible);
        }
        else{
            setSignupPasswordVisible(!signupPasswordVisible);
        }
    };

// --- Event Handlers ---
  const handleEmailChange = (text: string) => setEmail(text);
  const handlePasswordChange = (text: string) => setPassword(text);
  const handleSignupUsernameChange = (text: string) => setSignupUsername(text);
  const handleSignupEmailChange = (text: string) => setSignupEmail(text);
  const handleSignupPasswordChange = (text: string) => setSignupPassword(text);
    const handleProfilePictureChange = async () => {
     let result = await ImagePicker.launchImageLibraryAsync({
       mediaTypes: ImagePicker.MediaTypeOptions.All,
       allowsEditing: true,
       aspect: [4, 3],
       quality: 1,
     });

     console.log(result);

     if (!result.canceled) {
       setProfilePicture(result.assets[0].uri); // Correct way to access URI
     }
   };
  const handlePhoneNumberChange = (text: string) => setPhoneNumber(text);
  const handleVerificationCodeChange = (text: string) => setVerificationCode(text);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [signupPasswordVisible, setSignupPasswordVisible] = useState(false);
  // --- Form Submission Handlers ---

  const handleSignIn = () => {
    if (!email || !password) {
      setLoginError('Please enter both email and password');
      return;
    }

    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        console.log("User signed in:", userCredential.user);
        router.replace('/dashboard');

      })
      .catch((error) => {
        console.error("Login error:", error);
        setLoginError(`Error: ${error.message}`);
      });
  };

  const handleShowSignupForm = () => setShowSignupForm(true);

  const handleCloseSignupForm = () => {
    setShowSignupForm(false);
    setSignupError('');
    setSignupSuccess(false);
    // Reset form fields:
    setSignupUsername('');
    setSignupEmail('');
    setSignupPassword('');
    setProfilePicture(null); // Corrected line: Use setProfilePicture, not setProfilePictureFile
  };

  const handleCreateAccount = () => {
    if (!signupUsername || !signupEmail || !signupPassword) {
      setSignupError('Please fill in all fields');
      return;
    }

    const usernameRegex = /^[a-zA-Z0-9_]{3,16}$/;
    if (!usernameRegex.test(signupUsername)) {
      setSignupError('Username must be 3-16 characters and contain only letters, numbers, and underscores');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(signupEmail)) {
      setSignupError('Please enter a valid email address');
      return;
    }

    if (signupPassword.length < 6) {
      setSignupError('Password must be at least 6 characters');
      return;
    }

    createUserWithEmailAndPassword(auth, signupEmail, signupPassword)
      .then((userCredential) => {
        const user = userCredential.user;
        const userRef = ref(database, `users/${user.uid}`);
        return set(userRef, {
          name: signupUsername,
          email: signupEmail,
          photo: '',
          classroom: {}
        })
          .then(() => {
             // Use profilePicture directly, as it's already a URI
            return updateUserProfile(user.uid, signupUsername, profilePicture ? new File([profilePicture], "profilePic.jpg",{type: 'image/jpeg'}) : null);
          })
          .then(() => {
            console.log("User created and profile updated successfully");
            setSignupSuccess(true);
            setTimeout(() => {
              setShowSignupForm(false);
              setSignupSuccess(false); // Also reset the success state
            }, 3000);
          });
      })
      .catch((error) => {
        console.error("Signup error:", error);
        setSignupError(`Error: ${error.message}`);
      });
  };


  const handleShowVerificationModal = () => {
    setShowVerificationModal(true);
  }

  const handleCloseVerificationModal = () => {
    setShowVerificationModal(false);
    setPhoneError('');
    setShowVerificationCodeInput(false);
    setPhoneNumber('');
    setVerificationCode('');
    if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current = null;
    }
  };



const handleSendVerificationCode = async () => {
    if (!phoneNumber || phoneNumber.trim() === '') {
        setPhoneError('Please enter a phone number');
        return;
    }
    if (!recaptchaVerifierRef.current) {
        // Important:  The ID must match an *existing* element ID in your rendered JSX.
        // In React Native, we can't directly add DOM elements like this; we have
        // to render a <View> with the correct ID, and that View must be *present*
        // in the output when this code runs.  We've already done this.
        recaptchaVerifierRef.current = new RecaptchaVerifier(auth,'recaptcha-container', {
            'size': 'normal',
            'callback': (response) => {
                console.log("reCAPTCHA solved", response);
            },
            'expired-callback': () => {
                console.log("reCAPTCHA expired");
                setPhoneError("Please solve the reCAPTCHA again.");
            }
        });
    }
    try{
        await recaptchaVerifierRef.current.render();
    } catch(error){
        console.error("Error rendering reCAPTCHA:", error);
        setPhoneError("Failed to render reCAPTCHA. Please try again.");
    }
    const provider = new PhoneAuthProvider(auth);
    try {
        const confirmationResult = await provider.verifyPhoneNumber(phoneNumber, recaptchaVerifierRef.current);
        confirmationResultRef.current = confirmationResult;  // Corrected line
        setShowVerificationCodeInput(true);
        setPhoneError('');
    } catch (error: any) { // Use type 'any'
        console.error("Phone verification error:", error);
        setPhoneError(`Error: ${error.message}`);
        if (error.code === 'auth/captcha-check-failed') {
            recaptchaVerifierRef.current = null; // Reset on error
        }
    }
};

const handleVerifyCode = () => {
    if (!verificationCode || verificationCode.trim() === '') {
      setPhoneError('Please enter the verification code');
      return;
    }

    if (confirmationResultRef.current) {
      confirmationResultRef.current.confirm(verificationCode) // Use the confirm method
        .then((result) => {
          const user = result.user;
          console.log("Phone login success:", user);

          const userRef = ref(database, `users/${user.uid}`);
          set(userRef, {
            name: user.displayName || 'Phone User',  // Use displayName if available
            email: user.email || '',
            photo: user.photoURL || '',
            classroom: {}
          });

          setShowVerificationModal(false);
          router.replace('/dashboard');  // Use router.replace

        })
        .catch((error: any) => { // Use type any for the error
          console.error("Code verification error:", error);
          setPhoneError(`Error: ${error.message}`);
        });
    } else {
      setPhoneError("Verification process not initiated.");
    }
  };

  const handleFacebookLogin = () => {
    const provider = new FacebookAuthProvider();
    provider.addScope('email');
    provider.addScope('public_profile');

    signInWithPopup(auth, provider)
      .then((result) => {
        const user = result.user;
        console.log("Facebook login success:", user);

        const userRef = ref(database, `users/${user.uid}`);
        set(userRef, {
          name: user.displayName || 'Facebook User',
          email: user.email || '',
          photo: user.photoURL || '',
          classroom: {}
        });

        router.replace('/dashboard');
      })
      .catch((error) => {
        console.error("Facebook login error:", error);
        setLoginError(`Error: ${error.message}`);
      });
  };
if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{flex: 1}}
    >
      <ScrollView contentContainerStyle={styles.body}>

        {/* --- Main Content --- */}
        <View style={[styles.mainContent, width > 767 ? {} : styles.mobileMainContent]}>
          <View style={[styles.loginSection, width > 767 ? {} : styles.mobileSection]}>
            <Text style={styles.h2}>Login to Your Account</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.inputField}
                placeholder="Email"
                value={email}
                onChangeText={handleEmailChange}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#9e9e9e"
              />
            </View>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.inputField}
                placeholder="Password"
                value={password}
                onChangeText={handlePasswordChange}
                secureTextEntry={!passwordVisible}
                placeholderTextColor="#9e9e9e"
              />
               <TouchableOpacity
                    style={styles.togglePassword}
                    onPress={() => setPasswordVisible(!passwordVisible)} // Toggle visibility
                >
                    <FontAwesomeIcon icon={passwordVisible ? faEyeSlash : faEye}  />
                </TouchableOpacity>

            </View>

            {loginError ? <Text style={styles.errorMessage}>{loginError}</Text> : null}
            <TouchableOpacity style={[styles.button, styles.signinButton]} onPress={handleSignIn}>
              <Text style={styles.buttonText}>Sign In</Text>
            </TouchableOpacity>

            <View style={styles.hrContainer}><Text>Or login using social networks</Text></View>


            <View style={[styles.socialLogin, width > 767 ? {} : styles.mobileSocialLogin]}>
             <TouchableOpacity
                style={[styles.button, styles.googleButton, width > 767 ? {} : styles.mobileSocialButton]}
                onPress={() => {
                    if (promptAsync) {
                        promptAsync();
                    } else {
                        Alert.alert("Error", "Failed to load authentication methods.");
                    }
                }}
                disabled={!request}
                >
                <FontAwesomeIcon icon={['fab', 'google']}  />
                <Text style={[styles.buttonText, width > 767 ? {} : {fontSize: 13}]}>Google</Text>
                </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.facebookButton, width > 767 ? {} : styles.mobileSocialButton]} onPress={handleFacebookLogin}>
              <FontAwesomeIcon icon={['fab', 'facebook']}  />
                <Text style={[styles.buttonText, width > 767 ? {} : {fontSize: 13}]}>Facebook</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.phoneButton, width > 767 ? {} : styles.mobileSocialButton]} onPress={handleShowVerificationModal}>
              <FontAwesomeIcon icon={['fas', 'phone']}   />
                <Text style={[styles.buttonText, width > 767 ? {} : {fontSize: 13}]}> Phone</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.signupSection,  width > 767 ? {} : styles.mobileSection]}>
            <Text style={styles.h2}>New Here?</Text>
            <Text style={styles.p}>Sign up and discover a great amount of new opportunities!</Text>
            <TouchableOpacity style={[styles.button, styles.signupButton]} onPress={handleShowSignupForm}>
              <Text style={[styles.buttonText, {color: '#2CBFAE'}]}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>


        {/* --- Overlay --- */}
        <TouchableOpacity
            style={[styles.overlay, (showSignupForm || showVerificationModal) && styles.activeOverlay]}
            onPress={showSignupForm ? handleCloseSignupForm : handleCloseVerificationModal}
            activeOpacity={1}
            >
        </TouchableOpacity>


        {/* --- Signup Form Modal --- */}
        {showSignupForm && (
          <View style={[styles.modal, styles.signupForm, showSignupForm ? styles.activeModal : null, width > 767 ? {} : styles.mobileModal]}>
          <FontAwesomeIcon icon={faTimes} style={styles.closeBtn} onPress={handleCloseSignupForm} />
          <Text style={styles.formTitle}>Create New Account</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.inputField}
              placeholder="Username"
              value={signupUsername}
              onChangeText={handleSignupUsernameChange}
              placeholderTextColor="#9e9e9e"
            />
          </View>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.inputField}
              placeholder="Email"
              value={signupEmail}
              onChangeText={handleSignupEmailChange}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#9e9e9e"
            />
          </View>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.inputField}
              placeholder="Password"
              secureTextEntry={!signupPasswordVisible}
              value={signupPassword}
              onChangeText={handleSignupPasswordChange}
              placeholderTextColor="#9e9e9e"
            />
             <TouchableOpacity
                    style={styles.togglePassword}
                    onPress={() => setSignupPasswordVisible(!signupPasswordVisible)}
                >
                <FontAwesomeIcon icon={signupPasswordVisible ? faEyeSlash : faEye} />
                </TouchableOpacity>
          </View>
          <View style={styles.profileUpload}>
            <Text>Profile Picture:</Text>
            <TouchableOpacity style={styles.fileInput} onPress={handleProfilePictureChange}>
                <Text style={styles.fileInputText}>Choose Profile Picture</Text>
            </TouchableOpacity>
            {profilePicture && <Image source={{ uri: profilePicture }} style={styles.previewImage} />}
          </View>
          {signupError ? <Text style={styles.errorMessage}>{signupError}</Text> : null}
          {signupSuccess ? <Text style={styles.successMessage}>Account created successfully! You can now login.</Text> : null}
           <TouchableOpacity style={[styles.button, styles.signinButton]} onPress={handleCreateAccount}>
               <Text style={styles.buttonText}>Create Account</Text>
           </TouchableOpacity>
        </View>
        )}

        {/* --- Phone Verification Modal --- */}
        {showVerificationModal && (
          <View style={[styles.modal, styles.verificationModal, showVerificationModal ? styles.activeModal : null,  width > 767 ? {} : styles.mobileModal]}>
            <FontAwesomeIcon icon={faTimes} style={styles.closeBtn} onPress={handleCloseVerificationModal} />
            <Text style={styles.formTitle}>Phone Verification</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.inputField}
                placeholder="+66812345678"
                value={phoneNumber}
                onChangeText={handlePhoneNumberChange}
                keyboardType="phone-pad"
                placeholderTextColor="#9e9e9e"
              />
            </View>
            <View style={styles.recaptchaContainer} id="recaptcha-container"></View>
            {showVerificationCodeInput && (
              <View >
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.inputField}
                    placeholder="Enter verification code"
                    value={verificationCode}
                    onChangeText={handleVerificationCodeChange}
                    keyboardType="number-pad"
                    placeholderTextColor="#9e9e9e"
                  />
                </View>
                <TouchableOpacity style={[styles.button, styles.signinButton]} onPress={handleVerifyCode}>
                    <Text style={styles.buttonText}>Verify Code</Text>
                </TouchableOpacity>
              </View>
            )}
            {!showVerificationCodeInput && (
               <TouchableOpacity style={[styles.button, styles.signinButton]} onPress={handleSendVerificationCode}>
                    <Text style={styles.buttonText}>Send Verification Code</Text>
                </TouchableOpacity>
            )}
            {phoneError ? <Text style={styles.errorMessage}>{phoneError}</Text> : null}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E0E7E9',
    paddingTop: Platform.OS === 'android' ? 25 : 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainContent: {
    flexDirection: 'row',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginSection: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 10,
  },
  signupSection: {
    flex: 1,
    padding: 20,
    height: '100vh', // Use percentage for height
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2CBFAE',
  },
  h2: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#354649',
    textAlign: 'center',
  },
  p: {
    marginBottom: 15,
    textAlign: 'center',
    color: 'white',
  },
  button: {
    width: '80%',
    maxWidth: 350,
    color: 'white',
    borderWidth: 0,
    padding: 15,
    fontSize: 18,
    cursor: 'pointer',
    borderRadius: 25,
    marginTop: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    backgroundColor: '#2CBFAE',
  },
  googleButton: {
    backgroundColor: '#DB4437',
  },
  facebookButton: {
    backgroundColor: '#3B5998',
  },
  phoneButton: {
    backgroundColor: '#1877F2',
  },
  signinButton: {
    backgroundColor: '#2CBFAE',
    marginBottom: 10,
  },
  signupButton: {
    backgroundColor: 'white',
  },
  socialLogin: {
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: 15,
    width: '80%',
  },
  inputContainer: {
    position: 'relative',
    width: '90%',
    maxWidth: 600,
    marginVertical: 7.5,
  },
  inputField: {
    width: '100%',
    padding: 15,
    marginVertical: 5,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#ccc',
    textAlign: 'center',
    fontSize: 16,
    boxSizing: 'border-box',
  },
  togglePassword: {
    position: 'absolute',
    right: 15,
    top: '50%',
    transform: [{ translateY: -10 }],
    fontSize: 18,
    color: '#888',
  },
  verificationCodeContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  overlay: {
    display: 'none',
    position:  'absolute',  // Changed from 'fixed' to 'absolute'
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    zIndex: 999,
  },
   activeOverlay: {
    display: 'flex', // Use flexbox to center
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: 'white',
      padding: 30,
      borderRadius: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,  // For Android shadow
      zIndex: 1000,
      width: '80%',
      maxWidth: 500,
  },
  closeBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    fontSize: 20,
    color: '#888',
  },
  formTitle: {
    color: '#2CBFAE',
    marginBottom: 20,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  errorMessage: {
    color: 'red',
    marginTop: 10,
    textAlign: 'center',
  },
  successMessage: {
    color: 'green',
    marginTop: 10,
    textAlign: 'center',
  },
  profileUpload: {
    marginVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center'
  },
  fileInput: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 250,
    marginVertical: 10,
    borderWidth: 2,
    borderColor: '#2CBFAE',
    borderStyle: 'dashed',
    borderRadius: 10,
    padding: 10,
    backgroundColor: 'white',
  },
  fileInputText: {
    color: '#2CBFAE',
    fontWeight: 'bold',
  },
   previewImage: { //add preview Image
        width: 100,
        height: 100,
        marginTop: 10,
        borderRadius: 8
    },
  verificationModal: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: 'white',
      padding: 30,
      borderRadius: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,  // For Android shadow
      zIndex: 1000,
      width: '80%',
      maxWidth: 500,
  },
  recaptchaContainer: {
    marginVertical: 20,
    alignItems: 'center',
  },
  hrContainer: {
    width: "80%",
    borderBottomWidth: 1,
    borderBottomColor: 'gray',
    marginVertical: 15,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  activeModal: {
      display: 'block',  // Changed to 'block' for visibility
  },
  // Mobile Styles
  mobileMainContent: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100vw',
    height: '100vh',
    overflow: 'hidden',
  },
  mobileSection: {
    width: '100%',
    height: '100%',
  },
  mobileSocialLogin: {
    flexDirection: 'row', // Horizontal layout for buttons
    width: '100%',
    height: '70vh',
    justifyContent: 'space-between', // Space out the buttons
  },
  mobileSocialButton: {
    width: '30%', // Adjust as needed for spacing
    fontSize: 13
  },
    mobileModal: {
    top: 0,          // Start from the top
    left: 0,         // Start from the left
    transform: 'none',    // No translation needed
    width: '100%',   // Full width
    height: '100%',  // Full height
    maxHeight: '100%', // Full screen
    maxWidth: '100%',
    borderRadius: 0,  // No rounded corners
    flexDirection: 'column'
  },

});

export default App;