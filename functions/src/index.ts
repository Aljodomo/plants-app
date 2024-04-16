import {initializeApp} from "firebase-admin/app";
import {Timestamp, getFirestore} from "firebase-admin/firestore";
import axios from "axios";
import {defineString} from "firebase-functions/params";
import {onDocumentUpdated} from "firebase-functions/v2/firestore";
import {onSchedule} from "firebase-functions/v2/scheduler";
import * as logger from "firebase-functions/logger";

initializeApp();

const DEFAULT_TELEGRAM_CHAT_ID = defineString("DEFAULT_TELEGRAM_CHAT_ID");

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
  preferedHumidy?: Humidity;
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
export const onPlantUpdated = onDocumentUpdated(
  "plants/{plantId}",
  async (event) => {
    const snapshotAfter = event.data?.after;
    const snapshotBefore = event.data?.before;
    if (!snapshotAfter) {
      logger.error("No data associated after");
      return;
    }
    if (!snapshotBefore) {
      logger.error("No data associated before");
      return;
    }

    const plantAfter = snapshotAfter.data() as PlantInfo;
    const plantBefore = snapshotBefore.data() as PlantInfo;

    if (plantBefore.visits.length === plantAfter.visits.length) {
      logger.log("No new visits. Skipping nextWatering calculation");
      return;
    }

    const nextWatering: Timestamp | null = predictNextWatering(plantAfter);

    if (!nextWatering) {
      return;
    }

    if (plantAfter.nextWatering !== nextWatering) {
      await snapshotAfter.ref.update({
        nextWatering: nextWatering,
      });
    }
  }
);

function predictNextWatering(plant: PlantInfo): Timestamp | null {
  let nextWatering: Timestamp | null = null;

  const waterings = plant.visits.filter((visit) => visit.wasWatered === true);

  if (waterings.length >= 2) {
    const lastWateringMillis =
      waterings[waterings.length - 1].timestamp.toMillis();
    const secondLastWateringMillis =
      waterings[waterings.length - 2].timestamp.toMillis();
    const millisBetweenLastWaterings =
      lastWateringMillis - secondLastWateringMillis;

    nextWatering = Timestamp.fromMillis(
      lastWateringMillis + millisBetweenLastWaterings
    );

    const now = Timestamp.now();

    // Should have already been watered
    if (nextWatering.seconds < now.seconds) {
      const moistCheck = plant.visits
        .filter((vis) => vis.wasWatered === false)
        .filter(
          (vis) =>
            vis.timestamp.seconds > nextWatering!.seconds &&
            [Humidity.MOIST, Humidity.WET].includes(vis.soilHumidity)
        )
        .sort((a, b) => a.timestamp.seconds - b.timestamp.seconds)
        .at(0);

      if (moistCheck) {
        nextWatering = Timestamp.fromMillis(
          moistCheck.timestamp.toMillis() + 1000 * 60 * 60 * 24 * 2
        );
      }
    }
  }
  return nextWatering;
}

export const wateringNotifications = onSchedule("0 8 * * *", async () => {
  const plantsCol = await getFirestore().collection("plants").get();

  logger.info("running notifications");

  await Promise.all(
    plantsCol.docs.map(async (docSnap) => {
      logger.info("running notifications for " + docSnap.id);

      const doc = docSnap.data() as PlantInfo;

      if (
        doc.nextWatering !== undefined &&
        doc.nextWatering.seconds < Timestamp.now().seconds
      ) {
        await sendTelegramMessage(
          DEFAULT_TELEGRAM_CHAT_ID.value(),
          `Du solltest "${doc.name}" gießen.`
        );
      } else {
        logger.info("Skipping telegram notification for plantId: " + doc.id);
      }
    })
  );
});

const TELEGRAM_API_KEY = defineString("TELEGRAM_API_KEY");

export async function sendTelegramMessage(
  chatId: string,
  text: string
): Promise<void> {
  const botApiKey = TELEGRAM_API_KEY.value();
  const sendMessageUrl = `https://api.telegram.org/bot${botApiKey}/sendMessage`;
  const body = {chat_id: chatId, text: text};
  await axios
    .post(sendMessageUrl, body)
    .then((res) => {
      logger.log(`Telegram message send with status code: ${res.status}`);
    })
    .catch((error) => {
      logger.error(error);
    });
}
