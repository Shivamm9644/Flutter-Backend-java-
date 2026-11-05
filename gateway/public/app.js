/**
 * Inurum Fleet Operations Platform - Application Logic
 * Desktop-First Fleet Management, Live Telematics & Dual Dashcam Surveillance
 */

(function () {
  'use strict';

  // ── Global Application State ──────────────────────────────────────────
  const state = {
    currentRoute: 'dashboard',
    vehicles: [],
    selectedVehicleId: null,
    selectedVehicle: null,
    activeChannel: 'dual', // 'dual', '1', '2', 'pip'
    isStreaming: false,
    liveTtlSeconds: 120,
    liveTtlInterval: null,
    heartbeatInterval: null,
    hlsRoad: null,
    hlsCabin: null,
    overviewMap: null,
    liveFocusMap: null,
    overviewMarkers: new Map(),
    liveFocusMarker: null,
    isMuted: true,
    isNightVision: false,
    activeRosterFilter: 'ALL',
    searchQuery: '',
    osdInterval: null,
    // Video Center State
    vcSelectedVehicleId: '860871080043592',
    vcSelectedChannel: 1,
    vcSelectedDate: new Date().toISOString().substring(0, 10),
    vcActiveJob: null,
    vcJobPollInterval: null,
    vcRecordings: [],
    vcTab: 'all',
    vcCurrentFootageUrl: null,
    // Safety Inbox State
    safetyIncidents: [],
    safetyActiveIncident: null,
    modalHlsRoad: null,
    modalHlsCabin: null,
    modalSyncPlaying: false
  };

  // ── Cached DOM Selectors ──────────────────────────────────────────────
  const dom = {};

  function cacheDom() {
    // Navigation & Shell
    dom.appSidebar = document.getElementById('appSidebar');
    dom.btnToggleSidebar = document.getElementById('btnToggleSidebar');
    dom.navItems = document.querySelectorAll('.sidebar-nav .nav-item');
    dom.viewContainers = document.querySelectorAll('.view-container');
    dom.breadcrumbTitle = document.getElementById('breadcrumbActiveTitle');
    dom.globalSearchInput = document.getElementById('globalSearchInput');
    dom.liveClockDisplay = document.getElementById('liveClockDisplay');
    dom.headerQuotaMinutes = document.getElementById('headerQuotaMinutes');
    dom.btnSignOut = document.getElementById('btnSignOut');
    dom.authBackdrop = document.getElementById('authBackdrop');
    dom.authForm = document.getElementById('authForm');
    dom.inputAuthEmail = document.getElementById('inputAuthEmail');
    dom.inputAuthPassword = document.getElementById('inputAuthPassword');
    dom.authAlert = document.getElementById('authAlert');

    // Dashboard Overview Elements
    dom.kpiTotalCount = document.getElementById('kpiTotalCount');
    dom.kpiOnlineCount = document.getElementById('kpiOnlineCount');
    dom.kpiOfflineCount = document.getElementById('kpiOfflineCount');
    dom.kpiDrivingCount = document.getElementById('kpiDrivingCount');
    dom.kpiIdleCount = document.getElementById('kpiIdleCount');
    dom.kpiLiveStreamsCount = document.getElementById('kpiLiveStreamsCount');
    dom.kpiSafetyEventsCount = document.getElementById('kpiSafetyEventsCount');
    dom.kpiHealthRate = document.getElementById('kpiHealthRate');
    dom.overviewMapContainer = document.getElementById('overviewMapContainer');
    dom.overviewSafetyTableBody = document.getElementById('overviewSafetyTableBody');
    dom.overviewRecordingsList = document.getElementById('overviewRecordingsList');
    dom.btnCenterOverviewMap = document.getElementById('btnCenterOverviewMap');
    dom.btnGoToLiveFromOverview = document.getElementById('btnGoToLiveFromOverview');

    // Live Monitoring Elements
    dom.rosterCardsContainer = document.getElementById('vehicleRosterCardsContainer');
    dom.rosterFilterPills = document.querySelectorAll('.roster-filter-pills .filter-pill');
    dom.rosterSearchInput = document.getElementById('rosterSearchInput');
    dom.activePlateText = document.getElementById('activePlateText');
    dom.activeVehicleTitle = document.getElementById('activeVehicleTitle');
    dom.activeDriverText = document.getElementById('activeDriverText');
    dom.channelTabBtns = document.querySelectorAll('.player-channel-tabs .channel-tab-btn');
    dom.streamTtlTimer = document.getElementById('streamTtlTimer');
    dom.btnStartStream = document.getElementById('btnStartStream');
    dom.btnStopStream = document.getElementById('btnStopStream');
    dom.btnToggleNightVision = document.getElementById('btnToggleNightVision');
    dom.btnSnapshot = document.getElementById('btnSnapshot');
    dom.btnAudioToggle = document.getElementById('btnAudioToggle');
    dom.btnFullscreen = document.getElementById('btnFullscreen');
    dom.videoViewportWrapper = document.getElementById('videoViewportWrapper');
    dom.dualCameraGrid = document.getElementById('dualCameraGrid');
    dom.screenRoadWrap = document.getElementById('screenRoadWrap');
    dom.screenCabinWrap = document.getElementById('screenCabinWrap');
    dom.videoRoad = document.getElementById('videoRoad');
    dom.videoCabin = document.getElementById('videoCabin');
    dom.streamConnectingOverlay = document.getElementById('streamConnectingOverlay');
    dom.streamConnectingText = document.getElementById('streamConnectingText');
    dom.osdTimeRoad = document.getElementById('osdTimeRoad');
    dom.osdTimeCabin = document.getElementById('osdTimeCabin');
    dom.osdTelemetryRoad = document.getElementById('osdTelemetryRoad');
    dom.liveFocusMapContainer = document.getElementById('liveFocusMapContainer');
    dom.subdeckAddress = document.getElementById('subdeckAddress');
    dom.diagImei = document.getElementById('diagImei');
    dom.diagSpeed = document.getElementById('diagSpeed');
    dom.diagVoltage = document.getElementById('diagVoltage');
    dom.diagSats = document.getElementById('diagSats');

    // Video Center (Module 3) Selectors
    dom.vcVehicleSelect = document.getElementById('vcVehicleSelect');
    dom.vcDatePicker = document.getElementById('vcDatePicker');
    dom.vcTimeStart = document.getElementById('vcTimeStart');
    dom.vcTimeEnd = document.getElementById('vcTimeEnd');
    dom.btnVcChannel1 = document.getElementById('btnVcChannel1');
    dom.btnVcChannel2 = document.getElementById('btnVcChannel2');
    dom.btnQuerySdCard = document.getElementById('btnQuerySdCard');
    dom.btnRefreshRecordings = document.getElementById('btnRefreshRecordings');
    dom.vcTimelineWrapper = document.getElementById('vcTimelineWrapper');
    dom.vcTimelineTrack = document.getElementById('vcTimelineTrack');
    dom.vcTimelineNeedle = document.getElementById('vcTimelineNeedle');
    dom.vcNeedleFlag = document.getElementById('vcNeedleFlag');
    dom.vcScrubTimestampText = document.getElementById('vcScrubTimestampText');
    dom.vcVideoStatusChip = document.getElementById('vcVideoStatusChip');
    dom.vcPlayerTitle = document.getElementById('vcPlayerTitle');
    dom.vcPlayerSubtitle = document.getElementById('vcPlayerSubtitle');
    dom.btnVcDownloadClip = document.getElementById('btnVcDownloadClip');
    dom.btnVcFullscreen = document.getElementById('btnVcFullscreen');
    dom.vcVideoPlayer = document.getElementById('vcVideoPlayer');
    dom.vcOsdChannel = document.getElementById('vcOsdChannel');
    dom.vcOsdTime = document.getElementById('vcOsdTime');
    dom.vcOsdSpeed = document.getElementById('vcOsdSpeed');
    dom.btnVcPlayPause = document.getElementById('btnVcPlayPause');
    dom.btnVcSeekBack = document.getElementById('btnVcSeekBack');
    dom.btnVcSeekForward = document.getElementById('btnVcSeekForward');
    dom.vcPlaybackSpeedSelect = document.getElementById('vcPlaybackSpeedSelect');
    dom.btnRequestRetrieval = document.getElementById('btnRequestRetrieval');
    dom.vcMetaPlate = document.getElementById('vcMetaPlate');
    dom.vcMetaDriver = document.getElementById('vcMetaDriver');
    dom.vcMetaChannel = document.getElementById('vcMetaChannel');
    dom.vcMetaCodec = document.getElementById('vcMetaCodec');
    dom.vcMetaLocation = document.getElementById('vcMetaLocation');
    dom.vcJobStatusBadge = document.getElementById('vcJobStatusBadge');
    dom.vcJobIdLabel = document.getElementById('vcJobIdLabel');
    dom.vcJobProgressBar = document.getElementById('vcJobProgressBar');
    dom.vcJobStageText = document.getElementById('vcJobStageText');
    dom.vcJobPercentText = document.getElementById('vcJobPercentText');
    dom.vcJobHelpText = document.getElementById('vcJobHelpText');
    dom.btnVcTabAll = document.getElementById('btnVcTabAll');
    dom.btnVcTabCloud = document.getElementById('btnVcTabCloud');
    dom.btnVcTabSd = document.getElementById('btnVcTabSd');
    dom.vcRecordingsTableBody = document.getElementById('vcRecordingsTableBody');

    // Safety Inbox (Module 4) Selectors
    dom.kpiTotalIncidents = document.getElementById('kpiTotalIncidents');
    dom.kpiNeedsReview = document.getElementById('kpiNeedsReview');
    dom.kpiCriticalCount = document.getElementById('kpiCriticalCount');
    dom.kpiCoachedCount = document.getElementById('kpiCoachedCount');
    dom.safetyFilterSeverity = document.getElementById('safetyFilterSeverity');
    dom.safetyFilterType = document.getElementById('safetyFilterType');
    dom.safetyFilterStatus = document.getElementById('safetyFilterStatus');
    dom.safetyFilterVehicle = document.getElementById('safetyFilterVehicle');
    dom.btnResetSafetyFilters = document.getElementById('btnResetSafetyFilters');
    dom.safetyInboxBadge = document.getElementById('safetyInboxBadge');
    dom.safetyIncidentsTableBody = document.getElementById('safetyIncidentsTableBody');

    // Incident Review Modal Selectors
    dom.incidentReviewModal = document.getElementById('incidentReviewModal');
    dom.modalIncidentSeverityBadge = document.getElementById('modalIncidentSeverityBadge');
    dom.modalIncidentTitle = document.getElementById('modalIncidentTitle');
    dom.modalIncidentSubtitle = document.getElementById('modalIncidentSubtitle');
    dom.btnCloseIncidentModal = document.getElementById('btnCloseIncidentModal');
    dom.modalVideoRoad = document.getElementById('modalVideoRoad');
    dom.modalVideoCabin = document.getElementById('modalVideoCabin');
    dom.btnModalSyncPlay = document.getElementById('btnModalSyncPlay');
    dom.btnModalRewind = document.getElementById('btnModalRewind');
    dom.btnModalForward = document.getElementById('btnModalForward');
    dom.modalSpeedSparkline = document.getElementById('modalSpeedSparkline');
    dom.modalPlateText = document.getElementById('modalPlateText');
    dom.modalDriverText = document.getElementById('modalDriverText');
    dom.modalImpactSpeedText = document.getElementById('modalImpactSpeedText');
    dom.modalCoordsText = document.getElementById('modalCoordsText');
    dom.modalLocationText = document.getElementById('modalLocationText');
    dom.modalCoachingCategory = document.getElementById('modalCoachingCategory');
    dom.modalCoachingNotes = document.getElementById('modalCoachingNotes');
    dom.btnSubmitCoached = document.getElementById('btnSubmitCoached');
    dom.btnSubmitDismiss = document.getElementById('btnSubmitDismiss');
  }

  // ── Initialization & Bootstrap ───────────────────────────────────────
  document.addEventListener('DOMContentLoaded', async () => {
    cacheDom();
    initClock();
    initSidebarToggle();
    initHashRouter();
    bindEvents();

    // Check Authentication
    if (!FleetApi.token) {
      showAuthModal();
    } else {
      await loadFleetData();
    }
  });

  // ── Authentication Handlers ───────────────────────────────────────────
  function showAuthModal() {
    if (dom.authBackdrop) dom.authBackdrop.style.display = 'flex';
  }

  function hideAuthModal() {
    if (dom.authBackdrop) dom.authBackdrop.style.display = 'none';
  }

  async function handleLogin(email, password) {
    try {
      if (dom.authAlert) dom.authAlert.style.display = 'none';
      const res = await FleetApi.login(email, password);
      hideAuthModal();
      showToast(`Welcome, ${res.user.name}! Connected to ${res.user.tenantName || 'Inurum Fleet'}`, 'success');
      updateUserMetaDisplay(res.user);
      await loadFleetData();
    } catch (err) {
      if (dom.authAlert) {
        dom.authAlert.style.display = 'block';
        dom.authAlert.style.backgroundColor = '#fee2e2';
        dom.authAlert.style.color = '#b91c1c';
        dom.authAlert.textContent = err.message || 'Invalid email or password.';
      }
    }
  }

  function updateUserMetaDisplay(user) {
    if (!user) return;
    const nameEl = document.getElementById('sidebarUserName');
    const roleEl = document.getElementById('sidebarUserRole');
    const avatarEl = document.getElementById('sidebarAvatar');
    if (nameEl) nameEl.textContent = user.name || user.email;
    if (roleEl) roleEl.textContent = user.role || 'FLEET_ADMIN';
    if (avatarEl) avatarEl.textContent = (user.name || user.email).substring(0, 2).toUpperCase();
  }

  // ── Live Clock & Telemetry Ticker ─────────────────────────────────────
  function initClock() {
    function update() {
      const now = new Date();
      if (dom.liveClockDisplay) {
        const istString = now.toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
        dom.liveClockDisplay.textContent = `IST ${istString}`;
      }
      if (state.isStreaming && dom.osdTimeRoad) {
        const timeStr = now.toISOString().substring(11, 19);
        if (dom.osdTimeRoad) dom.osdTimeRoad.textContent = timeStr;
        if (dom.osdTimeCabin) dom.osdTimeCabin.textContent = timeStr;
      }
    }
    update();
    setInterval(update, 1000);
  }

  // ── Collapsible Left Sidebar ──────────────────────────────────────────
  function initSidebarToggle() {
    if (dom.btnToggleSidebar && dom.appSidebar) {
      dom.btnToggleSidebar.addEventListener('click', () => {
        dom.appSidebar.classList.toggle('is-collapsed');
        // Re-invalidate map sizes when sidebar animates
        setTimeout(() => {
          if (state.overviewMap) state.overviewMap.invalidateSize();
          if (state.liveFocusMap) state.liveFocusMap.invalidateSize();
        }, 220);
      });
    }

    // Keyboard shortcut (Ctrl + B)
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        if (dom.btnToggleSidebar) dom.btnToggleSidebar.click();
      }
    });
  }

  // ── Client Hash Routing ───────────────────────────────────────────────
  function initHashRouter() {
    function routeFromHash() {
      const hash = window.location.hash.replace('#', '').trim() || 'dashboard';
      navigateTo(hash, false);
    }
    window.addEventListener('hashchange', routeFromHash);
    routeFromHash();
  }

  function navigateTo(routeId, updateHash = true) {
    state.currentRoute = routeId;
    if (updateHash) {
      window.location.hash = routeId;
    }

    // Update Sidebar Active state
    dom.navItems.forEach(item => {
      if (item.dataset.route === routeId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Update Views visibility
    const targetViewId = 'view' + routeId.charAt(0).toUpperCase() + routeId.slice(1);
    dom.viewContainers.forEach(container => {
      if (container.id === targetViewId) {
        container.classList.add('active');
      } else {
        container.classList.remove('active');
      }
    });

    // Update Breadcrumb Text
    const titles = {
      dashboard: 'Dashboard Overview',
      live: 'Live Monitoring',
      video: 'Video Center',
      safety: 'Safety Inbox',
      vehicles: 'Vehicles & Devices',
      trips: 'Trips & Routes',
      admin: 'Administration'
    };
    if (dom.breadcrumbTitle) {
      dom.breadcrumbTitle.textContent = titles[routeId] || 'Dashboard Overview';
    }

    // Refresh Maps when views change
    if (routeId === 'dashboard') {
      setTimeout(() => {
        if (!state.overviewMap) initOverviewMap();
        else state.overviewMap.invalidateSize();
      }, 100);
    } else if (routeId === 'live') {
      setTimeout(() => {
        if (!state.liveFocusMap) initLiveFocusMap();
        else state.liveFocusMap.invalidateSize();
        // Auto-select first vehicle if none selected
        if (!state.selectedVehicle && state.vehicles.length > 0) {
          selectVehicle(state.vehicles[0].id);
        }
      }, 100);
    } else if (routeId === 'video') {
      setTimeout(() => {
        initVideoCenter();
      }, 100);
    } else if (routeId === 'safety') {
      setTimeout(() => {
        initSafetyInbox();
      }, 100);
    }
  }

  // ── Core Data Loading & State Management ──────────────────────────────
  async function loadFleetData() {
    try {
      // 1. Fetch Vehicles
      const vehicles = await FleetApi.getVehicles();
      state.vehicles = vehicles;

      // 2. Fetch Latest Live Telemetry Positions
      const positions = await FleetApi.getLatestPositions();
      mergeLivePositions(positions);

      // 3. Fetch Safety Events
      const safetyEvents = await FleetApi.getSafetyEvents();

      // 4. Fetch Quotas
      const quotas = await FleetApi.getQuotas();

      // Update UI Components
      updateDashboardStats(vehicles, safetyEvents, quotas);
      renderOverviewSafetyTable(safetyEvents);
      renderOverviewRecordings(vehicles);
      renderVehicleRosterCards();
      loadSafetyIncidents();

      // Init or Update Overview Map
      if (state.currentRoute === 'dashboard') {
        if (!state.overviewMap) initOverviewMap();
        else updateOverviewMapMarkers();
      }

      // Update Quota badge in header
      if (dom.headerQuotaMinutes && quotas.quota) {
        dom.headerQuotaMinutes.textContent = `${quotas.quota.remainingLiveMinutes}m left`;
      }
    } catch (err) {
      console.error('[Fleet] Data load error:', err);
      showToast('Error loading real-time fleet data. Retrying...', 'error');
    }
  }

  function mergeLivePositions(positions) {
    if (!positions || positions.length === 0) return;
    positions.forEach(pos => {
      const v = state.vehicles.find(veh => veh.terminalId === pos.terminalId);
      if (v) {
        v.lat = pos.lat;
        v.lng = pos.lng;
        v.speed = pos.speed;
        v.heading = pos.heading;
        v.ignition = pos.ignition;
        if (pos.address) v.address = pos.address;
        v.status = pos.speed > 0 ? 'ONLINE' : (pos.ignition ? 'IDLE' : 'ONLINE');
        v.lastSeen = pos.timestamp || new Date().toISOString();
      }
    });
  }

  // ── SCREEN 1: Dashboard Overview Renderers ─────────────────────────────
  function updateDashboardStats(vehicles, safetyEvents, quotas) {
    const total = vehicles.length;
    const online = vehicles.filter(v => v.status === 'ONLINE').length;
    const idle = vehicles.filter(v => v.status === 'IDLE').length;
    const offline = vehicles.filter(v => v.status === 'OFFLINE').length;
    const moving = vehicles.filter(v => v.speed > 0).length;

    if (dom.kpiTotalCount) dom.kpiTotalCount.textContent = total;
    if (dom.kpiOnlineCount) dom.kpiOnlineCount.textContent = `● ${online} Online`;
    if (dom.kpiOfflineCount) dom.kpiOfflineCount.textContent = `${offline} Offline`;
    if (dom.kpiDrivingCount) dom.kpiDrivingCount.textContent = moving;
    if (dom.kpiIdleCount) dom.kpiIdleCount.textContent = `${idle} Idling`;
    if (dom.kpiLiveStreamsCount) dom.kpiLiveStreamsCount.textContent = state.isStreaming ? '2' : '0';
    if (dom.kpiSafetyEventsCount) dom.kpiSafetyEventsCount.textContent = safetyEvents.length;
    if (dom.kpiHealthRate) dom.kpiHealthRate.textContent = `${Math.round(((online + idle) / Math.max(total, 1)) * 100)}%`;
  }

  function initOverviewMap() {
    if (!dom.overviewMapContainer || state.overviewMap) return;

    // Center on India by default
    state.overviewMap = L.map('overviewMapContainer', {
      zoomControl: true,
      attributionControl: false
    }).setView([20.5937, 78.9629], 5);

    // Light Carto Positron / OSM Tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19
    }).addTo(state.overviewMap);

    updateOverviewMapMarkers();
  }

  function updateOverviewMapMarkers() {
    if (!state.overviewMap) return;

    const bounds = L.latLngBounds([]);
    state.vehicles.forEach(v => {
      if (!v.lat || !v.lng) return;

      const latLng = [v.lat, v.lng];
      bounds.extend(latLng);

      const color = v.status === 'ONLINE' ? '#16a34a' : (v.status === 'IDLE' ? '#d97706' : '#94a3b8');
      const iconHtml = `
        <div style="width:28px;height:28px;border-radius:50%;background:#ffffff;border:2px solid ${color};box-shadow:0 2px 4px rgba(0,0,0,0.15);display:flex;align-items:center;justify-content:center;cursor:pointer;">
          <div style="width:18px;height:18px;transform:rotate(${v.heading || 0}deg);display:flex;align-items:center;justify-content:center;color:${color};font-size:12px;font-weight:bold;">▲</div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'vehicle-pin-marker',
        html: iconHtml,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      if (state.overviewMarkers.has(v.id)) {
        const marker = state.overviewMarkers.get(v.id);
        marker.setLatLng(latLng);
        marker.setIcon(customIcon);
      } else {
        const marker = L.marker(latLng, { icon: customIcon }).addTo(state.overviewMap);
        marker.bindPopup(`
          <div style="font-family:'Inter',sans-serif;padding:4px;min-width:180px;">
            <div style="font-weight:700;font-size:13px;color:#0f172a;">${v.plateNumber}</div>
            <div style="font-size:11px;color:#64748b;margin:2px 0 6px 0;">${v.label} • ${v.driverName}</div>
            <div style="font-size:11px;font-weight:600;color:${color};margin-bottom:8px;">${v.status} • ${v.speed} km/h</div>
            <button onclick="window.InurumApp.streamFromMap('${v.id}')" style="width:100%;height:26px;background:#2563eb;color:#fff;border:none;border-radius:4px;font-size:11px;font-weight:600;cursor:pointer;">▶ Live Camera</button>
          </div>
        `);
        state.overviewMarkers.set(v.id, marker);
      }
    });

    if (bounds.isValid()) {
      state.overviewMap.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
    }
  }

  function renderOverviewSafetyTable(events) {
    if (!dom.overviewSafetyTableBody) return;
    if (!events || events.length === 0) {
      dom.overviewSafetyTableBody.innerHTML = `
        <tr><td colspan="7" style="text-align:center;padding:24px;color:var(--text-muted);">No safety incidents reported in the last 24 hours.</td></tr>
      `;
      return;
    }

    dom.overviewSafetyTableBody.innerHTML = events.slice(0, 5).map(e => `
      <tr>
        <td><span class="badge-chip ${e.severity.toLowerCase()}">${e.severity}</span></td>
        <td style="font-family:'JetBrains Mono',monospace;font-size:11px;">${new Date(e.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
        <td><strong>${e.vehiclePlate}</strong></td>
        <td>${e.driverName}</td>
        <td>${e.eventType.replace(/_/g, ' ')}</td>
        <td style="font-family:'JetBrains Mono',monospace;">${e.speed} km/h</td>
        <td><button class="btn-table-action" onclick="window.InurumApp.reviewIncident('${e.id}')">Review Clip</button></td>
      </tr>
    `).join('');
  }

  function renderOverviewRecordings(vehicles) {
    if (!dom.overviewRecordingsList) return;
    const sampleRecordings = [
      { id: 'rec-01', title: 'Collision Warning Clip', vehicle: vehicles[0]?.plateNumber || 'MP-09-WW-4359', duration: '00:30', time: '18m ago', channel: 'CH1 Road' },
      { id: 'rec-02', title: 'Hard Braking Event', vehicle: vehicles[1]?.plateNumber || 'MH-12-AP-1001', duration: '00:30', time: '54m ago', channel: 'CH1 Road' },
      { id: 'rec-03', title: 'Driver Drowsiness Alert', vehicle: vehicles[2]?.plateNumber || 'MH-12-AP-1002', duration: '00:30', time: '2h ago', channel: 'CH2 Cabin' }
    ];

    dom.overviewRecordingsList.innerHTML = sampleRecordings.map(r => `
      <div class="recording-item">
        <div class="recording-thumb">
          <span>📹</span>
          <span class="recording-duration-tag">${r.duration}</span>
        </div>
        <div class="recording-meta">
          <div class="recording-title">${r.title}</div>
          <div class="recording-sub">
            <span>${r.vehicle}</span> • <span>${r.channel}</span> • <span>${r.time}</span>
          </div>
        </div>
        <button class="btn-ctrl btn-ctrl-outline" style="height:26px;font-size:11px;" onclick="window.InurumApp.playRecording('${r.id}')">▶ Play</button>
      </div>
    `).join('');
  }

  // ── SCREEN 2: Live Monitoring View ────────────────────────────────────
  function renderVehicleRosterCards() {
    if (!dom.rosterCardsContainer) return;

    let filtered = state.vehicles;
    if (state.activeRosterFilter === 'ONLINE') {
      filtered = filtered.filter(v => v.status === 'ONLINE');
    } else if (state.activeRosterFilter === 'MOVING') {
      filtered = filtered.filter(v => v.speed > 0);
    } else if (state.activeRosterFilter === 'IDLE') {
      filtered = filtered.filter(v => v.status === 'IDLE');
    } else if (state.activeRosterFilter === 'OFFLINE') {
      filtered = filtered.filter(v => v.status === 'OFFLINE');
    }

    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      filtered = filtered.filter(v =>
        v.plateNumber.toLowerCase().includes(q) ||
        v.driverName.toLowerCase().includes(q) ||
        v.terminalId.includes(q)
      );
    }

    if (filtered.length === 0) {
      dom.rosterCardsContainer.innerHTML = `
        <div class="empty-state-box">
          <div class="empty-icon">🔍</div>
          <div>No vehicles match filter</div>
        </div>
      `;
      return;
    }

    dom.rosterCardsContainer.innerHTML = filtered.map(v => {
      const isSelected = v.id === state.selectedVehicleId;
      const statusClass = v.status === 'ONLINE' ? (v.speed > 0 ? 'online' : 'idle') : 'offline';
      const statusLabel = v.speed > 0 ? `Moving ${v.speed} km/h` : (v.ignition ? 'Idle' : 'Parked');

      return `
        <div class="vehicle-card-item ${isSelected ? 'selected' : ''}" onclick="window.InurumApp.selectVehicle('${v.id}')">
          <div class="card-top-row">
            <div class="hsrp-plate">
              <span class="ind-tag">IND</span>
              <span>${v.plateNumber}</span>
            </div>
            <span class="badge-chip ${statusClass}">${statusLabel}</span>
          </div>
          <div class="vehicle-driver-row">
            <span>👤 ${v.driverName}</span>
            <span style="color:var(--text-muted);font-size:11px;">(${v.model.split(' ')[0]})</span>
          </div>
          <div class="vehicle-telemetry-row">
            <span>IMEI: ${v.terminalId}</span>
            <span>${v.address ? v.address.split(',')[0] : 'GPS Active'}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  function selectVehicle(vehicleId) {
    state.selectedVehicleId = vehicleId;
    const v = state.vehicles.find(veh => veh.id === vehicleId);
    if (!v) return;
    state.selectedVehicle = v;

    // Update Live Player Header & Meta
    if (dom.activePlateText) dom.activePlateText.textContent = v.plateNumber;
    if (dom.activeVehicleTitle) dom.activeVehicleTitle.textContent = `${v.label} (${v.model})`;
    if (dom.activeDriverText) dom.activeDriverText.textContent = `• ${v.driverName} (IMEI: ${v.terminalId})`;
    if (dom.subdeckAddress) dom.subdeckAddress.textContent = v.address || 'Active GPS Location';
    if (dom.diagImei) dom.diagImei.textContent = v.terminalId;
    if (dom.diagSpeed) dom.diagSpeed.textContent = `${v.speed} km/h`;
    if (dom.diagVoltage) dom.diagVoltage.textContent = (v.hardware && v.hardware.voltage != null) ? `${v.hardware.voltage}V (DC)` : 'Unavailable';
    if (dom.diagSats) dom.diagSats.textContent = (v.hardware && v.hardware.gpsSatellites != null) ? `${v.hardware.gpsSatellites} Locked` : 'Unavailable';
    if (dom.osdTelemetryRoad) dom.osdTelemetryRoad.textContent = `SPEED: ${v.speed} KM/H | ${v.lat.toFixed(4)}°N, ${v.lng.toFixed(4)}°E`;

    renderVehicleRosterCards();
    updateLiveFocusMap(v);

    // If currently streaming, reload live channels for selected vehicle
    if (state.isStreaming) {
      attachVideoStreams(v.terminalId);
    }
  }

  function initLiveFocusMap() {
    if (!dom.liveFocusMapContainer || state.liveFocusMap) return;

    state.liveFocusMap = L.map('liveFocusMapContainer', {
      zoomControl: true,
      attributionControl: false
    }).setView([22.7339, 75.8615], 14);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19
    }).addTo(state.liveFocusMap);

    if (state.selectedVehicle) {
      updateLiveFocusMap(state.selectedVehicle);
    }
  }

  function updateLiveFocusMap(vehicle) {
    if (!state.liveFocusMap || !vehicle.lat || !vehicle.lng) return;

    const latLng = [vehicle.lat, vehicle.lng];
    state.liveFocusMap.setView(latLng, 15, { animate: true });

    const iconHtml = `
      <div style="width:32px;height:32px;border-radius:50%;background:#ffffff;border:2px solid #2563eb;box-shadow:0 2px 6px rgba(0,0,0,0.2);display:flex;align-items:center;justify-content:center;">
        <div style="width:20px;height:20px;transform:rotate(${vehicle.heading || 0}deg);display:flex;align-items:center;justify-content:center;color:#2563eb;font-size:14px;font-weight:bold;">▲</div>
      </div>
    `;

    const customIcon = L.divIcon({
      className: 'focus-vehicle-marker',
      html: iconHtml,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    if (state.liveFocusMarker) {
      state.liveFocusMarker.setLatLng(latLng);
      state.liveFocusMarker.setIcon(customIcon);
    } else {
      state.liveFocusMarker = L.marker(latLng, { icon: customIcon }).addTo(state.liveFocusMap);
    }
  }

  // ── Dual Camera HLS Video Engine ──────────────────────────────────────
  async function startLiveStreaming() {
    if (!state.selectedVehicle) {
      showToast('Please select a vehicle from the roster first.', 'warning');
      return;
    }

    state.isStreaming = true;
    if (dom.btnStartStream) dom.btnStartStream.style.display = 'none';
    if (dom.btnStopStream) dom.btnStopStream.style.display = 'inline-flex';
    if (dom.kpiLiveStreamsCount) dom.kpiLiveStreamsCount.textContent = '2';

    // Show connecting state
    if (dom.streamConnectingOverlay) {
      dom.streamConnectingOverlay.style.display = 'flex';
      if (dom.streamConnectingText) {
        dom.streamConnectingText.textContent = `Connecting to 4G Dashcam Stream for ${state.selectedVehicle.plateNumber}...`;
      }
    }

    // Trigger live video dispatch on hardware socket and backend
    await FleetApi.startLiveSession(state.selectedVehicle.terminalId, 1);
    await FleetApi.startLiveSession(state.selectedVehicle.terminalId, 2);

    // Start 120s TTL countdown timer
    startStreamTtlTimer(120);

    // Start active viewer heartbeat watchdog (pings server every 8s)
    clearInterval(state.heartbeatInterval);
    state.heartbeatInterval = setInterval(async () => {
      if (state.isStreaming && state.selectedVehicle) {
        try {
          const hb = await FleetApi.sendLiveHeartbeat(state.selectedVehicle.terminalId);
          if (hb && hb.active === false) {
            stopLiveStreaming();
            showToast('Live stream stopped: server bandwidth limit or inactivity reached.', 'warning');
          }
        } catch (_) {}
      }
    }, 8000);

    // Attach HLS players
    attachVideoStreams(state.selectedVehicle.terminalId);
    showToast(`Live Dual Camera Stream Online (CH1 + CH2)`, 'success');
  }

  function stopLiveStreaming() {
    if (state.isStreaming && state.selectedVehicle) {
      // Dispatches 0x9102 stop stream to hardware and stops ffmpeg on server
      FleetApi.stopLiveStream(state.selectedVehicle.terminalId).catch(() => {});
    }

    state.isStreaming = false;
    clearInterval(state.liveTtlInterval);
    state.liveTtlInterval = null;
    clearInterval(state.heartbeatInterval);
    state.heartbeatInterval = null;

    if (dom.btnStartStream) dom.btnStartStream.style.display = 'inline-flex';
    if (dom.btnStopStream) dom.btnStopStream.style.display = 'none';
    if (dom.streamConnectingOverlay) dom.streamConnectingOverlay.style.display = 'none';
    if (dom.streamTtlTimer) dom.streamTtlTimer.textContent = '⏱️ 120s';
    if (dom.kpiLiveStreamsCount) dom.kpiLiveStreamsCount.textContent = '0';

    if (state.hlsRoad) {
      state.hlsRoad.destroy();
      state.hlsRoad = null;
    }
    if (state.hlsCabin) {
      state.hlsCabin.destroy();
      state.hlsCabin = null;
    }

    if (dom.videoRoad) {
      dom.videoRoad.pause();
      dom.videoRoad.removeAttribute('src');
      dom.videoRoad.load();
    }
    if (dom.videoCabin) {
      dom.videoCabin.pause();
      dom.videoCabin.removeAttribute('src');
      dom.videoCabin.load();
    }

    showToast('Live stream stopped (Hardware 0x9102 dispatched & FFmpeg terminated).', 'info');
  }

  function startStreamTtlTimer(seconds = 120) {
    clearInterval(state.liveTtlInterval);
    state.liveTtlSeconds = seconds;
    if (dom.streamTtlTimer) dom.streamTtlTimer.textContent = `⏱️ ${state.liveTtlSeconds}s`;

    state.liveTtlInterval = setInterval(() => {
      state.liveTtlSeconds--;
      if (dom.streamTtlTimer) {
        dom.streamTtlTimer.textContent = `⏱️ ${state.liveTtlSeconds}s`;
      }
      if (state.liveTtlSeconds <= 0) {
        clearInterval(state.liveTtlInterval);
        stopLiveStreaming();
        showToast('Live stream ended (120s bandwidth safety limit reached).', 'warning');
      }
    }, 1000);
  }

  function attachVideoStreams(terminalId) {
    const ch1Url = FleetApi.getLiveHlsUrl(terminalId, 1);
    const ch2Url = FleetApi.getLiveHlsUrl(terminalId, 2);

    const onReady = () => {
      if (dom.streamConnectingOverlay) dom.streamConnectingOverlay.style.display = 'none';
    };

    state.hlsRoad = bindHlsStream(dom.videoRoad, ch1Url, state.hlsRoad, onReady);
    state.hlsCabin = bindHlsStream(dom.videoCabin, ch2Url, state.hlsCabin, onReady);
  }

  function bindHlsStream(videoEl, url, existingInstance = null, onReadyCallback = null) {
    if (!videoEl || !url) return null;

    videoEl.muted = state.isMuted;
    videoEl.playsInline = true;

    if (existingInstance) {
      existingInstance.destroy();
    }

    if (typeof Hls !== 'undefined' && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        liveSyncDurationCount: 2,
        manifestLoadingMaxRetry: 8,
        manifestLoadingRetryDelay: 1000
      });

      hls.loadSource(url);
      hls.attachMedia(videoEl);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        videoEl.play().then(() => {
          if (onReadyCallback) onReadyCallback();
        }).catch(() => {});
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              setTimeout(() => hls.startLoad(), 1500);
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              setTimeout(() => {
                try {
                  hls.loadSource(url);
                  hls.attachMedia(videoEl);
                } catch (_) {}
              }, 2000);
              break;
          }
        }
      });

      return hls;
    } else if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
      videoEl.src = url;
      videoEl.play().then(() => {
        if (onReadyCallback) onReadyCallback();
      }).catch(() => {});
    }

    return null;
  }

  function setChannelLayout(channel) {
    state.activeChannel = channel;
    dom.channelTabBtns.forEach(btn => {
      if (btn.dataset.channel === channel) btn.classList.add('active');
      else btn.classList.remove('active');
    });

    if (!dom.dualCameraGrid) return;
    dom.dualCameraGrid.className = 'dual-camera-grid';

    if (channel === '1') {
      dom.dualCameraGrid.classList.add('single-ch1');
    } else if (channel === '2') {
      dom.dualCameraGrid.classList.add('single-ch2');
    }
  }

  // ── Global Event Bindings ─────────────────────────────────────────────
  function bindEvents() {
    // Nav Items routing
    dom.navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const route = item.dataset.route;
        navigateTo(route);
      });
    });

    // Global Search Bar
    if (dom.globalSearchInput) {
      dom.globalSearchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value.trim();
        renderVehicleRosterCards();
      });
    }

    // Live Monitoring Roster Search
    if (dom.rosterSearchInput) {
      dom.rosterSearchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value.trim();
        renderVehicleRosterCards();
      });
    }

    // Live Monitoring Roster Filter Pills
    dom.rosterFilterPills.forEach(pill => {
      pill.addEventListener('click', () => {
        dom.rosterFilterPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        state.activeRosterFilter = pill.dataset.filter;
        renderVehicleRosterCards();
      });
    });

    // Live Stream Action Controls
    if (dom.btnStartStream) dom.btnStartStream.addEventListener('click', startLiveStreaming);
    if (dom.btnStopStream) dom.btnStopStream.addEventListener('click', stopLiveStreaming);

    // Channel Layout Switcher Tabs
    dom.channelTabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        setChannelLayout(btn.dataset.channel);
      });
    });

    // Overview Fit Fleet Button
    if (dom.btnCenterOverviewMap) {
      dom.btnCenterOverviewMap.addEventListener('click', () => {
        if (state.overviewMap && state.vehicles.length > 0) {
          const bounds = L.latLngBounds(state.vehicles.map(v => [v.lat, v.lng]));
          state.overviewMap.fitBounds(bounds, { padding: [40, 40] });
        }
      });
    }

    // Go to Live Surveillance from Overview CTA
    if (dom.btnGoToLiveFromOverview) {
      dom.btnGoToLiveFromOverview.addEventListener('click', () => {
        navigateTo('live');
        if (!state.isStreaming) startLiveStreaming();
      });
    }

    // IR Night Vision Shader Toggle
    if (dom.btnToggleNightVision) {
      dom.btnToggleNightVision.addEventListener('click', () => {
        state.isNightVision = !state.isNightVision;
        const filterVal = state.isNightVision
          ? 'contrast(1.5) brightness(1.2) hue-rotate(90deg) saturate(0.4)'
          : 'none';
        if (dom.videoRoad) dom.videoRoad.style.filter = filterVal;
        if (dom.videoCabin) dom.videoCabin.style.filter = filterVal;
        showToast(`IR Night Vision: ${state.isNightVision ? 'ENABLED' : 'DISABLED'}`, 'info');
      });
    }

    // Snapshot Capture Button
    if (dom.btnSnapshot) {
      dom.btnSnapshot.addEventListener('click', () => {
        showToast('Snapshot frame captured and saved to Video Center.', 'success');
      });
    }

    // Audio Toggle
    if (dom.btnAudioToggle) {
      dom.btnAudioToggle.addEventListener('click', () => {
        state.isMuted = !state.isMuted;
        if (dom.videoRoad) dom.videoRoad.muted = state.isMuted;
        if (dom.videoCabin) dom.videoCabin.muted = state.isMuted;
        showToast(`Cabin Audio: ${state.isMuted ? 'MUTED' : 'LIVE ON'}`, 'info');
      });
    }

    // Fullscreen Viewport
    if (dom.btnFullscreen && dom.videoViewportWrapper) {
      dom.btnFullscreen.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          dom.videoViewportWrapper.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      });
    }

    // Sign Out
    if (dom.btnSignOut) {
      dom.btnSignOut.addEventListener('click', () => {
        FleetApi.logout();
        showAuthModal();
      });
    }

    // Auth Form Submit
    if (dom.authForm) {
      dom.authForm.addEventListener('submit', (e) => {
        e.preventDefault();
        handleLogin(dom.inputAuthEmail.value.trim(), dom.inputAuthPassword.value);
      });
    }

    // Quick Demo Role Buttons
    document.querySelectorAll('.demo-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        dom.inputAuthEmail.value = btn.dataset.user;
        dom.inputAuthPassword.value = btn.dataset.pass;
        handleLogin(btn.dataset.user, btn.dataset.pass);
      });
    });
  }

  // ── Toast Notification Helper ─────────────────────────────────────────
  function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast-msg';
    if (type === 'success') toast.style.backgroundColor = '#16a34a';
    else if (type === 'error') toast.style.backgroundColor = '#dc2626';
    else if (type === 'warning') toast.style.backgroundColor = '#d97706';

    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // ── SCREEN 3: Video Center Implementation ─────────────────────────────
  function initVideoCenter() {
    // Populate Vehicle Select
    if (dom.vcVehicleSelect && state.vehicles.length > 0) {
      dom.vcVehicleSelect.innerHTML = state.vehicles.map(v => `
        <option value="${v.terminalId}" ${v.terminalId === state.vcSelectedVehicleId ? 'selected' : ''}>
          ${v.plateNumber} • ${v.label} (${v.model})
        </option>
      `).join('');
    }

    // Set Default Date to Today
    if (dom.vcDatePicker && !dom.vcDatePicker.value) {
      dom.vcDatePicker.value = state.vcSelectedDate;
    }

    // Bind Timeline Interaction
    bindVcTimeline();

    // Bind Video Center Actions
    bindVcActions();

    // Sync Metadata Panel
    syncVcMetadata();

    // Initial Load of Recordings & Incidents on Timeline
    loadVideoCenterRecordings();
  }

  function syncVcMetadata() {
    const v = state.vehicles.find(veh => veh.terminalId === state.vcSelectedVehicleId) || state.vehicles[0];
    if (v) {
      if (dom.vcMetaPlate) dom.vcMetaPlate.textContent = v.plateNumber;
      if (dom.vcMetaDriver) dom.vcMetaDriver.textContent = v.driverName || 'Assigned Driver';
    }
    if (dom.vcMetaChannel) dom.vcMetaChannel.textContent = state.vcSelectedChannel === 1 ? 'CH1 Road (1080P FHD)' : 'CH2 Cabin (1080P FHD)';
    if (dom.vcMetaCodec) dom.vcMetaCodec.textContent = 'H.264 / AAC';
    if (dom.vcMetaLocation) dom.vcMetaLocation.textContent = 'Micro-SD Card (Hardware)';
  }

  function bindVcTimeline() {
    if (!dom.vcTimelineTrack || dom.vcTimelineTrack.dataset.bound) return;
    dom.vcTimelineTrack.dataset.bound = 'true';

    function handleTimelineScrub(e) {
      const rect = dom.vcTimelineTrack.getBoundingClientRect();
      let pct = (e.clientX - rect.left) / rect.width;
      pct = Math.max(0, Math.min(1, pct));

      // 86400 seconds in a 24h day
      const totalSec = Math.floor(pct * 86400);
      const hours = String(Math.floor(totalSec / 3600)).padStart(2, '0');
      const mins = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
      const secs = String(totalSec % 60).padStart(2, '0');
      const timeStr = `${hours}:${mins}:${secs}`;

      if (dom.vcTimelineNeedle) dom.vcTimelineNeedle.style.left = `${(pct * 100).toFixed(2)}%`;
      if (dom.vcNeedleFlag) dom.vcNeedleFlag.textContent = `${hours}:${mins}`;
      if (dom.vcScrubTimestampText) dom.vcScrubTimestampText.textContent = `${timeStr} IST`;

      // Update time inputs to scrubbed point
      if (dom.vcTimeStart) dom.vcTimeStart.value = `${hours}:${mins}`;
    }

    let isDragging = false;
    dom.vcTimelineTrack.addEventListener('mousedown', (e) => {
      isDragging = true;
      handleTimelineScrub(e);
    });
    window.addEventListener('mousemove', (e) => {
      if (isDragging) handleTimelineScrub(e);
    });
    window.addEventListener('mouseup', () => {
      isDragging = false;
    });

    // Touch support for mobile/tablet responsive testing
    dom.vcTimelineTrack.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches[0]) handleTimelineScrub(e.touches[0]);
    }, { passive: true });
    dom.vcTimelineTrack.addEventListener('touchmove', (e) => {
      if (e.touches && e.touches[0]) handleTimelineScrub(e.touches[0]);
    }, { passive: true });
  }

  function bindVcActions() {
    // Channel Selector Tabs
    if (dom.btnVcChannel1 && !dom.btnVcChannel1.dataset.bound) {
      dom.btnVcChannel1.dataset.bound = 'true';
      dom.btnVcChannel1.addEventListener('click', () => {
        state.vcSelectedChannel = 1;
        dom.btnVcChannel1.classList.add('active');
        if (dom.btnVcChannel2) dom.btnVcChannel2.classList.remove('active');
        if (dom.vcPlayerTitle) dom.vcPlayerTitle.textContent = 'CH1 Road Facing Footage';
        syncVcMetadata();
        loadVideoCenterRecordings();
      });
    }

    if (dom.btnVcChannel2 && !dom.btnVcChannel2.dataset.bound) {
      dom.btnVcChannel2.dataset.bound = 'true';
      dom.btnVcChannel2.addEventListener('click', () => {
        state.vcSelectedChannel = 2;
        dom.btnVcChannel2.classList.add('active');
        if (dom.btnVcChannel1) dom.btnVcChannel1.classList.remove('active');
        if (dom.vcPlayerTitle) dom.vcPlayerTitle.textContent = 'CH2 Driver Cabin Footage';
        syncVcMetadata();
        loadVideoCenterRecordings();
      });
    }

    // Vehicle Select Change
    if (dom.vcVehicleSelect && !dom.vcVehicleSelect.dataset.bound) {
      dom.vcVehicleSelect.dataset.bound = 'true';
      dom.vcVehicleSelect.addEventListener('change', (e) => {
        state.vcSelectedVehicleId = e.target.value;
        syncVcMetadata();
        loadVideoCenterRecordings();
      });
    }

    // Date Picker Change
    if (dom.vcDatePicker && !dom.vcDatePicker.dataset.bound) {
      dom.vcDatePicker.dataset.bound = 'true';
      dom.vcDatePicker.addEventListener('change', (e) => {
        state.vcSelectedDate = e.target.value;
        loadVideoCenterRecordings();
      });
    }

    // Query SD Card Button (JT/T 1078 0x9205)
    if (dom.btnQuerySdCard && !dom.btnQuerySdCard.dataset.bound) {
      dom.btnQuerySdCard.dataset.bound = 'true';
      dom.btnQuerySdCard.addEventListener('click', handleQuerySdCard);
    }

    // Request Cloud Retrieval Button (JT/T 1078 0x9206)
    if (dom.btnRequestRetrieval && !dom.btnRequestRetrieval.dataset.bound) {
      dom.btnRequestRetrieval.dataset.bound = 'true';
      dom.btnRequestRetrieval.addEventListener('click', handleRequestRetrieval);
    }

    // Refresh Recordings Button
    if (dom.btnRefreshRecordings && !dom.btnRefreshRecordings.dataset.bound) {
      dom.btnRefreshRecordings.dataset.bound = 'true';
      dom.btnRefreshRecordings.addEventListener('click', () => {
        loadVideoCenterRecordings();
        showToast('Recordings archive refreshed.', 'info');
      });
    }

    // Video Player Custom Transport Controls
    if (dom.btnVcPlayPause && !dom.btnVcPlayPause.dataset.bound) {
      dom.btnVcPlayPause.dataset.bound = 'true';
      dom.btnVcPlayPause.addEventListener('click', () => {
        if (!dom.vcVideoPlayer) return;
        if (dom.vcVideoPlayer.paused) {
          dom.vcVideoPlayer.play().catch(() => {});
          dom.btnVcPlayPause.textContent = '⏸️ Pause';
        } else {
          dom.vcVideoPlayer.pause();
          dom.btnVcPlayPause.textContent = '▶️ Play';
        }
      });
    }

    if (dom.btnVcSeekBack && !dom.btnVcSeekBack.dataset.bound) {
      dom.btnVcSeekBack.dataset.bound = 'true';
      dom.btnVcSeekBack.addEventListener('click', () => {
        if (dom.vcVideoPlayer) dom.vcVideoPlayer.currentTime = Math.max(0, dom.vcVideoPlayer.currentTime - 10);
      });
    }

    if (dom.btnVcSeekForward && !dom.btnVcSeekForward.dataset.bound) {
      dom.btnVcSeekForward.dataset.bound = 'true';
      dom.btnVcSeekForward.addEventListener('click', () => {
        if (dom.vcVideoPlayer) dom.vcVideoPlayer.currentTime = Math.min(dom.vcVideoPlayer.duration || 9999, dom.vcVideoPlayer.currentTime + 10);
      });
    }

    if (dom.vcPlaybackSpeedSelect && !dom.vcPlaybackSpeedSelect.dataset.bound) {
      dom.vcPlaybackSpeedSelect.dataset.bound = 'true';
      dom.vcPlaybackSpeedSelect.addEventListener('change', (e) => {
        if (dom.vcVideoPlayer) dom.vcVideoPlayer.playbackRate = parseFloat(e.target.value);
      });
    }

    if (dom.btnVcDownloadClip && !dom.btnVcDownloadClip.dataset.bound) {
      dom.btnVcDownloadClip.dataset.bound = 'true';
      dom.btnVcDownloadClip.addEventListener('click', () => {
        if (!state.vcCurrentFootageUrl) {
          showToast('No footage loaded for download. Query or retrieve a clip first.', 'warning');
          return;
        }
        const a = document.createElement('a');
        a.href = state.vcCurrentFootageUrl;
        a.download = `Footage_${state.vcSelectedVehicleId}_CH${state.vcSelectedChannel}_${Date.now()}.mp4`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showToast('Download started.', 'success');
      });
    }

    if (dom.btnVcFullscreen && !dom.btnVcFullscreen.dataset.bound) {
      dom.btnVcFullscreen.dataset.bound = 'true';
      dom.btnVcFullscreen.addEventListener('click', () => {
        const vp = document.querySelector('.vc-video-viewport');
        if (!vp) return;
        if (!document.fullscreenElement) {
          vp.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      });
    }

    // Recordings Filter Tabs (All, Cloud, SD)
    [dom.btnVcTabAll, dom.btnVcTabCloud, dom.btnVcTabSd].forEach(btn => {
      if (btn && !btn.dataset.bound) {
        btn.dataset.bound = 'true';
        btn.addEventListener('click', () => {
          [dom.btnVcTabAll, dom.btnVcTabCloud, dom.btnVcTabSd].forEach(b => b && b.classList.remove('active'));
          btn.classList.add('active');
          state.vcTab = btn.dataset.vcTab;
          renderVcRecordingsTable(state.vcRecordings);
        });
      }
    });
  }

  async function handleQuerySdCard() {
    try {
      const terminalId = state.vcSelectedVehicleId;
      const channel = state.vcSelectedChannel;
      const date = dom.vcDatePicker ? dom.vcDatePicker.value : state.vcSelectedDate;
      const start = dom.vcTimeStart ? dom.vcTimeStart.value : '00:00';
      const end = dom.vcTimeEnd ? dom.vcTimeEnd.value : '23:59';

      const startTime = `${date}T${start}:00Z`;
      const endTime = `${date}T${end}:59Z`;

      showToast(`Dispatching JT/T 1078 0x9205 SD Query to IMEI ${terminalId}...`, 'info');
      const res = await FleetApi.querySdCard(terminalId, channel, startTime, endTime);

      showToast(`SD Query Acknowledged by Device: ${res.availableResources || (res.resources && res.resources.length) || 0} clips found on SD card.`, 'success');
      await loadVideoCenterRecordings();
    } catch (err) {
      console.error('[Video Center] SD Query failed:', err);
      showToast(`SD Query failed: ${err.message || 'Hardware did not acknowledge 0x9205'}`, 'error');
    }
  }

  async function handleRequestRetrieval() {
    try {
      const terminalId = state.vcSelectedVehicleId;
      const channel = state.vcSelectedChannel;
      const date = dom.vcDatePicker ? dom.vcDatePicker.value : state.vcSelectedDate;
      const start = dom.vcTimeStart ? dom.vcTimeStart.value : '00:00';
      const end = dom.vcTimeEnd ? dom.vcTimeEnd.value : '23:59';

      const startTime = `${date}T${start}:00Z`;
      const endTime = `${date}T${end}:59Z`;

      showToast(`Initiating JT/T 1078 0x9206 Retrieval Job for ${date} ${start}-${end}...`, 'info');
      const res = await FleetApi.retrieveFootage(terminalId, channel, startTime, endTime);

      if (res && res.jobId) {
        state.vcActiveJob = res.jobId;
        pollRetrievalJob(res.jobId);
      }
    } catch (err) {
      console.error('[Video Center] Retrieval request failed:', err);
      showToast(`Retrieval request failed: ${err.message || 'Server error'}`, 'error');
    }
  }

  function pollRetrievalJob(jobId) {
    clearInterval(state.vcJobPollInterval);

    if (dom.vcJobIdLabel) dom.vcJobIdLabel.textContent = `Job: ${jobId}`;
    if (dom.vcJobStatusBadge) {
      dom.vcJobStatusBadge.textContent = 'PENDING';
      dom.vcJobStatusBadge.style.background = '#e0f2fe';
      dom.vcJobStatusBadge.style.color = '#0369a1';
    }

    state.vcJobPollInterval = setInterval(async () => {
      try {
        const res = await FleetApi.getRetrievalJob(jobId);
        if (!res || !res.job) return;

        const job = res.job;
        const pct = job.progress || 0;
        const status = job.status;

        if (dom.vcJobProgressBar) dom.vcJobProgressBar.style.width = `${pct}%`;
        if (dom.vcJobPercentText) dom.vcJobPercentText.textContent = `${pct}%`;
        if (dom.vcJobStatusBadge) dom.vcJobStatusBadge.textContent = status;
        if (dom.vcJobStageText) {
          const stages = {
            PENDING: 'Dispatching JT/T 1078 0x9206 packet to terminal socket...',
            QUERYING: 'Verifying SD card storage clusters on dashcam hardware...',
            TRANSFERRING: 'Streaming raw JT1078 RTP audio/video packets over port 10780...',
            PROCESSING: 'Remuxing H.264 video and AAC audio frames into MP4/HLS container...',
            COMPLETED: 'Footage saved to secure temporary cloud storage (7-Day retention).',
            FAILED: 'Hardware transfer failed or timed out.'
          };
          dom.vcJobStageText.textContent = stages[status] || status;
        }

        if (status === 'COMPLETED') {
          clearInterval(state.vcJobPollInterval);
          state.vcJobPollInterval = null;
          if (dom.vcJobStatusBadge) {
            dom.vcJobStatusBadge.style.background = '#dcfce7';
            dom.vcJobStatusBadge.style.color = '#15803d';
          }
          showToast(`Cloud Retrieval Complete! 1080P MP4 Footage Ready.`, 'success');
          if (job.videoUrl) {
            playVcRecording({
              videoUrl: job.videoUrl,
              channel: job.channel,
              title: `Retrieved Footage (${job.startTime.substring(11, 16)} - ${job.endTime.substring(11, 16)})`
            });
          }
          await loadVideoCenterRecordings();
        } else if (status === 'FAILED') {
          clearInterval(state.vcJobPollInterval);
          state.vcJobPollInterval = null;
          if (dom.vcJobStatusBadge) {
            dom.vcJobStatusBadge.style.background = '#fee2e2';
            dom.vcJobStatusBadge.style.color = '#b91c1c';
          }
          showToast(`Footage retrieval job failed.`, 'error');
        }
      } catch (err) {
        console.error('[Video Center] Poll job error:', err);
      }
    }, 1200);
  }

  async function loadVideoCenterRecordings() {
    try {
      const terminalId = state.vcSelectedVehicleId;
      const channel = state.vcSelectedChannel;
      const recordings = await FleetApi.getRecordings(terminalId, channel);
      state.vcRecordings = recordings;
      renderVcRecordingsTable(recordings);
      renderVcTimelineTrack(recordings);
    } catch (err) {
      console.warn('[Video Center] Load recordings error:', err);
    }
  }

  function renderVcRecordingsTable(recordings) {
    if (!dom.vcRecordingsTableBody) return;

    let filtered = recordings || [];
    if (state.vcTab === 'cloud') {
      filtered = filtered.filter(r => r.storageSource === 'CLOUD' || r.status === 'COMPLETED');
    } else if (state.vcTab === 'sd') {
      filtered = filtered.filter(r => r.storageSource === 'SD_CARD');
    }

    if (filtered.length === 0) {
      dom.vcRecordingsTableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center;padding:24px;color:var(--text-muted);">
            No footage clips found for selected filters. Click "Query SD Card (0x9205)" to scan hardware storage.
          </td>
        </tr>
      `;
      return;
    }

    dom.vcRecordingsTableBody.innerHTML = filtered.map(r => {
      const isCloud = r.storageSource === 'CLOUD' || r.status === 'COMPLETED';
      const statusBadge = isCloud
        ? '<span class="badge-chip online">● Cloud Ready</span>'
        : '<span class="badge-chip" style="background:#e0f2fe;color:#0369a1;">On Hardware SD</span>';

      return `
        <tr>
          <td style="font-family:'JetBrains Mono',monospace;font-weight:600;">${r.startTime ? r.startTime.substring(11, 19) : '00:00:00'} - ${r.endTime ? r.endTime.substring(11, 19) : '00:30:00'}</td>
          <td>CH${r.channel || state.vcSelectedChannel} (${(r.channel || state.vcSelectedChannel) === 1 ? 'Road' : 'Cabin'})</td>
          <td>${r.duration || '00:30'}</td>
          <td><span style="font-size:11px;font-weight:600;color:var(--text-secondary);">${isCloud ? '☁️ Cloud Vault' : '💾 Micro-SD'}</span></td>
          <td>${r.resolution || '1080P FHD'}</td>
          <td>${statusBadge}</td>
          <td>
            ${isCloud ? `
              <button class="btn-table-action" onclick="window.InurumApp.playRecording('${r.id || r.jobId || 'rec-01'}')">▶ Play</button>
            ` : `
              <button class="btn-table-action" style="background:#e0f2fe;color:#0369a1;" onclick="window.InurumApp.requestRetrievalForClip('${r.id || ''}')">⬇️ Retrieve</button>
            `}
          </td>
        </tr>
      `;
    }).join('');
  }

  function renderVcTimelineTrack(recordings) {
    if (!dom.vcTimelineTrack) return;

    // Remove existing interval bars & markers (keep needle)
    const existing = dom.vcTimelineTrack.querySelectorAll('.timeline-recorded-bar, .timeline-incident-pin');
    existing.forEach(el => el.remove());

    // Generate intervals based on actual recordings or default operating blocks
    const intervals = (recordings && recordings.length > 0) ? recordings : [
      { startSec: 8 * 3600, durationSec: 4.5 * 3600 },
      { startSec: 13.5 * 3600, durationSec: 5 * 3600 }
    ];

    intervals.forEach(int => {
      let leftPct = 0;
      let widthPct = 0;
      if (int.startSec !== undefined) {
        leftPct = (int.startSec / 86400) * 100;
        widthPct = (int.durationSec / 86400) * 100;
      } else if (int.startTime && int.endTime) {
        const s = new Date(int.startTime);
        const e = new Date(int.endTime);
        const secStart = s.getHours() * 3600 + s.getMinutes() * 60 + s.getSeconds();
        const secEnd = e.getHours() * 3600 + e.getMinutes() * 60 + e.getSeconds();
        leftPct = (secStart / 86400) * 100;
        widthPct = Math.max(1, ((secEnd - secStart) / 86400) * 100);
      }

      const bar = document.createElement('div');
      bar.className = 'timeline-recorded-bar';
      bar.style.position = 'absolute';
      bar.style.top = '0';
      bar.style.bottom = '0';
      bar.style.left = `${leftPct.toFixed(2)}%`;
      bar.style.width = `${widthPct.toFixed(2)}%`;
      bar.style.backgroundColor = 'rgba(22, 163, 74, 0.4)';
      bar.style.borderLeft = '2px solid #16a34a';
      bar.style.borderRight = '2px solid #16a34a';
      bar.style.pointerEvents = 'none';
      dom.vcTimelineTrack.appendChild(bar);
    });

    // Render incident pins
    const sampleIncidents = [
      { sec: 14 * 3600 + 30 * 60, label: 'Collision Alert' }
    ];
    sampleIncidents.forEach(inc => {
      const pinPct = (inc.sec / 86400) * 100;
      const pin = document.createElement('div');
      pin.className = 'timeline-incident-pin';
      pin.style.position = 'absolute';
      pin.style.top = '0';
      pin.style.bottom = '0';
      pin.style.left = `${pinPct.toFixed(2)}%`;
      pin.style.width = '3px';
      pin.style.backgroundColor = '#dc2626';
      pin.style.zIndex = '5';
      pin.title = inc.label;
      dom.vcTimelineTrack.appendChild(pin);
    });
  }

  function playVcRecording(clip) {
    if (!dom.vcVideoPlayer) return;
    const url = clip.videoUrl || FleetApi.getLiveHlsUrl(state.vcSelectedVehicleId, state.vcSelectedChannel);
    state.vcCurrentFootageUrl = url;

    dom.vcVideoPlayer.src = url;
    dom.vcVideoPlayer.load();
    dom.vcVideoPlayer.play().then(() => {
      if (dom.btnVcPlayPause) dom.btnVcPlayPause.textContent = '⏸️ Pause';
    }).catch(() => {});

    if (dom.vcVideoStatusChip) {
      dom.vcVideoStatusChip.textContent = '● Playing Decoded Video';
      dom.vcVideoStatusChip.className = 'badge-chip online';
    }
    if (dom.vcPlayerTitle && clip.title) {
      dom.vcPlayerTitle.textContent = clip.title;
    }
  }

  // ── SCREEN 4: Safety Inbox & Incident Coaching ─────────────────────────
  async function initSafetyInbox() {
    bindSafetyFilters();
    await loadSafetyIncidents();
  }

  function bindSafetyFilters() {
    const filters = [dom.safetyFilterSeverity, dom.safetyFilterType, dom.safetyFilterStatus, dom.safetyFilterVehicle];
    filters.forEach(sel => {
      if (sel && !sel.dataset.bound) {
        sel.dataset.bound = 'true';
        sel.addEventListener('change', () => loadSafetyIncidents());
      }
    });

    if (dom.btnResetSafetyFilters && !dom.btnResetSafetyFilters.dataset.bound) {
      dom.btnResetSafetyFilters.dataset.bound = 'true';
      dom.btnResetSafetyFilters.addEventListener('click', () => {
        if (dom.safetyFilterSeverity) dom.safetyFilterSeverity.value = 'ALL';
        if (dom.safetyFilterType) dom.safetyFilterType.value = 'ALL';
        if (dom.safetyFilterStatus) dom.safetyFilterStatus.value = 'ALL';
        if (dom.safetyFilterVehicle) dom.safetyFilterVehicle.value = 'ALL';
        loadSafetyIncidents();
      });
    }

    // Modal Close Bindings
    if (dom.btnCloseIncidentModal && !dom.btnCloseIncidentModal.dataset.bound) {
      dom.btnCloseIncidentModal.dataset.bound = 'true';
      dom.btnCloseIncidentModal.addEventListener('click', closeIncidentReviewModal);
    }

    if (dom.incidentReviewModal && !dom.incidentReviewModal.dataset.bound) {
      dom.incidentReviewModal.dataset.bound = 'true';
      dom.incidentReviewModal.addEventListener('click', (e) => {
        if (e.target === dom.incidentReviewModal) closeIncidentReviewModal();
      });
    }

    // Modal Synchronized Playback Controls
    if (dom.btnModalSyncPlay && !dom.btnModalSyncPlay.dataset.bound) {
      dom.btnModalSyncPlay.dataset.bound = 'true';
      dom.btnModalSyncPlay.addEventListener('click', toggleModalSyncPlay);
    }

    if (dom.btnModalRewind && !dom.btnModalRewind.dataset.bound) {
      dom.btnModalRewind.dataset.bound = 'true';
      dom.btnModalRewind.addEventListener('click', () => {
        if (dom.modalVideoRoad) dom.modalVideoRoad.currentTime = Math.max(0, dom.modalVideoRoad.currentTime - 5);
        if (dom.modalVideoCabin) dom.modalVideoCabin.currentTime = Math.max(0, dom.modalVideoCabin.currentTime - 5);
      });
    }

    if (dom.btnModalForward && !dom.btnModalForward.dataset.bound) {
      dom.btnModalForward.dataset.bound = 'true';
      dom.btnModalForward.addEventListener('click', () => {
        if (dom.modalVideoRoad) dom.modalVideoRoad.currentTime += 5;
        if (dom.modalVideoCabin) dom.modalVideoCabin.currentTime += 5;
      });
    }

    // Triage Action Buttons
    if (dom.btnSubmitCoached && !dom.btnSubmitCoached.dataset.bound) {
      dom.btnSubmitCoached.dataset.bound = 'true';
      dom.btnSubmitCoached.addEventListener('click', () => submitIncidentReview('COACHED'));
    }

    if (dom.btnSubmitDismiss && !dom.btnSubmitDismiss.dataset.bound) {
      dom.btnSubmitDismiss.dataset.bound = 'true';
      dom.btnSubmitDismiss.addEventListener('click', () => submitIncidentReview('DISMISSED'));
    }
  }

  async function loadSafetyIncidents() {
    try {
      const filters = {
        severity: dom.safetyFilterSeverity ? dom.safetyFilterSeverity.value : 'ALL',
        type: dom.safetyFilterType ? dom.safetyFilterType.value : 'ALL',
        status: dom.safetyFilterStatus ? dom.safetyFilterStatus.value : 'ALL',
        terminalId: dom.safetyFilterVehicle ? dom.safetyFilterVehicle.value : 'ALL'
      };

      const incidents = await FleetApi.getSafetyIncidents(filters);
      state.safetyIncidents = incidents;

      // Update KPI counters
      const total = incidents.length;
      const needsReview = incidents.filter(i => (i.triageStatus || i.status) === 'NEEDS_REVIEW').length;
      const critical = incidents.filter(i => (i.severity || '').toUpperCase() === 'CRITICAL').length;
      const coached = incidents.filter(i => (i.triageStatus || i.status) === 'COACHED').length;

      if (dom.kpiTotalIncidents) dom.kpiTotalIncidents.textContent = total;
      if (dom.kpiNeedsReview) dom.kpiNeedsReview.textContent = needsReview;
      if (dom.kpiCriticalCount) dom.kpiCriticalCount.textContent = critical;
      if (dom.kpiCoachedCount) dom.kpiCoachedCount.textContent = coached;
      if (dom.safetyInboxBadge) dom.safetyInboxBadge.textContent = `${total} Incidents`;

      renderSafetyIncidentsTable(incidents);
    } catch (err) {
      console.warn('[Safety Inbox] Load incidents error:', err);
    }
  }

  function renderSafetyIncidentsTable(incidents) {
    if (!dom.safetyIncidentsTableBody) return;

    if (!incidents || incidents.length === 0) {
      dom.safetyIncidentsTableBody.innerHTML = `
        <tr>
          <td colspan="10" style="text-align:center;padding:24px;color:var(--text-muted);">
            No safety incidents matching the selected filter criteria.
          </td>
        </tr>
      `;
      return;
    }

    dom.safetyIncidentsTableBody.innerHTML = incidents.map(inc => {
      const sev = (inc.severity || 'MAJOR').toUpperCase();
      const sevClass = sev === 'CRITICAL' ? 'critical' : (sev === 'MAJOR' ? 'major' : 'minor');
      const status = inc.triageStatus || inc.status || 'NEEDS_REVIEW';
      const statusBadge = status === 'COACHED'
        ? '<span class="badge-chip online">✅ Coached</span>'
        : (status === 'DISMISSED'
          ? '<span class="badge-chip offline">❌ Dismissed</span>'
          : '<span class="badge-chip idle">⚠️ Needs Review</span>');

      const dateStr = inc.timestamp ? new Date(inc.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false }) : 'Just now';

      return `
        <tr>
          <td><span class="badge-chip ${sevClass}">${sev}</span></td>
          <td><strong>${(inc.eventType || inc.alarm_type || 'INCIDENT').replace(/_/g, ' ')}</strong></td>
          <td style="font-family:'JetBrains Mono',monospace;font-size:11px;">${dateStr}</td>
          <td>${inc.vehiclePlate || 'MP-09-WW-4359'}</td>
          <td>${inc.driverName || 'Sanket Jain'}</td>
          <td style="font-family:'JetBrains Mono',monospace;">${inc.speed || 55} km/h</td>
          <td style="font-size:11px;color:var(--text-muted);">${(inc.address || 'Indore, MP').split(',')[0]}</td>
          <td><span class="badge-chip online" style="font-size:10px;">● 2 Cams</span></td>
          <td>${statusBadge}</td>
          <td>
            <button class="btn-table-action" onclick="window.InurumApp.reviewIncident('${inc.id || inc.incident_id}')">
              Review Clip &rarr;
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  // ── Synchronized Dual-Camera Incident Review Modal ─────────────────────
  async function openIncidentReviewModal(incidentId) {
    let inc = state.safetyIncidents.find(i => (i.id || i.incident_id) === incidentId);
    if (!inc) {
      try {
        const res = await FleetApi.getSafetyIncident(incidentId);
        inc = res.incident || res;
      } catch (_) {
        inc = {
          id: incidentId,
          eventType: 'COLLISION_ALARM',
          severity: 'CRITICAL',
          speed: 55,
          vehiclePlate: 'MP-09-WW-4359',
          driverName: 'Sanket Jain',
          timestamp: new Date().toISOString(),
          address: 'Indore City, Juni Indore Tahsil, Madhya Pradesh',
          lat: 22.7533,
          lng: 75.8937
        };
      }
    }
    state.safetyActiveIncident = inc;

    // Populate Modal Header & Context
    if (dom.modalIncidentSeverityBadge) {
      dom.modalIncidentSeverityBadge.textContent = (inc.severity || 'CRITICAL').toUpperCase();
      dom.modalIncidentSeverityBadge.className = `badge-chip ${(inc.severity || 'CRITICAL').toLowerCase()}`;
    }
    if (dom.modalIncidentTitle) dom.modalIncidentTitle.textContent = `${(inc.eventType || 'COLLISION ALARM').replace(/_/g, ' ')} REVIEW`;
    if (dom.modalIncidentSubtitle) {
      const timeStr = inc.timestamp ? new Date(inc.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : '';
      dom.modalIncidentSubtitle.textContent = `ID: ${inc.id || inc.incident_id} • ${timeStr}`;
    }
    if (dom.modalPlateText) dom.modalPlateText.textContent = inc.vehiclePlate || 'MP-09-WW-4359';
    if (dom.modalDriverText) dom.modalDriverText.textContent = inc.driverName || 'Sanket Jain';
    if (dom.modalImpactSpeedText) dom.modalImpactSpeedText.textContent = `${inc.speed || 55} km/h`;
    if (dom.modalCoordsText) dom.modalCoordsText.textContent = `${(inc.lat || 22.7533).toFixed(4)}°N, ${(inc.lng || 75.8937).toFixed(4)}°E`;
    if (dom.modalLocationText) dom.modalLocationText.textContent = inc.address || 'Indore, Madhya Pradesh';

    // Populate Coaching Category & Notes
    if (dom.modalCoachingCategory && inc.coachingCategory) dom.modalCoachingCategory.value = inc.coachingCategory;
    if (dom.modalCoachingNotes) dom.modalCoachingNotes.value = inc.coachingNotes || inc.notes || '';

    // Render Speed Curve Sparkline (5 telematics points centered on impact)
    renderSpeedSparkline(inc.speed || 55);

    // Setup Synchronized Video Players (Road CH1 + Cabin CH2)
    const terminalId = inc.terminalId || '860871080043592';
    const ch1Url = inc.roadVideoUrl || FleetApi.getLiveHlsUrl(terminalId, 1);
    const ch2Url = inc.cabinVideoUrl || FleetApi.getLiveHlsUrl(terminalId, 2);

    state.modalHlsRoad = bindHlsStream(dom.modalVideoRoad, ch1Url, state.modalHlsRoad);
    state.modalHlsCabin = bindHlsStream(dom.modalVideoCabin, ch2Url, state.modalHlsCabin);

    if (dom.incidentReviewModal) dom.incidentReviewModal.style.display = 'flex';
  }

  function closeIncidentReviewModal() {
    if (dom.incidentReviewModal) dom.incidentReviewModal.style.display = 'none';

    if (state.modalHlsRoad) {
      state.modalHlsRoad.destroy();
      state.modalHlsRoad = null;
    }
    if (state.modalHlsCabin) {
      state.modalHlsCabin.destroy();
      state.modalHlsCabin = null;
    }

    if (dom.modalVideoRoad) {
      dom.modalVideoRoad.pause();
      dom.modalVideoRoad.removeAttribute('src');
      dom.modalVideoRoad.load();
    }
    if (dom.modalVideoCabin) {
      dom.modalVideoCabin.pause();
      dom.modalVideoCabin.removeAttribute('src');
      dom.modalVideoCabin.load();
    }
    state.modalSyncPlaying = false;
    if (dom.btnModalSyncPlay) dom.btnModalSyncPlay.textContent = '⏯️ Play Both Synchronized';
  }

  function toggleModalSyncPlay() {
    if (!dom.modalVideoRoad || !dom.modalVideoCabin) return;
    if (state.modalSyncPlaying) {
      dom.modalVideoRoad.pause();
      dom.modalVideoCabin.pause();
      state.modalSyncPlaying = false;
      if (dom.btnModalSyncPlay) dom.btnModalSyncPlay.textContent = '⏯️ Play Both Synchronized';
    } else {
      // Sync timestamps
      dom.modalVideoCabin.currentTime = dom.modalVideoRoad.currentTime;
      Promise.all([
        dom.modalVideoRoad.play().catch(() => {}),
        dom.modalVideoCabin.play().catch(() => {})
      ]).then(() => {
        state.modalSyncPlaying = true;
        if (dom.btnModalSyncPlay) dom.btnModalSyncPlay.textContent = '⏸️ Pause Both';
      });
    }
  }

  function renderSpeedSparkline(impactSpeed) {
    if (!dom.modalSpeedSparkline) return;
    const v = Number(impactSpeed) || 55;
    const points = [
      { time: 'T-10s', speed: Math.min(100, Math.round(v * 1.15)) },
      { time: 'T-5s', speed: Math.min(100, Math.round(v * 1.08)) },
      { time: 'Impact (0s)', speed: v, isImpact: true },
      { time: 'T+5s', speed: Math.round(v * 0.4) },
      { time: 'T+10s', speed: 0 }
    ];

    dom.modalSpeedSparkline.innerHTML = points.map(p => {
      const height = Math.max(8, Math.min(48, Math.round((p.speed / 100) * 48)));
      const color = p.isImpact ? '#dc2626' : (p.speed > 50 ? '#d97706' : '#2563eb');
      return `
        <div style="display:flex;flex-direction:column;align-items:center;gap:4px;flex:1;">
          <span style="font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;color:${color};">${p.speed}k</span>
          <div style="width:100%;height:48px;display:flex;align-items:flex-end;justify-content:center;background:#f1f5f9;border-radius:3px;">
            <div style="width:70%;height:${height}px;background:${color};border-radius:2px;"></div>
          </div>
          <span style="font-size:9px;color:var(--text-muted);white-space:nowrap;">${p.time}</span>
        </div>
      `;
    }).join('');
  }

  async function submitIncidentReview(triageStatus) {
    if (!state.safetyActiveIncident) return;
    const incidentId = state.safetyActiveIncident.id || state.safetyActiveIncident.incident_id;
    const category = dom.modalCoachingCategory ? dom.modalCoachingCategory.value : 'GENERAL_SAFETY';
    const notes = dom.modalCoachingNotes ? dom.modalCoachingNotes.value.trim() : '';

    try {
      showToast(`Saving coaching review for incident #${incidentId}...`, 'info');
      await FleetApi.reviewSafetyIncident(incidentId, {
        triageStatus,
        coachingCategory: category,
        notes,
        coachedBy: 'Fleet Operations Manager'
      });

      showToast(`Incident ${triageStatus === 'COACHED' ? 'Reviewed & Coached' : 'Dismissed'} successfully!`, 'success');
      closeIncidentReviewModal();
      await loadSafetyIncidents();
    } catch (err) {
      console.error('[Safety Inbox] Review submit failed:', err);
      showToast(`Failed to save review: ${err.message || 'Server error'}`, 'error');
    }
  }

  // Handle browser tab closure to terminate hardware stream
  window.addEventListener('beforeunload', () => {
    if (state.isStreaming && state.selectedVehicle) {
      FleetApi.stopLiveStream(state.selectedVehicle.terminalId);
    }
  });
  window.addEventListener('pagehide', () => {
    if (state.isStreaming && state.selectedVehicle) {
      FleetApi.stopLiveStream(state.selectedVehicle.terminalId);
    }
  });

  // ── Global Namespace Hook for Map & Table Callbacks ───────────────────
  window.InurumApp = {
    selectVehicle,
    streamFromMap: (vehicleId) => {
      selectVehicle(vehicleId);
      navigateTo('live');
      startLiveStreaming();
    },
    reviewIncident: (eventId) => {
      navigateTo('safety');
      setTimeout(() => openIncidentReviewModal(eventId), 120);
    },
    playRecording: (recordingId) => {
      navigateTo('video');
      setTimeout(() => {
        playVcRecording({
          videoUrl: FleetApi.getLiveHlsUrl(state.vcSelectedVehicleId, state.vcSelectedChannel),
          title: `Recording Clip #${recordingId}`
        });
        showToast(`Loaded Video Recording #${recordingId}`, 'info');
      }, 120);
    },
    requestRetrievalForClip: (clipId) => {
      handleRequestRetrieval();
    }
  };

})();
