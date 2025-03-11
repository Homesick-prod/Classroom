// firebase.ts
import { initializeApp, FirebaseApp, getApps } from 'firebase/app';
import { getAuth, Auth, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';  // Import Auth type
import { getDatabase, ref, set, get, child } from "firebase/database";
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import * as FileSystem from 'expo-file-system';


const firebaseConfig = {
    apiKey: "AIzaSyARzaE-mGJkYl9aD4LffYo-FW7FYRpUXD4",
    authDomain: "classroom-9e811.firebaseapp.com",
    databaseURL: "https://classroom-9e811-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "classroom-9e811",
    storageBucket: "classroom-9e811.firebasestorage.app",
    messagingSenderId: "543633744426",
    appId: "1:543633744426:web:98c2cc2f2846dfc31dd953",
    measurementId: "G-GFC2LZF52Q"
};

let app: FirebaseApp;
let auth: Auth;  // Declare auth here

// Initialize Firebase ONLY if it hasn't been initialized yet.
if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);  // Initialize auth here
} else {
    app = getApps()[0];
    auth = getAuth(app);
}

const database = getDatabase(app);
const storage = getStorage(app);



const updateUserProfile = async (userId: string, name: string, profilePicture: File | null) => {
    try {
      const userRef = ref(database, `users/${userId}`);
      let photoURL = '';

      if (profilePicture) {
        const base64 = await FileSystem.readAsStringAsync(profilePicture.uri, { encoding: 'base64' });
        const storagePath = `profile_pictures/${userId}/${profilePicture.name}`;
        const storageReference = storageRef(storage, storagePath);
        const uploadTask = uploadBytesResumable(storageReference, new Uint8Array(base64.match(/.{1,2}/g).map(byte => parseInt(byte, 16))));
        const snapshot = await uploadTask;
        photoURL = await getDownloadURL(snapshot.ref);
      }

      await set(userRef, {
        name: name,
        email: auth.currentUser?.email || '', // Use current user's email if available
        photo: photoURL,
        classroom: {} // Initialize classroom data
      });

      console.log("User profile updated successfully!");
    } catch (error) {
      console.error("Error updating user profile:", error);
      throw error; // Re-throw the error to be handled by the caller
    }
};


export { app, auth, database, storage, updateUserProfile }; // Export auth