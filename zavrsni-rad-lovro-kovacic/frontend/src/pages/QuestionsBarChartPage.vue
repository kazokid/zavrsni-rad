<template>
	<main>
		<div class="column items-center">
			<div class="row items-center q-mt-md">
				<q-input
					outlined
					v-model="questionID"
					type="number"
					label="Question ID"
					class="q-mr-md"
				/>

				<q-input
					outlined
					v-model="academicYear"
					type="number"
					label="Academic Year"
					class="q-mr-md"
				/>

				<q-btn
					color="primary"
					label="Fetch data for question"
					@click="fetchAllData"
				/>
			</div>
			<div class="col-12">
				<h4 class="text-bold">
					Alignment of student answers on multiple-choice questions
				</h4>
			</div>
			<div class="row no-wrap flex-center col-8 items-bottom">
				<QuestionsBarChart
					v-if="!isLoading"
					:questionData="questionData"
					:width="800"
					:height="500"
				/>
			</div>
			<QuestionsBarChartExplanation
				v-if="!isLoading"
				:questionData="questionData"
				:width="850"
			/>
			<div class="col-12">
				<h4 class="text-bold">Question score distribution</h4>
			</div>
			<div class="column items-start">
				<QuestionsBarChartScores
					v-if="!isLoadingScores"
					:questionScoresData="questionScoresData"
					:width="800"
					:height="500"
				/>
			</div>
		</div>
	</main>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";

import QuestionsBarChart from "src/components/QuestionsBarChart.vue";
import QuestionsBarChartExplanation from "src/components/QuestionsBarChartExplanation.vue";
import QuestionsBarChartScores from "src/components/QuestionsBarChartScores.vue";

const questionID = ref(44906);
const academicYear = ref(2022);

const questionData = ref([]);
const questionScoresData = ref([]);

const isLoading = ref(true);
const isLoadingScores = ref(true);

const fetchData = async () => {
	try {
		let URL =
			"http://localhost:4000/question/" +
			questionID.value +
			"/" +
			academicYear.value;

		const response = await axios.get(URL);

		questionData.value = response.data;

		questionData.value.forEach((data) => {
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
			questionID.value +
			"/" +
			academicYear.value;

		const response = await axios.get(URL);

		questionScoresData.value = response.data;
	} catch (error) {
		console.error("An error occurred:", error);
	} finally {
		isLoadingScores.value = false;
	}
};

function roundData(data) {
	return Math.round(data);
}

function fetchAllData() {
	fetchData();
	fetchScoresData();
}

onMounted(() => {
	fetchData();
	fetchScoresData();
});
</script>
