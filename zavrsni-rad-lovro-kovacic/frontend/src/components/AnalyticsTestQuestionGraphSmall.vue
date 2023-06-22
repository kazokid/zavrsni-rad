<template>
	<div class="row justify-around no-wrap">
		<QuestionsBarChart
			v-if="renderAnswersGraph"
			:questionData="data"
			:width="props.width / 2"
			:height="height"
		/>
		<QuestionsBarChartScores
			:questionScoresData="scoresData"
			:height="props.height"
			:width="renderAnswersGraph ? props.width / 2 : props.width"
		/>
	</div>
</template>

<script setup>
import { ref, onMounted, toRefs } from "vue";
import axios from "axios";

import QuestionsBarChart from "src/components/QuestionsBarChart.vue";
import QuestionsBarChartScores from "./QuestionsBarChartScores.vue";

const props = defineProps({
	questionData: {
		required: true,
		type: Object,
	},
	width: {
		type: Number,
	},
	height: {
		type: Number,
	},
	academicYear: {
		required: true,
		type: Object,
	},
	renderAnswersGraph: {
		type: Boolean,
		default: false,
	},
});

const chartRef = ref(null);
const { questionData, academicYear } = toRefs(props);
const data = ref([]);
const scoresData = ref([]);
const isLoading = ref(true);
const isLoadingScores = ref(true);

const fetchData = async () => {
	try {
		let URL =
			"http://localhost:4000/question/" +
			questionData.value.id_question +
			"/" +
			academicYear.value.id;

		const response = await axios.get(URL);

		data.value = response.data;

		data.value.forEach((data) => {
			data.correct = roundData(data.correct);
			data.incorrect = roundData(data.incorrect);
			data.unanswered = roundData(data.unanswered);
		});
	} catch (error) {
		console.error("An error occurred:", error);
	} finally {
		isLoading.value = false;
	}
};

const fetchScoresData = async () => {
	try {
		let URL =
			"http://localhost:4000/question/scores/" +
			questionData.value.id_question +
			"/" +
			academicYear.value.id;

		const response = await axios.get(URL);

		scoresData.value = response.data;
	} catch (error) {
		console.error("An error occurred:", error);
	} finally {
		isLoadingScores.value = false;
	}
};

function roundData(data) {
	return Math.round(data);
}

onMounted(() => {
	fetchScoresData();
	if (questionData.value.id == 1) {
		fetchData();
	}
});
</script>
