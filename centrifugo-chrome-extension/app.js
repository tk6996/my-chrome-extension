// Minimal Centrifugo bidirectional JSON protocol client.
// Protocol reference: https://centrifugal.dev/docs/transports/client_protocol

const els = {
  status: document.getElementById("status"),
  wsUrl: document.getElementById("wsUrl"),
  token: document.getElementById("token"),
  rememberToken: document.getElementById("rememberToken"),
  connectBtn: document.getElementById("connectBtn"),
  disconnectBtn: document.getElementById("disconnectBtn"),
  channel: document.getElementById("channel"),
  subscribeBtn: document.getElementById("subscribeBtn"),
  unsubscribeBtn: document.getElementById("unsubscribeBtn"),
  publishData: document.getElementById("publishData"),
  publishBtn: document.getElementById("publishBtn"),
  log: document.getElementById("log"),
  clearLogBtn: document.getElementById("clearLogBtn"),
  themeToggle: document.getElementById("themeToggle"),
  connectionSelect: document.getElementById("connectionSelect"),
  connectionName: document.getElementById("connectionName"),
  saveConnectionBtn: document.getElementById("saveConnectionBtn"),
  deleteConnectionBtn: document.getElementById("deleteConnectionBtn"),
};

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  els.themeToggle.textContent = theme === "dark" ? "☀️" : "🌙";
}

applyTheme(document.documentElement.getAttribute("data-theme"));

els.themeToggle.addEventListener("click", () => {
  const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
  applyTheme(next);
  localStorage.setItem("theme", next);
});

let ws = null;
let cmdId = 0;
const pendingCommands = new Map(); // id -> label, for logging replies against their request
let subscribedChannel = null;

let connections = []; // [{ id, name, wsUrl, channel, rememberToken, token }]
let selectedConnectionId = null;

function persistConnections() {
  chrome.storage.local.set({ connections });
}

function renderConnectionOptions() {
  els.connectionSelect.innerHTML = "";
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "-- New Connection --";
  els.connectionSelect.appendChild(placeholder);
  for (const conn of connections) {
    const opt = document.createElement("option");
    opt.value = conn.id;
    opt.textContent = conn.name;
    els.connectionSelect.appendChild(opt);
  }
  els.connectionSelect.value = selectedConnectionId || "";
}

function loadConnectionIntoForm(conn) {
  els.connectionName.value = conn.name;
  els.wsUrl.value = conn.wsUrl;
  els.channel.value = conn.channel || "";
  els.rememberToken.checked = !!conn.rememberToken;
  els.token.value = conn.rememberToken ? conn.token || "" : "";
}

function clearConnectionForm() {
  els.connectionName.value = "";
  els.wsUrl.value = "";
  els.channel.value = "";
  els.rememberToken.checked = false;
  els.token.value = "";
}

function selectConnection() {
  const id = els.connectionSelect.value;
  selectedConnectionId = id || null;
  els.deleteConnectionBtn.disabled = !id;
  if (!id) {
    clearConnectionForm();
    return;
  }
  const conn = connections.find((c) => c.id === id);
  if (!conn) return;
  loadConnectionIntoForm(conn);
  log("info", `Loaded connection "${conn.name}"`);
}

function saveConnection() {
  const name = els.connectionName.value.trim();
  if (!name) {
    log("error", "Connection name is required to save");
    return;
  }
  const wsUrl = els.wsUrl.value.trim();
  if (!wsUrl) {
    log("error", "WebSocket URL is required to save a connection");
    return;
  }

  const data = {
    name,
    wsUrl,
    channel: els.channel.value.trim(),
    rememberToken: els.rememberToken.checked,
    token: els.rememberToken.checked ? els.token.value.trim() : "",
  };

  const existing =
    connections.find((c) => c.id === selectedConnectionId) ||
    connections.find((c) => c.name.toLowerCase() === name.toLowerCase());

  if (existing) {
    Object.assign(existing, data);
    selectedConnectionId = existing.id;
    log("info", `Updated saved connection "${name}"`);
  } else {
    const conn = { id: crypto.randomUUID(), ...data };
    connections.push(conn);
    selectedConnectionId = conn.id;
    log("info", `Saved connection "${name}"`);
  }

  persistConnections();
  renderConnectionOptions();
  els.deleteConnectionBtn.disabled = false;
}

function deleteConnection() {
  if (!selectedConnectionId) return;
  const conn = connections.find((c) => c.id === selectedConnectionId);
  connections = connections.filter((c) => c.id !== selectedConnectionId);
  selectedConnectionId = null;
  persistConnections();
  renderConnectionOptions();
  els.connectionName.value = "";
  els.deleteConnectionBtn.disabled = true;
  if (conn) log("info", `Deleted saved connection "${conn.name}"`);
}

function logHeader(tag) {
  const time = new Date().toLocaleTimeString();
  const fragment = document.createDocumentFragment();
  const timeEl = document.createElement("span");
  timeEl.className = "log-time";
  timeEl.textContent = time;
  const tagEl = document.createElement("span");
  tagEl.className = `log-tag log-tag-${tag}`;
  tagEl.textContent = `[${tag}]`;
  fragment.appendChild(timeEl);
  fragment.appendChild(tagEl);
  return fragment;
}

function log(tag, text) {
  const entry = document.createElement("div");
  entry.className = "log-entry";
  entry.appendChild(logHeader(tag));
  entry.appendChild(document.createTextNode(text));
  els.log.appendChild(entry);
  els.log.scrollTop = els.log.scrollHeight;
}

// Logs a JS value as an indented, syntax-highlighted JSON block.
function logJson(tag, value) {
  const entry = document.createElement("div");
  entry.className = "log-entry";
  entry.appendChild(logHeader(tag));
  const pre = document.createElement("pre");
  pre.className = "log-json";
  pre.innerHTML = syntaxHighlightJson(value);
  entry.appendChild(pre);
  els.log.appendChild(entry);
  els.log.scrollTop = els.log.scrollHeight;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function syntaxHighlightJson(value) {
  const json = escapeHtml(JSON.stringify(value, null, 2));
  return json.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(\.\d+)?([eE][+-]?\d+)?)/g,
    (match) => {
      let cls = "json-number";
      if (/^"/.test(match)) {
        cls = /:$/.test(match) ? "json-key" : "json-string";
      } else if (/true|false/.test(match)) {
        cls = "json-boolean";
      } else if (/null/.test(match)) {
        cls = "json-null";
      }
      return `<span class="${cls}">${match}</span>`;
    }
  );
}

function setStatus(state, label) {
  els.status.className = `status status-${state}`;
  els.status.textContent = label;
}

function setConnectedUi(connected) {
  els.connectBtn.disabled = connected;
  els.disconnectBtn.disabled = !connected;
  els.subscribeBtn.disabled = !connected;
  els.wsUrl.disabled = connected;
  els.token.disabled = connected;
  if (!connected) {
    els.unsubscribeBtn.disabled = true;
    els.publishBtn.disabled = true;
    subscribedChannel = null;
  }
}

function send(method, params) {
  const id = ++cmdId;
  const command = { id, [method]: params };
  pendingCommands.set(id, method);
  ws.send(JSON.stringify(command));
  logJson("sent", command);
  return id;
}

function connect() {
  const url = els.wsUrl.value.trim();
  const token = els.token.value.trim();
  if (!url) {
    log("error", "WebSocket URL is required");
    return;
  }

  chrome.storage.local.set({
    wsUrl: url,
    channel: els.channel.value.trim(),
    rememberToken: els.rememberToken.checked,
    token: els.rememberToken.checked ? token : "",
  });

  setStatus("connecting", "connecting");
  cmdId = 0;
  pendingCommands.clear();

  try {
    ws = new WebSocket(url);
  } catch (err) {
    log("error", `Failed to open WebSocket: ${err.message}`);
    setStatus("error", "error");
    return;
  }

  ws.onopen = () => {
    log("info", "WebSocket open, sending connect command");
    send("connect", token ? { token } : {});
  };

  ws.onmessage = (event) => {
    const raw = event.data;
    if (raw === "" || raw === "{}") {
      // Server-to-client ping; reply with empty pong frame.
      ws.send("{}");
      log("info", "ping received, pong sent");
      return;
    }

    // Frames may contain multiple newline-separated JSON replies.
    for (const line of raw.split("\n")) {
      if (!line) continue;
      handleReply(line);
    }
  };

  ws.onerror = () => {
    log("error", "WebSocket error");
    setStatus("error", "error");
  };

  ws.onclose = (event) => {
    log("info", `WebSocket closed (code=${event.code} reason=${event.reason || "n/a"})`);
    setStatus("disconnected", "disconnected");
    setConnectedUi(false);
    ws = null;
  };
}

function handleReply(line) {
  let reply;
  try {
    reply = JSON.parse(line);
  } catch (err) {
    log("recv", line);
    log("error", `Failed to parse reply: ${err.message}`);
    return;
  }
  logJson("recv", reply);

  if (reply.error) {
    log("error", `Server error: ${JSON.stringify(reply.error)}`);
    return;
  }

  if (reply.id) {
    const method = pendingCommands.get(reply.id);
    pendingCommands.delete(reply.id);
    if (method === "connect") {
      setStatus("connected", "connected");
      setConnectedUi(true);
      log("info", "Connected to Centrifugo");
    } else if (method === "subscribe") {
      subscribedChannel = els.channel.value.trim();
      els.unsubscribeBtn.disabled = false;
      els.publishBtn.disabled = false;
      log("info", `Subscribed to "${subscribedChannel}"`);
    } else if (method === "unsubscribe") {
      log("info", `Unsubscribed from "${subscribedChannel}"`);
      subscribedChannel = null;
      els.unsubscribeBtn.disabled = true;
      els.publishBtn.disabled = true;
    }
    return;
  }

  // Server-initiated push (new publication, join/leave, etc.), id is 0/absent.
  if (reply.push) {
    const { channel, pub, join, leave } = reply.push;
    if (pub) {
      log("info", `Publication on "${channel}"`);
    } else if (join) {
      log("info", `Join on "${channel}"`);
    } else if (leave) {
      log("info", `Leave on "${channel}"`);
    }
  }
}

function disconnect() {
  if (ws) {
    ws.close(1000, "client disconnect");
  }
}

function subscribe() {
  const channel = els.channel.value.trim();
  if (!channel) {
    log("error", "Channel is required");
    return;
  }
  send("subscribe", { channel });
}

function unsubscribe() {
  if (!subscribedChannel) return;
  send("unsubscribe", { channel: subscribedChannel });
}

function publish() {
  if (!subscribedChannel) {
    log("error", "Subscribe to a channel before publishing");
    return;
  }
  const raw = els.publishData.value.trim() || "{}";
  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    log("error", `Publish data must be valid JSON: ${err.message}`);
    return;
  }
  send("publish", { channel: subscribedChannel, data });
}

els.connectBtn.addEventListener("click", connect);
els.disconnectBtn.addEventListener("click", disconnect);
els.subscribeBtn.addEventListener("click", subscribe);
els.unsubscribeBtn.addEventListener("click", unsubscribe);
els.publishBtn.addEventListener("click", publish);
els.clearLogBtn.addEventListener("click", () => {
  els.log.innerHTML = "";
});
els.connectionSelect.addEventListener("change", selectConnection);
els.saveConnectionBtn.addEventListener("click", saveConnection);
els.deleteConnectionBtn.addEventListener("click", deleteConnection);

chrome.storage.local.get(["wsUrl", "channel", "rememberToken", "token", "connections"], (stored) => {
  if (stored.wsUrl) els.wsUrl.value = stored.wsUrl;
  if (stored.channel) els.channel.value = stored.channel;
  if (stored.rememberToken) {
    els.rememberToken.checked = true;
    if (stored.token) els.token.value = stored.token;
  }
  connections = stored.connections || [];
  renderConnectionOptions();
});
