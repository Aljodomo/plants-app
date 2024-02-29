import * as logger from "firebase-functions/logger";
import { onRequest } from "firebase-functions/v2/https";
import {onSchedule} from "firebase-functions/v2/scheduler";
import { initializeApp } from "firebase-admin/app";
import { FieldValue, Timestamp, getFirestore } from "firebase-admin/firestore";
import axios from "axios";

initializeApp()

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

 export const waterPlant = onRequest(async (request, response) => {

   const plantId = request.query.id as string;

   logger.info("Watering plant! " + "id: " + plantId, {structuredData: true});

   if(!plantId) {
    response.status(400).send("No plant id specified")
    return;
   }

   const plantDocRef = getFirestore().collection("plants").doc(plantId)

   const plantDoc = await plantDocRef.get();

   if(!plantDoc.exists) {
    await plantDocRef.set(({
        name: "No name defined",
        telegramChatId: "-4134405446",
        wateringTimestamps: [newWateringTimestamp()],
    }))
   } else {
    await plantDocRef.update({
        wateringTimestamps: FieldValue.arrayUnion(newWateringTimestamp())
    })
   }

   response.send("Plant has been watered!");
 });

 function newWateringTimestamp() {
    return Timestamp.now()
 }

 export const wateringReminder = onSchedule("every day 08:00", async () => {

    logger.info("Checking for watering reminders");

    const plantsCol = await getFirestore().collection("plants").get()

    for (let docSnap of plantsCol.docs) {

        const docId = docSnap.id
        const doc = docSnap.data()

        if(doc.wateringTimestamps.length < 3) {
            logger.info("Skipping plant because it has to little watering timestamps. id: " + docId);
            continue
        }

        const timeDifsInMillis: number[] = []

        for (let i = 1; i < doc.wateringTimestamps.length - 1; i++) {
            const earlierTs = (doc.wateringTimestamps[i - 1] as Timestamp)
            const laterTs = (doc.wateringTimestamps[i] as Timestamp)
            timeDifsInMillis[i - 1] = laterTs.toMillis() - earlierTs.toMillis()
        }

        const averageMillisBetweenWaterings = 
            timeDifsInMillis.reduce((a, b) => a + b) / timeDifsInMillis.length

        const millisSinceLastWatering = Timestamp.now().toMillis() 
            - doc.wateringTimestamps[doc.wateringTimestamps.length - 1].toMillis()
        if(millisSinceLastWatering > averageMillisBetweenWaterings) {
            sendTelegramMessage(doc.telegramChatId, "Du solltest deine Pflanze gießen: " + doc.name ?? docId)
                .then(() => {
                    logger.info("Notified user for plant. id: " + docId)
                })
                .catch((e) => logger.error("Error while notifing user for plant. id: " + docId + " error: " + e))
        }

        logger.info("Plant has enough water. id: " + docId)
    }

    if(plantsCol.docs.length == 0) {
        logger.info("No plants initialized");
    }
 })

 export async function sendTelegramMessage(chatId: string, text: string): Promise<void> {
    const botApiKey = process.env.TELEGRAM_API_KEY;
    const sendMessageUrl = `https://api.telegram.org/bot${botApiKey}/sendMessage`;
    const body = {"chat_id": chatId, "text": text};
    await axios
        .post(sendMessageUrl, body)
        .then((res) => {
            console.log(`Telegram /sendMessage response statusCode: ${res.status}`);
        })
        .catch((error) => {
            console.error(error);
        });
}