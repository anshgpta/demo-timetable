/***********************
 * Dynamic Data Models *
 ***********************/
const sections = {
  A: { strength: 45 },
  B: { strength: 50 },
  C: { strength: 42 },
  D: { strength: 48 }
};

// Periods in minutes from midnight for easy time math
const periods = [
  { number: 1, start: toMin("09:00"), end: toMin("09:55") },
  { number: 2, start: toMin("10:00"), end: toMin("10:55") },
  { number: 3, start: toMin("11:00"), end: toMin("11:55") },
  { number: 4, start: toMin("12:00"), end: toMin("12:55") },
  { number: 5, start: toMin("13:00"), end: toMin("13:55") },
  { number: 6, start: toMin("14:00"), end: toMin("14:55") },
  { number: 7, start: toMin("15:00"), end: toMin("15:55") }
];

// Timetable by Section → Day → Period (kept as your original data)
const timetable = {
  A: {
    Mon: [
      { p: 1, subject: "Math", room: "101", teacher: "Mr. Verma" },
      { p: 2, subject: "English", room: "102", teacher: "Ms. Singh" },
      { p: 3, subject: "Physics", room: "Lab-1", teacher: "Dr. Rao" },
      { p: 4, subject: "CS", room: "Lab-2", teacher: "Mr. Jain" },
      { p: 5, subject: "History", room: "103", teacher: "Ms. Kaur" }
    ],
    Tue: [
      { p: 1, subject: "Chemistry", room: "Lab-3", teacher: "Dr. Bose" },
      { p: 2, subject: "Math", room: "101", teacher: "Mr. Verma" },
      { p: 4, subject: "CS Lab", room: "Lab-2", teacher: "Mr. Jain" }
    ],
    Wed: [], Thu: [], Fri: [], Sat: []
  },
  B: {
    Mon: [
      { p: 2, subject: "OOP Lab", room: "Lab-B", teacher: "Ms. Priya" },
      { p: 4, subject: "SE", room: "102", teacher: "Mr. K" }
    ],
    Tue: [
      { p: 1, subject: "Math", room: "101", teacher: "Mr. Verma" },
      { p: 2, subject: "OOP", room: "103", teacher: "Ms. Priya" },
      { p: 3, subject: "DBMS", room: "Lab-DB", teacher: "Dr. Iyer" }
    ],
    Wed: [], Thu: [], Fri: [], Sat: []
  },
  C: { Mon: [], Tue: [], Wed: [], Thu: [], Fri: [], Sat: [] },
  D: { Mon: [], Tue: [], Wed: [], Thu: [], Fri: [], Sat: [] }
};

// Notices (AI/back-end can replace this list)
const notices = [
  { title: "Unit Test-1 starts from 10 Sep", date: "2025-09-05" },
  { title: "Tomorrow is a holiday for Teacher's Day", date: "2025-09-04" },
  { title: "New library books have been added", date: "2025-08-31" }
];

// Smart suggestions (placeholder; can be AI-powered later)
const suggestions = [
  "You have a free slot 11:00–11:55 today. Consider revising Physics.",
  "Traffic peak near Gate-2 at 2 PM. Start for lab 10 mins early.",
  "Attendance below 75% in SE. Plan to attend all this week."
];

// Sample assigned classes for Faculty sidebar (placeholder)
const facultySampleClasses = [
  { code: "DBMS", section: "B", time: "11:00 – 11:55", day: "Tue" },
  { code: "OOP", section: "B", time: "10:00 – 10:55", day: "Tue" },
  { code: "SE", section: "B", time: "12:00 – 12:55", day: "Mon" }
];

/***********************
 * DOM References      *
 ***********************/
// Note: These may be re-acquired when sidebar is swapped, so keep these as let
let roleSelect = document.getElementById("roleSelect");
const studentTab = document.getElementById("studentTab");
const facultyTab = document.getElementById("facultyTab");
const adminTab = document.getElementById("adminTab");

let sectionSelect = document.getElementById("sectionSelect");
let sectionStrength = document.getElementById("sectionStrength");

const dayTabs = document.getElementById("dayTabs");
const dayTimetableBody = document.getElementById("dayTimetableBody");
const periodBody = document.getElementById("periodBody");
const currentIndicator = document.getElementById("currentIndicator");

let latestBadge = document.getElementById("latestBadge");
let noticeText = document.getElementById("noticeText");
let noticeDate = document.getElementById("noticeDate");
let viewAllNoticesBtn = document.getElementById("viewAllNoticesBtn");

const noticesModal = document.getElementById("noticesModal");
const closeNotices = document.getElementById("closeNotices");
const noticesList = document.getElementById("noticesList");
const noticeSearch = document.getElementById("noticeSearch");

const themeToggle = document.getElementById("themeToggle");
const printBtn = document.getElementById("printBtn");

const suggestionsList = document.getElementById("suggestionsList");
const assistantBtn = document.getElementById("assistantBtn");
const assistantInput = document.getElementById("assistantInput");

const sidebar = document.getElementById("sidebar");
const liveClock = document.getElementById("liveClock");

/***********************
 * Init & Rendering    *
 ***********************/
let selectedDay = getTodayAbbrev(); // "Mon"..."Sat"
let selectedSection = "B";          // default Section B

// Save initial admin sidebar markup so we can restore it later
const adminSidebarHTML = sidebar.innerHTML;

/* Utility to refresh references that live inside the sidebar,
   because switching sidebar innerHTML replaces elements. */
function refreshSidebarRefs(){
  roleSelect = document.getElementById("roleSelect");
  sectionSelect = document.getElementById("sectionSelect");
  sectionStrength = document.getElementById("sectionStrength");
  latestBadge = document.getElementById("latestBadge");
  noticeText = document.getElementById("noticeText");
  noticeDate = document.getElementById("noticeDate");
  viewAllNoticesBtn = document.getElementById("viewAllNoticesBtn");

  // re-attach events that depend on these elements
  if(roleSelect){
    roleSelect.addEventListener("change", (e)=>{
      selectTab(e.target.value);
      renderSidebar(e.target.value);
    });
  }
  if(sectionSelect){
    sectionSelect.addEventListener("change", ()=>{
      selectedSection = sectionSelect.value;
      updateStrength();
      renderDayTimetable();
    });
  }
  if(viewAllNoticesBtn){
    viewAllNoticesBtn.addEventListener("click", openNotices);
  }
}

/* Render sidebar content based on role */
function renderSidebar(role){
  // Admin: restore original admin sidebar
  if(role === "admin"){
    sidebar.innerHTML = adminSidebarHTML;
    // re-query and setup
    refreshSidebarRefs();
    initSections();
    renderLatestNotice();
    return;
  }

  // Student sidebar
  if(role === "student"){
    sidebar.innerHTML = `
      <section class="side-card role-card">
        <h3>My Section</h3>
        <div class="role-area">
          <label>Section</label>
          <div style="font-weight:700; margin-top:6px">Section ${selectedSection}</div>
          <div class="muted" id="sectionStrength">Strength: ${sections[selectedSection].strength} students</div>
        </div>
      </section>

      <section class="side-card latest-notice">
        <h3>Latest Notice</h3>
        <div class="latest-notice-body">
          <span id="latestBadge" class="badge hidden">NEW</span>
          <p id="noticeText" class="notice-text">No new notices.</p>
          <p id="noticeDate" class="notice-date muted"></p>
        </div>
        <button class="primary-btn" id="viewAllNoticesBtn">View All Notices</button>
      </section>

      <section class="side-card quick-actions">
        <h3>Quick Actions</h3>
        <button class="ghost-btn">View My Schedule</button>
        <button class="ghost-btn">Request Change</button>
        <button class="ghost-btn">Notifications <span class="notif">2</span></button>
      </section>
    `;
    refreshSidebarRefs();
    renderLatestNotice();
    return;
  }

  // Faculty sidebar
  if(role === "faculty"){
    // Build HTML with my-classes list
    const classesHtml = facultySampleClasses.map(c => `
      <li style="margin-bottom:8px">
        <div><strong>${c.code}</strong> — Section ${c.section}</div>
        <div class="muted" style="font-size:12px">${c.day} • ${c.time}</div>
      </li>`).join("");

    sidebar.innerHTML = `
      <section class="side-card">
        <h3>My Classes</h3>
        <ul style="padding-left:18px; margin-top:8px">${classesHtml}</ul>
      </section>

      <section class="side-card latest-notice">
        <h3>Latest Notice</h3>
        <div class="latest-notice-body">
          <span id="latestBadge" class="badge hidden">NEW</span>
          <p id="noticeText" class="notice-text">No new notices.</p>
          <p id="noticeDate" class="notice-date muted"></p>
        </div>
        <button class="primary-btn" id="viewAllNoticesBtn">View All Notices</button>
      </section>

      <section class="side-card quick-actions">
        <h3>Quick Actions</h3>
        <button class="ghost-btn">Mark Attendance</button>
        <button class="ghost-btn">Upload Material</button>
        <button class="ghost-btn">Notifications <span class="notif">2</span></button>
      </section>
    `;
    refreshSidebarRefs();
    renderLatestNotice();
    return;
  }
}

/* Populate Sections & Strength */
function initSections(){
  if(!sectionSelect) return;
  sectionSelect.innerHTML = "";
  Object.keys(sections).forEach(sec=>{
    const opt = document.createElement("option");
    opt.value = sec;
    opt.textContent = `Section ${sec}`;
    sectionSelect.appendChild(opt);
  });
  sectionSelect.value = selectedSection;
  updateStrength();
}

function updateStrength(){
  if(!sectionSelect || !sectionStrength) return;
  const sec = sectionSelect.value;
  sectionStrength.textContent = `Strength: ${sections[sec].strength} students`;
}

/* Render Period Table */
function renderPeriods(){
  periodBody.innerHTML = "";
  periods.forEach(p=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>Period ${p.number}</td>
      <td>${fmtRange(p.start, p.end)}</td>
    `;
    periodBody.appendChild(tr);
  });
}

/* Render Day Timetable per Section+Day */
function renderDayTimetable(){
  dayTimetableBody.innerHTML = "";
  const sec = sectionSelect ? sectionSelect.value : selectedSection;
  const dayData = (timetable[sec]?.[selectedDay]) || [];
  const byPeriod = new Map(dayData.map(item => [item.p, item]));
  periods.forEach(p=>{
    const item = byPeriod.get(p.number);
    const tr = document.createElement("tr");
    tr.dataset.period = p.number;
    tr.innerHTML = `
      <td>${p.number}</td>
      <td>${fmtRange(p.start, p.end)}</td>
      <td>${item ? item.subject : '<span class="muted">Free</span>'}</td>
      <td>${item ? item.room : '-'}</td>
      <td>${item ? item.teacher : '-'}</td>
    `;
    dayTimetableBody.appendChild(tr);
  });
  highlightCurrentPeriod();
}

/* Highlight current period if selected day is today */
function highlightCurrentPeriod(){
  const now = new Date();
  const nowMin = now.getHours()*60 + now.getMinutes();
  const todayAbbrev = getTodayAbbrev();
  let activeText = "";

  // Remove current highlights
  [...dayTimetableBody.querySelectorAll("tr")].forEach(tr=>tr.classList.remove("current"));

  if(selectedDay !== todayAbbrev){
    currentIndicator.textContent = `Viewing ${selectedDay}.`;
    return;
  }

  let found = false;
  periods.forEach(p=>{
    if(nowMin >= p.start && nowMin < p.end){
      const row = dayTimetableBody.querySelector(`tr[data-period="${p.number}"]`);
      if(row){ row.classList.add("current"); found = true; activeText = `Now: Period ${p.number} (${fmtRange(p.start, p.end)})`; }
    }
  });
  currentIndicator.textContent = found ? activeText : "No class right now.";
}

/* Render Latest Notice */
function renderLatestNotice(){
  if(!notices.length) {
    if(noticeText) noticeText.textContent = "No new notices.";
    if(noticeDate) noticeDate.textContent = "";
    if(latestBadge) latestBadge.classList.add("hidden");
    return;
  }
  const latest = notices[0];
  if(noticeText) noticeText.textContent = latest.title;
  if(noticeDate) noticeDate.textContent = niceDate(latest.date);
  const days = daysSince(latest.date);
  if(latestBadge) {
    if(days <= 3) latestBadge.classList.remove("hidden");
    else latestBadge.classList.add("hidden");
  }
}

/* Notices Modal & Search */
function openNotices(){
  noticesModal.classList.remove("hidden");
  noticesModal.setAttribute("aria-hidden","false");
  renderNoticesList();
}
function closeNoticesModal(){
  noticesModal.classList.add("hidden");
  noticesModal.setAttribute("aria-hidden","true");
}
function renderNoticesList(filter=""){
  noticesList.innerHTML = "";
  const q = filter.trim().toLowerCase();
  notices
    .filter(n => n.title.toLowerCase().includes(q))
    .forEach(n=>{
      const li = document.createElement("li");
      const badge = daysSince(n.date) <= 3 ? `<span class="badge">NEW</span>` : "";
      li.innerHTML = `
        <div style="position:relative">
          ${badge}
          <div style="padding-top:4px;">
            <div><strong>${n.title}</strong></div>
            <div class="muted" style="font-size:12px">${niceDate(n.date)}</div>
          </div>
        </div>
      `;
      noticesList.appendChild(li);
    });
}

/***********************
 * Role/Tab Sync       *
 ***********************/
function selectTab(role){
  [studentTab, facultyTab, adminTab].forEach(b=>b.classList.remove("active"));
  if(role==="student") studentTab.classList.add("active");
  if(role==="faculty") facultyTab.classList.add("active");
  if(role==="admin") adminTab.classList.add("active");
}

// keep dropdown change in sync with tabs
// attach initial listeners to the top tabs
studentTab.addEventListener("click", ()=>{
  // update dropdown (if present) and UI
  if(roleSelect) roleSelect.value = "student";
  selectTab("student");
  renderSidebar("student");
});
facultyTab.addEventListener("click", ()=>{
  if(roleSelect) roleSelect.value = "faculty";
  selectTab("faculty");
  renderSidebar("faculty");
});
adminTab.addEventListener("click", ()=>{
  if(roleSelect) roleSelect.value = "admin";
  selectTab("admin");
  renderSidebar("admin");
});

/***********************
 * Events              *
 ***********************/
sectionSelect && sectionSelect.addEventListener("change", ()=>{
  selectedSection = sectionSelect.value;
  updateStrength();
  renderDayTimetable();
});

dayTabs.addEventListener("click", (e)=>{
  const btn = e.target.closest("[data-day]");
  if(!btn) return;
  [...dayTabs.querySelectorAll(".chip")].forEach(c=>c.classList.remove("active"));
  btn.classList.add("active");
  selectedDay = btn.dataset.day;
  renderDayTimetable();
});

closeNotices.addEventListener("click", closeNoticesModal);
noticesModal.addEventListener("click", (e)=>{ if(e.target.classList.contains("modal-backdrop")) closeNoticesModal(); });
noticeSearch.addEventListener("input", (e)=> renderNoticesList(e.target.value));

themeToggle.addEventListener("click", ()=>{
  const html = document.documentElement;
  const curr = html.getAttribute("data-theme") || "light";
  html.setAttribute("data-theme", curr === "light" ? "dark" : "light");
});

printBtn.addEventListener("click", ()=> window.print());

assistantBtn.addEventListener("click", ()=>{
  const q = (assistantInput.value || "").trim();
  if(!q) return;
  alert("AI Assistant (placeholder):\n\n" + q + "\n\n(Will be connected to your AI API later.)");
  assistantInput.value = "";
});

/***********************
 * Helpers             *
 ***********************/
function toMin(hhmm){ // "13:05" -> minutes
  const [h,m] = hhmm.split(":").map(Number);
  return h*60 + m;
}
function fmtRange(startMin, endMin){
  return `${toHHMM(startMin)} – ${toHHMM(endMin)}`;
}
function toHHMM(min){
  const h = Math.floor(min/60), m = min%60;
  const ampm = h>=12 ? "PM" : "AM";
  const h12 = ((h+11)%12)+1;
  return `${pad(h12)}:${pad(m)} ${ampm}`;
}
function pad(n){ return String(n).padStart(2,"0"); }

function getTodayAbbrev(){
  const map = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const d = new Date();
  const day = map[d.getDay()];
  return ["Mon","Tue","Wed","Thu","Fri","Sat"].includes(day) ? day : "Mon";
}
function niceDate(iso){
  const d = new Date(iso+"T00:00:00");
  return d.toLocaleDateString(undefined, { year:"numeric", month:"short", day:"numeric" });
}
function daysSince(iso){
  const one = new Date(iso+"T00:00:00");
  const now = new Date();
  return Math.floor((now - one)/(1000*60*60*24));
}

/***********************
 * Suggestions Render  *
 ***********************/
function renderSuggestions(){
  suggestionsList.innerHTML = "";
  suggestions.forEach(s=>{
    const li = document.createElement("li");
    li.textContent = s;
    suggestionsList.appendChild(li);
  });
}

/***********************
 * Live Clock Update   *
 ***********************/
function updateClock(){
  const now = new Date();
  let h = now.getHours();
  let m = now.getMinutes();
  let s = now.getSeconds();
  const ampm = h >= 12 ? "PM" : "AM";
  h = ((h+11)%12)+1; // 12-hour format
  const timeStr = `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")} ${ampm}`;

  const options = { weekday:"short", year:"numeric", month:"short", day:"numeric" };
  const dateStr = now.toLocaleDateString(undefined, options);

  if(liveClock){
    liveClock.querySelector(".time").textContent = timeStr;
    liveClock.querySelector(".date").textContent = dateStr;
  }
}
setInterval(updateClock, 1000);
updateClock();

/***********************
 * Live highlight tick *
 ***********************/
setInterval(highlightCurrentPeriod, 60*1000); // update highlight every minute

/***********************
 * Boot                *
 ***********************/
(function boot(){
  // Ensure sidebar refs are correct for admin initial state
  refreshSidebarRefs();
  initSections();
  renderPeriods();

  // Activate today's day tab
  [...dayTabs.querySelectorAll(".chip")].forEach(c=>{
    c.classList.toggle("active", c.dataset.day === selectedDay);
  });

  renderDayTimetable();
  renderLatestNotice();
  renderSuggestions();

  // ensure role UI is consistent and sidebar matches role
  const initialRole = (roleSelect && roleSelect.value) ? roleSelect.value : "admin";
  selectTab(initialRole);
  renderSidebar(initialRole);
  updateClock();
})();
