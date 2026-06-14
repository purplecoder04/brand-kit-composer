# Best Collective Workbook Import Guide

Use this guide when you want to write a workbook in a text file, Markdown file, or Word document and feed it into the Kit Factory importer with fewer errors.

The goal is simple:

- The app should understand your kit structure.
- The Builder draft should come in clean.
- Import QC should have fewer blockers.
- The PDF should use your content, not guessed or sample content.

## Best File Types

Use one of these:

- `.txt`
- `.md`
- `.docx`

For the cleanest import, write the workbook like a structured outline. Do not make it fancy before importing. The app cares more about clear labels than pretty formatting.

## Golden Rule

Put one clear label before each section.

Good:

```text
Lesson Page: Know What You Are Building
Body: This lesson helps the reader understand what they are creating and why it matters.
```

Risky:

```text
Here is a really important thing about building your workbook...
```

The risky version may import, but the app has to guess what kind of page it is.

## Page Count Rule

Every page-type label creates one Builder block and usually one PDF page.

That means this creates 3 workbook pages:

```text
Cover Page: My Kit

Lesson Page: First Lesson

Workbook Page: First Prompt
```

If a file has 18 page-type labels, the app should create about 18 pages. That is correct behavior.

To control page count:

- Count the page-type labels before importing.
- Use only the labels you want to become real pages.
- Put extra context inside `Body:` or `Prompt:` instead of starting a new page label.
- If the label says `Something Page:`, `Section Divider:`, or `Back Cover Page:`, treat it like a new page.

If you expected 10 pages but got 18, the file probably has 18 page labels. Fix the file first before changing code.

## Import-Safe Page Types

These labels are the safest to use right now:

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

Reflection content can also import well when written as:

```text
Reflection:
Prompt:
```

If a page type does not import the way you expect, change the block type in Builder after import. The safest core types are still Cover, Section Divider, Lesson, Workbook, Checklist, Table / Tracker, Notes, and Back Cover.

## Page Count Warning Tests

Use these tests to confirm the Builder page count warnings are working.

### Normal Test: 1-20 Pages

Make a file with 20 page-type labels or fewer.

Expected result:

- No large workbook warning.
- PDF export should still work.

### Large Workbook Test: 21-40 Pages

Make a file with 21 page-type labels.

Expected warning:

```text
This is becoming a large workbook. Review spacing, page flow, and export quality before selling.
```

PDF export should still work. This warning is guidance only.

### Review Before Export Test: 41+ Pages

Make a file with 41 page-type labels.

Expected warning:

```text
This workbook is over 40 pages. Please review page flow, file size, print quality, and whether it should be split into multiple products before export.
```

PDF export should still work. This warning is guidance only.

### Easy Way To Build A 20 Or 40 Page Test

Repeat short page blocks instead of using long text. Short blocks keep the test focused on page count instead of overflow.

Example repeatable lesson block:

```text
Lesson Page: Test Lesson 01
Body: This is a short page-count test lesson.
```

Example repeatable workbook block:

```text
Workbook Page: Test Prompt 01
Prompt: What is one next step?
```

Example repeatable checklist block:

```text
Checklist Page: Test Checklist 01
- Confirm the title
- Confirm the branch
- Confirm the PDF
```

For a clean count test, avoid very long lesson bodies, long prompts, more than 8 table rows, or more than 12 checklist items. Those can create continuation pages and make the count higher on purpose.

## Top Kit Info

Start every workbook with this kit information:

```text
Kit Name: Test Kit Erica
Subtitle: A simple workbook draft
Branch: Brand
Audience: Business owners
Tone: Clear, warm, practical
Tagline: A short sentence about what this kit helps the reader do.
```

Approved branch values:

```text
Brand
Rise
Land
Rebuild
Heal
```

## Clean Workbook Structure

Use this order for a strong import:

```text
Kit Name:
Subtitle:
Branch:
Audience:
Tone:
Tagline:

Cover Page:
Body:

Section Divider:
Body:

Start Here Page:
Body:

Module Intro Page:
Body:

Lesson Page:
Body:

Quote / Opening Thought Page:
Body:

Workbook Page:
Prompt:

Checklist Page:
- Item one
- Item two
- Item three

Table / Tracker Page:
Headers: Column One, Column Two, Column Three
Row: Answer one, Answer two, Answer three
Row: Answer one, Answer two, Answer three

Notes Page:
Prompt:

Reflection Page:
Prompt:

Action Plan Page:
Body:

Resource Page:
Body:

Case Study / Example Page:
Body:

Prompt Page:
Prompt:

Progress Check Page:
Body:

Closing / Next Steps Page:
Body:

Back Cover Page:
Body:
```

## What Each Page Needs

### Cover Page

Use this for the main kit title and intro.

```text
Cover Page: Test Kit Erica
Body: A short description of what this workbook helps the reader do.
```

Tips:

- Keep the title short.
- Put the longer explanation in Body.
- Do not paste a full lesson on the cover.

### Section Divider

Use this to open a new section or module.

```text
Section Divider: Module One
Body: A short line that explains what this section is about.
```

Tips:

- Keep it short and spacious.
- Use this for pacing, not heavy teaching.

### Lesson Page

Use this for teaching content.

```text
Lesson Page: Know What You Are Building
Body: Before you build the workbook, define the result it creates.

Keep the lesson focused. One page should teach one main idea.
```

Tips:

- Use blank lines between paragraphs.
- Keep lesson bodies focused.
- Very long lessons may create continuation pages.

### Workbook Page

Use this for a writing prompt.

```text
Workbook Page: Define Your First Build
Prompt: What are you building first, who is it for, and what result should it create?
```

Tips:

- Always include Prompt.
- Keep the prompt under 280 characters when possible.
- The app will add writing lines in Builder.

### Checklist Page

Use one item per line.

```text
Checklist Page: Launch Checklist
- Name the kit
- Confirm the branch
- Review the lesson
- Test the PDF export
```

Tips:

- Use `-` for each item.
- Do not put all checklist items in one paragraph.
- Long checklists may create continuation pages.

### Table / Tracker Page

Use headers and rows.

```text
Table / Tracker Page: Build Tracker
Headers: Task, Status, Notes
Row: Draft lesson, Done, Keep it short
Row: Add workbook prompt, In progress, Needs review
Row: Test PDF, Not started, Export after QC
```

Tips:

- Use exactly three headers.
- Use exactly three values per row.
- Do not leave all headers blank.
- Do not leave all rows blank.

### Notes Page

Use this for open writing space.

```text
Notes Page: Notes
Prompt: What do you want to remember from this section?
```

Tips:

- Prompt is optional, but it helps QC and future fillable mapping.
- If you want a blank writing page, use Notes Page with a title.

### Back Cover Page

Use this only if the workbook needs a closing page.

```text
Back Cover Page: Your Next Step
Body: You have everything you need to take the next step with clarity.
```

Tips:

- Back Cover is optional.
- It is not forced onto every workbook.

## Common Import Errors

### Error: Missing title

Cause:

```text
Lesson Page:
Body: This has body text but no lesson title.
```

Fix:

```text
Lesson Page: Know What You Are Building
Body: This has a clear lesson title.
```

### Error: Workbook prompt is blank

Cause:

```text
Workbook Page: First Build
Body: What are you building first?
```

Fix:

```text
Workbook Page: First Build
Prompt: What are you building first?
```

### Error: Checklist has no items

Cause:

```text
Checklist Page: Launch Checklist
```

Fix:

```text
Checklist Page: Launch Checklist
- Check the title
- Check the branch
- Check the PDF
```

### Error: Table headers are blank

Cause:

```text
Table / Tracker Page: Build Tracker
Row: Draft, Done, Looks good
```

Fix:

```text
Table / Tracker Page: Build Tracker
Headers: Task, Status, Notes
Row: Draft, Done, Looks good
```

### Error: Table has no filled rows

Cause:

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

## Best Writing Rules

Follow these to avoid repair work:

- One page equals one idea.
- Keep titles clear and short.
- Use Body for teaching content.
- Use Prompt for workbook, notes, and reflection questions.
- Use bullets for checklists.
- Use Headers and Row for tables.
- Do not paste the whole workbook as one long paragraph.
- Do not use filler markers like lorem ipsum, placeholder, TODO:, [insert...], replace this, sample content, or sample text.
- Do not leave required pages blank unless you want blank pages.

## Copy/Paste Starter Template

Use this as your starting file:

```text
Kit Name: Test Kit Erica
Subtitle: A Best Collective workbook
Branch: Brand
Audience: Business owners
Tone: Clear, warm, practical
Tagline: A simple workbook to help the reader take the next right step.

Cover Page: Test Kit Erica
Body: This workbook helps you clarify what you are building and turn it into a simple action plan.

Section Divider: Start Here
Body: Begin with the big picture before moving into the details.

Start Here Page: How To Use This Workbook
Body: Move through each page in order. Keep your answers simple and focus on one clear next step at a time.

Lesson Page: Know What You Are Building
Body: Before you build anything, name the result you want the workbook to create.

The clearer the result, the easier it is to shape the lessons, prompts, and action steps.

Workbook Page: Define Your First Build
Prompt: What are you building first, who is it for, and what result should it create?

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

Progress Check Page: Review Your Progress
Body: Confirm what is finished
Confirm what still needs work
Choose the next action

Back Cover Page: Your Next Step
Body: Use this workbook as a clear starting point. Keep the next step simple and visible.
```

## Best Workflow

1. Write the workbook in `.txt`, `.md`, or `.docx`.
2. Use the labels from this guide.
3. Upload or paste into Import.
4. Run Import QC.
5. Fix blockers before creating a Builder draft.
6. Create Builder draft.
7. Add newer pacing pages in Builder if needed.
8. Run QC.
9. Preview.
10. Print / Save as PDF.

## Quick Pass Test

If your file imports and creates these blocks, the structure is working:

- Cover
- Section Divider
- Lesson
- Workbook
- Checklist
- Table / Tracker
- Notes
- Back Cover

If QC passes or only shows small warnings, the workbook is ready to clean up inside Builder.
