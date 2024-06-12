<template>
  <div class="home">
    <button @click="goToLogin('gitee')">登录码云</button>
    <button @click="goToLogin('github')">登录github</button>
  </div>
</template>

<script setup>
import axios from "axios";
async function goToLogin(type) {
  try {
    const response = await axios.get("/api/redirect", {
      params: {
        type,
      },
    });
    window.location.href = response.data;
  } catch (error) {
    console.log("error: ", error);
  }
}
</script>
<style>
.home {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
button {
  width: 200px;
  height: 50px;
}
</style>
