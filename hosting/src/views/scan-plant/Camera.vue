<script setup lang="ts">
import { onMounted, useTemplateRef } from "vue";

const cameraPreview = useTemplateRef<HTMLVideoElement>('cameraPreview')

const constraints = {
  video: {
    width: { ideal: 3840 },
    height: { ideal: 2160 },
    facingMode: 'environment',
    frameRate: { ideal: 60 }
  },
}

onMounted(async () => {
  try {
    cameraPreview.value!.srcObject = await navigator.mediaDevices.getUserMedia(constraints)
  } catch (err) {
    console.error('Error accessing camera:', err)
  }
})

async function takePhoto(): Promise<Blob> {
  if (!cameraPreview.value) {
    throw new Error('Camera not initialized')
  }

  const canvas = document.createElement('canvas')
  const videoEl = cameraPreview.value

  canvas.width = videoEl.videoWidth
  canvas.height = videoEl.videoHeight

  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Failed to capture photo')
  }

  context.drawImage(videoEl, 0, 0, canvas.width, canvas.height)

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Failed to create blob'))
        return
      }
      resolve(blob)
    }, 'image/jpeg', 0.95)
  })
}

defineExpose({
  takePhoto,
})
</script>

<template>
  <video ref="cameraPreview" autoplay></video>
</template>