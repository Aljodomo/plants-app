import * as logger from "firebase-functions/logger";
import {onRequest} from "firebase-functions/v2/https";
import {onSchedule} from "firebase-functions/v2/scheduler";
import {initializeApp} from "firebase-admin/app";
import {FieldValue, Timestamp, getFirestore} from "firebase-admin/firestore";
import axios from "axios";
import {defineString} from "firebase-functions/params";

initializeApp();

const DEFAULT_TELEGRAM_CHAT_ID = defineString("DEFAULT_TELEGRAM_CHAT_ID");
const WEB_APP_BASE_URL = defineString("WEB_APP_BASE_URL");

export const waterPlant = onRequest(async (request, response) => {
  const plantId = request.query.id as string;

  logger.info("Watering plant! " + "id: " + plantId, {structuredData: true});

  if (!plantId) {
    response.status(400).send("No plant id specified");
    return;
  }

  const plantDocRef = getFirestore().collection("plants").doc(plantId);

  const plantDoc = await plantDocRef.get();

  if (!plantDoc.exists) {
    await plantDocRef.set(({
      name: "No name defined",
      telegramChatId: DEFAULT_TELEGRAM_CHAT_ID.value(),
      wateringTimestamps: [Timestamp.now()],
    }));
  } else {
    const plantData = plantDoc.data();

    if (!plantData) {
      throw new Error("Plant data is undefined even tho the doc exits. id: " + plantDoc.id);
    }

    const lastWatering: Timestamp = plantData.wateringTimestamps[plantData.wateringTimestamps.length - 1];

    if (isDifferenceLessThen12Hours(lastWatering, Timestamp.now())) {
      response
        .status(400)
        .send("Die Pflanze wurde heute bereits um " +
              lastWatering.toDate().getUTCHours() + ":" + lastWatering.toDate().getMinutes() +
              " gegossen.");
      return;
    }

    await plantDocRef.update({
      wateringTimestamps: FieldValue.arrayUnion(Timestamp.now()),
    });
  }

  response.redirect(WEB_APP_BASE_URL.value() + "plants/" + plantId);
});


function isDifferenceLessThen12Hours(date1: Timestamp, date2: Timestamp): boolean {
  return Math.abs(date1.seconds - date2.seconds) < 43200;
}

export const wateringReminder = onSchedule("every day 08:00", async () => {
  logger.info("Checking for watering reminders");

  const plantsCol = await getFirestore().collection("plants").get();

  for (const docSnap of plantsCol.docs) {
    const docId = docSnap.id;
    const doc = docSnap.data();

    if (doc.wateringTimestamps.length < 3) {
      logger.info("Skipping plant because it has to little watering timestamps. id: " + docId);
      continue;
    }

    const timeDifsInMillis: number[] = [];

    for (let i = 1; i < doc.wateringTimestamps.length - 1; i++) {
      const earlierTs = (doc.wateringTimestamps[i - 1] as Timestamp);
      const laterTs = (doc.wateringTimestamps[i] as Timestamp);
      timeDifsInMillis[i - 1] = laterTs.toMillis() - earlierTs.toMillis();
    }

    const averageMillisBetweenWaterings =
            timeDifsInMillis.reduce((a, b) => a + b) / timeDifsInMillis.length;

    const millisSinceLastWatering = Timestamp.now().toMillis() -
            doc.wateringTimestamps[doc.wateringTimestamps.length - 1].toMillis();
    if (millisSinceLastWatering > averageMillisBetweenWaterings) {
      sendTelegramMessage(doc.telegramChatId, "Du solltest deine Pflanze gießen: " + doc.name ?? docId)
        .then(() => {
          logger.info("Notified user for plant. id: " + docId);
        })
        .catch((e) => logger.error("Error while notifing user for plant. id: " + docId + " error: " + e));
    }

    logger.info("Plant has enough water. id: " + docId);
  }

  if (plantsCol.docs.length == 0) {
    logger.info("No plants initialized");
  }
});

const TELEGRAM_API_KEY = defineString("TELEGRAM_API_KEY");

export async function sendTelegramMessage(chatId: string, text: string): Promise<void> {
  const botApiKey = TELEGRAM_API_KEY;
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
