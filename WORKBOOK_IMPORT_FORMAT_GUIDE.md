# Best Collective Kit Factory Workbook Import Guide

Use this guide when writing a `.md`, `.txt`, or `.docx` file for the Kit Factory importer.

The app reads structure. It does not need fancy formatting. The cleaner the labels, the cleaner the workbook.

## Best File Type

Best source file:

```text
.md
```

Also works:

```text
.txt
.docx
```

Use PDF only after the workbook is already built and styled. PDF is now the final fillable base file, not the best writing/import source.

## The Main Rule

Every page needs a page label.

Good:

```text
Lesson Page: Know What You Are Building
Body: Before you build the full kit, define what the first version should help the reader do.
```

Risky:

```text
Know what you are building before you start.
```

The risky version may import, but the app has to guess.

## Choose The File You Are Making First

Before writing the file, decide which product piece this is.

Most Best Collective products should use **two separate source files**:

```text
1. Lesson Guide file = teaching / reading content
2. Workbook file = writing prompts / checklists / tables / activities
```

This matters because the importer follows the labels you give it.

If a workbook file contains `Lesson Page:` labels with full teaching text, the app will build lesson pages inside the workbook. That makes the workbook longer and harder to make fillable.

### Lesson Guide File

Use this when the file is mainly teaching.

Good labels:

```text
Lesson Page:
Module Intro Page:
Section Divider:
Quote / Opening Thought Page:
Case Study / Example Page:
Resource Page:
Closing / Next Steps Page:
```

Example:

```text
Lesson Page: Choosing Your Business Name
Body: A business name should be useful, not just cute. This lesson explains how to choose a name that is clear, searchable, and realistic to use online.
```

### Workbook File

Use this when the file is mainly for the buyer to write, check off, track, or plan.

Good labels:

```text
Workbook Page:
Prompt Page:
Multi-Prompt Page:
Checklist Page:
Table / Tracker Page:
Reflection Page:
Action Plan Page:
Progress Check Page:
Notes Page:
Back Cover Page:
```

Example:

```text
Multi-Prompt Page: Choosing Your Business Name
Body: Use this page to narrow your name before buying domains, logos, or printed materials.

Prompt: What business names are you considering?
Writing Lines: 4

Prompt: Which name is easiest to say, spell, and remember?
Writing Lines: 4

Bottom Note: Beginner mistake to avoid: buying a logo before checking whether the name is realistic to use.
```

### When To Use Lesson Activity Page

Use `Lesson Activity Page:` only when you intentionally want one page to include:

```text
short teaching text + checklist/action steps/writing prompt
```

Do not use it for full lessons. Keep full lessons in the Lesson Guide.

## Kit Info

Put kit info at the top of the file.

```text
Kit Name: Cook With Confidence
Subtitle: A simple kitchen confidence workbook
Branch: Brand
Audience: Beginner home cooks
Tone: Clear, warm, practical
Tagline: Build kitchen confidence one small meal at a time.
```

Approved branches:

```text
Brand
Rise
Land
Rebuild
Heal
```

## Branch Rule: One File = One Branch

For branch kits, keep the source file focused on one branch at a time.

Good:

```text
Branch: Rise
```

Also good:

```text
Branch: Land
```

Do not put every branch in the same source file like this:

```text
Branch: Rise
Branch: Land
Branch: Heal
Branch: Brand
Branch: Rebuild
```

That makes the importer guess which branch the kit should use. If you want the same workbook for more than one branch, make one copy of the file per branch and change only the `Branch:` value.

Use these clean branch values:

```text
Branch: Brand
Branch: Rise
Branch: Land
Branch: Rebuild
Branch: Heal
```

## Rise / Land / Heal File Pattern

Self-help and relationship kits should usually be split into two files:

```text
Lesson Guide file = teaching
Workbook file = prompts, reflection, checklist, action steps
```

### Lesson Guide Example

```text
Kit Name: Why Do Men Come Back?
Subtitle: And Why Do I Let Him Come Back?
Branch: Rise
Audience: Women reviewing relationship patterns
Tone: Warm, honest, emotionally grounded
Tagline: Understand the return before you trust the repair.

Cover Page: Why Do Men Come Back?
Body: And Why Do I Let Him Come Back?

Section Divider: Part 1 - Why Do Men Come Back?

Lesson Page: The Return Is Not the Repair
Body: Help the reader understand that coming back is not the same as changing.

Why This Matters

Lesson text goes here.

The Lesson

Main teaching goes here.

What This Can Look Like In Real Life

- Example one
- Example two
- Example three

What This Chapter Is Really Saying

Short summary.

Bottom Note: A return is not proof. The behavior after the return is the answer.
```

### Matching Workbook Example

```text
Kit Name: Why Do Men Come Back?
Subtitle: Workbook
Branch: Rise
Audience: Women reviewing relationship patterns
Tone: Warm, honest, emotionally grounded
Tagline: Understand the return before you trust the repair.

Cover Page: Why Do Men Come Back?
Body: Workbook

Section Divider: Chapter 1 Reflection

Multi-Prompt Page: The Return Is Not the Repair
Body: Use this page to separate the feeling of the return from the proof of real repair.

Prompt: What did his return make you feel?
Writing Lines: 4

Prompt: What are you hoping his return means?
Writing Lines: 4

Prompt: What behavior would prove real change?
Writing Lines: 4

Prompt: What behavior would prove this is the same pattern?
Writing Lines: 4

Checklist Page: Pattern Check
- He returned with accountability.
- He returned with pressure.
- He returned with changed behavior.
- He returned with the same excuses.

Action Plan Page: One Next Step
Body: Before deciding anything, write down what would need to be different this time.
```

To make a Land version, change only the branch:

```text
Branch: Land
```

To make a Heal version, change only the branch:

```text
Branch: Heal
```

## Page Labels The App Understands

Use these labels exactly when possible:

```text
Cover Page:
Start Here Page:
Section Divider:
Module Intro Page:
Lesson Page:
Lesson Activity Page:
Quote / Opening Thought Page:
Workbook Page:
Checklist Page:
Table / Tracker Page:
Notes Page:
Reflection Page:
Action Plan Page:
Resource Page:
Case Study / Example Page:
Prompt Page:
Multi-Prompt Page:
Progress Check Page:
Closing / Next Steps Page:
Back Cover Page:
```

One page label usually creates one Builder block. Long content can create continuation pages later.

## When To Use Each Page Type

Use **Lesson Page** for teaching.

```text
Lesson Page: Cook One Good Breakfast
Body: Breakfast does not need to be complicated. Choose one simple meal you can repeat until it feels easy.
```

Use **Lesson Activity Page** when teaching and a checklist/action/prompt should stay on the same page.

Checklist example:

```text
Lesson Activity Page: Set Up Your Kitchen
Body: Start with one simple setup choice. You do not need a perfect kitchen to cook with more confidence.

Activity Type: Checklist
Activity Title: Remember This
Checklist:
- Keep one clear counter space
- Put your most-used pan where you can reach it
- Choose one meal to practice first

Bottom Note: Small setup choices make cooking feel less overwhelming.
```

Action steps example:

```text
Lesson Activity Page: Choose Your First Meal
Body: Pick one meal that is simple enough to repeat. The goal is confidence, not complexity.

Activity Type: Action Steps
Activity Title: Try This
Action Steps:
- Pick one breakfast, lunch, or dinner
- Write the ingredients you already have
- Choose the next time you will cook it
```

Writing prompt example:

```text
Lesson Activity Page: Plan Your First Meal
Body: Keep the first meal small and realistic.

Activity Type: Writing Prompt
Activity Title: Your First Plan
Prompt: What meal will you make first, and what do you need before you start?
Writing Lines: 4
Bottom Note: One clear meal is enough to begin.
```

Use **Workbook Page** for one main prompt with writing space.

```text
Workbook Page: Cook One Good Breakfast
Prompt: What is one breakfast you would like to make well, and what do you need to prep before the week starts?
Writing Lines: 4
```

Use **Prompt Page** for one prompt page with writing lines. Prompt pages default best to 4 lines.

```text
Prompt Page: One Kitchen Decision
Prompt: What is one small kitchen decision you can make today?
Writing Lines: 4
```

Use **Multi-Prompt Page** when several short prompts should stay on the same page.

```text
Multi-Prompt Page: Pantry Planning

Prompt: What three staples are running low right now?
Writing Lines: 3

Prompt: What is one item you keep buying but never finish?
Writing Lines: 2

Prompt: What do you want to add to your next shopping list?
Writing Lines: 3
```

Do not write this if you want prompts on the same page:

```text
Prompt Page: First prompt
Prompt: What is one thing?

Prompt Page: Second prompt
Prompt: What is another thing?
```

That can turn into separate pages. Use `Multi-Prompt Page:` instead.

Use **Notes Page** for open notes.

```text
Notes Page: Kitchen Notes
Prompt: What do you want to remember from this section?
Writing Lines: 12
```

Use **Reflection Page** for deeper thinking.

```text
Reflection Page: What Feels Easier Now
Prompt: What feels easier after practicing these meals?
Writing Lines: 10
```

Use **Checklist Page** for checkboxes.

```text
Checklist Page: Pantry Starter Checklist
- Stock cooking oil and salt
- Add a grain like rice or pasta
- Keep canned beans or tomatoes on hand
- Choose three spices you use often
```

Use **Table / Tracker Page** for real table rows.

```text
Table / Tracker Page: Meal Practice Tracker
Headers: Meal, Status, Notes
Row: Breakfast, Tried once, Needs prep
Row: Lunch, Not started, Pick one recipe
Row: Dinner, Comfortable, Repeat next week
```

Use **Action Plan Page** for next steps.

```text
Action Plan Page: Your Next Three Meals
Body: Choose the next three meals you will practice this week.
```

Use **Bottom Note** on pages that need a small encouragement or reminder near the bottom.

```text
Bottom Note: You do not need to finish everything today. Just choose the next honest step.
```

Bottom notes work best on Lesson, Lesson Activity, Workbook, Prompt, Reflection, Action Plan, Progress Check, and Closing pages.

Use **Back Cover Page** only when you want an optional closing page.

```text
Back Cover Page: Your Next Step
Body: Keep this workbook close and repeat the meals that help you feel steady.
```

## Writing Lines

For workbook-style pages, use one of these labels:

```text
Writing Lines: 4
Lines: 4
Writing Line Count: 4
```

Recommended range:

```text
4 to 20
```

Current defaults:

- Prompt Page: use 4 lines unless you need more.
- Workbook Page: use 4 to 12 lines depending on the page.
- Notes and Reflection: often use 10 to 12 lines.
- Multi-Prompt Page: each prompt should have its own `Writing Lines:` value.

If you leave writing lines blank, the app may use a default or show a warning.

## Page Count Rules

One page label usually equals one workbook page.

The app may create extra pages when content overflows:

- Lesson body over about 1400 characters or 6 paragraphs
- Table over 8 rows
- Checklist over 12 items
- Long writing pages or long prompts

If you expected 10 pages and got 18, check:

- Did the file have 18 page labels?
- Did several prompts use `Prompt Page:` instead of one `Multi-Prompt Page:`?
- Did long lessons create continuation pages?
- Did long tables or checklists continue?

## Page Count Warnings

The app guides page count but does not block export.

- 1 to 20 pages: normal
- 21 to 40 pages: large workbook warning
- 41+ pages: review before export warning

## Required Fields For QC

Blank fields stay blank. The app should not invent sample content.

To avoid blockers:

- Lesson Page needs title and body.
- Lesson Activity Page needs title, body, and either checklist/action items or a writing prompt.
- Workbook Page needs title and prompt.
- Checklist Page needs at least one checklist item.
- Table / Tracker Page needs headers and at least one filled row.
- Notes, Reflection, Prompt, and Multi-Prompt pages should have prompts and writing lines.

## Full Real Notebook Starter: Split Files

Use these two starter shapes when the Lesson Guide and Workbook are separate products.

### File 1: Lesson Guide Source

This file is for teaching. It should not include writing lines unless you intentionally want notes inside the guide.

```text
Kit Name: Cook With Confidence
Subtitle: Lesson guide
Branch: Brand
Audience: Beginner home cooks
Tone: Clear, warm, practical
Tagline: Build kitchen confidence one small meal at a time.

Cover Page: Cook With Confidence Lesson Guide
Body: A simple lesson guide for building kitchen confidence without overwhelm.

Start Here Page: How To Use This Lesson Guide
Body: Read each lesson in order. Use the matching workbook pages when you are ready to write, plan, or practice.

Section Divider: Part One
Body: Start with small meals that help the kitchen feel easier.

Module Intro Page: Kitchen Confidence Basics
Body: This module helps you choose simple meals, repeat what works, and reduce decision fatigue.

Lesson Page: Set Up Your Kitchen
Body: A good kitchen setup does not need to be fancy. Start by making the tools you use most easy to reach.

Lesson Page: Cook One Good Breakfast
Body: Breakfast does not need to be complicated. Choose one simple meal you can repeat until it feels easy.

Lesson Page: Pantry Planning
Body: Pantry confidence starts with knowing what you already use, what you waste, and what makes meals easier.

Closing / Next Steps Page: Keep Cooking Simply
Body: Repeat the meals that work. Add one new meal only when you feel ready.
```

### File 2: Workbook Source

This file is for writing, checklists, trackers, and action pages. It can include a short setup sentence, but it should not include full lesson teaching.

```text
Kit Name: Cook With Confidence Workbook
Subtitle: Workbook and action planner
Branch: Brand
Audience: Beginner home cooks
Tone: Clear, warm, practical
Tagline: Build kitchen confidence one small meal at a time.

Cover Page: Cook With Confidence Workbook
Body: A simple workbook for building kitchen confidence without overwhelm.

Start Here Page: How To Use This Workbook
Body: Complete the pages in order. Keep your answers simple and focus on one small kitchen win at a time.

Multi-Prompt Page: Set Up Your Kitchen
Body: Use this page to make your kitchen easier to use this week.

Prompt: What three tools do you reach for most?
Writing Lines: 4

Prompt: What is one thing you can clear off your counter today?
Writing Lines: 4

Bottom Note: Small setup choices make cooking feel less overwhelming.

Multi-Prompt Page: Pantry Planning
Body: Use this page to review what you have, what you waste, and what you need.

Prompt: What three staples are running low right now?
Writing Lines: 3

Prompt: What is one item you keep buying but never finish?
Writing Lines: 2

Prompt: What do you want to add to your next shopping list?
Writing Lines: 3

Checklist Page: Pantry Starter Checklist
- Stock cooking oil and salt
- Add a grain like rice or pasta
- Keep canned beans or tomatoes on hand
- Choose three spices you use often
- Clear out anything expired

Table / Tracker Page: Meal Practice Tracker
Headers: Meal, Status, Notes
Row: Breakfast, Tried once, Needs prep
Row: Lunch, Not started, Pick one recipe
Row: Dinner, Comfortable, Repeat next week

Reflection Page: What Feels Easier Now
Prompt: What feels easier after practicing these meals?
Writing Lines: 10

Action Plan Page: Your Next Three Meals
Body: Choose the next three meals you will practice this week.

Progress Check Page: Review Your Kitchen Confidence
Body: What feels easier?
What still needs practice?
What is your next small kitchen win?

Closing / Next Steps Page: Keep Cooking Simply
Body: Repeat the meals that work. Add one new meal only when you feel ready.

Back Cover Page: Your Next Step
Body: Keep this workbook close and come back when you need a simple reset.
```

### Optional Mixed Page

If one workbook page truly needs a short teaching note plus a checklist or prompt, use `Lesson Activity Page:`.

```text
Lesson Activity Page: Set Up Your Kitchen
Body: Start with one simple setup choice. You do not need a perfect kitchen to cook with more confidence.

Activity Type: Checklist
Activity Title: Remember This
Checklist:
- Keep one clear counter space
- Put your most-used pan where you can reach it
- Choose one meal to practice first

Bottom Note: Small setup choices make cooking feel less overwhelming.
```

## Full Page Type Quick Examples

```text
Cover Page: Kit Title
Body: Short cover description.

Start Here Page: How To Use This Workbook
Body: Short instructions for using the workbook.

Section Divider: Module One
Body: Short section intro.

Module Intro Page: Module Title
Body: What this module helps the reader do.

Lesson Page: Lesson Title
Body: Teaching content goes here.

Quote / Opening Thought Page: A Simple Thought
Body: One quote, thought, or short idea.

Workbook Page: Workbook Title
Prompt: One main workbook question.
Writing Lines: 8

Checklist Page: Checklist Title
- First item
- Second item

Table / Tracker Page: Tracker Title
Headers: Task, Status, Notes
Row: First task, Done, Short note

Notes Page: Notes Title
Prompt: What do you want to remember?
Writing Lines: 12

Reflection Page: Reflection Title
Prompt: What are you noticing?
Writing Lines: 10

Action Plan Page: Action Title
Body: Choose the next steps.

Resource Page: Resource Title
Body: Add links, tools, terms, reminders, or references.

Case Study / Example Page: Example Title
Body: Show a sample answer, scenario, or example.

Prompt Page: Prompt Title
Prompt: One main prompt.
Writing Lines: 4

Multi-Prompt Page: Prompt Group Title
Prompt: First short prompt?
Writing Lines: 3
Prompt: Second short prompt?
Writing Lines: 3

Progress Check Page: Progress Title
Body: What is done?
What needs work?
What comes next?

Closing / Next Steps Page: Final Step
Body: Close with the next action.

Back Cover Page: Back Cover Title
Body: Optional closing message.
```

## Table Rules

Tables need headers and rows.

Good:

```text
Table / Tracker Page: Offer Tracker
Headers: Offer, Status, Notes
Row: Starter kit, Drafted, Needs preview
Row: Workbook PDF, Ready, Export in Chrome
```

Avoid:

```text
Table / Tracker Page: Offer Tracker
Body: Here is a table about offers.
```

## Checklist Rules

Use one checklist item per line.

Good:

```text
Checklist Page: Review Checklist
- Check the title
- Check the branch
- Check the PDF
```

Avoid:

```text
Checklist Page: Review Checklist
Check the title, check the branch, check the PDF.
```

## Fillable PDF Workflow

The fillable workflow now uses the final styled PDF as the source of truth.

Best flow:

1. Write the kit in `.md`.
2. Import the kit.
3. Create Builder draft.
4. Review Builder pages.
5. Export the final workbook PDF from Chrome.
6. Open Fillable Fields.
7. Reload Latest Builder Draft if needed.
8. Upload the final workbook PDF.
9. Make sure the PDF page count matches the field map page count.
10. Add or auto-place fields.
11. Save Field Map.
12. Export Fillable PDF.

Important:

- The uploaded final workbook PDF must match the Builder/field-map page count.
- If the PDF has 19 pages and the field map has 6 pages, export stays disabled.
- Auto Fields should only be used on fillable pages.
- Start Here, cover, lessons, dividers, closing pages, and back covers should not get auto writing fields unless you manually add fields.

## Common Import Problems

### Prompts Split Into Too Many Pages

Problem:

```text
Prompt Page: Question One
Prompt: What is one thing?
Writing Lines: 3

Prompt Page: Question Two
Prompt: What is another thing?
Writing Lines: 3
```

Fix:

```text
Multi-Prompt Page: Short Reflection

Prompt: What is one thing?
Writing Lines: 3

Prompt: What is another thing?
Writing Lines: 3
```

### Lesson Turns Into Workbook Page

Problem:

```text
Lesson Page: First Lesson
Prompt: This should have been teaching text.
```

Fix:

```text
Lesson Page: First Lesson
Body: This is teaching text.
```

### Workbook Prompt Is Blank

Problem:

```text
Workbook Page: First Build
Body: What are you building first?
```

Fix:

```text
Workbook Page: First Build
Prompt: What are you building first?
Writing Lines: 8
```

### Checklist Has No Items

Problem:

```text
Checklist Page: Launch Checklist
```

Fix:

```text
Checklist Page: Launch Checklist
- Confirm the title
- Review the preview
```

### Table Headers Are Blank

Problem:

```text
Table / Tracker Page: Build Tracker
Row: Draft lesson, Done, Looks good
```

Fix:

```text
Table / Tracker Page: Build Tracker
Headers: Task, Status, Notes
Row: Draft lesson, Done, Looks good
```

## Words To Avoid In Real Kit Files

The importer/QC may flag placeholder language.

Avoid:

```text
sample
placeholder
lorem ipsum
TODO
insert here
replace this
dummy text
test ccccc
```

Use real working text, even if short.

## Best Workflow For A Real Notebook

1. Decide whether this file is the Lesson Guide or the Workbook.
2. For the Lesson Guide, use `Lesson Page` for teaching.
3. For the Workbook, use `Workbook Page`, `Prompt Page`, `Multi-Prompt Page`, `Checklist Page`, `Table / Tracker Page`, `Reflection Page`, and `Action Plan Page`.
4. Do not put full lessons inside the Workbook file unless you truly want lesson pages inside the workbook.
5. Add `Writing Lines:` anywhere you need writing space.
6. Import into **Import Content**.
7. Run Import QC.
8. Fix blockers.
9. Create Builder draft.
10. Review in Builder.
11. Save Version.
12. Export workbook PDF from Chrome.
13. Generate How-To PDF if needed.
14. Generate Lesson Guide if needed.
15. Open Fillable Fields, upload final PDF, save field map, export fillable PDF.
16. Track the kit in Package.

Simple memory rule:

```text
Lesson Guide = read this
Workbook = write this
```

## Quick Pass Test

If this imports cleanly, the basics are working:

```text
Kit Name: Quick Import Test
Subtitle: Basic structure test
Branch: Brand
Audience: Business owners
Tone: Clear and practical
Tagline: A short test kit for import structure.

Cover Page: Quick Import Test
Body: This is a short cover description.

Lesson Page: First Lesson
Body: This is a short lesson.

Workbook Page: First Prompt
Prompt: What is one next step?
Writing Lines: 4

Multi-Prompt Page: First Prompt Group

Prompt: What is one thing you noticed?
Writing Lines: 3

Prompt: What is one thing you will do next?
Writing Lines: 3

Checklist Page: First Checklist
- Confirm the title
- Confirm the branch
- Confirm the PDF

Table / Tracker Page: First Tracker
Headers: Task, Status, Notes
Row: Draft, Done, Looks good

Back Cover Page: Final Step
Body: Review your answers and choose one next action.
```

Expected result:

- Cover block
- Lesson block
- Workbook block
- Multi-Prompt block
- Checklist block
- Table block
- Back Cover block
- No sample content
- No prompts split into separate pages
