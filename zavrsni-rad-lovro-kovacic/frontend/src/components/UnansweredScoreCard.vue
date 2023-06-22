<script setup>
import { ref, onMounted, watchEffect, toRefs } from "vue";

const props = defineProps({
	questionData: {
		required: true,
		type: Array,
	},
});

const { questionData } = toRefs(props);
const unansweredData = ref([]);

onMounted(() => {
	processData();
});

function processData() {
	if (questionData.value === undefined || questionData.value.length < 1)
		return false;

	unansweredData.value = questionData.value[0].unanswered;

	return true;
}

watchEffect(() => {
	processData();
});
</script>

<template>
	<div v-if="processData()" class="unanswered-score-card column items-center">
		<span>{{ unansweredData }}%</span>
		<span>Unanswered</span>
	</div>
</template>

<style scoped>
.unanswered-score-card {
	font-weight: bold;
	font-size: larger;
	color: black;
	border: 3px solid gray;
	border-radius: 10px;
	width: min-content;
	height: min-content;
	padding: 0.5rem;
	margin: 2rem;
	background-color: lightgray;
}
</style>
