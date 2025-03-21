<script setup lang="ts">
import Camera from "@/views/scan-plant/Camera.vue";
import {ref, useTemplateRef} from "vue";
import {DefaultApi} from "@generated/my-api";
import {identifyPlant} from "@/views/PlantIdentificationClient";
import {uploadImage} from "@/views/imageRepo";
import {deleteObject, getDownloadURL} from "firebase/storage";

const camera = useTemplateRef<InstanceType<typeof Camera>>('camera')

const previewImageUrls = ref<string[]>([])

async function scan() {

  if(!camera.value) {
    throw new Error('Camera not initialized')
  }

  const blob = await camera.value.takePhoto()

  const uploadRes = await uploadImage("tmp-plant-image", blob)
  const imageUrl = await getDownloadURL(uploadRes.ref)

  // const imageUrl = URL.createObjectURL(blob).toString()

  const identification = await identifyPlant([imageUrl])

  await deleteObject(uploadRes.ref)

  previewImageUrls.value = identification.results
      ?.map(result => result.images?.[0].url?.m)
      .filter(url => url)
          .map(url => url!)
      ?? []

}

</script>

<template>
  <div class="flex flex-col flex-wrap gap-2">
    <img v-for="img of previewImageUrls" :src="img" :key="img"></img>
  </div>
  <Camera ref="camera"></Camera>
  <v-btn @click="scan">Scan</v-btn>
</template>

<style scoped>

</style>