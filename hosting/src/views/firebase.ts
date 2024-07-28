import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: 'AIzaSyA5kiDGBkl54x9TdKrm7KRYaEzqGZbE6Uo',
  authDomain: 'plants-app-c271d.firebaseapp.com',
  projectId: 'plants-app-c271d',
  storageBucket: 'plants-app-c271d.appspot.com',
  messagingSenderId: '35481030708',
  appId: '1:35481030708:web:192c7be6167c63d96b7a61'
}

export const firebase = initializeApp(firebaseConfig)

export const auth = getAuth(firebase)
