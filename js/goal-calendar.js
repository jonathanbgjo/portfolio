(function () {
  "use strict";

  const monthNames = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  const storagePrefix = "day-by-day-calendar:";
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  let selectedYear = today.getFullYear();
  let calendarData = {};

  const elements = {
    goalForm: document.getElementById("goal-form"),
    goalInput: document.getElementById("goal-input"),
    goalLabel: document.getElementById("goal-label"),
    year: document.getElementById("calendar-year"),
    months: document.getElementById("month-labels"),
    grid: document.getElementById("day-grid"),
    completed: document.getElementById("completed-count"),
    daysInYear: document.getElementById("days-in-year"),
    streak: document.getElementById("current-streak"),
    rate: document.getElementById("completion-rate"),
    progress: document.getElementById("progress-track"),
    progressFill: document.getElementById("progress-fill"),
    status: document.getElementById("status-message")
  };

  function isLeapYear(year) {
    return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  }

  function daysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }

  function dateKey(month, day) {
    return month + "-" + day;
  }

  function announce(message) {
    elements.status.textContent = message;
  }

  function loadYear(year) {
    try {
      const saved = localStorage.getItem(storagePrefix + year);
      if (!saved) return { goal: "", completed: [] };

      const parsed = JSON.parse(saved);
      if (!parsed || typeof parsed !== "object" || typeof parsed.goal !== "string" || !Array.isArray(parsed.completed)) {
        throw new Error("Saved calendar data has an unexpected format.");
      }

      const validDates = parsed.completed.filter(function (value) {
        if (typeof value !== "string") return false;
        const parts = value.split("-");
        if (parts.length !== 2 || !/^\d+$/.test(parts[0]) || !/^\d+$/.test(parts[1])) return false;
        const month = Number(parts[0]);
        const day = Number(parts[1]);
        return month >= 0 && month < 12 && day >= 1 && day <= daysInMonth(year, month);
      });
      return { goal: parsed.goal.slice(0, 80), completed: Array.from(new Set(validDates)) };
    } catch (error) {
      console.error("Unable to load goal calendar data.", error);
      announce("Saved progress could not be read. Your browser storage may be unavailable or the saved data may be damaged.");
      return { goal: "", completed: [] };
    }
  }

  function saveYear() {
    try {
      localStorage.setItem(storagePrefix + selectedYear, JSON.stringify(calendarData));
      return true;
    } catch (error) {
      console.error("Unable to save goal calendar data.", error);
      announce("Progress could not be saved. Check your browser storage settings and try again.");
      return false;
    }
  }

  function createMonthLabels() {
    elements.months.replaceChildren();
    monthNames.forEach(function (month) {
      const label = document.createElement("span");
      label.className = "month-label";
      label.textContent = month;
      elements.months.appendChild(label);
    });
  }

  function completedCountBefore(month, day) {
    let count = 0;
    let cursor = new Date(selectedYear, month, day);
    while (calendarData.completed.includes(dateKey(cursor.getMonth(), cursor.getDate()))) {
      count += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return count;
  }

  function renderCalendar() {
    elements.year.textContent = String(selectedYear);
    elements.daysInYear.textContent = String(isLeapYear(selectedYear) ? 366 : 365);
    elements.goalInput.value = calendarData.goal;
    elements.goalLabel.textContent = calendarData.goal || "Every day counts";
    elements.grid.replaceChildren();
    elements.grid.setAttribute("aria-label", "Daily goal calendar for " + selectedYear);

    for (let day = 1; day <= 31; day += 1) {
      for (let month = 0; month < 12; month += 1) {
        if (day > daysInMonth(selectedYear, month)) continue;

        const button = document.createElement("button");
        const completed = calendarData.completed.includes(dateKey(month, day));
        const isToday = selectedYear === today.getFullYear() && month === today.getMonth() && day === today.getDate();
        const isFuture = new Date(selectedYear, month, day) > todayStart;
        const label = new Date(selectedYear, month, day).toLocaleDateString(undefined, {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric"
        });

        button.type = "button";
        button.className = "day-mark" + (isToday ? " is-today" : "");
        button.textContent = String(day);
        button.style.gridRow = String(day);
        button.style.gridColumn = String(month + 1);
        button.disabled = isFuture;
        button.setAttribute("aria-label", (completed ? "Unmark " : "Mark ") + label + " complete");
        button.setAttribute("aria-pressed", String(completed));
        button.title = label + (completed ? " — completed" : "");
        button.addEventListener("click", function () {
          const dates = new Set(calendarData.completed);
          if (dates.has(dateKey(month, day))) {
            dates.delete(dateKey(month, day));
          } else {
            dates.add(dateKey(month, day));
          }
          calendarData.completed = Array.from(dates);
          const saved = saveYear();
          renderCalendar();
          if (saved) {
            announce((calendarData.completed.includes(dateKey(month, day)) ? "Marked " : "Unmarked ") + label + ".");
          }
        });
        elements.grid.appendChild(button);
      }
    }

    renderProgress();
  }

  function renderProgress() {
    const total = calendarData.completed.length;
    const todayForYear = selectedYear === today.getFullYear()
      ? today
      : new Date(selectedYear, selectedYear < today.getFullYear() ? 11 : 0, selectedYear < today.getFullYear() ? 31 : 1);
    const elapsed = Math.max(1, Math.floor((todayForYear - new Date(selectedYear, 0, 1)) / 86400000) + 1);
    const percentage = Math.min(100, Math.round((total / elapsed) * 1000) / 10);
    const streak = selectedYear === today.getFullYear()
      ? completedCountBefore(today.getMonth(), today.getDate())
      : selectedYear < today.getFullYear() ? completedCountBefore(11, 31) : 0;

    elements.completed.textContent = String(total);
    elements.streak.textContent = String(streak);
    elements.rate.textContent = percentage + "%";
    elements.progress.setAttribute("aria-valuenow", String(percentage));
    elements.progress.setAttribute("aria-valuetext", percentage + "% of elapsed days completed");
    elements.progressFill.style.width = percentage + "%";
  }

  elements.goalForm.addEventListener("submit", function (event) {
    event.preventDefault();
    calendarData.goal = elements.goalInput.value.trim();
    const saved = saveYear();
    renderCalendar();
    if (saved) {
      announce(calendarData.goal ? "Your goal has been saved for " + selectedYear + "." : "Your goal has been cleared.");
    }
  });

  document.getElementById("previous-year").addEventListener("click", function () {
    selectedYear -= 1;
    calendarData = loadYear(selectedYear);
    renderCalendar();
  });

  document.getElementById("next-year").addEventListener("click", function () {
    selectedYear += 1;
    calendarData = loadYear(selectedYear);
    renderCalendar();
  });

  createMonthLabels();
  calendarData = loadYear(selectedYear);
  renderCalendar();
})();
