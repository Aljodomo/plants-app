import {onRequest} from "firebase-functions/v2/https";
import {defineString} from "firebase-functions/params";
import {identifyPlant, identifyPlantByBlob} from "./plantnet";
import {warn} from "firebase-functions/logger"

const MY_API_KEY = defineString("MY_API_KEY");

export const onIdentifyPlantRequest = onRequest(
  async (req, res) => {
    if (req.query.apiKey !== MY_API_KEY.value()) {
      res.status(403).send("Wrong API key");
      return;
    }

    const identificationResult = await identifyPlant(req.body.images);

    res.status(200).send(identificationResult);
  }
);

// export const onIdentifyPlantByBlobRequest = onRequest(
//     async (req, res) => {
//         if (req.query.apiKey !== MY_API_KEY.value()) {
//             res.status(403).send("Wrong API key");
//             warn(`request key: ${req.query.apiKey}` );
//             return;
//         }
//
//         if(!req.body.images) {
//             res.status(400).send("No images provided");
//             return;
//         }
//
//         const identificationResult = await identifyPlantByBlob(req.body.images);
//
//         res.status(200).send(identificationResult);
//     }
// );
