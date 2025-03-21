import {DefaultApi} from "../generated/plantnet";
import {defineString} from "firebase-functions/params";
import {error} from "firebase-functions/logger"

const PLANTNET_API_KEY = defineString("PLANTNET_API_KEY");

export async function identifyPlant(imageUrls: string[]) {
  return new DefaultApi().getV2IdentifyProject({
    apiKey: PLANTNET_API_KEY.value(),
    lang: "de",
    images: imageUrls,
    project: "all",
    includeRelatedImages: true,
  }).catch((e) => error("Plantnet request error: ", e));
}

export async function identifyPlantByBlob(images: Blob[]) {
  return new DefaultApi().postV2IdentifyProject({
    apiKey: PLANTNET_API_KEY.value(),
    lang: "de",
    images: images,
    project: "all",
    includeRelatedImages: true,
  });
}
