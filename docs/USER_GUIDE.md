# EgSA AI Platform: User and Administrator Guide (web app)

> Deliverable **D-12** (web UI part) · Pilot build, September 2026 · Draft for review
> Audience: EgSA engineers who use the platform, and the administrators who run it during the pilot.
> The VS Code coding assistant has its own guide and is not covered here.

---

## Before you start: what this pilot build can and can't do

| | Status in this build |
|---|---|
| General chat | Works with a local model server (Ollama, LM Studio, or the EgSA gateway) once an administrator connects one. Without one it runs in **demo mode**, which gives sample answers only. |
| Knowledge Copilot | The full interface works, but answers come from a **demo index** of the sample documents. Real search over uploaded PDFs arrives when the backend ingestion service is connected. |
| Document upload | Records the document and its metadata and shows indexing progress. The PDF itself isn't parsed yet in this build. |
| Admin vs. user | The **Admin View / User View** switch is a demonstration control. It changes what the screen shows, not who is allowed to do what. Real sign-in comes with the backend. |
| Storage | Conversations, research threads and settings are saved **in your browser on this PC**. Another PC, or clearing browser data, starts fresh. |

Nothing in the platform needs Internet access. Models, fonts and data all stay on the EgSA network.

---

# Part 1: Using the platform

## 1. Finding your way around

Open the platform address you were given (for example `http://ai-platform.egsa.local`) in Chrome, Edge or Firefox.

- **Sidebar (left).** At the top it switches between the two pages, **Chat** and **Knowledge Copilot**. Below that is your history for the current page: chat conversations or research threads. At the bottom are **Settings**, the database button (**Administration**, see Part 2) and a light/dark switch.
- **On a phone or narrow window** the sidebar is hidden. Open it with the sidebar button in the top-left corner.
- **Esc** closes any open window or menu.
- **Keyboard shortcuts:** press **?** (or account menu → *Keyboard shortcuts*) for the full list. The most useful ones:

| Keys (⌘ on Mac) | Does |
|---|---|
| Ctrl + Shift + O | New conversation / research thread |
| / | Jump to the message box |
| Esc (in the message box) | Stop the answer being written |
| ↑ (empty chat box) | Edit your last message |
| Ctrl + Shift + C | Copy the last answer |
| Ctrl + Shift + S | Show or hide the sidebar |

## 2. Chat

Chat is a general assistant for questions, writing, explanations and code. It does **not** search engineering documents. For that, use the Knowledge Copilot (section 3).

### Start and manage conversations
- **New conversation:** the pencil button at the top of the sidebar. Each conversation is separate, so nothing from other conversations carries over.
- **Rename:** double-click the conversation's title in the sidebar.
- **Export:** the download icon next to a conversation saves it as a Markdown file.
- **Delete:** the bin icon next to a conversation. You'll be asked to confirm.
- **Search:** the search box above the list finds conversations by title or by anything said in them.
- **Pin:** the pin icon next to a conversation keeps it at the top under **Pinned**. The rest are grouped by date (Today, Yesterday, Previous 7 days…).
- **Drafts:** text you've typed but not sent stays with its conversation when you switch away, and is still there after a reload.

### Ask a question
Type in the box at the bottom and press **Return** to send. **Shift+Return** starts a new line. You can turn off Return-to-send under Settings → Appearance → *Send on Return*.

While an answer is being written, the send button becomes **Stop**. Hover over an answer to see its actions:
- **Copy**
- **Direction:** switch the answer between left-to-right and right-to-left, useful for mixed Arabic/English text
- **Retry:** regenerate the latest answer
- The **model** that wrote the answer, for example *Coding assistant · qwen2.5-coder:7b*

You can also hover over your own message and choose **Edit** to change it and send it again (or press ↑ in an empty message box).

**The small astronaut above the message box** shows which model the conversation uses ("Ready") and what it's doing while an answer is produced (thinking, writing, then a quick "Done"). You can turn it off in Settings → Appearance → *Answer status companion*.

**Code in answers.** Code blocks show the language, line numbers and colour-coded syntax. A quick check runs on each block: **✓ No issues**, or **▲ 2 warnings · 1 note**, which you can click to see the lines involved (for example an unclosed `{` or `if (a = b)`). These are quick checks, not a compiler, so always build and test code before using it. **Copy** copies the code without line numbers.

**Rate answers.** Use 👍 / 👎 under an answer. After a 👎, pick what went wrong (for example *Inaccurate* or *Incomplete*) and, if you like, add a comment. It takes two clicks and helps the team improve the pilot.

**Long conversations.** Only the most recent messages (30 by default) are sent to the model. A line in the conversation marks where older messages stop being sent. Start a new conversation for a new topic, or change *Conversation memory* in Settings → Intelligence.

### Choose the model profile
Just above the message box, next to the astronaut, is the conversation's **model profile** and the model behind it, for example **Ready · General assistant · llama3.1:8b**. Click it to open Settings → **Intelligence**, where the profiles are listed:

- **General:** everyday questions, writing, engineering explanations.
- **Coding:** code generation, review and debugging.

Open a profile's *Edit* panel and choose **Use in the open conversation** to switch the conversation you have open (it applies from the next answer). New conversations use the **default** profile, which you set with *Make default* in the same panel. If the status shows **No model set**, an administrator still needs to choose a model for that profile (see section 7). If it shows **demo**, no model server is connected yet.

### How much the model remembers
Each answer is sent with the most recent part of the conversation, as much as the model's context size allows (an administrator sets *Context size* per profile). When a conversation grows past that, a line marks where the older messages stop being sent. Failed, stopped and re-asked turns are left out, so the model doesn't answer old questions again. Start a new conversation for a new topic.

**Answer length.** Settings → Intelligence → *Answer length*: **Concise**, **Balanced** (default) or **Detailed**. It changes both the instruction the model gets and how long an answer may be.

**Thinking models.** Some models show their thinking before answering. It appears as a collapsed **"Thought for N s"** line above the answer. Open it if you want to read it. It is never copied with the answer and never sent back to the model.

### Personas
Settings → Intelligence → **Specialist persona** sets the assistant's style and focus: *EgSA Space Specialist*, *Senior Software Architect*, *Cosmic Assistant* and *Data & ML Scientist*. New conversations start with the selected persona. The chat box shows who you're talking to, for example "Ask EgSA Space Specialist…".

### Arabic
You can write in Arabic or English. Messages are laid out right-to-left automatically when they're in Arabic. To change the default, use Settings → Appearance → **Text Direction**. **Arabic Typography Font** offers three typefaces (IBM Plex Sans Arabic, Cairo, Readex Pro).

## 3. Knowledge Copilot

The Knowledge Copilot answers questions **only from indexed engineering documents**, and shows where each statement comes from (document, revision, page, section, requirement ID). If the documents don't support an answer, it says **"Insufficient information in the knowledge base"** instead of guessing.

Open it from **Knowledge Copilot** in the sidebar.

### Set the scope
At the top of the page, choose a **project** and optionally a **subsystem** to limit the search. The line under the title shows how many indexed documents are in scope. On a phone, tap the scope button under the title (it shows the current scope, for example *All projects*).

### Quick or Deep
Below the question box:
- **Quick** finds the most relevant passages for the whole question. Use it for direct questions such as *"What is the ADCS pointing accuracy requirement?"*
- **Deep** splits a multi-part question into parts, researches each part separately, and lists any part it couldn't find under **Not covered**. Use it for questions such as *"What are the ADCS safe mode rules and the EPS primary bus voltage?"*

Press **Return** (or the arrow button) to ask, and **Stop** to cancel.

### Read the answer
- **Research steps** (collapsible) show what the Copilot searched and what it found.
- Numbers in brackets such as **[1]** are citations. Click one to select that source.
- **Evidence** (the right-hand panel on wide screens) lists every source. Select a source to read the exact passage that was used. On narrower screens, switch between **Answer** and **Sources** under each answer.
- Each source shows **Strong match** or **Partial match**, and when its document was **indexed**. Always read the passage of a partial match before relying on it.
- **Not covered** (Deep only) lists the parts of your question that no document supports.
- **Insufficient information** means nothing in scope supports an answer. Try widening the scope, rephrasing with document terms (subsystem names, requirement IDs), or asking an administrator whether the right document has been uploaded.

Always check the cited passage before relying on an answer for engineering decisions.

### Research threads
Each question-and-answer sequence is saved as a **thread** in the sidebar. You can rename, export (Markdown, with sources) and delete threads just like chat conversations.

## 4. Settings

Open **Settings** at the bottom of the sidebar.

| Tab | What you can change |
|---|---|
| **Appearance** | Theme (System, Light, Dark), accent colour, text size, chat density, Arabic font, text direction, auto-scroll, Send on Return |
| **Intelligence** | Model profiles (view only for users), specialist persona, temperature, maximum answer length, system instructions |
| **Engine & API** | The model server connection (normally set by an administrator, see section 8) |
| **About EgSA** | About the platform |

**Reset to Defaults** (bottom of the Settings sidebar; **Reset All to Defaults** on a phone) restores your personal preferences. It doesn't change model profiles.

---

# Part 2: Administration

Administrators manage documents, projects, model profiles and the model server connection, and can check service health.

> **Pilot note.** Switch to **Admin View** with the shield control in the Administration window's header. In this build the control only changes the screen: anyone can switch it. Real administrator sign-in, and a record of who did what (ADM-001, ADM-006), arrive with the backend.

Open **Administration** with the database button at the bottom of the sidebar. In Admin View it has four sections: **Documents | Projects | Health | Feedback**.

## 5. Documents

The list shows every document with a one-line summary: document ID · project / subsystem · type · revision · upload date. Next to it is a status:

| Status | Meaning |
|---|---|
| ● **Indexed** | Searchable by the Knowledge Copilot |
| ◌ **Indexing…** | Being processed |
| ○ **Queued** | Waiting to be processed |
| ✕ **Failed** | Could not be indexed. Expand the row to see why |
| ○ **Disabled** | Kept, but excluded from search |

Use the search box and the **project/subsystem** filters to narrow the list. Click a row to expand it and see its classification, approval status, page count, file name, and any error.

### Upload a document
1. Click **Upload document**.
2. Drop a PDF on the upload area, or click it to browse.
3. Fill in the metadata. **Title**, **Project** and **Revision** are required. Also fill in the subsystem, document ID (for example `EGSA-ADCS-SRS-001`), document type (TRS, SRS, ICD, Design, Test, Report, Other), approval status and classification when you know them. Good metadata makes citations more useful.
4. Click **Upload & Index**. The document appears as *Queued*, then *Indexing…*, then *Indexed* (or *Failed*).

If you choose a project or subsystem that is switched off (section 6), the form warns you. The document is still indexed, but it isn't searchable until the project is switched back on.

**Before uploading:** use only approved pilot documents, with a text layer where possible. Poor scans can fail ("OCR quality too low…"). Replace them with a better copy and re-index.

### Row actions
Each row's **⋯** menu offers:
- **Re-index:** process it again, for example after fixing its metadata or replacing a poor scan.
- **Disable from retrieval / Enable in retrieval:** remove the document from search, or bring it back, without deleting anything.
- **Remove…:** delete it from the platform's knowledge base, after you confirm. The original source file outside the platform is not affected.

## 6. Projects

**Projects** lists every pilot project with its subsystems, each with an **On/Off** switch.

- Switching a **project** off stops the Knowledge Copilot searching all of its documents. You'll be asked to confirm, with the number of affected documents shown.
- Switching a **subsystem** off does the same for that subsystem only.
- **Nothing is deleted and nothing needs re-indexing.** Switching back on restores access immediately.
- While a project is off, users don't see it in the Copilot's scope picker or its documents in User View. Administrators still see those documents, marked **Project off**.

Use this to take a document set out of use temporarily, for example during a review or a revision change, without deleting files (ADM-007).

## 7. Model profiles (Settings → Intelligence)

Every conversation uses a **model profile**. The platform always keeps at least one **General** and one **Coding** profile, and one of each is the **default** for new conversations.

In Admin View, click **Edit** next to a profile to change:
- **Name:** what users see in the model status above the message box.
- **Role:** General or Coding. The last profile of a role can't change role or be removed.
- **Model:** the model name as the model server knows it, for example `llama3.1:8b` or `qwen2.5-coder:7b`. Click **Load** to list the models the server offers. If you leave it empty, the profile uses the **Endpoint default model** from Engine & API.
- **Endpoint (optional):** only for a model that runs on a different server.
- **Conversation context:** *This app sends it* for a plain model server (Ollama, LM Studio, OpenRouter), which remembers nothing between messages. *Server keeps it* for the EgSA gateway once it stores conversations: then only the new message is sent. With a plain model server, choosing *Server keeps it* makes the model forget earlier messages.
- **Make default:** make this profile the default for its role.

Use **Add profile** for extra profiles, for example a larger general model for long reports. Changing a profile's model is how you swap models during the pilot; no other change is needed (NFR-MNT-004).

## 8. Connecting the model server (Settings → Engine & API)

1. Set **Provider Engine** to **Live Custom API**. Leave it on **EgSA Mock Core** for a demo without a model server.
2. Choose a preset: **Ollama (Local)**, **LM Studio (Local)** or **EgSA Gateway / Custom**. Only on-premises options are offered.
3. Check the **endpoint URL**, for example `http://gpu-server.egsa.local:11434/v1/chat/completions`. Missing `/chat/completions` paths are completed automatically.
4. Optionally click **Retrieve Models from Endpoint** and choose an **Endpoint default model**. Profiles with no model of their own use it.
5. Enter an **API key** only if the server needs one. The key is kept **for this browser tab only**: it isn't saved on the PC, so enter it again after closing the browser.
6. Click **Test Connection** to confirm the setup. It sends one very short prompt.

**Bypass Browser CORS (Vite Dev Proxy)** is for development servers only. In the deployed platform, requests go through the EgSA gateway.

## 9. Answer feedback

**Administration → Feedback** lists how people rated answers: the totals, the most common reasons, and the latest ratings with their question, context and comments. **Export CSV** downloads everything for the pilot evaluation report. In this build, ratings are stored in each user's browser, so collect exports from the pilot PCs until the backend gathers them centrally.

## 10. Health

**Health** shows the state of the core services. It checks when you open it, when you click **Check now**, and every 30 seconds while it stays open.

| Service | What is checked |
|---|---|
| **General model / Coding model** | Whether each default profile's server answers and offers the configured model |
| **Knowledge index** | Numbers of indexed, indexing and failed documents, and any projects or subsystems switched off |
| **EgSA Gateway / API** | Whether the platform gateway is reachable. **Not connected** is expected until the backend is deployed |
| **Embeddings / retrieval** | Reported by the gateway once it is connected |

Each status is shown as a symbol and a word: ● Operational, ▲ Degraded, ✕ Unavailable, ○ Unknown / Not connected / Demo mode. The line under the title summarises the overall state and when it was last checked.

---

## 11. Troubleshooting

| You see | What to do |
|---|---|
| **No model set** above the message box, or **"Model not configured"** in an answer | An administrator sets a model for that profile (section 7) or an Endpoint default model (section 8). |
| **demo** in the model status above the message box | No model server is connected. See section 8. |
| **Connection Error** in an answer | Check that the model server is running and the URL is right, then click **Test Connection** (section 8) and look at Health (section 9). |
| The Copilot says **Insufficient information** | Widen the scope, rephrase with document terms, or check in Administration → Documents that the document is *Indexed* and its project is switched *On*. |
| A document stays **Failed** | Expand the row to read the reason. Fix it (for example, upload a better scan), then use **Re-index**. |
| Settings or history disappeared | They are stored in the browser on that PC. Another browser or PC, or cleared browser data, starts fresh. |
| The API key has to be entered again | Expected. For security it isn't saved after the browser closes. |

**Getting help:** contact the Web/Workflow lead (Mohamed Hany) for the web interface, the Platform/Backend lead (Hussin Saleh) for model servers and the gateway, and the AI/RAG lead (Mohamed Hesham) for retrieval quality.
