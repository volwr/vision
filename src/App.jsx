import { useMemo, useState } from "react";
import "./App.css";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const CATEGORY_STYLES = {
  School: "cat-school",
  Work: "cat-work",
  Sports: "cat-sports",
  Homework: "cat-homework",
  Personal: "cat-personal",
  Other: "cat-other",
};

const PRIORITY_STYLES = {
  High: "prio-high",
  Medium: "prio-medium",
  Low: "prio-low",
};

const BLOCK_COLOR_STYLES = ["block-paper-a", "block-paper-b", "block-paper-c", "block-paper-d", "block-paper-e"];

const START_HOUR = 6;
const END_HOUR = 23;

function toISODate(date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  const year = copy.getFullYear();
  const month = String(copy.getMonth() + 1).padStart(2, "0");
  const day = String(copy.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getWeekStart(date = new Date()) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  const offset = copy.getDay() === 0 ? -6 : 1 - copy.getDay();
  copy.setDate(copy.getDate() + offset);
  return copy;
}

function getDateForDay(dayName) {
  const weekStart = getWeekStart();
  const date = new Date(weekStart);
  date.setDate(weekStart.getDate() + DAYS.indexOf(dayName));
  return date;
}

function getISODateForDay(dayName) {
  return toISODate(getDateForDay(dayName));
}

const sampleClassBlockId = crypto.randomUUID();
const sampleHomeworkBlockId = crypto.randomUUID();

const initialTasks = [
  {
    id: crypto.randomUUID(),
    title: "Math practice set",
    duration: 60,
    priority: "High",
    category: "Homework",
    dueDate: getISODateForDay("Wednesday"),
    description: "Complete the practice questions and review the work.",
    steps: [
      { id: crypto.randomUUID(), title: "Review directions", done: false },
      { id: crypto.randomUUID(), title: "Answer practice questions", done: false },
      { id: crypto.randomUUID(), title: "Check grammar", done: false },
    ],
    scheduledBlockId: sampleHomeworkBlockId,
  },
  {
    id: crypto.randomUUID(),
    title: "English reading notes",
    duration: 45,
    priority: "Medium",
    category: "Homework",
    dueDate: getISODateForDay("Friday"),
    description: "Review the sample reading and write notes.",
    steps: [
      { id: crypto.randomUUID(), title: "Read the section", done: false },
      { id: crypto.randomUUID(), title: "Write notes", done: false },
    ],
    scheduledBlockId: sampleHomeworkBlockId,
  },
];

const initialBlocks = [
  {
    id: sampleClassBlockId,
    title: "Sample Class",
    day: "Monday",
    start: "09:00",
    end: "11:00",
    category: "School",
    description: "Example morning class block.",
    steps: ["Review plan", "Check assignments"],
    source: "regular",
  },
  {
    id: sampleHomeworkBlockId,
    title: "Homework Block",
    day: "Monday",
    start: "13:00",
    end: "17:00",
    category: "Homework",
    description: "Example homework block that can hold Math, English, or other assigned tasks.",
    steps: ["Pick assignment", "Work in order", "Review due dates"],
    source: "regular",
  },
];

const initialRegularBlocks = [
  {
    id: crypto.randomUUID(),
    title: "Sample Class",
    days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    start: "09:00",
    end: "11:00",
    category: "School",
    description: "Reusable example class block.",
    steps: ["Review plan", "Check assignments"],
  },
  {
    id: crypto.randomUUID(),
    title: "Sample Work Block",
    days: ["Monday", "Tuesday", "Thursday", "Friday"],
    start: "13:00",
    end: "17:00",
    category: "Work",
    description: "Reusable example focus block.",
    steps: ["Start timer", "Check tasks"],
  },
  {
    id: crypto.randomUUID(),
    title: "Sample Practice",
    days: ["Wednesday", "Saturday"],
    start: "16:00",
    end: "18:00",
    category: "Sports",
    description: "Example practice or activity block.",
    steps: ["Warm up", "Practice", "Stretch"],
  },
];

function timeToMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(total) {
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function formatTime(time) {
  const [hourRaw, minute] = time.split(":").map(Number);
  const suffix = hourRaw >= 12 ? "PM" : "AM";
  const hour = hourRaw % 12 || 12;
  return `${hour}:${String(minute).padStart(2, "0")} ${suffix}`;
}

function formatRange(start, end) {
  return `${formatTime(start)} - ${formatTime(end)}`;
}

function formatDate(date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatDateLong(date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatDueDate(dateString) {
  if (!dateString) return "No due date";
  const [year, month, day] = dateString.split("-").map(Number);
  return formatDateLong(new Date(year, month - 1, day));
}

function blocksOverlap(aStart, aEnd, bStart, bEnd) {
  return timeToMinutes(aStart) < timeToMinutes(bEnd) && timeToMinutes(aEnd) > timeToMinutes(bStart);
}

function hasOverlap(blocks, day, start, end, ignoreId = null) {
  return blocks.some((block) => {
    if (block.id === ignoreId) return false;
    if (block.day !== day) return false;
    return blocksOverlap(start, end, block.start, block.end);
  });
}

function priorityRank(priority) {
  if (priority === "High") return 1;
  if (priority === "Medium") return 2;
  return 3;
}

function hashString(value) {
  return [...value].reduce((total, char) => total + char.charCodeAt(0), 0);
}

function getTaskStyle(task) {
  return PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.Low;
}

function getBlockStyle(block, tasks = []) {
  const attachedTasks = tasks.filter((task) => task.scheduledBlockId === block.id || task.id === block.taskId);

  if (attachedTasks.length > 0) {
    const topTask = [...attachedTasks].sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority))[0];
    return getTaskStyle(topTask);
  }

  const seed = `${block.title}-${block.day}-${block.start}-${block.category}`;
  return BLOCK_COLOR_STYLES[hashString(seed) % BLOCK_COLOR_STYLES.length];
}

function getTodayName() {
  const jsDay = new Date().getDay();
  const map = {
    0: "Sunday",
    1: "Monday",
    2: "Tuesday",
    3: "Wednesday",
    4: "Thursday",
    5: "Friday",
    6: "Saturday",
  };
  return map[jsDay];
}

function emptyBlockDraft() {
  return {
    title: "",
    day: "Monday",
    start: "15:00",
    end: "16:00",
    category: "Other",
    description: "",
    stepsText: "",
  };
}

function emptyRegularDraft() {
  return {
    title: "",
    days: ["Monday"],
    start: "15:00",
    end: "16:00",
    category: "Other",
    description: "",
    stepsText: "",
  };
}

function normalizeSteps(steps = []) {
  return steps
    .map((step) => {
      if (typeof step === "string") {
        return { id: crypto.randomUUID(), title: step, done: false };
      }

      return {
        id: step.id || crypto.randomUUID(),
        title: step.title || "",
        done: Boolean(step.done),
      };
    })
    .filter((step) => step.title.trim());
}

function stepsFromText(text) {
  return text
    .split("\n")
    .map((step) => step.trim())
    .filter(Boolean)
    .map((title) => ({ id: crypto.randomUUID(), title, done: false }));
}

function getStepTitle(step) {
  return typeof step === "string" ? step : step.title;
}

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState(getTodayName());
  const [tasks, setTasks] = useState(initialTasks);
  const [blocks, setBlocks] = useState(initialBlocks);
  const [regularBlocks, setRegularBlocks] = useState(initialRegularBlocks);
  const [activeBlock, setActiveBlock] = useState(null);
  const [activeTask, setActiveTask] = useState(null);
  const [message, setMessage] = useState("");
  const [taskDraft, setTaskDraft] = useState({
    title: "",
    duration: 45,
    priority: "Medium",
    category: "School",
    dueDate: "",
    scheduledBlockId: "",
    description: "",
    stepsText: "",
  });
  const [blockDraft, setBlockDraft] = useState(emptyBlockDraft());
  const [regularDraft, setRegularDraft] = useState(emptyRegularDraft());

  const selectedDayBlocks = useMemo(() => {
    return blocks
      .filter((block) => block.day === selectedDay)
      .sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
  }, [blocks, selectedDay]);

  const unscheduledTasks = useMemo(() => {
    return tasks.filter((task) => !task.scheduledBlockId);
  }, [tasks]);

  const scheduledTasks = useMemo(() => {
    return tasks.filter((task) => task.scheduledBlockId);
  }, [tasks]);

  function closeMenuAndGo(nextPage) {
    setPage(nextPage);
    setMenuOpen(false);
  }

  function showMessage(text) {
    setMessage(text);
    setTimeout(() => setMessage(""), 3200);
  }

  function addTask(event) {
    event.preventDefault();

    if (!taskDraft.title.trim()) {
      showMessage("Add a task title first.");
      return;
    }

    const newTask = {
      id: crypto.randomUUID(),
      title: taskDraft.title.trim(),
      duration: Number(taskDraft.duration),
      priority: taskDraft.priority,
      category: taskDraft.category,
      dueDate: taskDraft.dueDate,
      description: taskDraft.description.trim(),
      steps: stepsFromText(taskDraft.stepsText),
      scheduledBlockId: taskDraft.scheduledBlockId || null,
    };

    setTasks((current) => [newTask, ...current]);
    setTaskDraft({
      title: "",
      duration: 45,
      priority: "Medium",
      category: "School",
      dueDate: "",
      scheduledBlockId: "",
      description: "",
      stepsText: "",
    });
    showMessage(newTask.scheduledBlockId ? "Task added to time block." : "Task added.");
  }

  function addManualBlock(event) {
    event.preventDefault();

    if (!blockDraft.title.trim()) {
      showMessage("Add a title for the time block first.");
      return;
    }

    if (timeToMinutes(blockDraft.end) <= timeToMinutes(blockDraft.start)) {
      showMessage("End time has to be after start time.");
      return;
    }

    if (hasOverlap(blocks, blockDraft.day, blockDraft.start, blockDraft.end)) {
      showMessage("That time overlaps with something already planned.");
      return;
    }

    const newBlock = {
      id: crypto.randomUUID(),
      title: blockDraft.title.trim(),
      day: blockDraft.day,
      start: blockDraft.start,
      end: blockDraft.end,
      category: blockDraft.category,
      description: blockDraft.description.trim(),
      steps: blockDraft.stepsText
        .split("\n")
        .map((step) => step.trim())
        .filter(Boolean),
      source: "manual",
    };

    setBlocks((current) => [...current, newBlock]);
    setBlockDraft(emptyBlockDraft());
    showMessage("Time block added.");
  }

  function addRegularBlock(event) {
    event.preventDefault();

    if (!regularDraft.title.trim()) {
      showMessage("Add a title for the saved block first.");
      return;
    }

    if (regularDraft.days.length === 0) {
      showMessage("Pick at least one day.");
      return;
    }

    if (timeToMinutes(regularDraft.end) <= timeToMinutes(regularDraft.start)) {
      showMessage("End time has to be after start time.");
      return;
    }

    const newRegularBlock = {
      id: crypto.randomUUID(),
      title: regularDraft.title.trim(),
      days: regularDraft.days,
      start: regularDraft.start,
      end: regularDraft.end,
      category: regularDraft.category,
      description: regularDraft.description.trim(),
      steps: regularDraft.stepsText
        .split("\n")
        .map((step) => step.trim())
        .filter(Boolean),
    };

    setRegularBlocks((current) => [...current, newRegularBlock]);
    setRegularDraft(emptyRegularDraft());
    showMessage("Saved regular block created.");
  }

  function toggleRegularDay(day) {
    setRegularDraft((current) => {
      const exists = current.days.includes(day);
      return {
        ...current,
        days: exists ? current.days.filter((item) => item !== day) : [...current.days, day],
      };
    });
  }

  function applyRegularBlock(template) {
    const blocksToAdd = [];
    const skippedDays = [];

    template.days.forEach((day) => {
      const overlaps = hasOverlap(blocks.concat(blocksToAdd), day, template.start, template.end);
      if (overlaps) {
        skippedDays.push(day);
        return;
      }

      blocksToAdd.push({
        id: crypto.randomUUID(),
        title: template.title,
        day,
        start: template.start,
        end: template.end,
        category: template.category,
        description: template.description,
        steps: template.steps,
        source: "regular",
      });
    });

    if (blocksToAdd.length > 0) {
      setBlocks((current) => [...current, ...blocksToAdd]);
    }

    if (skippedDays.length > 0 && blocksToAdd.length > 0) {
      showMessage(`Added some blocks, but skipped overlaps on ${skippedDays.join(", ")}.`);
    } else if (skippedDays.length > 0) {
      showMessage("Could not add this block because it overlaps with planned time.");
    } else {
      showMessage("Regular block applied to the calendar.");
    }
  }

  function deleteRegularBlock(id) {
    setRegularBlocks((current) => current.filter((block) => block.id !== id));
    showMessage("Saved block deleted.");
  }

  function findOpenSlot(currentBlocks, day, duration) {
    const dayBlocks = currentBlocks
      .filter((block) => block.day === day)
      .sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));

    let cursor = 8 * 60;
    const latestEnd = 21 * 60;

    for (const block of dayBlocks) {
      const blockStart = timeToMinutes(block.start);
      if (blockStart - cursor >= duration) {
        return {
          start: minutesToTime(cursor),
          end: minutesToTime(cursor + duration),
        };
      }

      cursor = Math.max(cursor, timeToMinutes(block.end));
    }

    if (latestEnd - cursor >= duration) {
      return {
        start: minutesToTime(cursor),
        end: minutesToTime(cursor + duration),
      };
    }

    return null;
  }

  function generatePlan(scope = "selected") {
    const tasksToSchedule = [...unscheduledTasks].sort((a, b) => {
      return priorityRank(a.priority) - priorityRank(b.priority);
    });

    if (tasksToSchedule.length === 0) {
      showMessage("There are no unscheduled tasks to plan.");
      return;
    }

    let workingBlocks = [...blocks];
    const newBlocks = [];
    const taskUpdates = {};
    const targetDays = scope === "week" ? DAYS : [selectedDay];

    for (const task of tasksToSchedule) {
      let placed = false;

      for (const day of targetDays) {
        const slot = findOpenSlot(workingBlocks, day, Number(task.duration));

        if (slot) {
          const blockId = crypto.randomUUID();

          const newBlock = {
            id: blockId,
            title: task.title,
            day,
            start: slot.start,
            end: slot.end,
            category: task.category,
            description: task.description,
            steps: normalizeSteps(task.steps),
            source: "task",
            taskId: task.id,
          };

          workingBlocks = [...workingBlocks, newBlock];
          newBlocks.push(newBlock);
          taskUpdates[task.id] = blockId;
          placed = true;
          break;
        }
      }

      if (!placed) {
        continue;
      }
    }

    if (newBlocks.length === 0) {
      showMessage("No open time was found. Try adding shorter tasks or clearing space.");
      return;
    }

    setBlocks((current) => [...current, ...newBlocks]);
    setTasks((current) =>
      current.map((task) => {
        if (!taskUpdates[task.id]) return task;
        return { ...task, scheduledBlockId: taskUpdates[task.id] };
      })
    );

    showMessage(`Planned ${newBlocks.length} task${newBlocks.length === 1 ? "" : "s"} without overlaps.`);
  }

  function openBlock(block) {
    setActiveBlock({
      ...block,
      stepsText: block.steps?.map(getStepTitle).join("\n") || "",
    });
  }

  function saveActiveBlock(event) {
    event.preventDefault();

    if (!activeBlock.title.trim()) {
      showMessage("The block needs a title.");
      return;
    }

    if (timeToMinutes(activeBlock.end) <= timeToMinutes(activeBlock.start)) {
      showMessage("End time has to be after start time.");
      return;
    }

    if (hasOverlap(blocks, activeBlock.day, activeBlock.start, activeBlock.end, activeBlock.id)) {
      showMessage("That edit would overlap with another block.");
      return;
    }

    const cleanBlock = {
      ...activeBlock,
      title: activeBlock.title.trim(),
      description: activeBlock.description?.trim() || "",
      steps: activeBlock.stepsText
        .split("\n")
        .map((step) => step.trim())
        .filter(Boolean),
    };

    delete cleanBlock.stepsText;

    setBlocks((current) => current.map((block) => (block.id === cleanBlock.id ? cleanBlock : block)));
    setActiveBlock(null);
    showMessage("Block updated.");
  }

  function deleteActiveBlock() {
    if (!activeBlock) return;

    const deletedBlock = activeBlock;

    setBlocks((current) => current.filter((block) => block.id !== deletedBlock.id));

    setTasks((current) =>
      current.map((task) => {
        if (task.id === deletedBlock.taskId || task.scheduledBlockId === deletedBlock.id) {
          return { ...task, scheduledBlockId: null };
        }
        return task;
      })
    );

    setActiveBlock(null);
    showMessage("Block deleted.");
  }

  function deleteTask(taskId) {
    const task = tasks.find((item) => item.id === taskId);

    if (task?.scheduledBlockId) {
      setBlocks((current) =>
        current.filter((block) => block.taskId !== task.id)
      );
    }

    setTasks((current) => current.filter((item) => item.id !== taskId));
    showMessage("Task deleted.");
  }

  function openTask(task) {
    setActiveTask({
      ...task,
      steps: normalizeSteps(task.steps),
      newStepTitle: "",
    });
  }

  function saveActiveTask(event) {
    event.preventDefault();

    if (!activeTask.title.trim()) {
      showMessage("The task needs a title.");
      return;
    }

    const cleanTask = {
      ...activeTask,
      title: activeTask.title.trim(),
      duration: Number(activeTask.duration),
      description: activeTask.description?.trim() || "",
      steps: normalizeSteps(activeTask.steps),
    };

    delete cleanTask.newStepTitle;

    setTasks((current) => current.map((task) => (task.id === cleanTask.id ? cleanTask : task)));
    setBlocks((current) =>
      current.flatMap((block) => {
        if (block.taskId !== cleanTask.id) return block;
        if (cleanTask.scheduledBlockId !== block.id) return [];
        return {
          ...block,
          title: cleanTask.title,
          category: cleanTask.category,
          description: cleanTask.description,
          steps: cleanTask.steps,
        };
      })
    );
    setActiveTask(null);
    showMessage("Task updated.");
  }

  function addStepToActiveTask() {
    if (!activeTask?.newStepTitle.trim()) {
      showMessage("Add a step title first.");
      return;
    }

    setActiveTask((current) => ({
      ...current,
      steps: [
        ...normalizeSteps(current.steps),
        { id: crypto.randomUUID(), title: current.newStepTitle.trim(), done: false },
      ],
      newStepTitle: "",
    }));
  }

  function updateActiveTaskStep(stepId, patch) {
    setActiveTask((current) => ({
      ...current,
      steps: normalizeSteps(current.steps).map((step) =>
        step.id === stepId ? { ...step, ...patch } : step
      ),
    }));
  }

  function deleteActiveTaskStep(stepId) {
    setActiveTask((current) => ({
      ...current,
      steps: normalizeSteps(current.steps).filter((step) => step.id !== stepId),
    }));
  }

  return (
    <div className="app-shell">
      <div className="paper-texture" />

      <header className="topbar">
        <button className="hamburger" onClick={() => setMenuOpen(true)} aria-label="Open menu">
          <span />
          <span />
          <span />
        </button>

        <div>
          <h1>Vision</h1>
          <p>Smart Planner</p>
        </div>

        <div className="date-pill">{formatDateLong(getDateForDay(selectedDay))}</div>
      </header>

      {menuOpen && (
        <div className="menu-backdrop" onClick={() => setMenuOpen(false)}>
          <aside className="side-menu" onClick={(event) => event.stopPropagation()}>
            <div className="menu-header">
              <div>
                <h2>Menu</h2>
                <p>Plan your week without the clutter.</p>
              </div>
              <button className="close-btn" onClick={() => setMenuOpen(false)}>
                x
              </button>
            </div>

            <nav>
              <button className={page === "dashboard" ? "active" : ""} onClick={() => closeMenuAndGo("dashboard")}>
                Dashboard
              </button>
              <button className={page === "calendar" ? "active" : ""} onClick={() => closeMenuAndGo("calendar")}>
                Weekly Calendar
              </button>
              <button className={page === "tasks" ? "active" : ""} onClick={() => closeMenuAndGo("tasks")}>
                Tasks
              </button>
              <button className={page === "settings" ? "active" : ""} onClick={() => closeMenuAndGo("settings")}>
                Settings
              </button>
            </nav>
          </aside>
        </div>
      )}

      {message && <div className="toast">{message}</div>}

      <main>
        {page === "dashboard" && (
          <Dashboard
            selectedDay={selectedDay}
            setSelectedDay={setSelectedDay}
            blocks={blocks}
            tasks={tasks}
            selectedDayBlocks={selectedDayBlocks}
            openBlock={openBlock}
            unscheduledTasks={unscheduledTasks}
            scheduledTasks={scheduledTasks}
            taskDraft={taskDraft}
            setTaskDraft={setTaskDraft}
            addTask={addTask}
            generatePlan={generatePlan}
            openTask={openTask}
          />
        )}

        {page === "calendar" && (
          <CalendarPage
            blocks={blocks}
            selectedDay={selectedDay}
            setSelectedDay={setSelectedDay}
            openBlock={openBlock}
            blockDraft={blockDraft}
            setBlockDraft={setBlockDraft}
            addManualBlock={addManualBlock}
            regularBlocks={regularBlocks}
            tasks={tasks}
            regularDraft={regularDraft}
            setRegularDraft={setRegularDraft}
            toggleRegularDay={toggleRegularDay}
            addRegularBlock={addRegularBlock}
            applyRegularBlock={applyRegularBlock}
            deleteRegularBlock={deleteRegularBlock}
          />
        )}

        {page === "tasks" && (
          <TasksPage
            tasks={tasks}
            blocks={blocks}
            taskDraft={taskDraft}
            setTaskDraft={setTaskDraft}
            addTask={addTask}
            deleteTask={deleteTask}
            generatePlan={generatePlan}
            openTask={openTask}
          />
        )}

        {page === "settings" && <SettingsPage />}
      </main>

      {activeBlock && (
        <BlockModal
          activeBlock={activeBlock}
          setActiveBlock={setActiveBlock}
          saveActiveBlock={saveActiveBlock}
          deleteActiveBlock={deleteActiveBlock}
          assignedTasks={tasks.filter((task) => task.scheduledBlockId === activeBlock.id)}
          openTask={openTask}
        />
      )}

      {activeTask && (
        <TaskModal
          activeTask={activeTask}
          setActiveTask={setActiveTask}
          returnToBlock={Boolean(activeBlock)}
          closeTask={() => {
            setActiveTask(null);
            if (activeBlock) {
              setActiveBlock(null);
            }
          }}
          backToBlock={() => setActiveTask(null)}
          saveActiveTask={saveActiveTask}
          addStepToActiveTask={addStepToActiveTask}
          updateActiveTaskStep={updateActiveTaskStep}
          deleteActiveTaskStep={deleteActiveTaskStep}
          deleteTask={deleteTask}
          blocks={blocks}
        />
      )}
    </div>
  );
}

function Dashboard({
  selectedDay,
  setSelectedDay,
  blocks,
  tasks,
  selectedDayBlocks,
  openBlock,
  unscheduledTasks,
  taskDraft,
  setTaskDraft,
  addTask,
  generatePlan,
  openTask,
}) {
  const upcomingTasks = [...tasks].sort((a, b) => {
    const aDue = a.dueDate || "9999-12-31";
    const bDue = b.dueDate || "9999-12-31";
    if (aDue !== bDue) return aDue.localeCompare(bDue);
    return priorityRank(a.priority) - priorityRank(b.priority);
  });

  return (
    <section className="page-grid dashboard-grid">
      <section className="paper-card schedule-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Today's schedule</p>
            <h3>{selectedDay} Time Blocks</h3>
            <span className="date-line">{formatDateLong(getDateForDay(selectedDay))}</span>
          </div>
          <span className="note-chip">{selectedDayBlocks.length} planned</span>
        </div>

        {selectedDayBlocks.length === 0 ? (
          <div className="empty-note">No time blocks yet. Add regular blocks or generate a plan.</div>
        ) : (
          <div className="block-list">
            {selectedDayBlocks.map((block) => {
              const assignedTasks = tasks.filter((task) => task.scheduledBlockId === block.id);

              return (
                <button key={block.id} className={`time-card ${getBlockStyle(block, tasks)}`} onClick={() => openBlock(block)}>
                  <span className="time">{formatRange(block.start, block.end)}</span>
                  <strong>{block.title}</strong>
                  <small>{block.category}</small>
                  {assignedTasks.length > 0 && (
                    <span className="task-count">{assignedTasks.length} task{assignedTasks.length === 1 ? "" : "s"} inside</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section className="paper-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Tasks</p>
            <h3>Due & Assigned</h3>
          </div>
          <span className="note-chip">{upcomingTasks.length}</span>
        </div>

        <div className="task-stack">
          {upcomingTasks.length === 0 ? (
            <div className="empty-note">No tasks yet.</div>
          ) : (
            upcomingTasks.map((task) => {
              const block = blocks.find((item) => item.id === task.scheduledBlockId);
              return <TaskNote key={task.id} task={task} block={block} openTask={openTask} />;
            })
          )}
        </div>
      </section>

      <div className="hero paper-card wide">
        <div>
          <p className="eyebrow">Plan controls</p>
          <h2>{selectedDay}</h2>
        </div>

        <div className="hero-actions">
          <select value={selectedDay} onChange={(event) => setSelectedDay(event.target.value)}>
            {DAYS.map((day) => (
              <option key={day} value={day}>
                {day} - {formatDate(getDateForDay(day))}
              </option>
            ))}
          </select>

          <button className="primary-btn" onClick={() => generatePlan("selected")}>
            Generate Today
          </button>
          <button className="secondary-btn" onClick={() => generatePlan("week")}>
            Generate Week
          </button>
        </div>
      </div>

      <section className="paper-card wide">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Quick add</p>
            <h3>Add Task</h3>
          </div>
        </div>

        <TaskForm taskDraft={taskDraft} setTaskDraft={setTaskDraft} addTask={addTask} blocks={blocks} compact />
      </section>

    </section>
  );
}

function CalendarPage({
  blocks,
  selectedDay,
  setSelectedDay,
  openBlock,
  blockDraft,
  setBlockDraft,
  addManualBlock,
  regularBlocks,
  regularDraft,
  setRegularDraft,
  toggleRegularDay,
  addRegularBlock,
  applyRegularBlock,
  deleteRegularBlock,
  tasks,
}) {
  return (
    <section className="calendar-page">
      <div className="paper-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Weekly view</p>
            <h2>Weekly Calendar</h2>
          </div>

          <select value={selectedDay} onChange={(event) => setSelectedDay(event.target.value)}>
            {DAYS.map((day) => (
              <option key={day} value={day}>
                {day} - {formatDate(getDateForDay(day))}
              </option>
            ))}
          </select>
        </div>

        <div className="week-grid">
          {DAYS.map((day) => {
            const dayBlocks = blocks
              .filter((block) => block.day === day)
              .sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));

            return (
              <div className={`day-column ${selectedDay === day ? "selected-day" : ""}`} key={day}>
                <button className="day-title" onClick={() => setSelectedDay(day)}>
                  <strong>{day}</strong>
                  <span>{formatDate(getDateForDay(day))}</span>
                </button>

                <div className="day-lines">
                  {Array.from({ length: END_HOUR - START_HOUR }).map((_, index) => {
                    const hour = START_HOUR + index;
                    return (
                      <div className="hour-line" key={hour}>
                        <span>{formatTime(`${String(hour).padStart(2, "0")}:00`)}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="day-blocks">
                  {dayBlocks.map((block) => {
                    const assignedTasks = tasks.filter((task) => task.scheduledBlockId === block.id);

                    return (
                      <button
                        key={block.id}
                      className={`mini-block ${getBlockStyle(block, tasks)}`}
                        onClick={() => openBlock(block)}
                      >
                        <strong>{block.title}</strong>
                        <span>{formatRange(block.start, block.end)}</span>
                        {assignedTasks.length > 0 && <small>{assignedTasks.length} task{assignedTasks.length === 1 ? "" : "s"}</small>}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="calendar-lower-grid">
        <section className="paper-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Manual block</p>
              <h3>Add Time Block</h3>
            </div>
          </div>

          <form className="form-grid" onSubmit={addManualBlock}>
            <input
              value={blockDraft.title}
              onChange={(event) => setBlockDraft({ ...blockDraft, title: event.target.value })}
              placeholder="Block title"
            />

            <div className="two-col">
              <select
                value={blockDraft.day}
                onChange={(event) => setBlockDraft({ ...blockDraft, day: event.target.value })}
              >
                {DAYS.map((day) => (
                  <option key={day} value={day}>
                    {day} - {formatDate(getDateForDay(day))}
                  </option>
                ))}
              </select>

              <select
                value={blockDraft.category}
                onChange={(event) => setBlockDraft({ ...blockDraft, category: event.target.value })}
              >
                {Object.keys(CATEGORY_STYLES).map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </div>

            <div className="two-col">
              <label>
                Start
                <input
                  type="time"
                  value={blockDraft.start}
                  onChange={(event) => setBlockDraft({ ...blockDraft, start: event.target.value })}
                />
              </label>

              <label>
                End
                <input
                  type="time"
                  value={blockDraft.end}
                  onChange={(event) => setBlockDraft({ ...blockDraft, end: event.target.value })}
                />
              </label>
            </div>

            <textarea
              value={blockDraft.description}
              onChange={(event) => setBlockDraft({ ...blockDraft, description: event.target.value })}
              placeholder="Description"
            />

            <textarea
              value={blockDraft.stepsText}
              onChange={(event) => setBlockDraft({ ...blockDraft, stepsText: event.target.value })}
              placeholder={"Steps\nOne per line"}
            />

            <button className="primary-btn" type="submit">
              Add Block
            </button>
          </form>
        </section>

        <section className="paper-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Reusable</p>
              <h3>Create Saved Regular Block</h3>
            </div>
          </div>

          <form className="form-grid" onSubmit={addRegularBlock}>
            <input
              value={regularDraft.title}
              onChange={(event) => setRegularDraft({ ...regularDraft, title: event.target.value })}
              placeholder="Saved block title"
            />

            <div className="day-picker">
              {DAYS.map((day) => (
                <button
                  key={day}
                  type="button"
                  className={regularDraft.days.includes(day) ? "picked" : ""}
                  onClick={() => toggleRegularDay(day)}
                >
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>

            <div className="two-col">
              <label>
                Start
                <input
                  type="time"
                  value={regularDraft.start}
                  onChange={(event) => setRegularDraft({ ...regularDraft, start: event.target.value })}
                />
              </label>

              <label>
                End
                <input
                  type="time"
                  value={regularDraft.end}
                  onChange={(event) => setRegularDraft({ ...regularDraft, end: event.target.value })}
                />
              </label>
            </div>

            <select
              value={regularDraft.category}
              onChange={(event) => setRegularDraft({ ...regularDraft, category: event.target.value })}
            >
              {Object.keys(CATEGORY_STYLES).map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>

            <textarea
              value={regularDraft.description}
              onChange={(event) => setRegularDraft({ ...regularDraft, description: event.target.value })}
              placeholder="Description"
            />

            <textarea
              value={regularDraft.stepsText}
              onChange={(event) => setRegularDraft({ ...regularDraft, stepsText: event.target.value })}
              placeholder={"Steps\nOne per line"}
            />

            <button className="primary-btn" type="submit">
              Save Regular Block
            </button>
          </form>
        </section>
      </div>

      <section className="paper-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Saved blocks</p>
            <h3>Saved Regular Blocks</h3>
          </div>
          <span className="note-chip">{regularBlocks.length}</span>
        </div>

        <div className="regular-grid">
          {regularBlocks.map((block) => (
            <article className={`sticky-card ${getBlockStyle(block)}`} key={block.id}>
              <div>
                <strong>{block.title}</strong>
                <p>{block.days.join(", ")}</p>
                <span>{formatRange(block.start, block.end)}</span>
              </div>

              <div className="sticky-actions">
                <button className="secondary-btn" onClick={() => applyRegularBlock(block)}>
                  Apply
                </button>
                <button className="danger-btn" onClick={() => deleteRegularBlock(block.id)}>
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

function TasksPage({ tasks, blocks, taskDraft, setTaskDraft, addTask, deleteTask, generatePlan, openTask }) {
  return (
    <section className="page-grid">
      <section className="paper-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Task list</p>
            <h2>Tasks</h2>
          </div>

          <button className="primary-btn" onClick={() => generatePlan("week")}>
            Plan Unscheduled
          </button>
        </div>

        <div className="task-board">
          {tasks.map((task) => {
            const block = blocks.find((item) => item.id === task.scheduledBlockId);

            return (
              <article className={`task-row ${getTaskStyle(task)}`} key={task.id}>
                <button className="task-row-main" onClick={() => openTask(task)}>
                  <strong>{task.title}</strong>
                  <p>{task.description || "No description yet."}</p>
                  <span>
                    {task.duration} min * {task.priority} priority * {task.category}
                  </span>
                  <small>Due: {formatDueDate(task.dueDate)}</small>
                  <small>{normalizeSteps(task.steps).filter((step) => step.done).length} of {normalizeSteps(task.steps).length} steps complete</small>
                  {block && (
                    <small>
                      Assigned: {block.title} on {block.day}, {formatRange(block.start, block.end)}
                    </small>
                  )}
                </button>

                <div className="task-row-actions">
                  <button className="secondary-btn" onClick={() => openTask(task)}>
                    Details
                  </button>
                  <button className="danger-btn" onClick={() => deleteTask(task.id)}>
                    Delete
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="paper-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Add more</p>
            <h3>New Task</h3>
          </div>
        </div>

        <TaskForm taskDraft={taskDraft} setTaskDraft={setTaskDraft} addTask={addTask} blocks={blocks} />
      </section>
    </section>
  );
}

function SettingsPage() {
  return (
    <section className="page-grid">
      <section className="paper-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Settings</p>
            <h2>Planner Preferences</h2>
          </div>
        </div>

        <div className="settings-list">
          <article>
            <strong>Style</strong>
            <p>Paper cards, sticky notes, soft shadows, and clean spacing.</p>
          </article>

          <article>
            <strong>Planning rule</strong>
            <p>Generated tasks will not overlap with existing calendar blocks.</p>
          </article>

          <article>
            <strong>Layout</strong>
            <p>The dashboard stays simple. Weekly calendar and regular blocks stay on their own page.</p>
          </article>
        </div>
      </section>
    </section>
  );
}

function TaskForm({ taskDraft, setTaskDraft, addTask, blocks = [], compact = false }) {
  return (
    <form className="form-grid" onSubmit={addTask}>
      <input
        value={taskDraft.title}
        onChange={(event) => setTaskDraft({ ...taskDraft, title: event.target.value })}
        placeholder="Task title"
      />

      <div className="two-col">
        <label>
          Minutes
          <input
            type="number"
            min="15"
            step="15"
            value={taskDraft.duration}
            onChange={(event) => setTaskDraft({ ...taskDraft, duration: event.target.value })}
          />
        </label>

        <label>
          Priority
          <select
            value={taskDraft.priority}
            onChange={(event) => setTaskDraft({ ...taskDraft, priority: event.target.value })}
          >
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
        </label>
      </div>

      <select
        value={taskDraft.category}
        onChange={(event) => setTaskDraft({ ...taskDraft, category: event.target.value })}
      >
        {Object.keys(CATEGORY_STYLES).map((category) => (
          <option key={category}>{category}</option>
        ))}
      </select>

      <div className="two-col">
        <label>
          Due date
          <input
            type="date"
            value={taskDraft.dueDate}
            onChange={(event) => setTaskDraft({ ...taskDraft, dueDate: event.target.value })}
          />
        </label>

        <label>
          Assign to block
          <select
            value={taskDraft.scheduledBlockId}
            onChange={(event) => setTaskDraft({ ...taskDraft, scheduledBlockId: event.target.value })}
          >
            <option value="">Not assigned</option>
            {blocks.map((block) => (
              <option key={block.id} value={block.id}>
                {formatDate(getDateForDay(block.day))} {formatRange(block.start, block.end)} - {block.title}
              </option>
            ))}
          </select>
        </label>
      </div>

      {!compact && (
        <>
          <textarea
            value={taskDraft.description}
            onChange={(event) => setTaskDraft({ ...taskDraft, description: event.target.value })}
            placeholder="Description"
          />

          <textarea
            value={taskDraft.stepsText}
            onChange={(event) => setTaskDraft({ ...taskDraft, stepsText: event.target.value })}
            placeholder={"Steps\nOne per line"}
          />
        </>
      )}

      <button className="primary-btn" type="submit">
        Add Task
      </button>
    </form>
  );
}

function TaskNote({ task, block, openTask }) {
  const steps = normalizeSteps(task.steps);
  const doneCount = steps.filter((step) => step.done).length;

  return (
    <button className={`sticky-card task-note ${getTaskStyle(task)}`} onClick={() => openTask(task)}>
      <strong>{task.title}</strong>
      <p>
        {task.duration} min * {task.priority}
      </p>
      <span>Due: {formatDueDate(task.dueDate)}</span>
      {block && <span>In: {block.title}</span>}
      <div className="step-progress">
        <span>{doneCount}/{steps.length} steps</span>
        <div>
          <i style={{ width: steps.length ? `${(doneCount / steps.length) * 100}%` : "0%" }} />
        </div>
      </div>
      {task.description && <span>{task.description}</span>}
    </button>
  );
}

function TaskModal({
  activeTask,
  setActiveTask,
  returnToBlock = false,
  closeTask,
  backToBlock,
  saveActiveTask,
  addStepToActiveTask,
  updateActiveTaskStep,
  deleteActiveTaskStep,
  deleteTask,
  blocks = [],
}) {
  const steps = normalizeSteps(activeTask.steps);
  const completeCount = steps.filter((step) => step.done).length;

  function deleteAndClose() {
    deleteTask(activeTask.id);
    if (closeTask) {
      closeTask();
    } else {
      setActiveTask(null);
    }
  }

  return (
    <div className="modal-backdrop" onClick={() => setActiveTask(null)}>
      <section className="modal-card task-detail-card paper-card" onClick={(event) => event.stopPropagation()}>
        <div className="section-heading">
          <div>
            <p className="eyebrow">Task details</p>
            <h2>Edit Task</h2>
          </div>

          <div className="modal-header-actions">
            {returnToBlock && (
              <button className="secondary-btn compact-btn" onClick={backToBlock}>
                Back
              </button>
            )}
            <button className="close-btn" onClick={closeTask || (() => setActiveTask(null))}>
              x
            </button>
          </div>
        </div>

        <form className="form-grid" onSubmit={saveActiveTask}>
          <input
            value={activeTask.title}
            onChange={(event) => setActiveTask({ ...activeTask, title: event.target.value })}
            placeholder="Task title"
          />

          <div className="two-col">
            <label>
              Minutes
              <input
                type="number"
                min="15"
                step="15"
                value={activeTask.duration}
                onChange={(event) => setActiveTask({ ...activeTask, duration: event.target.value })}
              />
            </label>

            <label>
              Priority
              <select
                value={activeTask.priority}
                onChange={(event) => setActiveTask({ ...activeTask, priority: event.target.value })}
              >
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </label>
          </div>

          <select
            value={activeTask.category}
            onChange={(event) => setActiveTask({ ...activeTask, category: event.target.value })}
          >
            {Object.keys(CATEGORY_STYLES).map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>

          <div className="two-col">
            <label>
              Due date
              <input
                type="date"
                value={activeTask.dueDate || ""}
                onChange={(event) => setActiveTask({ ...activeTask, dueDate: event.target.value })}
              />
            </label>

            <label>
              Assign to block
              <select
                value={activeTask.scheduledBlockId || ""}
                onChange={(event) =>
                  setActiveTask({ ...activeTask, scheduledBlockId: event.target.value || null })
                }
              >
                <option value="">Not assigned</option>
                {blocks.map((block) => (
                  <option key={block.id} value={block.id}>
                    {formatDate(getDateForDay(block.day))} {formatRange(block.start, block.end)} - {block.title}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <textarea
            value={activeTask.description || ""}
            onChange={(event) => setActiveTask({ ...activeTask, description: event.target.value })}
            placeholder="Description"
          />

          <section className="steps-panel">
            <div className="steps-heading">
              <div>
                <strong>Steps</strong>
                <span>{completeCount} of {steps.length} complete</span>
              </div>
            </div>

            <div className="step-editor-list">
              {steps.length === 0 ? (
                <div className="empty-note">No steps yet. Add the first one below.</div>
              ) : (
                steps.map((step) => (
                  <div className="step-row" key={step.id}>
                    <input
                      className="step-check"
                      type="checkbox"
                      checked={step.done}
                      onChange={(event) => updateActiveTaskStep(step.id, { done: event.target.checked })}
                    />
                    <input
                      className={step.done ? "step-title complete" : "step-title"}
                      value={step.title}
                      onChange={(event) => updateActiveTaskStep(step.id, { title: event.target.value })}
                    />
                    <button type="button" className="step-delete" onClick={() => deleteActiveTaskStep(step.id)}>
                      x
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="add-step-row">
              <input
                value={activeTask.newStepTitle || ""}
                onChange={(event) => setActiveTask({ ...activeTask, newStepTitle: event.target.value })}
                placeholder="Add a step"
              />
              <button type="button" className="secondary-btn" onClick={addStepToActiveTask}>
                Add Step
              </button>
            </div>
          </section>

          <div className="modal-actions">
            <button className="danger-btn" type="button" onClick={deleteAndClose}>
              Delete
            </button>

            <button className="primary-btn" type="submit">
              Save Task
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function BlockModal({ activeBlock, setActiveBlock, saveActiveBlock, deleteActiveBlock, assignedTasks = [], openTask }) {
  return (
    <div className="modal-backdrop" onClick={() => setActiveBlock(null)}>
      <section className="modal-card paper-card" onClick={(event) => event.stopPropagation()}>
        <div className="section-heading">
          <div>
            <p className="eyebrow">Time block</p>
            <h2>Edit Details</h2>
            <span className="date-line">{formatDateLong(getDateForDay(activeBlock.day))}</span>
          </div>

          <button className="close-btn" onClick={() => setActiveBlock(null)}>
            x
          </button>
        </div>

        <form className="form-grid" onSubmit={saveActiveBlock}>
          <input
            value={activeBlock.title}
            onChange={(event) => setActiveBlock({ ...activeBlock, title: event.target.value })}
            placeholder="Title"
          />

          <div className="two-col">
            <select
              value={activeBlock.day}
              onChange={(event) => setActiveBlock({ ...activeBlock, day: event.target.value })}
            >
                {DAYS.map((day) => (
                  <option key={day} value={day}>
                    {day} - {formatDate(getDateForDay(day))}
                  </option>
                ))}
              </select>

            <select
              value={activeBlock.category}
              onChange={(event) => setActiveBlock({ ...activeBlock, category: event.target.value })}
            >
              {Object.keys(CATEGORY_STYLES).map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </div>

          <div className="two-col">
            <label>
              Start
              <input
                type="time"
                value={activeBlock.start}
                onChange={(event) => setActiveBlock({ ...activeBlock, start: event.target.value })}
              />
            </label>

            <label>
              End
              <input
                type="time"
                value={activeBlock.end}
                onChange={(event) => setActiveBlock({ ...activeBlock, end: event.target.value })}
              />
            </label>
          </div>

          <textarea
            value={activeBlock.description || ""}
            onChange={(event) => setActiveBlock({ ...activeBlock, description: event.target.value })}
            placeholder="Description"
          />

          <textarea
            value={activeBlock.stepsText || ""}
            onChange={(event) => setActiveBlock({ ...activeBlock, stepsText: event.target.value })}
            placeholder={"Steps\nOne per line"}
          />

          <section className="steps-panel">
            <div className="steps-heading">
              <div>
                <strong>Tasks inside this block</strong>
                <span>{assignedTasks.length} assigned</span>
              </div>
            </div>

            <div className="inside-task-list">
              {assignedTasks.length === 0 ? (
                <div className="empty-note">No tasks assigned yet. Create a task and choose this block.</div>
              ) : (
                assignedTasks.map((task) => (
                  <button
                    type="button"
                    className="inside-task-row"
                    key={task.id}
                    onClick={() => {
                      openTask(task);
                    }}
                  >
                    <strong>{task.title}</strong>
                    <span>Due: {formatDueDate(task.dueDate)}</span>
                    <small>{normalizeSteps(task.steps).filter((step) => step.done).length} of {normalizeSteps(task.steps).length} steps complete</small>
                  </button>
                ))
              )}
            </div>
          </section>

          <div className="modal-actions">
            <button className="danger-btn" type="button" onClick={deleteActiveBlock}>
              Delete
            </button>

            <button className="primary-btn" type="submit">
              Save Changes
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
