<template>
  <div class="about">
    <div style="margin-top: 20px">
      <button @click="getUserInfo('gitee')">获取gitee用户信息</button>
      <button @click="getUserInfo('github')">获取github用户信息</button>
    </div>
    <div v-if="userInfo" class="userInfo">
      <img :src="userInfo.avatar_url" alt="" srcset="" />
      <p>{{ userInfo.name }}</p>
      <p>{{ userInfo.login }}</p>
    </div>
    <div v-if="errorInfo" class="errorInfo">
      <h1>{{ errorInfo.error }}</h1>
      <button @click="router.replace('/')">返回首页</button>
    </div>
  </div>
</template>
<script setup>
import { ref } from "vue";
import axios from "axios";
import { useRoute, useRouter } from "vue-router";
const router = useRouter();
const route = useRoute();
const userInfo = ref(null);
const errorInfo = ref(null);
async function getUserInfo(Bearer) {
  try {
    const response = await axios.get(`/api/user/${Bearer}`, {
      headers: {
        authorization: `Bearer ${route.query.code}`,
      },
    });
    if (response.data.code === 200) {
      errorInfo.value = null;
      userInfo.value = response.data.data;
    }
  } catch (error) {
    userInfo.value = null;
    errorInfo.value = error.response.data;
  }
}
</script>
<style>
.about {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}
button {
  width: 200px;
  height: 50px;
}
.userInfo img {
  max-width: 100px;
  max-height: 100px;
  margin-top: 10px;
}
.errorInfo button {
  width: 80px;
  height: 30px;
}
</style>
