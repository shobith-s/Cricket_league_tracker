# 🏏 Cricket League Manager

A beautiful, mobile-friendly web application to **manage your cricket league** with Google Sheets as your live database. Features real-time analytics, comprehensive match tracking, and responsive design that works perfectly on all devices.

**✨ No server hosting required** - Deploy for free using GitHub Pages + Google Apps Script!

---

## 🌟 Key Features

### 📊 **Complete League Management**
- **Add Teams & Matches**: Instantly log new teams and match results with intuitive forms
- **Live League Standings**: Auto-calculated wins, losses, points, and Net Run Rate (NRR)
- **Match History**: Complete record of all matches with detailed statistics
- **Team Management**: Add, edit, and organize teams with ease

### 📈 **Advanced Analytics Dashboard**
- **Key Metrics Cards**: Single-column layout with auto-adjusting heights
  - Teams with Most 50+ Scores
  - Teams with Most 30+ Scores  
  - Highest Run Scored
  - Total Runs Across League
- **Performance Insights**: Track team and player performance trends
- **Visual Statistics**: Clean, modern card-based metrics display

### 📱 **Mobile-First Design**
- **Responsive Layout**: Optimized for phones, tablets, and desktop
- **Touch-Friendly Interface**: Large buttons and intuitive navigation
- **Progressive Web App**: Install on mobile devices like a native app
- **Dark/Light Mode**: Toggle between themes for comfortable viewing

### 🔧 **Technical Features**
- **Google Sheets Integration**: Real-time data sync with Google Sheets
- **No Backend Required**: Serverless architecture using Google Apps Script
- **Offline Capability**: Works offline with cached data
- **Fast Loading**: Optimized performance with minimal dependencies

---

## 🚀 Live Demo

[🔗 **View Live Application**](https://shobith-s.github.io/cricket_league_tracker/)

*Try the demo with sample data to explore all features!*

---

## 📋 Quick Setup Guide

### 1. **Clone the Repository**

```bash
git clone https://github.com/shobith-s/cricket_league_tracker.git
cd cricket_league_tracker
```

### 2. **Setup Google Sheets Database**

1. **Create a new Google Sheet** with the following structure:

   **Sheet 1: "Teams"**
   | TeamName |
   |----------|
   | Team A   |
   | Team B   |

   **Sheet 2: "Matches"**
   | Team1 | Team2 | Team1Runs | Team1Overs | Team2Runs | Team2Overs | Winner | Date |
   |-------|-------|-----------|-------------|-----------|-------------|--------|------|
   | Team A| Team B| 150       | 20.0        | 145       | 19.5        | Team A | 2024-01-15 |

2. **Make the sheet publicly accessible**:
   - Click "Share" → "Change to anyone with the link"
   - Set permission to "Viewer"

3. **Copy your Sheet ID** from the URL:
   ```
   https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit
   ```

### 3. **Deploy Google Apps Script API**

1. **Open Google Apps Script**: Go to [script.google.com](https://script.google.com)
2. **Create new project** and paste the following code in `Code.gs`:

```javascript
function doGet(e) {
  const sheetId = 'YOUR_SHEET_ID_HERE'; // Replace with your sheet ID
  const ss = SpreadsheetApp.openById(sheetId);
  
  try {
    const teamsSheet = ss.getSheetByName('Teams');
    const matchesSheet = ss.getSheetByName('Matches');
    
    const teams = teamsSheet.getDataRange().getValues().slice(1).map(row => row[0]).filter(team => team);
    const matches = matchesSheet.getDataRange().getValues().slice(1).map(row => ({
      team1: row[0],
      team2: row[1], 
      team1Runs: parseInt(row[2]) || 0,
      team1Overs: parseFloat(row[3]) || 0,
      team2Runs: parseInt(row[4]) || 0,
      team2Overs: parseFloat(row[5]) || 0,
      winner: row[6],
      date: row[7]
    })).filter(match => match.team1 && match.team2);
    
    return ContentService.createTextOutput(JSON.stringify({teams, matches}))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders({'Access-Control-Allow-Origin': '*'});
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({error: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  const sheetId = 'YOUR_SHEET_ID_HERE'; // Replace with your sheet ID
  const ss = SpreadsheetApp.openById(sheetId);
  const data = JSON.parse(e.postData.contents);
  
  try {
    if (data.type === 'team') {
      const teamsSheet = ss.getSheetByName('Teams');
      teamsSheet.appendRow([data.teamName]);
    } else if (data.type === 'match') {
      const matchesSheet = ss.getSheetByName('Matches');
      matchesSheet.appendRow([
        data.team1, data.team2, data.team1Runs, data.team1Overs,
        data.team2Runs, data.team2Overs, data.winner, data.date
      ]);
    }
    
    return ContentService.createTextOutput(JSON.stringify({success: true}))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders({'Access-Control-Allow-Origin': '*'});
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({error: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

3. **Deploy as Web App**:
   - Click "Deploy" → "New Deployment"
   - Choose "Web app" as type
   - Set "Execute as: Me"
   - Set "Who has access: Anyone"
   - Click "Deploy" and copy the Web App URL

### 4. **Configure the Frontend**

1. **Update API URL** in `main.js` (around line 10):
```javascript
const API_URL = 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE';
```

2. **Set default Sheet ID** in `index.html` (optional):
```html
<input type="text" id="sheet-id" placeholder="Google Sheet ID" value="YOUR_SHEET_ID_HERE">
```

### 5. **Deploy to GitHub Pages**

1. **Push to GitHub**:
```bash
git add .
git commit -m "Initial setup with custom configuration"
git push origin main
```

2. **Enable GitHub Pages**:
   - Go to repository "Settings" → "Pages"
   - Source: "Deploy from a branch"
   - Branch: "main" / "root"
   - Click "Save"

3. **Access your app** at: `https://yourusername.github.io/cricket_league_tracker`

---

## 🎯 Usage Guide

### Adding Teams
1. Navigate to the "Teams" tab
2. Click "Add New Team"
3. Enter team name and save

### Recording Matches
1. Go to "Add Match" tab
2. Select teams from dropdowns
3. Enter runs and overs for both teams
4. System automatically determines winner
5. Save the match

### Viewing Analytics
1. Click "Analytics" tab to see:
   - Teams with most 50+ scores
   - Teams with most 30+ scores (30-49 range)
   - Highest individual run score
   - Total runs across all matches

### League Standings
- Automatically calculated based on match results
- Shows wins, losses, points, and Net Run Rate (NRR)
- Updates in real-time as matches are added

---

## 🛠️ Technical Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Backend**: Google Apps Script (Serverless)
- **Database**: Google Sheets
- **Hosting**: GitHub Pages (Free)
- **PWA**: Service Worker for offline capability

---

## 📱 Mobile App Features

- **Install as PWA**: Add to home screen on mobile devices
- **Offline Support**: View cached data without internet
- **Touch Optimized**: Large buttons and swipe gestures
- **Responsive Design**: Adapts to any screen size

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m "Add feature"`
4. Push to branch: `git push origin feature-name`
5. Submit a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 🙋‍♂️ Support

- **Issues**: [GitHub Issues](https://github.com/shobith-s/cricket_league_tracker/issues)
- **Discussions**: [GitHub Discussions](https://github.com/shobith-s/cricket_league_tracker/discussions)

---

## 🎉 Acknowledgments

- Built with ❤️ for cricket enthusiasts
- Inspired by the need for simple, effective league management
- Thanks to the open-source community for tools and inspiration

---

**⭐ Star this repo if you find it useful!**
