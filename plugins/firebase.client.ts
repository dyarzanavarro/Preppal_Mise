import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()

  const firebaseConfig = {
    apiKey:            config.public.firebaseApiKey,
    authDomain:        config.public.firebaseAuthDomain,
    projectId:         config.public.firebaseProjectId,
    storageBucket:     config.public.firebaseStorageBucket,
    messagingSenderId: config.public.firebaseMessagingSenderId,
    appId:             config.public.firebaseAppId,
  }

  // Avoid re-initialising on hot reload
  const app  = getApps().length ? getApp() : initializeApp(firebaseConfig)
  const auth = getAuth(app)
  const db   = getFirestore(app)

  return {
    provide: {
      firebase: app,
      auth,
      db,
    },
  }
})
