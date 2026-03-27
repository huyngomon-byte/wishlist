import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "../firebase/config";
import {
  CALENDAR_MILESTONES_KEY,
  readCustomMilestones,
  saveCustomMilestones,
} from "./anniversary";
import type { CustomMilestone } from "./anniversary";

const calendarDocRef = doc(db, "appConfig", "calendar");
const legacyMilestonesCollection = collection(db, "milestones");

type CalendarDoc = {
  milestones?: CustomMilestone[];
};

type LegacyCalendarDoc = {
  title?: string;
  date?: string;
  note?: string;
};

const normalizeMilestones = (items: unknown): CustomMilestone[] => {
  if (!Array.isArray(items)) return [];

  return items
    .map((item) => {
      if (!item || typeof item !== "object") return null;

      const value = item as Partial<CustomMilestone>;
      if (!value.id || !value.title || !value.date) return null;

      return {
        id: value.id,
        title: value.title,
        date: value.date,
        note: value.note || "",
      };
    })
    .filter((item): item is CustomMilestone => item !== null)
    .sort((first, second) => first.date.localeCompare(second.date));
};

const createMilestoneId = () => {
  if ("randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.round(Math.random() * 100000)}`;
};

const readLegacyCollectionMilestones = async () => {
  const snapshot = await getDocs(query(legacyMilestonesCollection, orderBy("date", "asc")));

  return snapshot.docs.map((item) => {
    const data = item.data() as LegacyCalendarDoc;

    return {
      id: item.id,
      title: data.title || "",
      date: data.date || "",
      note: data.note || "",
    };
  });
};

const writeCalendarDoc = async (items: CustomMilestone[]) => {
  await setDoc(
    calendarDocRef,
    {
      milestones: items,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
};

const syncLegacyCollection = async (items: CustomMilestone[]) => {
  const existing = await readLegacyCollectionMilestones();
  const existingIds = new Set(existing.map((item) => item.id));
  const incomingIds = new Set(items.map((item) => item.id));

  await Promise.all(
    items.map((item) =>
      setDoc(doc(db, "milestones", item.id), {
        title: item.title,
        date: item.date,
        note: item.note,
        updatedAt: serverTimestamp(),
      }),
    ),
  );

  await Promise.all(
    existing
      .filter((item) => existingIds.has(item.id) && !incomingIds.has(item.id))
      .map((item) => deleteDoc(doc(db, "milestones", item.id))),
  );
};

const writeEverywhere = async (items: CustomMilestone[]) => {
  const normalized = normalizeMilestones(items);

  await Promise.all([writeCalendarDoc(normalized), syncLegacyCollection(normalized)]);
  saveCustomMilestones(normalized);
};

export const subscribeToMilestones = (callback: (items: CustomMilestone[]) => void) =>
  onSnapshot(query(legacyMilestonesCollection, orderBy("date", "asc")), (snapshot) => {
    const items = snapshot.docs.map((item) => {
      const data = item.data() as LegacyCalendarDoc;

      return {
        id: item.id,
        title: data.title || "",
        date: data.date || "",
        note: data.note || "",
      };
    });

    saveCustomMilestones(items);
    callback(items);
  });

export const ensureCalendarStoreReady = async () => {
  const [calendarSnapshot, legacyRemoteItems] = await Promise.all([
    getDoc(calendarDocRef),
    readLegacyCollectionMilestones(),
  ]);

  const documentItems = normalizeMilestones((calendarSnapshot.data() as CalendarDoc | undefined)?.milestones);

  if (legacyRemoteItems.length > 0) {
    saveCustomMilestones(legacyRemoteItems);

    if (JSON.stringify(legacyRemoteItems) !== JSON.stringify(documentItems)) {
      await writeCalendarDoc(legacyRemoteItems);
    }

    return;
  }

  if (documentItems.length > 0) {
    await writeEverywhere(documentItems);
    return;
  }

  const localItems = normalizeMilestones(readCustomMilestones());
  if (localItems.length > 0) {
    await writeEverywhere(localItems);
    localStorage.removeItem(CALENDAR_MILESTONES_KEY);
  }
};

export const addMilestoneToStore = async (item: Omit<CustomMilestone, "id">) => {
  const existing = await readLegacyCollectionMilestones();

  await writeEverywhere([
    ...existing,
    {
      id: createMilestoneId(),
      ...item,
    },
  ]);
};

export const removeMilestoneFromStore = async (id: string) => {
  const existing = await readLegacyCollectionMilestones();

  await writeEverywhere(existing.filter((item) => item.id !== id));
};
