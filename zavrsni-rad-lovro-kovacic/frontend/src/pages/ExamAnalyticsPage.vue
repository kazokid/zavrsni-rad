<template>
	<h2 class="test-title">{{ course.course_name }}</h2>
	<div class="row justify-between q-ma-lg">
		<div class="row col-6 justify-start">
			<AnalyticsTestsPercentagesBoxPlot
				@selectTest="updateGraphs"
				:examData="allTests"
			/>
		</div>
		<div class="row col-6 justify-end">
			<AnalyticsTestParticipationAreaChart
				:data="instancesData"
				:width="graphWidth"
				:height="500"
				class="col-12"
			>
			</AnalyticsTestParticipationAreaChart>
			<AnalyticsTestResultsPercentageBarChart
				class="col-12"
				:data="resultsData"
				:width="graphWidth"
				:height="400"
			>
			</AnalyticsTestResultsPercentageBarChart>
			<AnalyticsTestPassPercentagePieChart
				class="col-12"
				v-if="!percDataisLoading"
				:data="passPercData"
			>
			</AnalyticsTestPassPercentagePieChart>
		</div>
		<AnalyticsTestQuestionsList
			class="col-12"
			:data="questionsData"
			:academicYear="academicYear"
		/>
	</div>
</template>

<script setup>
import { onMounted, ref, toRefs, watchEffect } from "vue";
import axios from "axios";
import AnalyticsTestsPercentagesBoxPlot from "src/components/AnalyticsTestsPercentagesBoxPlot.vue";
import AnalyticsTestParticipationAreaChart from "src/components/AnalyticsTestParticipationAreaChart.vue";
import AnalyticsTestResultsPercentageBarChart from "src/components/AnalyticsTestResultsPercentageBarChart.vue";
import AnalyticsTestPassPercentagePieChart from "src/components/AnalyticsTestPassPercentagePieChart.vue";
import AnalyticsTestQuestionsList from "src/components/AnalyticsTestQuestionsList.vue";

const instancesData = ref([]);
const resultsData = ref([]);
const passPercData = ref([]);
const percDataisLoading = ref(true);
const allTests = ref([]);
const questionsData = ref([]);

const graphWidth = 800;

const props = defineProps({
	course: {
		required: true,
		type: Object,
	},
	academicYear: {
		required: true,
		type: Object,
	},
});

const { course, academicYear } = toRefs(props);

const fetchInstancesData = async (testID, academic_year, courseID) => {
	try {
		let URL = "http://localhost:4000/instances/";

		URL += testID + "/" + academic_year + "/" + courseID;

		const response = await axios.get(URL);

		instancesData.value = response.data;
	} catch (error) {
		console.error("An error occurred:", error);
	}
};

const fetchTestResultsData = async (testID, academic_year, courseID) => {
	try {
		let URL = "http://localhost:4000/results/";

		URL = URL + testID + "/" + academic_year + "/" + courseID;

		console.log(testID);

		const response = await axios.get(URL);

		resultsData.value = response.data;
	} catch (error) {
		console.error("An error occurred:", error);
	}
};

const fetchPassPercentageData = async (testID, academic_year, courseID) => {
	try {
		let URL = "http://localhost:4000/passed/percentage/";

		URL = URL + testID + "/" + academic_year + "/" + courseID;

		const response = await axios.get(URL);

		passPercData.value = response.data;
	} catch (error) {
		console.error("An error occurred:", error);
	} finally {
		percDataisLoading.value = false;
	}
};

const fetchAllTestsResultsData = async () => {
	try {
		let URL = "http://localhost:4000/exams/";

		URL = URL + course.value.id + "/" + academicYear.value.id;

		const response = await axios.get(URL);

		allTests.value = response.data;
	} catch (error) {
		console.error("An error occurred:", error);
	}
};

const fetchExamQuestion = async (testID, academicYearID, courseID) => {
	try {
		let URL = "http://localhost:4000/questions/";

		URL = URL + testID + "/" + academicYearID + "/" + courseID;
		const response = await axios.get(URL);
		questionsData.value = response.data;
	} catch (error) {
		console.error("An error occurred:", error);
	}
};

const resetValues = () => {
	instancesData.value = [];
	resultsData.value = [];
	passPercData.value = [];
	questionsData.value = [];
	percDataisLoading.value = true;
};

onMounted(() => {
	fetchAllTestsResultsData();
});

watchEffect(() => {
	if (course.value && academicYear.value) {
		resetValues();
		fetchAllTestsResultsData();
	}
});

const updateGraphs = (testID) => {
	// add course ID
	fetchInstancesData(testID, academicYear.value.id, course.value.id);
	fetchTestResultsData(testID, academicYear.value.id, course.value.id);
	fetchPassPercentageData(testID, academicYear.value.id, course.value.id);
	fetchExamQuestion(testID, academicYear.value.id, course.value.id);
};
</script>

<style>
div.tooltip-sm {
	color: white;
	position: absolute;
	text-align: center;
	width: 80px;
	height: 30px;
	padding: 2px;
	font: 12px sans-serif;
	background: black;
	border: 0px;
	border-radius: 5px;
	pointer-events: none;
	font-size: 11px;
}

div.tooltip-md {
	color: white;
	position: absolute;
	text-align: center;
	width: 100px;
	height: 45px;
	padding: 2px;
	font: 12px sans-serif;
	background: black;
	border: 0px;
	border-radius: 5px;
	pointer-events: none;
	font-size: 11px;
}

div.tooltip-lg {
	color: white;
	position: absolute;
	text-align: center;
	width: 115px;
	height: 65px;
	padding: 2px;
	font: 12px sans-serif;
	background: black;
	border: 0px;
	border-radius: 5px;
	pointer-events: none;
	font-size: 11px;
}

div.tooltip-xlg {
	color: white;
	position: absolute;
	text-align: center;
	width: 100px;
	height: 75px;
	padding: 2px;
	font: 12px sans-serif;
	background: black;
	border: 0px;
	border-radius: 5px;
	pointer-events: none;
	font-size: 11px;
}

.test-title {
	font-size: 20px;
	text-align: center;
}

.even-margins-sm {
	margin: 15px 15px 15px 15px;
}

.even-margins-md {
	margin: 25px 25px 25px 25px;
}

.border-primary {
	border: 1px solid;
	border-color: #428bca;
}

.blue-line {
	fill: none;
	stroke: steelblue;
	stroke-width: 2px;
}

.red-line {
	fill: none;
	stroke: red;
	stroke-width: 2px;
}

.green-line {
	fill: none;
	stroke: green;
	stroke-width: 2px;
}

.blue-area {
	fill: #64c7ce;
}

.green-area {
	fill: #92c244;
}

.clip-path {
	clip-path: url(#clip);
}

.zoom {
	cursor: move;
	fill: none;
	pointer-events: all;
}

.box {
	font: 10px sans-serif;
}

.box line,
.box rect,
.box circle {
	fill: lightsteelblue;
	stroke: #000;
	stroke-width: 1.5px;
}

.box .center {
	stroke-dasharray: 3, 3;
}

.box .outlier {
	fill: #ccc;
	stroke: black;
}

option.red {
	background-color: #cc0000;
	font-weight: bold;
	font-size: 12px;
	color: white;
}

.test-title {
	font-weight: bold;
}
</style>
