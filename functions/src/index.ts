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

    const nextWatering: Timestamp | null = predictNextWatering(plantAfter);

    if (!nextWatering) {
      logger.info("Could not calculate nextWatering");
      return;
    }

    if (plantAfter.nextWatering !== nextWatering) {
      await snapshotAfter.ref.update({
        nextWatering: nextWatering,
      });
    }
  }
);

function calcHumidityDelta(
  humidity: Humidity,
  preferedHumidy: Humidity | undefined
) {
  if (preferedHumidy === undefined) {
    return 0;
  }
  const humidityOrder = [
    Humidity.WET,
    Humidity.MOIST,
    Humidity.DRY,
    Humidity.VERY_DRY,
  ];
  const prefIndex = humidityOrder.indexOf(preferedHumidy);
  const actualIndex = humidityOrder.indexOf(humidity);
  return prefIndex - actualIndex;
}

function calcTimeDeltaAvg(
  waterings: Visit[],
  weightModifier: (v: Visit) => number
): number {
  let weightedAverage = 0;
  let totalWeight = 0;

  for (let i = 0; i < waterings.length - 1; i++) {
    const j = i + 1;
    const first = waterings[i];
    const second = waterings[j];

    // time
    const timeDelta = second.timestamp.toMillis() - first.timestamp.toMillis();

    // weight
    const deltaCount = waterings.length - 1;
    // large number = the recent values are more important
    // 0 = weight always 1
    const lambda = 0.5;
    const expoWeight = Math.exp(-lambda * (deltaCount - i - 1));

    const weight = expoWeight * weightModifier(second);

    totalWeight += weight;
    weightedAverage += timeDelta * weight;
  }

  return weightedAverage / totalWeight;
}

function predictNextWatering(plant: PlantInfo): Timestamp | null {
  let nextWatering: Timestamp | null = null;

  const waterings = plant.visits.filter((visit) => visit.wasWatered === true);

  if (waterings.length < 2) {
    logger.info(
      "Skipping nextWaterPrediction because there are not enough waterings: " +
        waterings.length
    );
    return nextWatering;
  }

  const avg = calcTimeDeltaAvg(
    waterings,
    // weight visits less which did not water the plant at the prefered soil humidity
    (v) => 1 / 1 + calcHumidityDelta(v.soilHumidity, plant.preferedHumidy)
  );

  nextWatering = Timestamp.fromMillis(
    waterings.at(-1)!.timestamp.toMillis() + avg
  );

  logger.debug(
    "nextWatering based on last waterings alone: " +
      nextWatering.toDate().toString()
  );

  const now = Timestamp.now();

  // "Smart" logic to take humidity checks into account
  if (
    nextWatering.seconds < now.seconds &&
    plant.preferedHumidy !== undefined
  ) {
    const lastHumidityCheck = plant.visits
      .filter((vis) => vis.wasWatered === false)
      .filter(
        (vis) =>
          // Take only checks after the nextWatering time into account
          vis.timestamp.seconds > nextWatering!.seconds
      )
      .at(-1);

    logger.debug(
      "Using smart logic. Last humidity check: " +
        lastHumidityCheck?.timestamp.toDate().toString()
    );

    if (lastHumidityCheck !== undefined) {
      const humidityDelta = calcHumidityDelta(
        lastHumidityCheck.soilHumidity,
        plant.preferedHumidy
      );

      if (humidityDelta > 0) {
        nextWatering = Timestamp.fromMillis(
          // Add two days for every one delta
          lastHumidityCheck.timestamp.toMillis() +
            1000 * 60 * 60 * 24 * 2 * humidityDelta
        );
        logger.debug(
          `Next watering updated based on humidityDelta=(${humidityDelta}): ${nextWatering
            .toDate()
            .toString()}`
        );
      } else {
        logger.debug(
          "Not postponing next watering because soil has already reached prefered humidity level. HumidityDelta: " +
            humidityDelta
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
