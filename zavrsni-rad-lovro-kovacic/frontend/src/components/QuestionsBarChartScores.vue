<template>
	<div ref="chartRef"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watchEffect, toRefs } from "vue";
import * as d3 from "d3";

const chartRef = ref(null);

const props = defineProps({
	questionScoresData: {
		required: true,
		type: Array,
	},
	height: {
		type: Number,
		default: 400,
	},
	width: {
		type: Number,
		default: 800,
	},
});

const projectColors = {
	primary: "#64c7ce",
	secondary: "#92c244",
	accent: "#dbdfaa",

	dark: "#374259",
	darkPage: "#121212",

	positive: "#21ba45",
	negative: "#c10015",
	info: "#31ccec",
	warning: "#f2c037",
};

const { questionScoresData } = toRefs(props);
const previousBars = ref({});

onMounted(() => {
	drawQuestionBarChart();
});

onUnmounted(() => {
	d3.select(chartRef.value).selectAll("svg").remove();
});

watchEffect(() => {
	if (questionScoresData.value === undefined) return;

	d3.select(chartRef.value).selectAll("svg").remove();
	drawQuestionBarChart();
});

function drawQuestionBarChart() {
	if (questionScoresData.value === undefined) return;

	// parse string from questonScoreData to Integers
	questionScoresData.value.forEach((data) => {
		data.score = parseFloat(data.score);
		data.count = parseInt(data.count);
	});

	// const barWidth = 120;
	// const width = questionScoresData.value.length * barWidth;
	const width = props.width;
	const height = props.height;
	const margin = { top: 20, right: 20, bottom: 60, left: 50 };
	const padding = 0.1;

	const max = d3.max(questionScoresData.value, (d) => d.count);

	const svg = d3
		.select(chartRef.value)
		.append("svg")
		.attr("width", width)
		.attr("height", height);

	const xScale = d3
		.scaleBand()
		.range([margin.left, width - margin.right])
		.domain(questionScoresData.value.map((d) => d.score))
		.paddingInner(padding)
		.paddingOuter(padding);

	const yScale = d3
		.scaleLinear()
		.range([height - margin.bottom, margin.top])
		.domain([0, max]);

	const tooltip = d3
		.select(chartRef.value)
		.append("div")
		.style("position", "absolute")
		.style("visibility", "hidden")
		.style("background", "white")
		.style("border", "solid")
		.style("border-width", "1px")
		.style("border-radius", "5px")
		.style("padding", "3px");

	svg
		.append("text")
		.attr("class", "y-axis-label-boxplot")
		.attr("text-anchor", "middle")
		.attr("transform", `translate(${15}, ${height / 2}) rotate(-90)`)
		.text("Number of students")
		.attr("font-family", "sans-serif")
		.attr("font-size", "15px")
		.attr("font-weight", "bold");

	svg
		.append("text")
		.attr("class", "x-axis-label-barchart")
		.attr("text-anchor", "middle")
		.attr("transform", `translate(${width / 2}, ${height - 10})`)
		.text("Question score")
		.attr("font-family", "sans-serif")
		.attr("font-size", "15px")
		.attr("font-weight", "bold");

	questionScoresData.value.forEach((data) => {
		let barColor = projectColors.primary;
		let dataBars = data.count;

		const graphBar = svg
			.append("rect")
			.attr("x", xScale(data.score))
			.attr("width", xScale.bandwidth())
			.attr("fill", barColor)
			.on("mouseover", function () {
				tooltip.style("visibility", "visible");
				tooltip.text(`Num. of students: ${data.count}`);
				d3.select(this).attr("fill-opacity", 0.5);
			})
			.on("mousemove", function (event) {
				tooltip
					.style("top", event.pageY - 10 + "px")
					.style("left", event.pageX + 10 + "px");
			})
			.on("mouseout", function () {
				tooltip.style("visibility", "hidden");
				d3.select(this).attr("fill-opacity", 1);
			});

		const barPercentage = svg
			.append("text")
			.text(`${dataBars}`)
			.attr("x", xScale(data.score) + xScale.bandwidth() / 2)
			.attr("text-anchor", "middle")
			.attr("font-size", "1.2rem");

		// smooth transition to the new data
		if (previousBars.value[data.count]) {
			graphBar
				.attr("y", previousBars.value[data.count].y)
				.attr("height", previousBars.value[data.count].height)
				.transition()
				.duration(500)
				.attr("y", yScale(dataBars))
				.attr("height", yScale(0) - yScale(dataBars));

			barPercentage
				.attr("y", previousBars.value[data.count].y - 5)
				.transition()
				.duration(500)
				.attr("y", yScale(dataBars) - 5);
		} else {
			graphBar
				.attr("y", yScale(0))
				.attr("height", 0)
				.transition()
				.duration(500)
				.attr("y", yScale(dataBars))
				.attr("height", yScale(0) - yScale(dataBars));

			barPercentage
				.attr("y", yScale(0) - 5)
				.transition()
				.duration(500)
				.attr("y", yScale(dataBars) - 5);
		}

		// set the previousBars values to the current bars
		previousBars.value[data.count] = {
			y: yScale(dataBars),
			height: yScale(0) - yScale(dataBars),
		};

		function xAxis(g) {
			g.attr("transform", `translate(0,${height - margin.bottom})`)
				.call(d3.axisBottom(xScale).tickSizeOuter(0))
				.attr("font-size", "1rem")
				.attr("font-style", "bold");
		}

		function yAxis(g) {
			g.attr("transform", `translate(${margin.left},0)`)
				.call(d3.axisLeft(yScale))
				.attr("font-size", "1rem");
		}

		svg.append("g").call(xAxis);

		svg.append("g").call(yAxis);
	});
}
</script>
