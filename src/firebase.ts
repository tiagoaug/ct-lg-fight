import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import * as firebaseConfig from '../firebase-applet-config.json';

const config = (firebaseConfig as any).default || firebaseConfig;

console.log('Firebase Config loaded:', config);

const app = initializeApp(config);
export const auth = getAuth(app);
export const db = getFirestore(app, config.firestoreDatabaseId);
