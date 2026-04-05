import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import dagre from "dagre";

const SVGApplicationModel = ({
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

    return {
      x: source.x + (nodeRadius * deltaX) / dist,
      y: source.y + (nodeRadius * deltaY) / dist,
    };
  };

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    if (!graph || !graph.tasks.length) {
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

    graph.tasks.forEach((node) => {
      dagreGraph.setNode(node.id, { label: node.id, width: 22, height: 22 });
    });

    graph.messages.forEach((edge) => {
      dagreGraph.setEdge(edge.sender, edge.receiver, {
        width: 10,
        height: 10,
        label: edge.id,
      });
    });

    dagre.layout(dagreGraph);
    svg.attr(
      "viewBox",
      `0 0 ${dagreGraph.graph().width} ${dagreGraph.graph().height}`,
    );

    const zoom = d3.zoom().scaleExtent([0.7, Math.max(2, graph.tasks.length)]);
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

    nodes
      .append("circle")
      .attr("r", nodeRadius)
      .classed("highlighted-circle", (d) => highlightNode === d.label);

    nodes
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", ".35em")
      .style("font-size", "5px")
      .text((d) => d.label);

    svgGroup
      .selectAll(".edge")
      .data(dagreGraph.edges())
      .enter()
      .append("line")
      .attr("class", "edge")
      .classed(
        "highlighted-edge",
        (d) =>
          highlightedEdge?.sender === d.v && highlightedEdge?.receiver === d.w,
      )
      .attr("x1", (d) => calculateBoundaryPoint(dagreGraph.node(d.v), dagreGraph.node(d.w)).x)
      .attr("y1", (d) => calculateBoundaryPoint(dagreGraph.node(d.v), dagreGraph.node(d.w)).y)
      .attr("x2", (d) => calculateBoundaryPoint(dagreGraph.node(d.w), dagreGraph.node(d.v)).x)
      .attr("y2", (d) => calculateBoundaryPoint(dagreGraph.node(d.w), dagreGraph.node(d.v)).y)
      .attr("marker-end", "url(#application-arrowhead)")
      .on("click", (_event, edge) => {
        onEdgeSelect?.({ sender: edge.v, receiver: edge.w });
      });

    svgGroup
      .append("defs")
      .append("marker")
      .attr("id", "application-arrowhead")
      .attr("viewBox", "-0 -5 10 10")
      .attr("refX", 5)
      .attr("refY", 0)
      .attr("orient", "auto")
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .append("path")
      .attr("d", "M 0,-5 L 10,0 L 0,5")
      .attr("fill", "#c9d4d9");
  }, [graph, highlightNode, highlightedEdge, onNodeSelect, onEdgeSelect]);

  return <svg ref={svgRef} width="900" height="800"></svg>;
};

export default SVGApplicationModel;
