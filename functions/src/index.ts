import * as logger from "firebase-functions/logger";
import {onSchedule} from "firebase-functions/v2/scheduler";
import {initializeApp} from "firebase-admin/app";
import {Timestamp, getFirestore} from "firebase-admin/firestore";
import axios from "axios";
import {defineString} from "firebase-functions/params";

initializeApp();

// const DEFAULT_TELEGRAM_CHAT_ID = defineString("DEFAULT_TELEGRAM_CHAT_ID");

export enum Humidity {
  WET = "WET",
  MOIST = "MOIST",
  DRY = "DRY",
  VERY_DRY = "VERY_DRY",
}

export interface Visit {
  id: string;
  timestamp: Timestamp;
  wasWatered: boolean;
  soilHumidity: Humidity;
}

export interface PlantInfo {
  id: string;
  name: string;
  wateringInterval: string;
  visits: Visit[];
  nextWatering?: Timestamp;
}

/**
 * if list contains no watering do nothing
 *
 * trafers waterings in list from back
 * get watering
 * is last element in list?
 *    go to next waterin
 * get next visit from watering forward
 * is last element in list?
 * switch humidity
 *    case WET
 *      go to next
 *
 *
 * find interval between dry watering and dry visit
 * check interval is too big? bigger then 2 * preset maybe? what todo then?
 *
 * if not possible
 * interval between wet and dry
 *
 * interval between wet and dry
 */
export const wateringReminder = onSchedule("* 3 * * *", async () => {
  logger.info("Checking for watering reminders");

  const plantsCol = await getFirestore().collection("plants").get();

  await Promise.all(
    plantsCol.docs.map(async (docSnap) => {
      const doc = docSnap.data() as PlantInfo;

      const waterings = doc.visits.filter((visit) => visit.wasWatered === true);

      if (waterings.length >= 2) {
        const lastWateringMillis =
          waterings[waterings.length - 1].timestamp.toMillis();
        const secondLastWateringMillis =
          waterings[waterings.length - 2].timestamp.toMillis();
        const millisBetweenLastWaterings =
          lastWateringMillis - secondLastWateringMillis;

        let nextWatering = Timestamp.fromMillis(
          lastWateringMillis + millisBetweenLastWaterings
        );

        const now = Timestamp.now();

        if (nextWatering.seconds < now.seconds) {
          const moistCheck = doc.visits
            .filter((vis) => vis.wasWatered === false)
            .filter(
              (vis) =>
                vis.timestamp.seconds > nextWatering.seconds &&
                [Humidity.MOIST, Humidity.WET].includes(vis.soilHumidity!)
            )
            .sort((a, b) => a.timestamp.seconds - b.timestamp.seconds)
            .at(0);

          if (moistCheck) {
            nextWatering = Timestamp.fromMillis(
              moistCheck.timestamp.toMillis() + 1000 * 60 * 60 * 24 * 2
            );
          }
        }

        await docSnap.ref.update({
          nextWatering: nextWatering,
        });
      }
    })
  );

  //   const docId = docSnap.id;
  //   const doc = docSnap.data() as PlantInfo;

  //   if (doc.wateringTimestamps.length < 2) {
  //     logger.info(
  //       "Skipping plant because it has to little watering timestamps. id: " +
  //         docId
  //     );
  //     continue;
  //   }

  //   const timeDifsInMillis: number[] = [];

  //   for (let i = 1; i < doc.wateringTimestamps.length - 1; i++) {
  //     const earlierTs = doc.wateringTimestamps[i - 1] as Timestamp;
  //     const laterTs = doc.wateringTimestamps[i] as Timestamp;
  //     timeDifsInMillis[i - 1] = laterTs.toMillis() - earlierTs.toMillis();
  //   }

  //   const averageMillisBetweenWaterings =
  //     timeDifsInMillis.reduce((a, b) => a + b) / timeDifsInMillis.length;

  //   const millisSinceLastWatering =
  //     Timestamp.now().toMillis() -
  //     doc.wateringTimestamps[doc.wateringTimestamps.length - 1].toMillis();
  //   if (millisSinceLastWatering > averageMillisBetweenWaterings) {
  //     sendTelegramMessage(
  //       DEFAULT_TELEGRAM_CHAT_ID.value(),
  //       "Du solltest deine Pflanze gießen: " + doc.name ?? docId
  //     )
  //       .then(() => {
  //         logger.info("Notified user for plant. id: " + docId);
  //       })
  //       .catch((e) =>
  //         logger.error(
  //           "Error while notifing user for plant. id: " + docId + " error: " + e
  //         )
  //       );
  //   }

  //   logger.info("Plant has enough water. id: " + docId);
  // }

  // if (plantsCol.docs.length == 0) {
  //   logger.info("No plants initialized");
  // }
});

const TELEGRAM_API_KEY = defineString("TELEGRAM_API_KEY");

export async function sendTelegramMessage(
  chatId: string,
  text: string
): Promise<void> {
  const botApiKey = TELEGRAM_API_KEY;
  const sendMessageUrl = `https://api.telegram.org/bot${botApiKey}/sendMessage`;
  const body = {chat_id: chatId, text: text};
  await axios
    .post(sendMessageUrl, body)
    .then((res) => {
      console.log(`Telegram /sendMessage response statusCode: ${res.status}`);
    })
    .catch((error) => {
      console.error(error);
    });
}
