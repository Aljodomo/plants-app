import { getFirestore } from "firebase/firestore";
import { firebase } from "./firebase";

export const firestore = getFirestore(firebase)

//console.log("CONNECTING TO LOCAL FIRESTORE EMULATOR")
//connectFirestoreEmulator(firestore, '127.0.0.1', 8080)

