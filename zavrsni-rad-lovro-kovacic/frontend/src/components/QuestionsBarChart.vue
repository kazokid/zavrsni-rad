<template>
	<div ref="chartRef"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watchEffect, toRefs } from "vue";
import * as d3 from "d3";

const chartRef = ref(null);

const props = defineProps({
	questionData: {
		required: true,
		type: Array,
	},
	width: {
		type: Number,
		default: 800,
	},
	height: {
		type: Number,
		default: 400,
	},
});

const { questionData } = toRefs(props);
const previousBars = ref({});

onMounted(() => {
	drawQuestionBarChart();
});

onUnmounted(() => {
	d3.select(chartRef.value).selectAll("svg").remove();
});

watchEffect(() => {
	if (questionData.value === undefined) return;

	d3.select(chartRef.value).selectAll("svg").remove();
	drawQuestionBarChart();
});
// make them into capital letters
function numberToLetter(number) {
	if (number === null) return "N/A";
	return String.fromCharCode(96 + number - 32);
}

function drawQuestionBarChart() {
	if (questionData.value === undefined) return;

	const width = props.width;
	const height = props.height;
	const margin = {
		top: 50,
		right: 20,
		bottom: 60,
		left: 80,
	};
	const padding = 0.1;

	const svg = d3
		.select(chartRef.value)
		.append("svg")
		.attr("width", width)
		.attr("height", height);

	const barWidth =
		(width - margin.left - margin.right - padding * width) /
		questionData.value.length;

	const xScale = d3
		.scaleBand()
		.range([margin.left, width - margin.right])
		.domain(questionData.value.map((d) => d.ordinal))
		.paddingInner(padding)
		.paddingOuter(padding);

	const yScale = d3
		.scaleLinear()
		.range([height - margin.bottom, margin.top])
		.domain([0, 100]);

	svg
		.append("text")
		.attr("class", "y-axis-label-boxplot")
		.attr("text-anchor", "middle")
		.attr("transform", `translate(20, ${height / 2}) rotate(-90)`)
		.text("Score")
		.attr("font-family", "sans-serif")
		.attr("font-size", "15px")
		.attr("font-weight", "bold");

	svg
		.append("text")
		.attr("class", "x-axis-label-barchart")
		.attr("text-anchor", "middle")
		.attr(
			"transform",
			`translate(${width / 2 + margin.left / 2}, ${height - 10})`
		)
		.text("Answer")
		.attr("font-family", "sans-serif")
		.attr("font-size", "15px")
		.attr("font-weight", "bold");

	const xAxisColorLookup = questionData.value.reduce((acc, curr) => {
		if (curr.ordinal === null) {
			acc[curr.ordinal] = "grey";
			return acc;
		}
		acc[curr.ordinal] = curr.is_correct ? "green" : "red";
		return acc;
	}, {});

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

	const color = d3
		.scaleOrdinal()
		.domain(["Correct", "Incorrect", "Unanswered"])
		.range(["green", "red", "grey"]);

	const legend = svg
		.selectAll(".legend")
		.data(color.domain())
		.enter()
		.append("g")
		.attr("class", "legend")
		.attr("transform", (d, i) => `translate(${(i - 1) * 120},15)`);

	legend
		.append("rect")
		.attr("x", xScale(2) + 65)
		.attr("width", 18)
		.attr("height", 18)
		.style("fill", color);

	legend
		.append("text")
		.attr("x", xScale(2) + 65 - 5)
		.attr("y", 9)
		.attr("dy", ".3em")
		.style("text-anchor", "end")
		.text((d) => d);

	questionData.value.forEach((data) => {
		let barColor = data.correct ? "green" : "red";

		let dataBars = data.correct ? data.correct : data.incorrect;

		// special case for unanswered questions
		if (data.ordinal === null) {
			barColor = "grey";
			dataBars = data.unanswered;
		}

		const graphBar = svg
			.append("rect")
			.attr("x", xScale(data.ordinal))
			.attr("width", barWidth)
			.attr("fill", barColor)
			.on("mouseover", function () {
				tooltip.style("visibility", "visible");
				tooltip.text(`Num. of students: ${data.num}`);
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
			.text(`${dataBars}%`)
			.attr("x", xScale(data.ordinal) + barWidth / 2)
			.attr("text-anchor", "middle")
			.attr("font-size", "1.2rem");

		// smooth transition to the new data
		if (previousBars.value[data.ordinal]) {
			graphBar
				.attr("y", previousBars.value[data.ordinal].y)
				.attr("height", previousBars.value[data.ordinal].height)
				.transition()
				.duration(500)
				.attr("y", yScale(dataBars))
				.attr("height", yScale(0) - yScale(dataBars));

			barPercentage
				.attr("y", previousBars.value[data.ordinal].y - 5)
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
		previousBars.value[data.ordinal] = {
			y: yScale(dataBars),
			height: yScale(0) - yScale(dataBars),
		};

		function xAxis(g) {
			g.attr("transform", `translate(0,${height - margin.bottom})`)
				.call(
					d3
						.axisBottom(xScale)
						.tickFormat((i) => numberToLetter(i))
						.tickSizeOuter(0)
				)
				.attr("font-size", "1.5rem")
				.attr("font-style", "bold");
		}

		function yAxis(g) {
			g.attr("transform", `translate(${margin.left},0)`)
				.call(d3.axisLeft(yScale).tickFormat((i) => i + "%"))
				.attr("font-size", "1rem");
		}

		svg
			.append("g")
			.call(xAxis)
			.selectAll("text")
			.attr("fill", (d) => xAxisColorLookup[d]);

		svg.append("g").call(yAxis);
	});
}
</script>
