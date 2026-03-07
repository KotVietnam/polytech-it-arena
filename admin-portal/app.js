(function () {
  const API_BASE = "/api";
  const TOKEN_KEY = "adminPortalToken";
  const USER_KEY = "adminPortalUser";

  const state = {
    token: localStorage.getItem(TOKEN_KEY) || "",
    user: null,
    events: [],
    users: [],
    liveEventId: "",
    liveStats: null,
    pollHandle: null,
    timerHandle: null,
  };

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));

  const sessionMeta = $("#session-meta");
  const loginPanel = $("#login-panel");
  const appPanel = $("#app-panel");
  const loginForm = $("#login-form");
  const loginError = $("#login-error");
  const toast = $("#toast");

  const navButtons = $$(".nav-btn[data-target]");
  const views = {
    overview: $("#view-overview"),
    events: $("#view-events"),
    live: $("#view-live"),
    points: $("#view-points"),
  };

  const eventForm = $("#event-form");
  const eventsBody = $("#events-body");
  const liveEventSelect = $("#live-event-select");
  const drawBtn = $("#draw-btn");
  const scoreForm = $("#score-form");
  const teamsList = $("#teams-list");
  const actionsList = $("#actions-list");
  const pointsForm = $("#points-form");

  const statEvents = $("#stat-events");
  const statUsers = $("#stat-users");
  const statLiveEvent = $("#stat-live-event");
  const statLiveStatus = $("#stat-live-status");
  const liveTimer = $("#live-timer");
  const liveStatus = $("#live-status");

  const timerActionButtons = $$("[data-timer-action]");

  const timerStatusLabel = {
    idle: "ОЖИДАНИЕ",
    running: "СТАРТ",
    paused: "ПАУЗА",
    break: "ПЕРЕРЫВ",
  };

  const trackNames = {
    cybersecurity: "Кибербезопасность",
    networks: "Сети",
    devops: "DevOps",
    sysadmin: "Системное администрирование",
  };

  const teamNames = {
    BLUE: "СИНЯЯ",
    RED: "КРАСНАЯ",
  };

  const escapeHtml = (value) =>
    String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const formatTeamName = (value) => {
    const key = String(value || "").toUpperCase();
    return teamNames[key] || key || "КОМАНДА";
  };

  const showToast = (message, mode) => {
    toast.textContent = message;
    toast.className = `toast ${mode || ""}`;
    toast.classList.remove("hidden");
    window.setTimeout(() => {
      toast.classList.add("hidden");
    }, 2600);
  };

  const setSessionMeta = () => {
    if (!state.user) {
      sessionMeta.textContent = "Не авторизован";
      return;
    }
    const roleLabel = state.user.role === "ADMIN" ? "АДМИН" : state.user.role;
    sessionMeta.textContent = `${state.user.username} / ${roleLabel}`;
  };

  const request = async (path, options) => {
    const headers = new Headers((options && options.headers) || {});
    if (state.token) {
      headers.set("Authorization", `Bearer ${state.token}`);
    }
    if (options && options.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    const response = await fetch(`${API_BASE}${path}`, {
      ...(options || {}),
      headers,
    });

    if (!response.ok) {
      let errorText = `HTTP ${response.status}`;
      try {
        const payload = await response.json();
        if (payload && payload.error) {
          errorText = payload.error;
        }
      } catch {
        // no-op
      }
      throw new Error(errorText);
    }

    if (response.status === 204) {
      return null;
    }

    return response.json();
  };

  const clearSession = () => {
    state.token = "";
    state.user = null;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    loginPanel.classList.remove("hidden");
    appPanel.classList.add("hidden");
    loginError.textContent = "";
    setSessionMeta();
    stopLivePolling();
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) {
      return isoString;
    }
    return date.toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTimer = (snapshot) => {
    if (!snapshot || !snapshot.timer) {
      return "00:00:00";
    }

    let elapsed = snapshot.timer.elapsedSeconds || 0;
    if (snapshot.timer.status === "running" && snapshot.timer.startedAt) {
      const startedMs = new Date(snapshot.timer.startedAt).getTime();
      if (Number.isFinite(startedMs)) {
        elapsed += Math.max(0, Math.floor((Date.now() - startedMs) / 1000));
      }
    }

    const hours = Math.floor(elapsed / 3600);
    const minutes = Math.floor((elapsed % 3600) / 60);
    const seconds = elapsed % 60;
    return [hours, minutes, seconds].map((item) => String(item).padStart(2, "0")).join(":");
  };

  const setActiveView = (key) => {
    Object.entries(views).forEach(([viewKey, node]) => {
      if (!node) return;
      node.classList.toggle("hidden", viewKey !== key);
    });
    navButtons.forEach((button) => {
      button.classList.toggle("active", button.dataset.target === key);
    });
  };

  const renderStats = () => {
    statEvents.textContent = String(state.events.length);
    statUsers.textContent = String(state.users.length);
    const selected = state.events.find((item) => item.id === state.liveEventId);
    statLiveEvent.textContent = selected ? selected.title : "Нет";
    const status = state.liveStats?.timer?.status || "idle";
    statLiveStatus.textContent = timerStatusLabel[status] || "ОЖИДАНИЕ";
  };

  const renderEventsTable = () => {
    eventsBody.innerHTML = state.events
      .map(
        (eventItem) => `
          <tr>
            <td>${escapeHtml(eventItem.title)}</td>
            <td>${escapeHtml(trackNames[eventItem.track] || eventItem.track)}</td>
            <td>${escapeHtml(formatDate(eventItem.date))}</td>
            <td>${escapeHtml(eventItem.location)}</td>
            <td><button data-event-delete="${eventItem.id}" class="danger">Удалить</button></td>
          </tr>
        `,
      )
      .join("");
  };

  const renderEventSelects = () => {
    const options = state.events
      .map((item) => `<option value="${item.id}">${escapeHtml(item.title)} (${escapeHtml(formatDate(item.date))})</option>`)
      .join("");

    liveEventSelect.innerHTML = options || '<option value="">Нет событий</option>';
    if (!state.liveEventId && state.events[0]) {
      state.liveEventId = state.events[0].id;
    }
    if (state.liveEventId && !state.events.some((item) => item.id === state.liveEventId)) {
      state.liveEventId = state.events[0] ? state.events[0].id : "";
    }
    liveEventSelect.value = state.liveEventId;

    const pointsEvent = $("#points-event");
    pointsEvent.innerHTML =
      '<option value="">Нет</option>' +
      state.events
        .map((item) => `<option value="${item.id}">${escapeHtml(item.title)}</option>`)
        .join("");
  };

  const renderUsers = () => {
    const select = $("#points-user");
    select.innerHTML = state.users
      .map((item) => `<option value="${item.id}">${escapeHtml(item.username)} (${item.totalPoints} балл.)</option>`)
      .join("");
  };

  const renderLive = () => {
    const stats = state.liveStats;
    liveTimer.textContent = formatTimer(stats);
    liveStatus.textContent =
      timerStatusLabel[(stats && stats.timer && stats.timer.status) || "idle"] || "ОЖИДАНИЕ";

    if (!stats) {
      teamsList.innerHTML = "<li>Нет LIVE-данных.</li>";
      actionsList.innerHTML = "<li>Пока нет действий.</li>";
      renderStats();
      return;
    }

    teamsList.innerHTML = stats.teams
      .map(
        (team) =>
          `<li><strong>${escapeHtml(formatTeamName(team.name))}</strong> - ${team.score} балл., участников: ${team.participantsCount}</li>`,
      )
      .join("");

    actionsList.innerHTML = stats.recentActions.length
      ? stats.recentActions
          .map(
            (action) =>
              `<li>${escapeHtml(formatTeamName(action.team))} ${action.points > 0 ? "+" : ""}${action.points} - ${escapeHtml(action.reason)}</li>`,
          )
          .join("")
      : "<li>Действия начисления пока отсутствуют.</li>";

    renderStats();
  };

  const stopLivePolling = () => {
    if (state.pollHandle) {
      window.clearInterval(state.pollHandle);
      state.pollHandle = null;
    }
    if (state.timerHandle) {
      window.clearInterval(state.timerHandle);
      state.timerHandle = null;
    }
  };

  const refreshLiveStats = async () => {
    if (!state.liveEventId) {
      state.liveStats = null;
      renderLive();
      return;
    }
    const response = await request(`/events/${state.liveEventId}/live-stats`);
    state.liveStats = response.item;
    renderLive();
  };

  const startLivePolling = () => {
    stopLivePolling();
    state.pollHandle = window.setInterval(() => {
      refreshLiveStats().catch((error) => {
        showToast(error.message, "error");
      });
    }, 8000);
    state.timerHandle = window.setInterval(() => {
      renderLive();
    }, 1000);
  };

  const loadData = async () => {
    const [eventsResponse, usersResponse] = await Promise.all([
      request("/events"),
      request("/admin/users"),
    ]);
    state.events = eventsResponse.items || [];
    state.users = usersResponse.items || [];
    renderEventsTable();
    renderEventSelects();
    renderUsers();
    await refreshLiveStats();
  };

  const ensureAdmin = () => {
    if (!state.user || state.user.role !== "ADMIN") {
      throw new Error("Доступ запрещен: требуется роль ADMIN");
    }
  };

  const onLogin = async (event) => {
    event.preventDefault();
    loginError.textContent = "";

    const username = $("#login-username").value.trim();
    const password = $("#login-password").value;

    try {
      const result = await request("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });

      state.token = result.token;
      state.user = result.user;
      localStorage.setItem(TOKEN_KEY, state.token);
      localStorage.setItem(USER_KEY, JSON.stringify(result.user));
      ensureAdmin();

      loginPanel.classList.add("hidden");
      appPanel.classList.remove("hidden");
      setSessionMeta();

      await loadData();
      startLivePolling();
      setActiveView("overview");
      showToast("Авторизация выполнена.", "ok");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ошибка входа";
      loginError.textContent = message;
      showToast(message, "error");
      clearSession();
    }
  };

  const restoreSession = async () => {
    if (!state.token) {
      return;
    }
    try {
      const response = await request("/auth/me");
      state.user = response.user;
      ensureAdmin();
      loginPanel.classList.add("hidden");
      appPanel.classList.remove("hidden");
      setSessionMeta();
      await loadData();
      startLivePolling();
      setActiveView("overview");
    } catch {
      clearSession();
    }
  };

  const onCreateEvent = async (event) => {
    event.preventDefault();
    const dateLocal = $("#event-date").value;
    const parsedDate = new Date(dateLocal);
    if (Number.isNaN(parsedDate.getTime())) {
      showToast("Некорректная дата события", "error");
      return;
    }

    const payload = {
      track: $("#event-track").value,
      level: $("#event-level").value,
      title: $("#event-title").value.trim(),
      duration: $("#event-duration").value.trim(),
      location: $("#event-location").value.trim(),
      description: $("#event-description").value.trim(),
      registrationLink: $("#event-link").value.trim() || null,
      date: parsedDate.toISOString(),
    };

    try {
      await request("/admin/events", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      eventForm.reset();
      await loadData();
      showToast("Событие создано.", "ok");
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const onEventsTableClick = async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    const eventId = target.getAttribute("data-event-delete");
    if (!eventId) {
      return;
    }

    try {
      await request(`/admin/events/${eventId}`, { method: "DELETE" });
      await loadData();
      showToast("Событие удалено.", "ok");
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const onDraw = async () => {
    if (!state.liveEventId) {
      showToast("Сначала выберите событие.", "error");
      return;
    }
    try {
      const response = await request(`/admin/live/${state.liveEventId}/draw`, { method: "POST" });
      state.liveStats = response.item;
      renderLive();
      showToast("Жеребьевка выполнена.", "ok");
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const onScore = async (event) => {
    event.preventDefault();
    if (!state.liveEventId) {
      showToast("Сначала выберите событие.", "error");
      return;
    }
    const payload = {
      team: $("#score-team").value,
      points: Number($("#score-points").value),
      reason: $("#score-reason").value.trim(),
    };
    try {
      const response = await request(`/admin/live/${state.liveEventId}/score`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      state.liveStats = response.item;
      renderLive();
      $("#score-reason").value = "";
      showToast("Баллы начислены.", "ok");
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const onTimerAction = async (action) => {
    if (!state.liveEventId) {
      showToast("Сначала выберите событие.", "error");
      return;
    }
    const actionLabel = {
      START: "СТАРТ",
      PAUSE: "ПАУЗА",
      BREAK: "ПЕРЕРЫВ",
      RESUME: "ПРОДОЛЖИТЬ",
      RESET: "СБРОС",
    }[action] || action;
    try {
      const response = await request(`/admin/live/${state.liveEventId}/timer`, {
        method: "POST",
        body: JSON.stringify({ action }),
      });
      state.liveStats = response.item;
      renderLive();
      showToast(`Таймер: ${actionLabel}`, "ok");
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const onGrantPoints = async (event) => {
    event.preventDefault();
    const payload = {
      userId: $("#points-user").value,
      eventId: $("#points-event").value || null,
      points: Number($("#points-value").value),
      reason: $("#points-reason").value.trim(),
    };
    try {
      await request("/admin/points/grant", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      await loadData();
      pointsForm.reset();
      showToast("Баллы начислены.", "ok");
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const bindEvents = () => {
    loginForm.addEventListener("submit", onLogin);
    $("#logout-btn").addEventListener("click", clearSession);

    navButtons.forEach((button) => {
      button.addEventListener("click", () => {
        setActiveView(button.dataset.target);
      });
    });

    eventForm.addEventListener("submit", onCreateEvent);
    eventsBody.addEventListener("click", onEventsTableClick);
    liveEventSelect.addEventListener("change", async (event) => {
      state.liveEventId = event.target.value;
      await refreshLiveStats();
    });
    drawBtn.addEventListener("click", onDraw);
    scoreForm.addEventListener("submit", onScore);
    pointsForm.addEventListener("submit", onGrantPoints);

    timerActionButtons.forEach((button) => {
      button.addEventListener("click", () => {
        onTimerAction(button.dataset.timerAction);
      });
    });
  };

  const bootstrap = async () => {
    bindEvents();
    setSessionMeta();
    await restoreSession();
  };

  bootstrap().catch((error) => {
    showToast(error.message || "Ошибка запуска панели", "error");
    clearSession();
  });
})();
