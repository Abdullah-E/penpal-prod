import { initializeApp } from 'firebase/app'
import admin from 'firebase-admin'

const serviceAcc = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
admin.initializeApp({
  credential: admin.credential.cert(serviceAcc),
  storageBucket: process.env.FIREBASE_STORAGEBUCKET
})

const firebaseConfig = {
    apiKey: process.env.FIREBASE_APIKEY,
    authDomain: process.env.FIREBASE_AUTHDOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGEBUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGINGSENDERID,
    appId: process.env.FIREBASE_APPID,
    measurementID: process.env.FIREBASE_MEASUREMENTID
};

// console.log("fb conf:",firebaseConfig)

export const firebaseApp = initializeApp(firebaseConfig)
export {admin}