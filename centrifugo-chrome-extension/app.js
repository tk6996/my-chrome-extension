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

function log(tag, text) {
  const time = new Date().toLocaleTimeString();
  const entry = document.createElement("div");
  entry.className = "log-entry";
  entry.innerHTML =
    `<span class="log-time">${time}</span>` +
    `<span class="log-tag log-tag-${tag}">[${tag}]</span>` +
    escapeHtml(text);
  els.log.appendChild(entry);
  els.log.scrollTop = els.log.scrollHeight;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
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
  const payload = JSON.stringify(command);
  ws.send(payload);
  log("sent", payload);
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
  log("recv", line);
  let reply;
  try {
    reply = JSON.parse(line);
  } catch (err) {
    log("error", `Failed to parse reply: ${err.message}`);
    return;
  }

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
      log("info", `Publication on "${channel}": ${JSON.stringify(pub.data)}`);
    } else if (join) {
      log("info", `Join on "${channel}": ${JSON.stringify(join.info)}`);
    } else if (leave) {
      log("info", `Leave on "${channel}": ${JSON.stringify(leave.info)}`);
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

chrome.storage.local.get(["wsUrl", "channel", "rememberToken", "token"], (stored) => {
  if (stored.wsUrl) els.wsUrl.value = stored.wsUrl;
  if (stored.channel) els.channel.value = stored.channel;
  if (stored.rememberToken) {
    els.rememberToken.checked = true;
    if (stored.token) els.token.value = stored.token;
  }
});
