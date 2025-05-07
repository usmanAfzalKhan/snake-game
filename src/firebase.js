// src/firebase.js

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCCR_GtbRu727e_wzOyAyIgdYndhraTqlk",
  authDomain: "byte-n-slither.firebaseapp.com",
  projectId: "byte-n-slither",
  storageBucket: "byte-n-slither.appspot.com", // fixed typo (was .firebasestorage.app)
  messagingSenderId: "310028878985",
  appId: "1:310028878985:web:90ebc43e46b76e5eeef258",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
