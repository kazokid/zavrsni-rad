<template>
	<div class="q-ml-lg">
		<q-toggle
			v-model="showJitterDots"
			color="green"
			:label="showJitterDots ? 'Hide jitter dots' : 'Show jitter dots'"
			class="jitter-toggle"
		/>
		<div ref="chartRef"></div>
	</div>
</template>

<script setup>
import { ref, onMounted, watchEffect, onUnmounted, toRefs } from "vue";

import * as d3 from "d3";

const props = defineProps({
	examData: {
		required: true,
		type: Array,
	},
});
 
const { examData } = toRefs(props);

const emit = defineEmits(["selectTest"]);

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

const showJitterDots = ref(false);
const selectedTestKey = ref(undefined);

const chartRef = ref(null);
const brightness = 1.5;

onMounted(() => {
	renderTestsPercentagesBoxPlot(showJitterDots.value);
});

onUnmounted(() => {
	d3.select(chartRef.value).selectAll("svg").remove();
});

watchEffect(() => {
	d3.select(chartRef.value).selectAll("svg").remove();
	renderTestsPercentagesBoxPlot(showJitterDots.value);
});

function renderTestsPercentagesBoxPlot(showJitterDots) {
	if (examData.value === undefined) return;

	if (examData.value.length === 0) {
		d3.select(chartRef.value).selectAll("div").remove();
		d3.select(chartRef.value)
			.append("div")
			.attr("class", "test-title")
			.text("No tests found");
		return;
	} else {
		d3.select(chartRef.value).selectAll("div").remove();
	}

	var data = examData.value;

	let scoreData = data.map((d) => d.scores);

	let min = Infinity,
		max = -Infinity;

	scoreData.forEach((scores) => {
		if (scores === undefined) return;

		let rowMax = d3.max(scores);
		let rowMin = d3.min(scores);
		if (rowMax > max) max = rowMax;
		if (rowMin < min) min = rowMin;
	});

	const margin = {
		top: 50,
		right: 80,
		bottom: 60,
		left: 100,
	};

	const width = 600;
	const boxHeight = 45;
	var height = data.length * boxHeight;

	const svg = d3
		.select(chartRef.value)
		.append("svg")
		.attr("width", width)
		.attr("height", height);

	const xScalePadding = 35;

	// Adding the X Axis

	const xScale = d3
		.scaleLinear()
		.domain([min > 0 ? 0 : min, max < 1 ? 1 : max])
		.range([margin.left, width - margin.right]);

	function xAxis(g) {
		g.attr("transform", `translate(${xScalePadding},${margin.top})`)
			.call(d3.axisTop(xScale).tickFormat(d3.format(".0%")))
			.attr("font-size", "0.7rem");
	}

	// Adding the Y Axis

	const padding = 0.2;

	const yScale = d3
		.scaleBand()
		.domain(data.map((d) => d.title_abbrev))
		.range([margin.top, height - margin.bottom])
		.paddingInner(padding)
		.paddingOuter(padding);

	// Adjusting the height of the boxes to look nice - this is a bit of a hack

	while (yScale.bandwidth() < boxHeight) {
		height += 20;
		yScale.range([margin.top, height - margin.bottom]);
	}

	svg.attr("height", height);

	function yAxis(g) {
		g.attr("transform", `translate(${margin.left},0)`)
			.call(d3.axisLeft(yScale))
			.attr("font-size", "0.7rem");
	}

	svg.append("g").call(yAxis);

	svg
		.append("text")
		.attr("class", "y-axis-label-boxplot")
		.attr("text-anchor", "middle")
		.attr("transform", `translate(${25}, ${height / 2}) rotate(-90)`)
		.text("Exam title")
		.attr("font-family", "sans-serif")
		.attr("font-size", "15px")
		.attr("font-weight", "bold");

	svg
		.append("text")
		.attr("class", "x-axis-label-barchart")
		.attr("text-anchor", "middle")
		.attr("transform", `translate(${width / 2 + xScalePadding}, 15)`)
		.text("Exam score")
		.attr("font-family", "sans-serif")
		.attr("font-size", "15px")
		.attr("font-weight", "bold");

	svg.append("g").call(xAxis);

	d3.select("body")
		.append("div")
		.attr("class", "tooltip-sm tooltip-boxplot-outlier")
		.style("opacity", 0);

	d3.select("body")
		.append("div")
		.attr("class", "tooltip-lg tooltip-boxplot-box")
		.style("opacity", 0);

	var sumstat = Array.from(
		d3.group(data, (d) => d.title_abbrev),
		([key, values]) => {
			let scores = values[0].scores.sort(d3.ascending);
			let q1 = d3.quantile(scores, 0.25);
			let median = d3.quantile(scores, 0.5);
			let q3 = d3.quantile(scores, 0.75);
			let interQuantileRange = q3 - q1;
			let min = q1 - 1.5 * interQuantileRange;
			let max = q3 + 1.5 * interQuantileRange;
			if (min < scores[0]) min = scores[0];
			if (max > scores[scores.length - 1]) max = scores[scores.length - 1];

			return {
				key,
				value: {
					q1: q1,
					median: median,
					q3: q3,
					interQuantileRange: interQuantileRange,
					min: min,
					max: max,
				},
			};
		}
	);

	// Show the main horizontal line
	svg
		.selectAll("horizonLines")
		.data(sumstat)
		.enter()
		.append("line")
		.attr("x1", function (d) {
			return xScale(d.value.min) + xScalePadding;
		})
		.attr("x2", function (d) {
			return xScale(d.value.max) + xScalePadding;
		})
		.attr("y1", function (d) {
			return yScale(d.key) + yScale.bandwidth() / 2;
		})
		.attr("y2", function (d) {
			return yScale(d.key) + yScale.bandwidth() / 2;
		})
		.attr("stroke", "black");

	// add the whiskers
	var whiskersYOffset = yScale.bandwidth() / 2;
	var whiskersHeight = 5;

	svg
		.selectAll("whiskerTicksLeft")
		.data(sumstat)
		.enter()
		.append("line")
		.attr("x1", function (d) {
			return xScale(d.value.min) + xScalePadding;
		})
		.attr("x2", function (d) {
			return xScale(d.value.min) + xScalePadding;
		})
		.attr("y1", function (d) {
			return yScale(d.key) + whiskersYOffset - whiskersHeight;
		})
		.attr("y2", function (d) {
			return yScale(d.key) + whiskersYOffset + whiskersHeight;
		})
		.attr("stroke", "black");

	svg
		.selectAll("whiskerTicksRight")
		.data(sumstat)
		.enter()
		.append("line")
		.attr("x1", function (d) {
			return xScale(d.value.max) + xScalePadding;
		})
		.attr("x2", function (d) {
			return xScale(d.value.max) + xScalePadding;
		})
		.attr("y1", function (d) {
			return yScale(d.key) + whiskersYOffset - whiskersHeight;
		})
		.attr("y2", function (d) {
			return yScale(d.key) + whiskersYOffset + whiskersHeight;
		})
		.attr("stroke", "black");

	// rectangle for the main bars

	svg
		.selectAll("boxes")
		.data(sumstat)
		.enter()
		.append("rect")
		.attr("x", function (d) {
			return xScale(d.value.q1) + xScalePadding;
		})
		.attr("y", function (d) {
			return yScale(d.key);
		})
		.attr("height", yScale.bandwidth())
		.attr("width", function (d) {
			// aestethic width
			if (xScale(d.value.q3) - xScale(d.value.q1) < 2) {
				return 2;
			}
			return xScale(d.value.q3) - xScale(d.value.q1);
		})
		.attr("stroke", "black")
		.style("fill", function (d) {
			if (selectedTestKey.value && d.key == selectedTestKey.value) {
				return projectColors.primary;
			} else {
				return "lightgray";
			}
		})
		.attr("class", function (d) {
			return `boxplot-box-${d.key}`;
		});

	// Show the median
	svg
		.selectAll("medianLines")
		.data(sumstat)
		.enter()
		.append("line")
		.attr("x1", function (d) {
			return xScale(d.value.median) + xScalePadding;
		})
		.attr("x2", function (d) {
			return xScale(d.value.median) + xScalePadding;
		})
		.attr("y1", function (d) {
			return yScale(d.key);
		})
		.attr("y2", function (d) {
			return yScale(d.key) + yScale.bandwidth();
		})
		.attr("stroke", "black")
		.style("height", 50);

	// Show the percentages on the each end of the box
	svg
		.selectAll("boxPercentagesQ1")
		.data(sumstat)
		.enter()
		.append("text")
		.text((d) => `${Math.round(d.value.q1 * 100)}%`)
		.attr("x", function (d) {
			return xScale(d.value.q1) + 5 + xScalePadding;
		})
		.attr("y", function (d) {
			return yScale(d.key) + 10;
		})
		.attr("font-size", "0.7rem")
		.attr("font-weight", "bold")
		.style("dominant-baseline", "middle");

	svg
		.selectAll("boxPercentagesQ3")
		.data(sumstat)
		.enter()
		.append("text")
		.text((d) => `${Math.round(d.value.q3 * 100)}%`)
		.attr("x", function (d) {
			return xScale(d.value.q3) + 5 + xScalePadding;
		})
		.attr("y", function (d) {
			return yScale(d.key) + 10;
		})
		.attr("font-size", "0.7rem")
		.attr("font-weight", "bold")
		.style("dominant-baseline", "middle");

	svg
		.selectAll("medianPercentages")
		.data(sumstat)
		.enter()
		.append("text")
		.text((d) => `${Math.round(d.value.median * 100)}%`)
		.attr("x", function (d) {
			return xScale(d.value.median) + 5 + xScalePadding;
		})
		.attr("y", function (d) {
			return yScale(d.key) + yScale.bandwidth() - 10;
		})
		.attr("font-size", "0.7rem")
		.attr("font-weight", "bold")
		.style("dominant-baseline", "middle");

	// var myColor = d3.scaleQuantize().range(d3.schemeRdYlGn[11]).domain([0, 1]);
	var colorScale = d3
		.scaleLinear()
		.domain([min < 0 ? min : 0, max > 1 ? max : 1])
		.range(["red", "green"])
		.interpolate(d3.interpolateHcl);

	var outliersData = data.flatMap((d, i) => {
		var filteredScores = d.scores.filter((score) => {
			if (score < sumstat[i].value.min || score > sumstat[i].value.max) {
				return true;
			} else {
				return false;
			}
		});

		return filteredScores.map((score) => ({
			title_abbrev: d.title_abbrev,
			scores: score,
		}));
	});

	const outliersScoresSum = outliersData.reduce((acc, curr) => {
		const existingEntry = acc.find(
			(entry) =>
				entry.title_abbrev === curr.title_abbrev && entry.score === curr.scores
		);

		if (existingEntry) {
			existingEntry.number_of_instances++;
		} else {
			acc.push({
				title_abbrev: curr.title_abbrev,
				score: curr.scores,
				number_of_instances: 1,
			});
		}

		return acc;
	}, []);

	const radiusScale = d3
		.scaleLinear()
		.domain([0, d3.max(outliersScoresSum, (d) => d.number_of_instances)])
		.range([2, 5]);

	if (!showJitterDots) {
		svg
			.selectAll("outlierDots")
			.data(outliersScoresSum)
			.enter()
			.append("circle")
			.attr("class", "outlierDots")
			.attr("cx", function (d) {
				return xScale(d.score) + xScalePadding;
			})
			.attr("cy", function (d) {
				return yScale(d.title_abbrev) + yScale.bandwidth() / 2;
			})
			.style("fill", function (d) {
				if (selectedTestKey.value && d.title_abbrev == selectedTestKey.value) {
					return projectColors.primary;
				} else {
					return "lightgray";
				}
			})
			.attr("stroke", "black")
			.attr("r", function (d) {
				return radiusScale(d.number_of_instances);
			})
			.attr("pointer-events", "all")
			.style("cursor", "pointer")
			.on("mouseover", (event, d) => {
				const tooltip = d3.select(".tooltip-boxplot-outlier");
				tooltip.transition().duration(200).style("opacity", 0.8);
				tooltip
					.html(
						`<b>Score: ${d.score * 100}</b><br/><b>Instances: ${
							d.number_of_instances
						}</b>`
					)
					.style("left", event.pageX + 10 + "px")
					.style("top", event.pageY - 20 + "px");
			})
			.on("mouseout", () => {
				const tooltip = d3.select(".tooltip-boxplot-outlier");
				tooltip.transition().duration(200).style("opacity", 0);
			})
			.on("mousemove", (event, d) => {
				const tooltip = d3.select(".tooltip-boxplot-outlier");
				tooltip
					.style("left", event.pageX + 10 + "px")
					.style("top", event.pageY - 20 + "px");
			});
	}

	var flattenData = data.flatMap((d) =>
		d.scores.map((score) => ({ title_abbrev: d.title_abbrev, scores: score }))
	);

	if (showJitterDots) {
		var jitterWidth = 50;
		svg
			.selectAll("indPoints")
			.data(flattenData)
			.enter()
			.append("circle")
			.attr("cx", function (d) {
				return xScale(d.scores) + xScalePadding;
			})
			.attr("cy", function (d) {
				return (
					yScale(d.title_abbrev) +
					yScale.bandwidth() / 2 -
					jitterWidth / 2 +
					Math.random() * jitterWidth
				);
			})
			.style("fill", function (d) {
				return d3.color(colorScale(d.scores)).brighter(brightness);
			})
			.attr("stroke", "black")
			.attr("r", 1e-6)
			.transition()
			.duration(800)
			.attr("r", 5)
			.transition()
			.duration(300)
			.attr("r", 3.5);
	}
	svg
		.selectAll("g.hover")
		.data(data)
		.enter()
		.append("g")
		.attr("class", "hover")
		.append("rect")
		.attr("fill", "none")
		.attr("x", xScale(0))
		.attr("y", (d) => {
			return yScale(d.title_abbrev);
		})
		.attr("height", yScale.bandwidth())
		.attr("width", function (d) {
			return width - margin.left - margin.right + xScalePadding;
		})
		.attr("pointer-events", "all")
		.style("cursor", "pointer")
		.on("mouseover", (event, d) => {
			const tooltip = d3.select(".tooltip-boxplot-box");
			tooltip.transition().duration(200).style("opacity", 0.8);
			tooltip
				.html(`<b>ID: ${d.id}</b><br/><b>${d.title}</b>`)
				.style("left", event.pageX + 10 + "px")
				.style("top", event.pageY - 20 + "px");
		})
		.on("mouseout", () => {
			const tooltip = d3.select(".tooltip-boxplot-box");
			tooltip.transition().duration(200).style("opacity", 0);
		})
		.on("mousemove", (event, d) => {
			const tooltip = d3.select(".tooltip-boxplot-box");
			tooltip
				.style("left", event.pageX + 10 + "px")
				.style("top", event.pageY - 20 + "px");
		})
		.on("click", (e, d) => {
			markSelectoin(d.title_abbrev);
			emit("selectTest", d.id);
		});

	// raise the outlilner to the top

	svg.selectAll(".outlierDots").raise();
}

function markSelectoin(key) {
	selectedTestKey.value = key;
	let rect = d3.select(`boxplot-box-${key}`);
	rect.attr("fill", d3.color(projectColors.primary).brighter(brightness));
}
</script>

<style>
.jitter-toggle {
	margin-left: 80px;
}

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

/* .red-area {
	fill: lightsalmon;
} */

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
</style>
