export type StaffTaskStatus = "done" | "due" | "upcoming" | "overdue";

export type StaffTaskType = "checklist" | "temps" | "confirm";

export type StaffTask = {
  id: string;
  category: string;
  name: string;
  meta: string;
  type: StaffTaskType;
  status: StaffTaskStatus;
  obligationId?: string;
  logType?: string;
};

export type StaffTab = "home" | "tasks" | "logbook" | "evidence";

export const STAFF_TASK_TEMPLATES: Omit<StaffTask, "status" | "obligationId">[] = [
  {
    id: "opening",
    category: "clean",
    name: "Opening checklist",
    meta: "Due at open · 07:30",
    type: "checklist",
    logType: "food_check",
  },
  {
    id: "temps",
    category: "food",
    name: "Fridge & freezer temperatures",
    meta: "Every open + close",
    type: "temps",
    logType: "fridge_check",
  },
  {
    id: "allergen",
    category: "food",
    name: "Allergen matrix on display",
    meta: "Daily check",
    type: "confirm",
    logType: "food_check",
  },
  {
    id: "fire-walk",
    category: "fire",
    name: "Fire exits & extinguishers — visual",
    meta: "Daily walk",
    type: "checklist",
    logType: "fire_check",
  },
  {
    id: "handwash",
    category: "hs",
    name: "Handwash stations stocked",
    meta: "Twice daily",
    type: "confirm",
    logType: "food_check",
  },
  {
    id: "closing",
    category: "food",
    name: "Closing temperature & clean-down",
    meta: "Due at close · 22:00",
    type: "temps",
    logType: "fridge_check",
  },
];
