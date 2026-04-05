import React, { useEffect, useRef, useState } from "react";
import Autocomplete from "@mui/material/Autocomplete";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import { ChevronDown, X } from "lucide-react";

const modalAutocompleteSx = {
  ".MuiOutlinedInput-root": {
    minHeight: 54,
    padding: "0 !important",
    borderRadius: "14px",
    backgroundColor: "rgba(255, 255, 255, 0.045)",
    color: "#f3efe7",
    ".MuiAutocomplete-input": {
      padding: "0.9rem 0.95rem !important",
    },
    ".MuiOutlinedInput-notchedOutline": {
      borderColor: "rgba(255, 255, 255, 0.1)",
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: "rgba(255, 255, 255, 0.18)",
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: "rgba(57, 201, 148, 0.34)",
    },
    "&.Mui-focused": {
      boxShadow: "0 0 0 3px rgba(57, 201, 148, 0.12)",
    },
  },
  ".MuiAutocomplete-popupIndicator": {
    color: "#8ea3ad",
    marginRight: "4px",
  },
  ".MuiAutocomplete-popupIndicator:hover": {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
  },
  ".MuiAutocomplete-endAdornment": {
    right: "10px !important",
  },
};

const modalAutocompletePaperSx = {
  mt: 1,
  borderRadius: "16px",
  background:
    "linear-gradient(180deg, rgba(18, 33, 44, 0.98), rgba(12, 24, 32, 0.98))",
  border: "1px solid rgba(255, 255, 255, 0.08)",
  boxShadow: "0 18px 48px rgba(0,0,0,0.32)",
  backdropFilter: "blur(16px)",
  ".MuiAutocomplete-listbox": {
    padding: "6px",
  },
  ".MuiAutocomplete-option": {
    minHeight: 42,
    borderRadius: "10px",
    color: "#f3efe7",
    fontSize: "0.88rem",
  },
  ".MuiAutocomplete-option:hover": {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },
  ".MuiAutocomplete-option[aria-selected=\"true\"]": {
    backgroundColor: "rgba(57, 201, 148, 0.16)",
  },
  ".MuiAutocomplete-option[aria-selected=\"true\"].Mui-focused": {
    backgroundColor: "rgba(57, 201, 148, 0.22)",
  },
};

function ModalSelectIcon(props) {
  return <ChevronDown {...props} size={16} strokeWidth={2.2} />;
}

function ModalAutocompletePaper(props) {
  return <Paper {...props} sx={modalAutocompletePaperSx} />;
}

function ModalShell({
  title,
  subtitle,
  kicker = "Generator",
  isOpen,
  onClose,
  children,
}) {
  if (!isOpen) return null;

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-content" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="section-kicker">{kicker}</span>
            <h2>{title}</h2>
            <p className="modal-subtitle">{subtitle}</p>
          </div>
          <button className="close" type="button" onClick={onClose} aria-label="Close modal">
            <X size={18} strokeWidth={2.2} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

const getOptionIds = (items, key = "id") =>
  items
    .map((item) => item[key])
    .filter((value) => value != null)
    .sort((left, right) => left - right);

const formatTypeLabel = (value) =>
  value.charAt(0).toUpperCase() + value.slice(1);

function ModalError({ message }) {
  if (!message) return null;

  return <p className="modal-error">{message}</p>;
}

function ModalSelectField({
  value,
  onChange,
  inputRef,
  options,
  placeholder = "Type to search",
}) {
  const selectedOption = options.find((option) => option.value === value) ?? null;

  return (
    <Autocomplete
      disablePortal
      disableClearable
      autoHighlight
      openOnFocus
      options={options}
      value={selectedOption}
      onChange={(_event, nextValue) => onChange(nextValue?.value ?? "")}
      getOptionLabel={(option) => option.label ?? ""}
      isOptionEqualToValue={(option, selected) =>
        option.value === selected.value
      }
      popupIcon={<ModalSelectIcon />}
      PaperComponent={ModalAutocompletePaper}
      noOptionsText="No matches found"
      sx={modalAutocompleteSx}
      renderInput={(params) => (
        <TextField
          {...params}
          inputRef={inputRef}
          placeholder={placeholder}
        />
      )}
    />
  );
}

export const ApplicationModal = ({ isOpen, onClose, onSubmit }) => {
  const [N, setN] = useState(5);
  const [maxWCET, setMaxWCET] = useState(100);
  const [minWCET, setMinWCET] = useState(1);
  const [minMCET, setMinMCET] = useState(1);
  const [minDeadlineOffset, setMinDeadlineOffset] = useState(10);
  const [maxDeadline, setMaxDeadline] = useState(1000);
  const [linkProb, setLinkProb] = useState(0.5);
  const [maxMessageSize, setMaxMessageSize] = useState(50);

  const taskInputRef = useRef(null);

  useEffect(() => {
    if (isOpen && taskInputRef.current) {
      taskInputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({
      N,
      maxWCET,
      minWCET,
      minMCET,
      minDeadlineOffset,
      maxDeadline,
      linkProb,
      maxMessageSize,
    });
    onClose();
  };

  return (
    <ModalShell
      title="Application Parameters"
      subtitle="Generate a task graph with execution and messaging constraints."
      isOpen={isOpen}
      onClose={onClose}
    >
      <form className="modal-form" onSubmit={handleSubmit}>
        <div className="modal-inputs">
          <label className="modal-field">
            <span>Tasks</span>
            <input
              type="number"
              value={N}
              onChange={(event) =>
                setN(Math.abs(parseInt(event.target.value, 10)) || 0)
              }
              placeholder="Enter number of tasks"
              ref={taskInputRef}
            />
          </label>

          <label className="modal-field">
            <span>Max WCET</span>
            <input
              type="number"
              value={maxWCET}
              onChange={(event) =>
                setMaxWCET(Math.abs(parseInt(event.target.value, 10)) || 0)
              }
            />
          </label>

          <label className="modal-field">
            <span>Min WCET</span>
            <input
              type="number"
              value={minWCET}
              onChange={(event) =>
                setMinWCET(Math.abs(parseInt(event.target.value, 10)) || 0)
              }
            />
          </label>

          <label className="modal-field">
            <span>Min MCET</span>
            <input
              type="number"
              value={minMCET}
              onChange={(event) =>
                setMinMCET(Math.abs(parseInt(event.target.value, 10)) || 0)
              }
            />
          </label>

          <label className="modal-field">
            <span>Deadline-WCET Offset</span>
            <input
              type="number"
              value={minDeadlineOffset}
              onChange={(event) =>
                setMinDeadlineOffset(
                  Math.abs(parseInt(event.target.value, 10)) || 0,
                )
              }
            />
          </label>

          <label className="modal-field">
            <span>Max Deadline</span>
            <input
              type="number"
              value={maxDeadline}
              onChange={(event) =>
                setMaxDeadline(Math.abs(parseInt(event.target.value, 10)) || 0)
              }
            />
          </label>

          <label className="modal-field">
            <span>Link Probability</span>
            <input
              type="number"
              value={linkProb}
              step="0.01"
              onChange={(event) =>
                setLinkProb(Math.abs(parseFloat(event.target.value)) || 0)
              }
            />
          </label>

          <label className="modal-field">
            <span>Max Message Size</span>
            <input
              type="number"
              value={maxMessageSize}
              onChange={(event) =>
                setMaxMessageSize(
                  Math.abs(parseInt(event.target.value, 10)) || 0,
                )
              }
            />
          </label>
        </div>

        <div className="modal-actions">
          <button className="button button-accent" type="submit">
            Generate
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

export const PlatformModal = ({ isOpen, onClose, onSubmit }) => {
  const [compute, setCompute] = useState(6);
  const [routers, setRouters] = useState(3);
  const [sensors, setSensors] = useState(2);
  const [actuators, setActuators] = useState(2);
  const [maxLinkDelay, setMaxLinkDelay] = useState(100);
  const [minLinkDelay, setMinLinkDelay] = useState(1);
  const [maxBandwidth, setMaxBandwidth] = useState(100);
  const [minBandwidth, setMinBandwidth] = useState(1);

  const computeInputRef = useRef(null);

  useEffect(() => {
    if (isOpen && computeInputRef.current) {
      computeInputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({
      compute,
      routers,
      sensors,
      actuators,
      maxLinkDelay,
      minLinkDelay,
      maxBandwidth,
      minBandwidth,
    });
    onClose();
  };

  return (
    <ModalShell
      title="Platform Parameters"
      subtitle="Generate a hardware topology with node types and communication bounds."
      isOpen={isOpen}
      onClose={onClose}
    >
      <form className="modal-form" onSubmit={handleSubmit}>
        <div className="modal-inputs">
          <label className="modal-field">
            <span>Compute Nodes</span>
            <input
              type="number"
              value={compute}
              onChange={(event) =>
                setCompute(Math.abs(parseInt(event.target.value, 10)) || 0)
              }
              placeholder="Enter number of compute nodes"
              ref={computeInputRef}
            />
          </label>

          <label className="modal-field">
            <span>Routers</span>
            <input
              type="number"
              value={routers}
              onChange={(event) =>
                setRouters(Math.abs(parseInt(event.target.value, 10)) || 0)
              }
            />
          </label>

          <label className="modal-field">
            <span>Sensors</span>
            <input
              type="number"
              value={sensors}
              onChange={(event) =>
                setSensors(Math.abs(parseInt(event.target.value, 10)) || 0)
              }
            />
          </label>

          <label className="modal-field">
            <span>Actuators</span>
            <input
              type="number"
              value={actuators}
              onChange={(event) =>
                setActuators(Math.abs(parseInt(event.target.value, 10)) || 0)
              }
            />
          </label>

          <label className="modal-field">
            <span>Max Link Delay</span>
            <input
              type="number"
              value={maxLinkDelay}
              onChange={(event) =>
                setMaxLinkDelay(Math.abs(parseInt(event.target.value, 10)) || 0)
              }
            />
          </label>

          <label className="modal-field">
            <span>Min Link Delay</span>
            <input
              type="number"
              value={minLinkDelay}
              onChange={(event) =>
                setMinLinkDelay(Math.abs(parseInt(event.target.value, 10)) || 0)
              }
            />
          </label>

          <label className="modal-field">
            <span>Max Bandwidth</span>
            <input
              type="number"
              value={maxBandwidth}
              onChange={(event) =>
                setMaxBandwidth(Math.abs(parseInt(event.target.value, 10)) || 0)
              }
            />
          </label>

          <label className="modal-field">
            <span>Min Bandwidth</span>
            <input
              type="number"
              value={minBandwidth}
              onChange={(event) =>
                setMinBandwidth(Math.abs(parseInt(event.target.value, 10)) || 0)
              }
            />
          </label>
        </div>

        <div className="modal-actions">
          <button className="button button-accent" type="submit">
            Generate
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

export const TaskLinkModal = ({ isOpen, onClose, onSubmit, tasks }) => {
  const [sender, setSender] = useState("");
  const [receiver, setReceiver] = useState("");
  const [error, setError] = useState("");
  const senderInputRef = useRef(null);
  const taskIds = getOptionIds(tasks);
  const taskIdsKey = taskIds.join(",");

  useEffect(() => {
    if (!isOpen) return;

    const [firstId = "", secondId = taskIds[1] ?? taskIds[0] ?? ""] = taskIds;
    setSender(String(firstId));
    setReceiver(String(secondId));
    setError("");

    if (senderInputRef.current) {
      senderInputRef.current.focus();
    }
  }, [isOpen, taskIdsKey]);

  const handleSubmit = (event) => {
    event.preventDefault();

    const nextError = onSubmit({
      sender: Number(sender),
      receiver: Number(receiver),
    });

    if (nextError) {
      setError(nextError);
      return;
    }

    onClose();
  };

  return (
    <ModalShell
      title="Add Task Link"
      subtitle="Create a dependency between two tasks."
      kicker="Create"
      isOpen={isOpen}
      onClose={onClose}
    >
      <form className="modal-form" onSubmit={handleSubmit}>
        <div className="modal-inputs">
          <label className="modal-field">
            <span>From Task</span>
            <ModalSelectField
              value={sender}
              onChange={(nextValue) => {
                setSender(nextValue);
                setError("");
              }}
              inputRef={senderInputRef}
              options={taskIds.map((taskId) => ({
                value: String(taskId),
                label: `${taskId}`,
              }))}
            />
          </label>

          <label className="modal-field">
            <span>To Task</span>
            <ModalSelectField
              value={receiver}
              onChange={(nextValue) => {
                setReceiver(nextValue);
                setError("");
              }}
              options={taskIds.map((taskId) => ({
                value: String(taskId),
                label: `${taskId}`,
              }))}
            />
          </label>
        </div>

        <ModalError message={error} />

        <div className="modal-actions">
          <button
            className="button button-accent"
            type="submit"
            disabled={taskIds.length < 2}
          >
            Add Link
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

export const NodeModal = ({ isOpen, onClose, onSubmit, nodeTypes }) => {
  const [type, setType] = useState(nodeTypes[0] || "compute");
  const typeInputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    setType(nodeTypes[0] || "compute");

    if (typeInputRef.current) {
      typeInputRef.current.focus();
    }
  }, [isOpen, nodeTypes]);

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({ type });
    onClose();
  };

  return (
    <ModalShell
      title="Add Node"
      subtitle="Create a platform node with a hardware role."
      kicker="Create"
      isOpen={isOpen}
      onClose={onClose}
    >
      <form className="modal-form" onSubmit={handleSubmit}>
        <div className="modal-inputs modal-inputs-single">
          <label className="modal-field">
            <span>Node Type</span>
            <ModalSelectField
              value={type}
              onChange={setType}
              inputRef={typeInputRef}
              options={nodeTypes.map((option) => ({
                value: option,
                label: formatTypeLabel(option),
              }))}
            />
          </label>
        </div>

        <div className="modal-actions">
          <button className="button button-accent" type="submit">
            Add Node
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

export const NodeLinkModal = ({ isOpen, onClose, onSubmit, nodes }) => {
  const [startNode, setStartNode] = useState("");
  const [endNode, setEndNode] = useState("");
  const [error, setError] = useState("");
  const startInputRef = useRef(null);
  const sortedNodes = [...nodes].sort((left, right) => left.id - right.id);
  const nodeOptionsKey = sortedNodes
    .map((node) => `${node.id}:${node.type}`)
    .join(",");

  useEffect(() => {
    if (!isOpen) return;

    const [firstNode, secondNode = firstNode] = sortedNodes;
    setStartNode(firstNode ? String(firstNode.id) : "");
    setEndNode(secondNode ? String(secondNode.id) : "");
    setError("");

    if (startInputRef.current) {
      startInputRef.current.focus();
    }
  }, [isOpen, nodeOptionsKey]);

  const handleSubmit = (event) => {
    event.preventDefault();

    const nextError = onSubmit({
      startNode: Number(startNode),
      endNode: Number(endNode),
    });

    if (nextError) {
      setError(nextError);
      return;
    }

    onClose();
  };

  return (
    <ModalShell
      title="Add Node Link"
      subtitle="Create a link between two platform nodes."
      kicker="Create"
      isOpen={isOpen}
      onClose={onClose}
    >
      <form className="modal-form" onSubmit={handleSubmit}>
        <div className="modal-inputs">
          <label className="modal-field">
            <span>Start Node</span>
            <ModalSelectField
              value={startNode}
              onChange={(nextValue) => {
                setStartNode(nextValue);
                setError("");
              }}
              inputRef={startInputRef}
              options={sortedNodes.map((node) => ({
                value: String(node.id),
                label: `${node.id} · ${formatTypeLabel(node.type)}`,
              }))}
            />
          </label>

          <label className="modal-field">
            <span>End Node</span>
            <ModalSelectField
              value={endNode}
              onChange={(nextValue) => {
                setEndNode(nextValue);
                setError("");
              }}
              options={sortedNodes.map((node) => ({
                value: String(node.id),
                label: `${node.id} · ${formatTypeLabel(node.type)}`,
              }))}
            />
          </label>
        </div>

        <p className="modal-note">At least one endpoint must be a router.</p>
        <ModalError message={error} />

        <div className="modal-actions">
          <button
            className="button button-accent"
            type="submit"
            disabled={sortedNodes.length < 2}
          >
            Add Link
          </button>
        </div>
      </form>
    </ModalShell>
  );
};
