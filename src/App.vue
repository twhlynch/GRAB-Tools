<script>
import CookiesPopup from '@/components/CookiesPopup.vue';
import Panic from '@/components/Panic.vue';
import Toast from '@/components/Toast.vue';
export default {
	components: { Toast, CookiesPopup, Panic },
};
</script>

<template>
	<router-view></router-view>
	<Panic />
	<Toast />
	<CookiesPopup />
</template>

<style scoped></style>
