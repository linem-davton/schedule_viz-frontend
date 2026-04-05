import React, { useEffect, useRef, useState } from "react";
import Ajv from "ajv";
import Tooltip from "@mui/material/Tooltip";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import {
  Group,
  Panel,
  Separator,
  usePanelRef,
} from "react-resizable-panels";
import {
  Download,
  Expand,
  FileJson,
  Link2,
  Minus,
  Network,
  Plus,
  Unplug,
  Upload,
  X,
} from "lucide-react";

import "./App.css";
import SVGApplicationModel from "./SVGApplicationModel";
import SVGPlatformModel from "./SVGPlatformModel";
import SlidersAM from "./slidersAM";
import SlidersPM from "./slidersPM";
import ScheduleVisualization from "./ScheduleVisualization";
import examplejson from "./example1.json";
import schema from "./input_schema.json";
import { saveToLocalStorage, loadFromLocalStorage } from "./utility";
import { generateRandomAM, generateRandomPM } from "./randomModels";
import {
  ApplicationModal,
  NodeLinkModal,
  NodeModal,
  PlatformModal,
  TaskLinkModal,
} from "./parametersModal";
import ServerConfig from "./ServerConfig.json";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#39c994" },
    background: {
      default: "#081017",
      paper: "#101c25",
    },
    text: {
      primary: "#f4efe7",
      secondary: "#8ea4ae",
    },
  },
  typography: {
    fontFamily: '"Space Grotesk", "Segoe UI", sans-serif',
  },
});

const nodeTypes = ["compute", "router", "sensor", "actuator"];
const linkDelay = 10;
const bandwidth = 10;
const linkType = "ethernet";
const messageSize = 20;
const messageInjectionTime = 0;
const wcet = 10;
const mcet = 5;
const deadline = 500;
const COMPACT_LAYOUT_BREAKPOINT = 980;
const SCHEDULE_PANEL_OPEN_SIZE = "32%";
const SCHEDULE_PANEL_OPEN_SIZE_COMPACT = "30%";
const runAfterNextPaint = (callback) => {
  if (typeof window === "undefined") {
    callback();
    return;
  }

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      callback();
    });
  });
};

const getViewportWidth = () =>
  typeof window !== "undefined" ? window.innerWidth : 1440;

const tooltipSlotProps = {
  tooltip: {
    sx: {
      bgcolor: "rgba(7, 17, 24, 0.96)",
      color: "#f3efe7",
      border: "1px solid rgba(255,255,255,0.12)",
      borderRadius: "12px",
      px: 1.25,
      py: 0.8,
      fontSize: "0.78rem",
      boxShadow: "0 18px 48px rgba(0,0,0,0.32)",
    },
  },
  arrow: {
    sx: {
      color: "rgba(7, 17, 24, 0.96)",
    },
  },
};

function ActionButton({
  label,
  icon: Icon,
  onClick,
  disabled = false,
  tone = "default",
  tooltip,
}) {
  return (
    <Tooltip
      title={tooltip || label}
      placement="right"
      arrow
      slotProps={tooltipSlotProps}
    >
      <span className="action-button-wrap">
        <button
          className={`action-button ${tone !== "default" ? `tone-${tone}` : ""}`}
          type="button"
          onClick={onClick}
          disabled={disabled}
          aria-label={label}
        >
          <Icon className="action-icon" strokeWidth={2} />
        </button>
      </span>
    </Tooltip>
  );
}

function TooltipIconButton({
  label,
  onClick,
  children,
  className = "icon-button",
  tooltipPlacement = "top",
}) {
  return (
    <Tooltip
      title={label}
      placement={tooltipPlacement}
      arrow
      slotProps={tooltipSlotProps}
    >
      <span>
        <button
          className={className}
          type="button"
          onClick={onClick}
          aria-label={label}
          title={label}
        >
          {children}
        </button>
      </span>
    </Tooltip>
  );
}

function ChevronIcon({ direction }) {
  const rotation =
    direction === "right"
      ? "0"
      : direction === "left"
        ? "180"
        : direction === "down"
          ? "90"
          : "-90";

  return (
    <svg
      className="icon-svg"
      viewBox="0 0 20 20"
      aria-hidden="true"
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      <path
        d="M7 4l6 6-6 6"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function ChipSwitch({ value, onChange, leftLabel, rightLabel }) {
  return (
    <div className="chip-switch" role="tablist" aria-label="Server selector">
      <button
        className={`chip-option ${value === "local" ? "is-active" : ""}`}
        type="button"
        onClick={() => onChange("local")}
      >
        {leftLabel}
      </button>
      <button
        className={`chip-option ${value === "remote" ? "is-active" : ""}`}
        type="button"
        onClick={() => onChange("remote")}
      >
        {rightLabel}
      </button>
    </div>
  );
}

function App() {
  const [applicationModel, setApplicationModel] = useState({
    tasks: [],
    messages: [],
  });
  const [platformModel, setPlatformModel] = useState({ nodes: [], links: [] });
  const [scheduleData, setScheduleData] = useState(null);
  const [errorMessage, setErrorMessage] = useState([]);
  const [server, setServer] = useState(
    localStorage.getItem("server") || "remote",
  );
  const [applicationModalOpen, setApplicationModalOpen] = useState(false);
  const [platformModalOpen, setPlatformModalOpen] = useState(false);
  const [taskLinkModalOpen, setTaskLinkModalOpen] = useState(false);
  const [nodeModalOpen, setNodeModalOpen] = useState(false);
  const [nodeLinkModalOpen, setNodeLinkModalOpen] = useState(false);
  const [highlightedTask, setHighlightedTask] = useState(null);
  const [highlightedMessage, setHighlightedMessage] = useState(null);
  const [highlightedNodePM, setHighlightedNodePM] = useState(null);
  const [highlightedEdgePM, setHighlightedEdgePM] = useState(null);
  const [selectionKind, setSelectionKind] = useState(null);
  const [isControlsCollapsed, setIsControlsCollapsed] = useState(
    () => getViewportWidth() < COMPACT_LAYOUT_BREAKPOINT,
  );
  const [isScheduleCollapsed, setIsScheduleCollapsed] = useState(false);
  const [isCompactLayout, setIsCompactLayout] = useState(
    () => getViewportWidth() < COMPACT_LAYOUT_BREAKPOINT,
  );
  const [isScheduling, setIsScheduling] = useState(false);
  const [immersiveCanvas, setImmersiveCanvas] = useState(null);

  const controlsPanelRef = usePanelRef();
  const schedulePanelRef = usePanelRef();
  const fileInputRef = useRef(null);
  const scheduleAbortControllerRef = useRef(null);

  const activeServerUrl =
    server === "remote"
      ? ServerConfig.remoteServer
      : ServerConfig.localServer;

  useEffect(() => {
    const handleResize = () => {
      setIsCompactLayout(getViewportWidth() < COMPACT_LAYOUT_BREAKPOINT);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (isCompactLayout && controlsPanelRef.current) {
      controlsPanelRef.current.collapse();
    }
  }, [isCompactLayout, controlsPanelRef]);

  useEffect(() => {
    if (!controlsPanelRef.current) return;

    if (isControlsCollapsed && !controlsPanelRef.current.isCollapsed()) {
      controlsPanelRef.current.collapse();
    } else if (!isControlsCollapsed && controlsPanelRef.current.isCollapsed()) {
      controlsPanelRef.current.expand();
    }
  }, [isControlsCollapsed, controlsPanelRef]);

  useEffect(() => {
    if (!schedulePanelRef.current) return;

    if (isScheduleCollapsed && !schedulePanelRef.current.isCollapsed()) {
      schedulePanelRef.current.collapse();
    } else if (!isScheduleCollapsed && schedulePanelRef.current.isCollapsed()) {
      schedulePanelRef.current.expand();
    }
  }, [isScheduleCollapsed, schedulePanelRef]);

  useEffect(() => {
    localStorage.setItem("server", server);
  }, [server]);

  useEffect(() => {
    const data = loadFromLocalStorage("model");
    if (data) {
      setApplicationModel(data.application);
      setPlatformModel(data.platform);
    }
  }, []);

  useEffect(() => {
    if (applicationModel.tasks.length && platformModel.nodes.length) {
      saveToLocalStorage("model", {
        application: applicationModel,
        platform: platformModel,
      });
      scheduleGraph();
      return;
    }

    setScheduleData(null);
  }, [applicationModel, platformModel, activeServerUrl]);

  useEffect(() => {
    return () => {
      scheduleAbortControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey && event.key === "s") {
        event.preventDefault();
        downloadJsonFile();
      } else if (event.ctrlKey && event.key === "o") {
        event.preventDefault();
        handleFileUpload();
      } else if (event.key === "Delete") {
        event.preventDefault();
        removeCurrentSelection();
      } else if (event.key === "Escape") {
        event.preventDefault();
        setImmersiveCanvas((prev) => {
          if (prev != null) {
            return null;
          }

          clearSelection();
          return prev;
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const clearSelection = () => {
    setHighlightedTask(null);
    setHighlightedMessage(null);
    setHighlightedNodePM(null);
    setHighlightedEdgePM(null);
    setSelectionKind(null);
  };

  const toggleControlsPanel = () => {
    if (isControlsCollapsed) {
      controlsPanelRef.current?.expand();
    } else {
      controlsPanelRef.current?.collapse();
    }
  };

  const toggleSchedulePanel = () => {
    if (isScheduleCollapsed) {
      const nextSize = isCompactLayout
        ? SCHEDULE_PANEL_OPEN_SIZE_COMPACT
        : SCHEDULE_PANEL_OPEN_SIZE;

      schedulePanelRef.current?.expand();
      runAfterNextPaint(() => {
        schedulePanelRef.current?.resize(nextSize);
      });
    } else {
      schedulePanelRef.current?.collapse();
    }
  };

  const loadDefaultJSON = () => {
    setApplicationModel(examplejson.application);
    setPlatformModel(examplejson.platform);
    clearSelection();
    setErrorMessage([]);
  };

  const addTask = () => {
    setApplicationModel((prevGraph) => {
      const nextId = prevGraph.tasks.length + 1;
      setHighlightedTask(nextId);
      setHighlightedMessage(null);
      setSelectionKind("task");

      return {
        ...prevGraph,
        tasks: [
          ...prevGraph.tasks,
          {
            id: nextId,
            wcet,
            mcet,
            deadline,
          },
        ],
      };
    });
  };

  const addMessage = ({ sender, receiver }) => {
    const sourceNode = applicationModel.tasks.find((task) => task.id === sender);
    if (!sourceNode) {
      return `Task ${sender} does not exist`;
    }

    const targetNode = applicationModel.tasks.find(
      (task) => task.id === receiver,
    );
    if (!targetNode) {
      return `Task ${receiver} does not exist`;
    }
    if (sender === receiver) {
      return "Sender and receiver cannot be the same";
    }
    if (
      applicationModel.messages.some(
        (edge) => edge.sender === sender && edge.receiver === receiver,
      )
    ) {
      return "Dependency already exists";
    }

    const message = {
      id: applicationModel.messages.length,
      sender,
      receiver,
      size: messageSize,
      message_injection_time: messageInjectionTime,
    };

    setApplicationModel((prevGraph) => ({
      ...prevGraph,
      messages: [...prevGraph.messages, message],
    }));
    setHighlightedTask(null);
    setHighlightedMessage({ sender, receiver });
    setSelectionKind("message");
    return null;
  };

  const deleteTask = () => {
    if (highlightedTask == null) return;

    setApplicationModel((prevGraph) => ({
      tasks: prevGraph.tasks.filter((task) => task.id !== highlightedTask),
      messages: prevGraph.messages.filter(
        (message) =>
          message.sender !== highlightedTask &&
          message.receiver !== highlightedTask,
      ),
    }));
    setHighlightedTask(null);
    setHighlightedMessage(null);
    if (selectionKind === "task") {
      setSelectionKind(null);
    }
  };

  const deleteMessage = () => {
    if (!highlightedMessage) return;

    setApplicationModel((prevGraph) => ({
      ...prevGraph,
      messages: prevGraph.messages.filter(
        (message) =>
          !(
            message.sender === highlightedMessage.sender &&
            message.receiver === highlightedMessage.receiver
          ),
      ),
    }));
    setHighlightedMessage(null);
    if (selectionKind === "message") {
      setSelectionKind(null);
    }
  };

  const addNode = ({ type }) => {
    if (!nodeTypes.includes(type)) {
      return "Invalid node type";
    }

    const nodeId = platformModel.nodes.length;
    setPlatformModel((prevGraph) => ({
      ...prevGraph,
      nodes: [...prevGraph.nodes, { id: nodeId, type }],
    }));
    setHighlightedNodePM(nodeId);
    setHighlightedEdgePM(null);
    setSelectionKind("node");
    return null;
  };

  const addLink = ({ startNode, endNode }) => {
    const sourceNode = platformModel.nodes.find((node) => node.id === startNode);
    if (!sourceNode) {
      return "Start node does not exist";
    }

    const targetNode = platformModel.nodes.find((node) => node.id === endNode);
    if (!targetNode) {
      return "End node does not exist";
    }
    if (startNode === endNode) {
      return "Start node and end node cannot be the same";
    }
    if (sourceNode.type !== "router" && targetNode.type !== "router") {
      return "One node must be a router";
    }
    if (
      platformModel.links.some(
        (edge) => edge.start_node === startNode && edge.end_node === endNode,
      )
    ) {
      return "Link already exists";
    }

    const link = {
      id: platformModel.links.length,
      start_node: startNode,
      end_node: endNode,
      link_delay: linkDelay,
      bandwidth,
      type: linkType,
    };

    setPlatformModel((prevGraph) => ({
      ...prevGraph,
      links: [...prevGraph.links, link],
    }));
    setHighlightedNodePM(null);
    setHighlightedEdgePM({ start_node: startNode, end_node: endNode });
    setSelectionKind("link");
    return null;
  };

  const deleteNode = () => {
    if (highlightedNodePM == null) return;

    setPlatformModel((prevGraph) => ({
      nodes: prevGraph.nodes.filter((node) => node.id !== highlightedNodePM),
      links: prevGraph.links.filter(
        (link) =>
          link.start_node !== highlightedNodePM &&
          link.end_node !== highlightedNodePM,
      ),
    }));
    setHighlightedNodePM(null);
    setHighlightedEdgePM(null);
    if (selectionKind === "node") {
      setSelectionKind(null);
    }
  };

  const deleteLink = () => {
    if (!highlightedEdgePM) return;

    setPlatformModel((prevGraph) => ({
      ...prevGraph,
      links: prevGraph.links.filter(
        (link) =>
          !(
            link.start_node === highlightedEdgePM.start_node &&
            link.end_node === highlightedEdgePM.end_node
          ),
      ),
    }));
    setHighlightedEdgePM(null);
    if (selectionKind === "link") {
      setSelectionKind(null);
    }
  };

  const removeCurrentSelection = () => {
    if (selectionKind === "task") {
      deleteTask();
    } else if (selectionKind === "message") {
      deleteMessage();
    } else if (selectionKind === "node") {
      deleteNode();
    } else if (selectionKind === "link") {
      deleteLink();
    }
  };

  const handleTaskSelection = (taskId) => {
    setHighlightedTask((prev) => {
      const nextValue = prev === taskId ? null : taskId;
      setSelectionKind(nextValue == null ? null : "task");
      return nextValue;
    });
    setHighlightedMessage(null);
  };

  const handleMessageSelection = (edge) => {
    setHighlightedMessage((prev) => {
      const nextValue =
        prev?.sender === edge.sender && prev?.receiver === edge.receiver
          ? null
          : edge;
      setSelectionKind(nextValue == null ? null : "message");
      return nextValue;
    });
    setHighlightedTask(null);
  };

  const handlePlatformNodeSelection = (nodeId) => {
    setHighlightedNodePM((prev) => {
      const nextValue = prev === nodeId ? null : nodeId;
      setSelectionKind(nextValue == null ? null : "node");
      return nextValue;
    });
    setHighlightedEdgePM(null);
  };

  const handlePlatformLinkSelection = (edge) => {
    setHighlightedEdgePM((prev) => {
      const nextValue =
        prev?.start_node === edge.start_node && prev?.end_node === edge.end_node
          ? null
          : edge;
      setSelectionKind(nextValue == null ? null : "link");
      return nextValue;
    });
    setHighlightedNodePM(null);
  };

  const handleFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const contents = loadEvent.target.result;

      try {
        const parsedData = JSON.parse(contents);
        const ajv = new Ajv();
        const validate = ajv.compile(schema);

        if (!validate(parsedData)) {
          setErrorMessage(["JSON data does not match schema"]);
          return;
        }

        setApplicationModel(parsedData.application);
        setPlatformModel(parsedData.platform);
        clearSelection();
        setErrorMessage([]);
      } catch (error) {
        setErrorMessage(["Upload a valid JSON file"]);
        console.error("Error parsing JSON:", error);
      }
    };

    reader.readAsText(file);
  };

  const downloadJsonFile = () => {
    const jsonString = JSON.stringify(
      {
        application: applicationModel,
        platform: platformModel,
      },
      null,
      2,
    );

    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "updated_data.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const scheduleGraph = async () => {
    if (!applicationModel.tasks.length || !platformModel.nodes.length) {
      return;
    }

    scheduleAbortControllerRef.current?.abort();
    const abortController = new AbortController();
    scheduleAbortControllerRef.current = abortController;
    setIsScheduling(true);

    try {
      const response = await fetch(activeServerUrl + ServerConfig.schedule_jobs, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          application: applicationModel,
          platform: platformModel,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const warnings = Object.values(data).flatMap((entry) =>
        entry.missed_deadlines?.length
          ? [`${entry.name}: ${entry.missed_deadlines.join(", ")}`]
          : [],
      );

      setScheduleData(data);
      setErrorMessage(warnings);
    } catch (error) {
      if (error.name !== "AbortError") {
        setErrorMessage(["Error connecting to server"]);
        console.error("Error connecting to backend:", error);
      }
    } finally {
      if (scheduleAbortControllerRef.current === abortController) {
        setIsScheduling(false);
        scheduleAbortControllerRef.current = null;
      }
    }
  };

  const appClassName = [
    "app-shell",
    isCompactLayout ? "is-compact" : "",
    isControlsCollapsed ? "controls-collapsed" : "",
    immersiveCanvas ? "has-immersive-view" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const scheduleCount = scheduleData ? Object.keys(scheduleData).length : 0;
  const workspaceStatus = isScheduling
    ? "Updating"
    : scheduleCount > 0
      ? "Ready"
      : "Idle";
  const immersiveTitle =
    immersiveCanvas === "application"
      ? "Application"
      : immersiveCanvas === "platform"
        ? "Platform"
        : "";

  return (
    <ThemeProvider theme={theme}>
      <div className={appClassName}>
        <input
          type="file"
          accept=".json"
          ref={fileInputRef}
          className="hidden-input"
          onChange={handleFileChange}
        />

        <div className="top-status-bar">
          <div className="top-status-actions">
            {isControlsCollapsed && (
              <button
                className="topbar-chip-button"
                type="button"
                onClick={toggleControlsPanel}
                aria-label="Open controls panel"
                title="Open controls panel"
              >
                <ChevronIcon direction="right" />
                <span>Show Controls</span>
              </button>
            )}
            {isScheduleCollapsed && (
              <button
                className="topbar-chip-button"
                type="button"
                onClick={toggleSchedulePanel}
                aria-label="Open schedule panel"
                title="Open schedule panel"
              >
                <ChevronIcon direction="right" />
                <span>Show Schedules</span>
              </button>
            )}
          </div>

          <div className="top-status-title">Distributed Scheduling</div>

          <div className="top-status-meta">
            <span className={`status-chip ${isScheduling ? "is-busy" : ""}`}>
              {workspaceStatus}
            </span>
            {errorMessage.length > 0 && (
              <span className="status-chip">{errorMessage.length} alerts</span>
            )}
          </div>
        </div>

        <Group
          orientation={isCompactLayout ? "vertical" : "horizontal"}
          className="layout-panels"
        >
          <Panel
            panelRef={controlsPanelRef}
            id="controls-panel"
            defaultSize={isCompactLayout ? "24%" : "18%"}
            minSize={isCompactLayout ? "20%" : "14%"}
            collapsible
            collapsedSize={0}
            onResize={(panelSize) => {
              setIsControlsCollapsed(panelSize.asPercentage === 0);
            }}
          >
            <aside className={`panel-card controls-panel ${isControlsCollapsed ? "is-collapsed" : ""}`}>
              <div className="panel-topbar">
                <h1 className="panel-title">Control Panel</h1>
                <button
                  className="icon-button"
                  type="button"
                  onClick={toggleControlsPanel}
                  aria-label="Collapse controls panel"
                  title="Collapse controls panel"
                >
                  <ChevronIcon direction="left" />
                </button>
              </div>

              <div className="control-block">
                <span className="control-title">Data</span>
                <div className="action-grid">
                  <ActionButton
                    label="Upload"
                    icon={Upload}
                    onClick={handleFileUpload}
                    tooltip="Upload a saved JSON model"
                  />
                  <ActionButton
                    label="Load Example"
                    icon={FileJson}
                    onClick={loadDefaultJSON}
                    tooltip="Load the bundled example model"
                  />
                  <ActionButton
                    label="Download"
                    icon={Download}
                    onClick={downloadJsonFile}
                    disabled={
                      !applicationModel.tasks.length && !platformModel.nodes.length
                    }
                    tone="accent"
                    tooltip="Download the current JSON model"
                  />
                </div>
              </div>

              <div className="control-block">
                <span className="control-title">Application</span>
                <div className="action-grid">
                  <ActionButton
                    label="Add Task"
                    icon={Plus}
                    onClick={addTask}
                    tooltip="Add a task"
                  />
                  <ActionButton
                    label="Add Edge"
                    icon={Link2}
                    onClick={() => setTaskLinkModalOpen(true)}
                    disabled={applicationModel.tasks.length < 2}
                    tooltip="Add a task dependency"
                  />
                  <ActionButton
                    label="Delete Task"
                    icon={Minus}
                    onClick={deleteTask}
                    disabled={highlightedTask == null}
                    tone="danger"
                    tooltip="Delete the selected task"
                  />
                  <ActionButton
                    label="Delete Edge"
                    icon={Unplug}
                    onClick={deleteMessage}
                    disabled={!highlightedMessage}
                    tone="danger"
                    tooltip="Delete the selected dependency"
                  />
                  <ActionButton
                    label="Generate"
                    icon={Network}
                    onClick={() => setApplicationModalOpen(true)}
                    tone="accent"
                    tooltip="Generate an application model"
                  />
                </div>
              </div>

              <div className="control-block">
                <span className="control-title">Platform</span>
                <div className="action-grid">
                  <ActionButton
                    label="Add Node"
                    icon={Plus}
                    onClick={() => setNodeModalOpen(true)}
                    tooltip="Add a platform node"
                  />
                  <ActionButton
                    label="Add Link"
                    icon={Link2}
                    onClick={() => setNodeLinkModalOpen(true)}
                    disabled={platformModel.nodes.length < 2}
                    tooltip="Add a network link"
                  />
                  <ActionButton
                    label="Delete Node"
                    icon={Minus}
                    onClick={deleteNode}
                    disabled={highlightedNodePM == null}
                    tone="danger"
                    tooltip="Delete the selected node"
                  />
                  <ActionButton
                    label="Delete Link"
                    icon={Unplug}
                    onClick={deleteLink}
                    disabled={!highlightedEdgePM}
                    tone="danger"
                    tooltip="Delete the selected link"
                  />
                  <ActionButton
                    label="Generate"
                    icon={Network}
                    onClick={() => setPlatformModalOpen(true)}
                    tone="accent"
                    tooltip="Generate a platform model"
                  />
                </div>
              </div>

              <div className="control-block control-inline">
                <span className="control-title">Server</span>
                <div className="server-switch-row">
                  <ChipSwitch
                    value={server}
                    onChange={setServer}
                    leftLabel="Local"
                    rightLabel="Remote"
                  />
                </div>
              </div>

            </aside>
          </Panel>

          <Separator
            className={`resize-handle ${isControlsCollapsed ? "is-hidden" : ""}`}
          />

          <Panel
            id="center-stack-panel"
            defaultSize={isCompactLayout ? "50%" : "54%"}
            minSize="32%"
          >
            <Group orientation="vertical">
              <Panel defaultSize="50%" minSize="28%">
                <section className="panel-card work-panel hero-panel">
                  <div className="panel-topbar">
                    <div className="panel-heading">
                      <div className="panel-title-row">
                        <h2>Application</h2>
                        <TooltipIconButton
                          label="Open immersive application view"
                          onClick={() => setImmersiveCanvas("application")}
                          className="icon-button header-icon-button"
                        >
                          <Expand className="action-icon" strokeWidth={2} />
                        </TooltipIconButton>
                      </div>
                    </div>
                    <div className="panel-topbar-meta">
                      <div className="count-row compact-chip-row">
                        <span className="status-chip mini-chip">
                          {applicationModel.tasks.length} tasks
                        </span>
                        <span className="status-chip mini-chip">
                          {applicationModel.messages.length} edges
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="work-panel-body">
                    <div className="canvas-shell">
                      <SVGApplicationModel
                        graph={applicationModel}
                        setGraph={setApplicationModel}
                        highlightNode={highlightedTask}
                        highlightedEdge={highlightedMessage}
                        onNodeSelect={handleTaskSelection}
                        onEdgeSelect={handleMessageSelection}
                      />
                    </div>

                    {highlightedTask != null && (
                      <div className="work-panel-inspector">
                        <SlidersAM
                          highlightNode={highlightedTask}
                          graph={applicationModel}
                          setGraph={setApplicationModel}
                        />
                      </div>
                    )}
                  </div>
                </section>
              </Panel>

              <Separator className="resize-handle vertical" />

              <Panel defaultSize="50%" minSize="28%">
                <section className="panel-card work-panel hero-panel">
                  <div className="panel-topbar">
                    <div className="panel-heading">
                      <div className="panel-title-row">
                        <h2>Platform</h2>
                        <TooltipIconButton
                          label="Open immersive platform view"
                          onClick={() => setImmersiveCanvas("platform")}
                          className="icon-button header-icon-button"
                        >
                          <Expand className="action-icon" strokeWidth={2} />
                        </TooltipIconButton>
                      </div>
                    </div>
                    <div className="panel-topbar-meta">
                      <div className="count-row compact-chip-row">
                        <span className="status-chip mini-chip">
                          {platformModel.nodes.length} nodes
                        </span>
                        <span className="status-chip mini-chip">
                          {platformModel.links.length} links
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="work-panel-body">
                    <div className="canvas-shell">
                      <SVGPlatformModel
                        graph={platformModel}
                        setGraph={setPlatformModel}
                        highlightNode={highlightedNodePM}
                        highlightedEdge={highlightedEdgePM}
                        onNodeSelect={handlePlatformNodeSelection}
                        onEdgeSelect={handlePlatformLinkSelection}
                      />
                    </div>

                    {highlightedEdgePM && (
                      <div className="work-panel-inspector">
                        <SlidersPM
                          highlightedEdge={highlightedEdgePM}
                          graph={platformModel}
                          setGraph={setPlatformModel}
                        />
                      </div>
                    )}
                  </div>
                </section>
              </Panel>
            </Group>
          </Panel>

          <Separator className="resize-handle" />

          <Panel
            id="schedule-panel"
            panelRef={schedulePanelRef}
            defaultSize={
              isCompactLayout
                ? SCHEDULE_PANEL_OPEN_SIZE_COMPACT
                : SCHEDULE_PANEL_OPEN_SIZE
            }
            minSize="18%"
            collapsible
            collapsedSize={0}
            onResize={(panelSize) => {
              setIsScheduleCollapsed(panelSize.asPercentage === 0);
            }}
          >
            <section className="panel-card schedule-panel">
              <div className="panel-topbar">
                <div className="panel-heading">
                  <h2>Schedules</h2>
                </div>
                <div className="count-row">
                  {isScheduling && (
                    <span className="status-chip is-busy">Updating</span>
                  )}
                  <button
                    className="icon-button"
                    type="button"
                    onClick={toggleSchedulePanel}
                    aria-label="Collapse schedule panel"
                    title="Collapse schedule panel"
                  >
                    <ChevronIcon direction="right" />
                  </button>
                </div>
              </div>

              <div className="schedule-shell">
                {scheduleData ? (
                  <ScheduleVisualization schedules={scheduleData} />
                ) : (
                  <div className="empty-state">
                    Add data to both models to generate schedules.
                  </div>
                )}
                {isScheduling && scheduleData && (
                  <div className="schedule-overlay">Updating…</div>
                )}
              </div>
            </section>
          </Panel>
        </Group>

        {errorMessage.length > 0 && (
          <div className="error-toast" role="alert">
            <div className="error-toast-head">
              <span>Alerts</span>
              <button
                className="icon-button"
                type="button"
                onClick={() => setErrorMessage([])}
                aria-label="Dismiss alerts"
                title="Dismiss alerts"
              >
                <X className="action-icon" strokeWidth={2} />
              </button>
            </div>
            <div className="error-toast-body">
              {errorMessage.map((error, index) => (
                <p key={index}>{error}</p>
              ))}
            </div>
          </div>
        )}

        <ApplicationModal
          isOpen={applicationModalOpen}
          onClose={() => setApplicationModalOpen(false)}
          onSubmit={(params) => {
            setApplicationModel(
              generateRandomAM(
                params.N,
                params.maxWCET,
                params.minWCET,
                params.minMCET,
                params.minDeadlineOffset,
                params.maxDeadline,
                params.linkProb,
                params.maxMessageSize,
              ),
            );
            clearSelection();
          }}
        />

        <TaskLinkModal
          isOpen={taskLinkModalOpen}
          onClose={() => setTaskLinkModalOpen(false)}
          onSubmit={addMessage}
          tasks={applicationModel.tasks}
        />

        <NodeModal
          isOpen={nodeModalOpen}
          onClose={() => setNodeModalOpen(false)}
          onSubmit={addNode}
          nodeTypes={nodeTypes}
        />

        <NodeLinkModal
          isOpen={nodeLinkModalOpen}
          onClose={() => setNodeLinkModalOpen(false)}
          onSubmit={addLink}
          nodes={platformModel.nodes}
        />

        <PlatformModal
          isOpen={platformModalOpen}
          onClose={() => setPlatformModalOpen(false)}
          onSubmit={(params) => {
            setPlatformModel(
              generateRandomPM(
                params.compute,
                params.routers,
                params.sensors,
                params.actuators,
                params.maxLinkDelay,
                params.minLinkDelay,
                params.maxBandwidth,
                params.minBandwidth,
              ),
            );
            clearSelection();
          }}
        />

        {immersiveCanvas && (
          <div
            className="immersive-modal"
            role="dialog"
            aria-modal="true"
            aria-label={`${immersiveTitle} immersive view`}
          >
            <div className="immersive-shell">
              <div className="immersive-header">
                <div className="immersive-heading">
                  <div className="panel-title-row">
                    <h2>{immersiveTitle}</h2>
                    {immersiveCanvas === "application" ? (
                      <div className="count-row compact-chip-row">
                        <span className="status-chip mini-chip">
                          {applicationModel.tasks.length} tasks
                        </span>
                        <span className="status-chip mini-chip">
                          {applicationModel.messages.length} edges
                        </span>
                      </div>
                    ) : (
                      <div className="count-row compact-chip-row">
                        <span className="status-chip mini-chip">
                          {platformModel.nodes.length} nodes
                        </span>
                        <span className="status-chip mini-chip">
                          {platformModel.links.length} links
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="immersive-actions">
                  <TooltipIconButton
                    label="Close immersive view"
                    onClick={() => setImmersiveCanvas(null)}
                    className="icon-button immersive-close-button"
                  >
                    <X className="action-icon" strokeWidth={2} />
                  </TooltipIconButton>
                </div>
              </div>

              <div className="immersive-body">
                <div className="canvas-shell immersive-canvas-shell">
                  {immersiveCanvas === "application" ? (
                    <SVGApplicationModel
                      graph={applicationModel}
                      setGraph={setApplicationModel}
                      highlightNode={highlightedTask}
                      highlightedEdge={highlightedMessage}
                      onNodeSelect={handleTaskSelection}
                      onEdgeSelect={handleMessageSelection}
                    />
                  ) : (
                    <SVGPlatformModel
                      graph={platformModel}
                      setGraph={setPlatformModel}
                      highlightNode={highlightedNodePM}
                      highlightedEdge={highlightedEdgePM}
                      onNodeSelect={handlePlatformNodeSelection}
                      onEdgeSelect={handlePlatformLinkSelection}
                    />
                  )}
                </div>

                {immersiveCanvas === "application" && highlightedTask != null && (
                  <div className="immersive-inspector">
                    <SlidersAM
                      highlightNode={highlightedTask}
                      graph={applicationModel}
                      setGraph={setApplicationModel}
                    />
                  </div>
                )}

                {immersiveCanvas === "platform" && highlightedEdgePM && (
                  <div className="immersive-inspector">
                    <SlidersPM
                      highlightedEdge={highlightedEdgePM}
                      graph={platformModel}
                      setGraph={setPlatformModel}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </ThemeProvider>
  );
}

export default App;
