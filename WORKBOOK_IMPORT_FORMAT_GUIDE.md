# Best Collective Kit Factory Import Format Guide

Use this guide when creating a `.md`, `.txt`, or `.docx` file that you want the Kit Factory importer to read cleanly.

The best import format is simple Markdown/text with clear labels. The app is looking for structure more than formatting.

## Best File Type

Recommended:

```text
.md
```

Also works:

```text
.txt
.docx
```

Avoid using PDF as the source file. PDF should be the final output after the kit is built.

## The Main Rule

Every page needs a clear page label.

Good:

```text
Lesson Page: Know What You Are Building
Body: Before you build the full kit, define what the first version should help the reader do.
```

Risky:

```text
Know what you are building before you start.
```

The risky version may import, but the app has to guess what kind of page it is.

## Kit Info Format

Start the file with kit-level information.

```text
Kit Name: Test Kit Erica
Subtitle: A Best Collective workbook
Branch: Brand
Audience: Business owners
Tone: Clear, warm, practical
Tagline: A simple workbook to help the reader take the next right step.
```

Approved branch values:

```text
Brand
Rise
Land
Rebuild
Heal
```

If branch is blank or misspelled, the app may default to a general style or show a warning.

## Import-Safe Page Labels

Use these exact labels when possible:

```text
Cover Page:
Start Here Page:
Section Divider:
Module Intro Page:
Lesson Page:
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
Progress Check Page:
Closing / Next Steps Page:
Back Cover Page:
```

Each page label creates one Builder block. Some blocks can create extra print pages later if they overflow.

## Page Count Rule

One page label usually becomes one workbook page.

This file creates about three pages:

```text
Cover Page: My Kit

Lesson Page: First Lesson
Body: Short lesson text.

Workbook Page: First Prompt
Prompt: What is one next step?
```

If you expected 10 pages but got 18, the file probably had 18 page labels or overflow content created continuation pages.

## Overflow Rules

The app may create continuation pages when content is long:

- Lesson body over about 1400 characters or 6 paragraphs
- Table over 8 rows
- Checklist over 12 items
- Very long prompts can trigger warnings

This is expected. The app should not shrink text tiny or crowd the page.

## Required Field Rules

Blank fields stay blank. The app should not invent sample content.

To avoid QC blockers, give these pages the right fields:

- Lesson Page needs a title and body.
- Workbook Page needs a title and prompt.
- Checklist Page needs at least one checklist item.
- Table / Tracker Page needs headers and at least one filled row.
- Notes, Reflection, and Prompt pages work best with a title, prompt, and writing lines.

## Writing Lines

For writing pages, add `Writing Lines:` when you want to control space.

```text
Workbook Page: Define Your First Build
Prompt: What are you building first, who is it for, and what result should it create?
Writing Lines: 12
```

Recommended range:

```text
4 to 20
```

If you leave writing lines blank, the Builder may use its default or show a warning.

## Lesson-Only File

Use this when you only want to upload lesson content.

```text
Kit Name: Test Kit Erica
Subtitle: Lesson-only import test
Branch: Brand
Audience: Business owners
Tone: Clear, warm, practical
Tagline: A simple lesson import test.

Lesson Page: Know What You Are Building
Body: Before you build the full kit, define what the first version should help the reader do.

A strong workbook helps the reader move from confusion to clarity with simple, focused steps.

Lesson Page: Choose the First Result
Body: The first version of a kit does not need to solve everything.

It should create one useful result the reader can feel, name, or complete.
```

Expected result:

- Two Lesson Page blocks
- No workbook prompts unless you add Workbook Page labels
- No sample content

## Workbook-Only File

Use this when you only want writing pages.

```text
Kit Name: Test Kit Erica
Subtitle: Workbook-only import test
Branch: Brand
Audience: Business owners
Tone: Clear, warm, practical
Tagline: A simple workbook import test.

Workbook Page: Define Your First Build
Prompt: What are you building first, who is it for, and what result should it create?
Writing Lines: 12

Reflection Page: What Feels Clear
Prompt: What feels clearer after naming the first version of this kit?
Writing Lines: 10

Action Plan Page: Choose Your Next Three Steps
Body: Write the next three steps you will take to move this kit forward.
```

Expected result:

- Workbook Page block
- Reflection Page block
- Action Plan Page block
- No lesson pages unless you add Lesson Page labels

## Full Kit Starter Template

Copy this when you want a complete test kit.

```text
Kit Name: Test Kit Erica
Subtitle: A Best Collective workbook
Branch: Brand
Audience: Business owners
Tone: Clear, warm, practical
Tagline: A simple workbook to help the reader take the next right step.

Cover Page: Test Kit Erica
Body: This workbook helps you clarify what you are building and turn it into a simple action plan.

Start Here Page: How To Use This Workbook
Body: Move through each page in order. Keep your answers simple and focus on one clear next step at a time.

Section Divider: Module One
Body: Start by naming the result this kit should create.

Module Intro Page: Build the First Version
Body: This module helps you focus on the first useful version instead of trying to build everything at once.

Lesson Page: Know What You Are Building
Body: Before you build anything, name the result you want the workbook to create.

The clearer the result, the easier it is to shape the lessons, prompts, and action steps.

Quote / Opening Thought Page: Keep the First Version Simple
Body: A clear first version is better than a crowded final version that never gets finished.

Workbook Page: Define Your First Build
Prompt: What are you building first, who is it for, and what result should it create?
Writing Lines: 12

Checklist Page: Builder Checklist
- Name the kit
- Choose the branch
- Write the first lesson
- Add one workbook prompt
- Review the PDF

Table / Tracker Page: Build Tracker
Headers: Task, Status, Notes
Row: Draft lesson, Done, Keep it focused
Row: Add workbook prompt, In progress, Keep prompt short
Row: Test PDF, Not started, Review before export

Notes Page: Reflection Notes
Prompt: What needs to be clearer before this kit is ready?
Writing Lines: 12

Reflection Page: What Is Working
Prompt: What part of this kit already feels useful?
Writing Lines: 10

Action Plan Page: Next Three Steps
Body: Choose the next three steps that will move this kit toward a clean first version.

Resource Page: Helpful Links and Reminders
Body: Add any tools, links, reminders, or references that support this kit.

Case Study / Example Page: Example Answer
Body: Show a simple example of how a reader might complete one of the workbook prompts.

Prompt Page: Main Writing Prompt
Prompt: What is the most important decision you need to make before this kit is ready?
Writing Lines: 12

Progress Check Page: Review Your Progress
Body: Confirm what is finished.
Confirm what still needs work.
Choose the next action.

Closing / Next Steps Page: What To Do Next
Body: Review your answers, choose your top three next actions, and revisit the kit in 30 days.

Back Cover Page: Your Next Step
Body: Use this workbook as a clear starting point. Keep the next step simple and visible.
```

## Page Type Examples

### Cover Page

```text
Cover Page: Test Kit Erica
Body: This workbook helps you clarify what you are building.
```

### Start Here Page

```text
Start Here Page: How To Use This Workbook
Body: Start at the beginning, move in order, and keep your answers simple.
```

### Section Divider

```text
Section Divider: Module One
Body: Begin with clarity before moving into action.
```

### Module Intro Page

```text
Module Intro Page: Build the First Version
Body: This module helps you choose the first useful version of the kit.
```

### Lesson Page

```text
Lesson Page: Know What You Are Building
Body: Before you build the full kit, define the first result this kit should create.
```

### Quote / Opening Thought Page

```text
Quote / Opening Thought Page: A Simple Start
Body: The first version does not need to do everything. It needs to do one useful thing clearly.
```

### Workbook Page

```text
Workbook Page: Define Your First Build
Prompt: What are you building first, who is it for, and what result should it create?
Writing Lines: 12
```

### Checklist Page

```text
Checklist Page: Launch Checklist
- Confirm the kit title
- Confirm the branch
- Review the workbook preview
- Export the PDF
```

### Table / Tracker Page

```text
Table / Tracker Page: Build Tracker
Headers: Task, Status, Notes
Row: Draft lesson, Done, Keep it focused
Row: Add workbook prompt, In progress, Keep prompt short
Row: Test PDF, Not started, Review before export
```

Use three headers and three values per row when possible.

### Notes Page

```text
Notes Page: Notes
Prompt: What do you want to remember from this section?
Writing Lines: 12
```

### Reflection Page

```text
Reflection Page: What Feels Clear
Prompt: What feels clearer after completing this section?
Writing Lines: 10
```

### Action Plan Page

```text
Action Plan Page: Next Three Steps
Body: Choose three actions you can complete next.
```

### Resource Page

```text
Resource Page: Tools and Reminders
Body: Add helpful links, tools, terms, reminders, or references here.
```

### Case Study / Example Page

```text
Case Study / Example Page: Example Answer
Body: Show a sample answer or scenario that helps the reader understand what good work looks like.
```

### Prompt Page

```text
Prompt Page: Main Decision
Prompt: What is the most important decision you need to make before moving forward?
Writing Lines: 12
```

### Progress Check Page

```text
Progress Check Page: Review Your Progress
Body: What is finished?
What still needs work?
What is the next action?
```

### Closing / Next Steps Page

```text
Closing / Next Steps Page: What To Do Next
Body: Review your answers, choose the top three next actions, and revisit the kit in 30 days.
```

### Back Cover Page

```text
Back Cover Page: Your Next Step
Body: You have everything you need to take the next step with clarity.
```

Back Cover is optional. Do not add it unless the kit needs a closing page.

## Table Rules

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

The app needs `Headers:` and `Row:` lines to build a real table.

## Checklist Rules

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

Use one checklist item per line.

## Common Import Problems

### Missing Title

Problem:

```text
Lesson Page:
Body: This lesson has no title.
```

Fix:

```text
Lesson Page: Know What You Are Building
Body: This lesson has a clear title.
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

### Table Has No Rows

Problem:

```text
Table / Tracker Page: Build Tracker
Headers: Task, Status, Notes
```

Fix:

```text
Table / Tracker Page: Build Tracker
Headers: Task, Status, Notes
Row: Draft lesson, Done, Looks good
```

## Words To Avoid In Test Files

The importer/QC may flag sample or placeholder language.

Avoid:

```text
sample
placeholder
lorem ipsum
TODO
insert here
replace this
test ccccc
dummy text
```

Use real working text, even if it is short.

## Best Writing Rules

- One page equals one idea.
- Use clear page labels.
- Use `Body:` for teaching or explanation.
- Use `Prompt:` for workbook, notes, reflection, and prompt pages.
- Use `Writing Lines:` for writing pages.
- Use `Headers:` and `Row:` for tables.
- Use `-` for checklist items.
- Keep lesson pages focused.
- Keep workbook prompts short.
- Do not paste the whole workbook into one block.
- Do not use sample content unless you are intentionally testing sample content.

## 20-Page And 40-Page Tests

To test page warnings, repeat short blocks.

Normal:

- 1 to 20 pages
- No large workbook warning

Large workbook:

- 21 to 40 pages
- Shows large workbook warning
- Export still allowed

Review before export:

- 41+ pages
- Shows stronger review warning
- Export still allowed

Short repeatable lesson:

```text
Lesson Page: Test Lesson 01
Body: This is a short page-count test lesson.
```

Short repeatable workbook page:

```text
Workbook Page: Test Prompt 01
Prompt: What is one next step?
Writing Lines: 8
```

Avoid long text during page-count tests because overflow pages can make the final PDF page count higher.

## Best Workflow

1. Write the kit in `.md` first.
2. Use the exact labels from this guide.
3. Import into Paste Importer.
4. Run Import QC.
5. Fix blockers.
6. Create Builder draft.
7. Review and edit in Builder.
8. Run QC.
9. Generate workbook PDF.
10. Generate How-To PDF if needed.
11. Generate Lesson Guide if this kit will be taught or reviewed.
12. Track the package in Package Export.

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
Writing Lines: 10

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
- Checklist block
- Table block
- Back Cover block
- No sample content
