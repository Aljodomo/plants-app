<script setup lang="ts">
import { browserLocalPersistence, setPersistence, signInWithEmailAndPassword } from 'firebase/auth'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { auth } from '@/views/firebase'

const pass = ref('')

const router = useRouter()

async function login() {
  await setPersistence(auth, browserLocalPersistence).then(async () => {
    await signInWithEmailAndPassword(auth, 'global@login.com', pass.value).then(() => {
      if (router.currentRoute.value.redirectedFrom) {
        router.push(router.currentRoute.value.redirectedFrom)
      } else {
        router.push({ name: 'plants' })
      }
    })
  })
}
</script>

<template>
  <div
    style="
      height: 100%;
      display: inline-flex;
      flex-direction: column;
      gap: 32px;
      justify-content: center;
      align-items: center;
    "
  >
    <input type="password" v-model="pass" />
    <button @click="login" style="border-radius: 10%; padding: 16px 32px; background-color: gray">
      Access
    </button>
  </div>
</template>

<style scoped></style>
