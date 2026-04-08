// Browser Notification API helpers
export function requestNotificationPermission() {
  if (!("Notification" in window)) return Promise.resolve("denied");
  if (Notification.permission === "granted") return Promise.resolve("granted");
  return Notification.requestPermission();
}

export function showNotification(title, body, onClick) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  try {
    var n = new Notification(title, {
      body: body,
      icon: "/logo-192.png",
      badge: "/logo-192.png",
      tag: "mns-" + Date.now(),
    });
    if (onClick) {
      n.onclick = function() { window.focus(); onClick(); n.close(); };
    }
  } catch(e) { console.log("Notification error:", e); }
}

// Check for upcoming items and notify
export function checkReminders(allSteps, allRoutines, calData) {
  var now = new Date();
  var reminders = [];

  // Check steps with time hints
  allSteps.filter(function(s) { return s.status === "active" && !s.snoozedUntil; }).forEach(function(s) {
    var t = (s.time || "").toLowerCase();
    if (t.includes("today") || t.includes("tonight")) {
      reminders.push({ title: "Step reminder", body: s.title, id: s.id });
    }
  });

  // Check routines scheduled for today
  var todayName = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"][now.getDay()];
  allRoutines.filter(function(r) { return !r.paused; }).forEach(function(r) {
    var days = (r.days || []).map(function(d) { return d.toLowerCase(); });
    if (days.includes(todayName)) {
      reminders.push({ title: "Recurring step today", body: r.title + " - " + (r.time || r.schedule) });
    }
  });

  return reminders;
}

// Schedule a periodic check (runs every 30 min while app is open)
var reminderInterval = null;
export function startReminderChecks(getState) {
  if (reminderInterval) return;
  // Check if we've already notified today
  var lastCheck = localStorage.getItem("mns_last_reminder_check");
  var today = new Date().toDateString();

  reminderInterval = setInterval(function() {
    var nowCheck = new Date().toDateString();
    var lastCheckDate = localStorage.getItem("mns_last_reminder_check");
    if (lastCheckDate === nowCheck) return; // Already notified today

    var state = getState();
    if (!state) return;
    var reminders = checkReminders(state.allSteps, state.allRoutines, state.calData);
    if (reminders.length > 0) {
      showNotification(
        "My Next Step",
        reminders.length === 1 ? reminders[0].body : reminders.length + " items on your agenda today"
      );
      localStorage.setItem("mns_last_reminder_check", nowCheck);
    }
  }, 30 * 60 * 1000); // Every 30 minutes
}

export function stopReminderChecks() {
  if (reminderInterval) { clearInterval(reminderInterval); reminderInterval = null; }
}
