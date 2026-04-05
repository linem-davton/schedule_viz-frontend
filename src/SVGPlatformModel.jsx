import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import dagre from "dagre";

const legendData = [
  { type: "Compute", color: "#39c994" },
  { type: "Router", color: "#f09b48" },
  { type: "Sensor", color: "#579ff0" },
  { type: "Actuator", color: "#ff7f63" },
];

const SVGPlatformModel = ({
  graph,
  highlightNode,
  highlightedEdge,
  onNodeSelect,
  onEdgeSelect,
}) => {
  const svgRef = useRef();
  const nodeRadius = 5;

  const calculateBoundaryPoint = (source, target) => {
    const deltaX = target.x - source.x;
    const deltaY = target.y - source.y;
    const dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY) || 1;

    if (source.shape === "router" || target.shape === "router") {
      const angle = Math.atan2(deltaY, deltaX);
      const edgeDist =
        nodeRadius /
        Math.cos(Math.PI / 4 - Math.abs((angle % (Math.PI / 2)) - Math.PI / 4));

      return {
        x: source.x + edgeDist * Math.cos(angle),
        y: source.y + edgeDist * Math.sin(angle),
      };
    }

    return {
      x: source.x + (nodeRadius * deltaX) / dist,
      y: source.y + (nodeRadius * deltaY) / dist,
    };
  };

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    if (!graph || !graph.nodes.length) {
      return;
    }

    const svgGroup = svg.append("g");
    const dagreGraph = new dagre.graphlib.Graph();

    dagreGraph.setGraph({
      rankdir: "LR",
      nodesep: 10,
      edgesep: 16,
      ranksep: 20,
      marginx: 16,
      marginy: 16,
    });
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    graph.nodes.forEach((node) => {
      const size = node.type === "router" ? 24 : 20;
      dagreGraph.setNode(node.id, {
        label: node.id,
        width: size,
        height: size,
        shape: node.type,
      });
    });

    graph.links.forEach((edge) => {
      dagreGraph.setEdge(edge.start_node, edge.end_node, {
        width: 10,
        height: 10,
        label: edge.link_delay,
      });
    });

    dagre.layout(dagreGraph);
    svg.attr(
      "viewBox",
      `0 0 ${dagreGraph.graph().width} ${dagreGraph.graph().height}`,
    );

    const zoom = d3.zoom().scaleExtent([0.7, Math.max(2, graph.nodes.length)]);
    zoom.on("zoom", (event) => {
      svgGroup.attr("transform", event.transform);
    });
    svg.call(zoom);

    const nodes = svgGroup
      .selectAll(".node")
      .data(dagreGraph.nodes().map((nodeId) => dagreGraph.node(nodeId)), (d) => d.label)
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", (d) => `translate(${d.x},${d.y})`)
      .on("click", (_event, d) => {
        onNodeSelect?.(d.label);
      });

    nodes.each(function eachNode(d) {
      const node = d3.select(this);
      node
        .append("circle")
        .attr("r", nodeRadius)
        .classed(d.shape, true)
        .classed("highlighted-circle", highlightNode === d.label);
    });

    nodes
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", ".35em")
      .style("font-size", "5px")
      .text((d) => d.label);

    const edges = svgGroup
      .selectAll(".edge")
      .data(dagreGraph.edges())
      .enter()
      .append("g")
      .attr("class", "edge")
      .on("click", (_event, d) => {
        onEdgeSelect?.({ start_node: d.v, end_node: d.w });
      });

    edges
      .append("line")
      .classed(
        "highlighted-edge",
        (d) =>
          highlightedEdge?.start_node === d.v &&
          highlightedEdge?.end_node === d.w,
      )
      .attr("x1", (d) => calculateBoundaryPoint(dagreGraph.node(d.v), dagreGraph.node(d.w)).x)
      .attr("y1", (d) => calculateBoundaryPoint(dagreGraph.node(d.v), dagreGraph.node(d.w)).y)
      .attr("x2", (d) => calculateBoundaryPoint(dagreGraph.node(d.w), dagreGraph.node(d.v)).x)
      .attr("y2", (d) => calculateBoundaryPoint(dagreGraph.node(d.w), dagreGraph.node(d.v)).y);

    edges
      .append("text")
      .attr("x", (d) => {
        const source = calculateBoundaryPoint(dagreGraph.node(d.v), dagreGraph.node(d.w));
        const target = calculateBoundaryPoint(dagreGraph.node(d.w), dagreGraph.node(d.v));
        return (source.x + target.x) / 2;
      })
      .attr("y", (d) => {
        const source = calculateBoundaryPoint(dagreGraph.node(d.v), dagreGraph.node(d.w));
        const target = calculateBoundaryPoint(dagreGraph.node(d.w), dagreGraph.node(d.v));
        return (source.y + target.y) / 2;
      })
      .text((d) => dagreGraph.edge(d).label)
      .attr("font-size", "10px")
      .attr("text-anchor", "middle")
      .attr("dy", -4);

    const legend = svg
      .append("g")
      .attr("class", "legend")
      .attr(
        "transform",
        `translate(0, ${dagreGraph.graph().height - dagreGraph.graph().height / 18})`,
      );

    legend
      .selectAll(".legend-item")
      .data(legendData)
      .enter()
      .append("g")
      .attr("class", "legend-item")
      .attr(
        "transform",
        (_d, index) => `translate(${(index * dagreGraph.graph().width) / 4},0)`,
      )
      .each(function eachLegendItem(d) {
        const item = d3.select(this);

        item
          .append("rect")
          .attr("width", dagreGraph.graph().width / 42)
          .attr("height", dagreGraph.graph().height / 42)
          .style("fill", d.color);

        item
          .append("text")
          .attr("x", dagreGraph.graph().width / 25)
          .attr("y", dagreGraph.graph().height / 42)
          .text(d.type)
          .style("text-anchor", "start")
          .style("font-size", `${dagreGraph.graph().width / 26}px`);
      });
  }, [graph, highlightNode, highlightedEdge, onNodeSelect, onEdgeSelect]);

  return <svg ref={svgRef} width="900" height="800"></svg>;
};

export default SVGPlatformModel;
