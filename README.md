# 🏏 Cricket League Manager

A beautiful, mobile-friendly web app to **manage your cricket league** with Google Sheets as your live database.  
**No server, no paid hosting needed:** just GitHub Pages + Google Apps Script!

---

## 🌟 Features

- **Add Teams and Matches**: Instantly log new teams and match results.
- **Live League Standings**: Auto-calculated wins, losses, points, and Net Run Rate (NRR).
- **All Match History**: See every result with details.
- **Mobile-first Design**: Looks great on all screens.
- **No Server Hosting**: Only static files, all dynamic logic via Google Apps Script.

---

## 🚀 Live Demo

[🔗 View Live App](https://shobith-s.github.io/cricket_league_tracker/)  

---

## 📋 Quick Start

### 1. **Clone this Repo**

```
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
```
### 2. **Setup Google Sheets**

- Create a new Google Sheet.
- Add two sheets:
  - **Teams** with a header: **TeamnName**
  - **Matches** with headers: **Team1**, **Team2**, **Team1Runs**, **Team1Overs**, **Team2Runs**, **Team2Overs**, **Winner**, **Date**
- Make the sheet public.
### 3. Deploy Google Apps Script Web API
- In Google Sheets: ```Extensions -> Apps Script```
- Paste the code(App Script) in Code.gs
- Deploy as a Web App with:
  
  ```
   Execute as: Me
   Who has access: Anyone
  ```
- Copy the Web App URL.
### 4. Configure Frontend
- In ```main.js```, set your App Script Web App URL.
- Set your Sheet ID as default(optional).
### 5. Push to Github & Enable Pages
- Commit & push all files to ```main```
- In repo ```Settings -> Pages```, choose ```main``` branch and ```/``` root
