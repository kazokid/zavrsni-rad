<template>
	<div class="row justify-end">
		<div ref="chartRef"></div>
	</div>
</template>

<script setup>
import { ref, onMounted, toRefs, watchEffect, onUnmounted } from "vue";
import * as d3 from "d3";

const props = defineProps({
	data: {
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

const { data } = toRefs(props);

const marginTPBC = { top: 25, right: 35, bottom: 50, left: 75 };

const widthTPBC = props.width - marginTPBC.left - marginTPBC.right;
const heightTPBC = props.height - marginTPBC.top - marginTPBC.bottom;

const chartRef = ref(null);
const selectTestMessage = "Select a test to see results";
const duration = 500;
const brightness = 1.5;
const hoverBrightnessFactor = 1.5;

// todo implement resolution switching
const resolution = 5;

d3.selection.prototype.moveToFront = function () {
	return this.each(function () {
		this.parentNode.appendChild(this);
	});
};

onMounted(() => {
	renderTestResultsPercentageBarChart();
});

onUnmounted(() => {
	d3.select(chartRef.value).select("svg").remove();
});

watchEffect(() => {
	if (data.value) {
		updateTestResultsPercentageBarChart(data.value, selectTestMessage);
	}
});

function renderTestResultsPercentageBarChart() {
	// create SVG
	const svg = d3
		.select(chartRef.value)
		.append("svg")
		.attr("width", widthTPBC + marginTPBC.left + marginTPBC.right)
		.attr("height", heightTPBC + marginTPBC.top + marginTPBC.bottom)
		.append("g")
		.attr("transform", `translate(${marginTPBC.left}, ${marginTPBC.top})`);

	// create axis labels
	svg
		.append("text")
		.attr("class", "x-axis-label-barchart")
		.attr("text-anchor", "middle")
		.attr(
			"transform",
			`translate(${widthTPBC / 2}, ${heightTPBC + marginTPBC.bottom - 10})`
		)
		.text("Score Percentage")
		.attr("font-family", "sans-serif")
		.attr("font-size", "15px")
		.style("font-weight", "bold");

	svg
		.append("text")
		.attr("class", "y-axis-label-barchart")
		.attr("text-anchor", "middle")
		.attr("transform", `translate(${-45}, ${heightTPBC / 2}) rotate(-90)`)
		.text("Number of Students")
		.attr("font-family", "sans-serif")
		.attr("font-size", "15px")
		.style("font-weight", "bold");

	checkEmptyBarChart([], selectTestMessage);

	// create null scales
	const xScale = d3
		.scaleBand()
		.domain(d3.range(0, 101, 1).map((d) => d / 100))
		.range([0, widthTPBC]);

	const yScale = d3.scaleLinear().domain([0, 0]).range([heightTPBC, 0]);

	const xAxis = d3.axisBottom(xScale).tickFormat(d3.format(".00%"));
	const yAxis = d3.axisLeft(yScale);

	svg
		.append("g")
		.attr("class", "x-axis-barchart")
		.attr("transform", `translate(0, ${heightTPBC})`)
		.call(xAxis)
		.selectAll("text")
		.attr("class", function (d, i) {
			if (i % 10 != 0) d3.select(this).attr("opacity", 0);
		});

	svg.append("g").attr("class", "y-axis-barchart").call(yAxis);

	d3.select("body")
		.append("div")
		.attr("class", "tooltip-sm tooltip-barchart")
		.style("opacity", 0);

	svg
		.append("line")
		.attr("class", "test-barchart-average-vertical")
		.attr("stroke", "black")
		.attr("stroke-width", 0)
		.attr("y1", 0)
		.attr("y2", heightTPBC);

	svg
		.append("line")
		.attr("class", "test-barchart-median-vertical")
		.attr("stroke", "black")
		.attr("stroke-width", 0)
		.attr("y1", 0)
		.attr("y2", heightTPBC);

	svg
		.append("text")
		.attr("class", "average-label-barchart")
		.attr("font-family", "sans-serif")
		.attr("font-size", "12px")
		.attr("text-anchor", "middle");

	svg
		.append("text")
		.attr("class", "median-label-barchart")
		.attr("font-family", "sans-serif")
		.attr("font-size", "12px")
		.attr("text-anchor", "middle");
}

const colorScale = d3
	.scaleLinear()
	.domain([0, 1])
	.range(["red", "green"])
	.interpolate(d3.interpolateHcl);

function updateTestResultsPercentageBarChart(data, selectTestMessage) {
	if (data === undefined) return;

	const testScores = data.map((d) => d.percentage);
	// const testScoresResolution =

	if (!checkEmptyBarChart(data, selectTestMessage)) {
		const svg = d3.select(chartRef.value).select("svg").select("g");

		let max = d3.max(data, (d) => d.percentage) * 100;
		max = max < 100 ? 100 : max;

		let min = d3.min(data, (d) => d.percentage) * 100;
		min = min > 0 ? 0 : min;

		// create scales
		const xScale = d3
			.scaleBand()
			.domain(d3.range(min, max + 1, 1).map((d) => d / 100))
			.range([0, widthTPBC])
			.paddingInner(0.1);

		const yScale = d3
			.scaleLinear()
			.domain([0, d3.max(data, (d) => parseFloat(d.student_count))])
			.range([heightTPBC, 0]);

		const xAxis = d3.axisBottom(xScale).tickFormat(d3.format(".00%"));
		const yAxis = d3.axisLeft(yScale);

		// update bars
		const bars = svg.selectAll("rect").data(data);

		bars
			.exit()
			.transition()
			.duration(duration)
			.attr("x", widthTPBC + marginTPBC.right + marginTPBC.left)
			.style("fill-opacity", 1e-6)
			.remove();

		bars
			.transition()
			.duration(duration)
			.attr("x", function (d) {
				return xScale(parseFloat(d.percentage));
			})
			.attr("y", function (d) {
				return yScale(d.student_count);
			})
			.attr("width", xScale.bandwidth())
			.attr("height", function (d) {
				return heightTPBC - yScale(d.student_count);
			})
			.attr("fill", function (d) {
				return d3.color(colorScale(d.percentage)).brighter(brightness);
			});

		bars
			.enter()
			.append("rect")
			.attr("x", widthTPBC + marginTPBC.right + marginTPBC.left)
			.attr("y", function (d) {
				return yScale(d.student_count);
			})
			.attr("width", xScale.bandwidth())
			.attr("height", function (d) {
				return heightTPBC - yScale(d.student_count);
			})
			.attr("fill", function (d) {
				return d3.color(colorScale(d.percentage)).brighter(brightness);
			})
			.style("fill-opacity", 1e-6)
			.on("mouseover", function (event, d) {
				mouseOverBarHandler(event, d);
			})
			.on("mouseout", function (event, d) {
				mouseOutBarHandler(event, d);
			})
			.transition()
			.duration(duration)
			.attr("x", function (d) {
				return xScale(parseFloat(d.percentage));
			})
			.style("fill-opacity", 1);

		svg
			.selectAll("g.y-axis-barchart")
			.transition()
			.duration(duration)
			.call(yAxis);

		svg
			.selectAll("g.x-axis-barchart")
			.transition()
			.duration(duration)
			.call(xAxis)
			.selectAll("text")
			.attr("class", function (d, i) {
				if (i % 10 != 0) {
					d3.select(this).attr("opacity", 0);
				} else {
					d3.select(this).attr("opacity", 1);
				}
			});

		var average = +(
			data.reduce(function (a, b) {
				return a + b.percentage * b.student_count;
			}, 0) /
			data.reduce(function (a, b) {
				return a + +b.student_count;
			}, 0)
		).toFixed(2);

		var median = d3.quantile(testScores.map(Number).sort(d3.ascending), 0.5);
		average = Math.round(average * 100) / 100;
		median = Math.round(median * 100) / 100;

		console.log(average, median);
		const averageVerticalX = xScale(average) + xScale.bandwidth() / 2;
		const medianVerticalX = xScale(median) + xScale.bandwidth() / 2;

		console.log(averageVerticalX, medianVerticalX);

		svg
			.select(".test-barchart-average-vertical")
			.transition()
			.attr("stroke-width", 1)
			.attr("x1", averageVerticalX)
			.attr("x2", averageVerticalX);

		svg
			.select(".test-barchart-median-vertical")
			.transition()
			.attr("stroke-width", 1)
			.attr("x1", medianVerticalX)
			.attr("x2", medianVerticalX);

		svg
			.select(".average-label-barchart")
			.transition()
			.attr(
				"transform",
				`translate(${averageVerticalX - 5}, ${40}) rotate(-90)`
			)
			.text(`Average: ${Math.round(average * 100 * 100) / 100}%`);

		svg
			.select(".median-label-barchart")
			.transition()
			.attr(
				"transform",
				`translate(${medianVerticalX - 5}, ${140}) rotate(-90)`
			)
			.text(`Median: ${Math.round(median * 100 * 100) / 100}%`);

		svg.select(".median-label-barchart").moveToFront();
		svg.select(".average-label-barchart").moveToFront();
	}
}

function checkEmptyBarChart(data, message) {
	const svg = d3.select(chartRef.value).select("svg").select("g");

	const emptySel = svg.selectAll("text.message").data(message);

	if (data.length === 0) {
		emptySel.text(message);

		emptySel
			.enter()
			.append("text")
			.text(message)
			.attr("text-anchor", "middle")
			.attr("x", widthTPBC / 2)
			.attr("y", heightTPBC / 2)
			.attr("font-size", "16px")
			.attr("fill", "black")
			.attr("class", "message")
			.style("fill-opacity", 1e-6)
			.transition()
			.duration(200)
			.style("fill-opacity", 1);
		return true;
	}

	emptySel
		.data({})
		.exit()
		.transition()
		.duration(duration)
		.style("fill-opacity", 1e-6)
		.remove();

	return false;
}

function mouseOverBarHandler(event, d) {
	d3.select(this).attr("fill", (d) =>
		d3
			.color(colorScale(d.percentage))
			.brighter(brightness * hoverBrightnessFactor)
	);

	const tooltip = d3.select(".tooltip-barchart");
	tooltip.transition().duration(200).style("opacity", 0.8);
	tooltip
		.html(
			`<b>Score: ${Math.round(d.percentage * 100)}%</b><br><b>Students: ${
				d.student_count
			}</b>`
		)
		.style("left", event.pageX - 40 + "px")
		.style("top", event.pageY - 20 + "px");
}

function mouseOutBarHandler(event, d) {
	d3.select(this).attr("fill", (d) =>
		d3.color(colorScale(d.percentage)).brighter(brightness)
	);

	const tooltip = d3.select(".tooltip-barchart");
	tooltip.transition().duration(200).style("opacity", 0);
}
</script>
