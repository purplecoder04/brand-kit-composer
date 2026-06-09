import { BRAND_PROFILE } from "./branch-profile";
import type { Kit } from "./kit-types";

export const SAMPLE_KIT: Kit = {
  id: "sample-gybs",
  name: "Get Your Business Straight",
  branch: "Brand",
  audience: "Founders building a focused service business",
  tone: "Clear, practical, supportive, professional",
  description:
    "A focused kit to help founders get their business operations, priorities, and tracking systems in order.",
  lessonGuide:
    "Three short lessons covering priorities, weekly planning, and review rhythms.",
  workbook: "Prompts and worksheets to translate the lessons into action.",
  tracker: "A weekly tracker for top three priorities and follow-through.",
  branchProfile: BRAND_PROFILE,
  version: "v1",
  status: "Template Test",
  qcStatus: "Needs Review",
  dochubStatus: "Not Ready",
  updatedAt: "2026-06-01T00:00:00.000Z",
  blocks: [
    {
      id: "b1",
      pageType: "cover",
      order: 1,
      title: "Get Your Business Straight",
      subtitle: "A Best Collective Brand Kit",
      body: "A practical guide for founders ready to focus, plan, and follow through.",
    },
    {
      id: "b2",
      pageType: "divider",
      order: 2,
      title: "Section One",
      subtitle: "Foundations",
    },
    {
      id: "b3",
      pageType: "lesson",
      order: 3,
      title: "Set Your Priorities",
      subtitle: "Lesson One",
      body:
        "Most founders are not behind because they are lazy. They are behind because everything feels urgent.\n\nIn this lesson, you will learn how to separate the work that grows your business from the work that simply fills your day. You will end the week with a short, honest list of priorities that match where you are going.\n\nThe goal is not to do more. The goal is to do the right things, on purpose, on a schedule you can keep.",
    },
    {
      id: "b4",
      pageType: "table",
      order: 4,
      title: "Weekly Focus Tracker",
      subtitle: "Pick three. Protect them.",
      tableData: {
        headers: ["Area", "Action", "Deadline"],
        rows: [
          ["Sales", "Follow up with five qualified leads", "Friday"],
          ["Marketing", "Publish one long-form post", "Wednesday"],
          ["Operations", "Document one repeatable process", "Thursday"],
          ["Finance", "Reconcile last week's invoices", "Tuesday"],
          ["Client", "Send weekly check-in to top account", "Monday"],
          ["Team", "Hold one focused 30-minute sync", "Wednesday"],
        ],
      },
    },
    {
      id: "b5",
      pageType: "workbook",
      order: 5,
      title: "Your Top Three",
      subtitle: "Workbook",
      prompt:
        "Write the three priorities that will move your business forward this week. Be specific. A priority is something you can finish, not a feeling.",
      lines: 14,
    },
  ],
};