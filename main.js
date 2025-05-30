// == Replace with your deployed Apps Script web app URL ==
const APPS_SCRIPT_URL = "https://gsheet-cors-proxy.shobi7196.workers.dev/";
const DEFAULT_SHEET_ID = "1gBvi2v5LYHUMBsbSwAoUfLpDPG_zN_KBzMNq55K03fY";

let teams = [], matches = [], sheetId = DEFAULT_SHEET_ID, isConnected = false;
let currentTheme = localStorage.getItem('theme') || 'light';
let touchStartX = 0;
let touchEndX = 0;
let currentTab = 'add-match';

// Initialize app
window.onload = () => {
    initializeApp();
};

function initializeApp() {
    // Show loading screen
    showLoadingScreen();
    
    // Set theme
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateThemeIcon();
    
    // Set default sheet ID
    document.getElementById('sheet-id').value = DEFAULT_SHEET_ID;
    
    // Add event listeners
    addEventListeners();
    
    // Hide loading screen after a short delay
    setTimeout(() => {
        hideLoadingScreen();
        // Auto-load data if default sheet ID is set
        if (DEFAULT_SHEET_ID) {
            loadData();
        }
    }, 1500);
}

function showLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
        loadingScreen.classList.remove('hidden');
    }
}

function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
        loadingScreen.classList.add('hidden');
    }
}

function addEventListeners() {
    // Touch events for swipe navigation
    const tabViews = document.getElementById('tab-views');
    if (tabViews) {
        tabViews.addEventListener('touchstart', handleTouchStart, { passive: true });
        tabViews.addEventListener('touchend', handleTouchEnd, { passive: true });
    }
    
    // Form input listeners for real-time calculations
    const team1Runs = document.getElementById('team1-runs');
    const team1Overs = document.getElementById('team1-overs');
    const team2Runs = document.getElementById('team2-runs');
    const team2Overs = document.getElementById('team2-overs');
    const team1Select = document.getElementById('team1');
    const team2Select = document.getElementById('team2');
    
    if (team1Runs) team1Runs.addEventListener('input', updateMatchPreview);
    if (team1Overs) team1Overs.addEventListener('input', updateMatchPreview);
    if (team2Runs) team2Runs.addEventListener('input', updateMatchPreview);
    if (team2Overs) team2Overs.addEventListener('input', updateMatchPreview);
    if (team1Select) team1Select.addEventListener('change', updateTeamNames);
    if (team2Select) team2Select.addEventListener('change', updateTeamNames);
    
    // Form submission
    const matchForm = document.getElementById('match-form');
    if (matchForm) {
        matchForm.addEventListener('submit', handleMatchSubmit);
    }
    
    const teamForm = document.getElementById('team-form');
    if (teamForm) {
        teamForm.addEventListener('submit', handleTeamSubmit);
    }
}

function handleTouchStart(e) {
    touchStartX = e.changedTouches[0].screenX;
}

function handleTouchEnd(e) {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
}

function handleSwipe() {
    const swipeThreshold = 50;
    const diff = touchStartX - touchEndX;
    
    if (Math.abs(diff) > swipeThreshold) {
        const tabs = ['add-match', 'standings', 'matches', 'teams', 'analytics'];
        const currentIndex = tabs.indexOf(currentTab);
        
        if (diff > 0 && currentIndex < tabs.length - 1) {
            // Swipe left - next tab
            showTab(tabs[currentIndex + 1]);
        } else if (diff < 0 && currentIndex > 0) {
            // Swipe right - previous tab
            showTab(tabs[currentIndex - 1]);
        }
    }
}

function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('theme', currentTheme);
    updateThemeIcon();
}

function updateThemeIcon() {
    const themeIcon = document.querySelector('.theme-icon');
    if (themeIcon) {
        themeIcon.textContent = currentTheme === 'light' ? '🌙' : '☀️';
    }
}

function setResponsiveText() {
    const isMobile = window.innerWidth <= 767;
    const expandableCards = document.querySelectorAll('.expandable-card .metric-value');
    
    expandableCards.forEach(metricEl => {
        if (isMobile) {
            // On mobile, always show full text
            if (metricEl.getAttribute('data-full-text')) {
                metricEl.textContent = metricEl.getAttribute('data-full-text');
            }
        } else {
            // On desktop, show short text unless expanded
            const card = metricEl.closest('.metric-card');
            const isExpanded = card.classList.contains('expanded');
            if (isExpanded && metricEl.getAttribute('data-full-text')) {
                metricEl.textContent = metricEl.getAttribute('data-full-text');
            } else if (metricEl.getAttribute('data-short-text')) {
                metricEl.textContent = metricEl.getAttribute('data-short-text');
            }
        }
    });
}

function toggleMetricCard(metricId) {
    // Check if we're on mobile (screen width <= 767px)
    const isMobile = window.innerWidth <= 767;
    
    // On mobile, don't allow manual toggling - cards auto-expand
    if (isMobile) {
        return;
    }
    
    const card = document.getElementById(metricId).closest('.metric-card');
    const metricValueEl = document.getElementById(metricId);
    const isExpanded = card.classList.contains('expanded');
    
    // Close all other expanded cards first
    document.querySelectorAll('.expandable-card.expanded').forEach(expandedCard => {
        if (expandedCard !== card) {
            expandedCard.classList.remove('expanded');
            // Reset text to short version for other cards
            const otherMetricEl = expandedCard.querySelector('.metric-value');
            if (otherMetricEl && otherMetricEl.getAttribute('data-short-text')) {
                otherMetricEl.textContent = otherMetricEl.getAttribute('data-short-text');
            }
        }
    });
    
    // Toggle current card
    if (isExpanded) {
        card.classList.remove('expanded');
        // Show short text when collapsed
        if (metricValueEl.getAttribute('data-short-text')) {
            metricValueEl.textContent = metricValueEl.getAttribute('data-short-text');
        }
    } else {
        card.classList.add('expanded');
        // Show full text when expanded
        if (metricValueEl.getAttribute('data-full-text')) {
            metricValueEl.textContent = metricValueEl.getAttribute('data-full-text');
        }
    }
}

function updateStatus(message, type = 'loading') {
    const status = document.getElementById('status');
    status.textContent = message;
    status.className = `status ${type}`;
}

function showTab(tabName) {
    // Update current tab
    currentTab = tabName;
    
    // Remove active class from all tabs and tab links
    document.querySelectorAll('.tab-view').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.tab-link').forEach(t => t.classList.remove('active'));
    
    // Add active class to selected tab and tab link
    const selectedTab = document.getElementById(tabName);
    const selectedTabLink = document.querySelector(`[data-tab="${tabName}"]`);
    
    if (selectedTab) selectedTab.classList.add('active');
    if (selectedTabLink) selectedTabLink.classList.add('active');
    
    // Update content based on tab
    if (isConnected) {
        switch(tabName) {
            case 'standings':
                updateStandings();
                updateStandingsCards();
                break;
            case 'matches':
                displayMatches();
                break;
            case 'teams':
                updateTeamsList();
                updateTeamsGrid();
                updatePerformanceCards();
                break;
            case 'analytics':
                updateAnalytics();
                break;
        }
    }
}

function updateTeamNames() {
    const team1Select = document.getElementById('team1');
    const team2Select = document.getElementById('team2');
    const team1Name = document.getElementById('team1-name');
    const team2Name = document.getElementById('team2-name');
    
    if (team1Name && team1Select) {
        team1Name.textContent = team1Select.value || 'Team 1';
    }
    if (team2Name && team2Select) {
        team2Name.textContent = team2Select.value || 'Team 2';
    }
    
    updateMatchPreview();
}

function updateMatchPreview() {
    const team1Runs = parseInt(document.getElementById('team1-runs')?.value) || 0;
    const team1Overs = parseFloat(document.getElementById('team1-overs')?.value) || 0;
    const team2Runs = parseInt(document.getElementById('team2-runs')?.value) || 0;
    const team2Overs = parseFloat(document.getElementById('team2-overs')?.value) || 0;
    const team1Name = document.getElementById('team1')?.value || 'Team 1';
    const team2Name = document.getElementById('team2')?.value || 'Team 2';
    
    // Update run rates
    const team1Rate = team1Overs > 0 ? (team1Runs / team1Overs).toFixed(2) : '0.00';
    const team2Rate = team2Overs > 0 ? (team2Runs / team2Overs).toFixed(2) : '0.00';
    
    const team1RateEl = document.getElementById('team1-rate');
    const team2RateEl = document.getElementById('team2-rate');
    
    if (team1RateEl) team1RateEl.textContent = `Run Rate: ${team1Rate}`;
    if (team2RateEl) team2RateEl.textContent = `Run Rate: ${team2Rate}`;
    
    // Update match result preview
    const resultEl = document.getElementById('match-result');
    const resultTextEl = resultEl?.querySelector('.result-text');
    
    if (resultTextEl && team1Name && team2Name && team1Runs > 0 && team2Runs > 0) {
        let resultText = '';
        if (team1Runs > team2Runs) {
            const margin = team1Runs - team2Runs;
            resultText = `${team1Name} wins by ${margin} runs`;
        } else if (team2Runs > team1Runs) {
            const margin = team2Runs - team1Runs;
            resultText = `${team2Name} wins by ${margin} runs`;
        } else {
            resultText = 'Match tied!';
        }
        resultTextEl.textContent = resultText;
    } else if (resultTextEl) {
        resultTextEl.textContent = 'Select teams and enter scores';
    }
}

function clearForm() {
    document.getElementById('team1').value = '';
    document.getElementById('team2').value = '';
    document.getElementById('team1-runs').value = '';
    document.getElementById('team1-overs').value = '';
    document.getElementById('team2-runs').value = '';
    document.getElementById('team2-overs').value = '';
    updateTeamNames();
    updateMatchPreview();
}

function randomMatch() {
    if (teams.length < 2) {
        alert('Need at least 2 teams for a random match');
        return;
    }
    
    // Select random teams
    const shuffledTeams = [...teams].sort(() => 0.5 - Math.random());
    const team1 = shuffledTeams[0];
    const team2 = shuffledTeams[1];
    
    // Generate random scores
    const team1Runs = Math.floor(Math.random() * 200) + 50;
    const team2Runs = Math.floor(Math.random() * 200) + 50;
    const team1Overs = Math.floor(Math.random() * 20) + 1;
    const team2Overs = Math.floor(Math.random() * 20) + 1;
    
    // Fill form
    document.getElementById('team1').value = team1;
    document.getElementById('team2').value = team2;
    document.getElementById('team1-runs').value = team1Runs;
    document.getElementById('team1-overs').value = team1Overs;
    document.getElementById('team2-runs').value = team2Runs;
    document.getElementById('team2-overs').value = team2Overs;
    
    updateTeamNames();
    updateMatchPreview();
}

function handleMatchSubmit(e) {
    e.preventDefault();
    addMatch();
}

function handleTeamSubmit(e) {
    e.preventDefault();
    addTeam();
}

function connectToSheet() {
    const id = document.getElementById('sheet-id').value.trim();
    if (!id) { alert('Please enter a Google Sheet ID'); return; }
    sheetId = id;
    updateStatus('Connecting to Google Sheets...', 'loading');
    loadData();
}

async function loadData() {
    if (!sheetId) { 
        updateStatus('Please connect to Google Sheets first', 'error'); 
        return; 
    }
    
    try {
        updateStatus('Loading data...', 'loading');
        
        // Test sheet accessibility first
        console.log('Testing sheet ID:', sheetId);
        
        // Teams
        const teamsUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=Teams`;
        console.log('Fetching teams from:', teamsUrl);
        
        const teamsResponse = await fetch(teamsUrl);
        
        if (!teamsResponse.ok) {
            throw new Error(`HTTP ${teamsResponse.status}: ${teamsResponse.statusText}`);
        }
        
        const teamsText = await teamsResponse.text();
        console.log('Teams response length:', teamsText.length);
        
        // Check if response contains error
        if (teamsText.includes('Invalid input') || teamsText.includes('error') || teamsText.length < 50) {
            throw new Error('Invalid sheet ID or sheet not accessible');
        }
        
        // More robust JSON parsing
        let teamsData;
        try {
            // Google Sheets returns JSONP, need to extract JSON
            const jsonStart = teamsText.indexOf('(') + 1;
            const jsonEnd = teamsText.lastIndexOf(')');
            const jsonString = teamsText.substring(jsonStart, jsonEnd);
            teamsData = JSON.parse(jsonString);
        } catch (parseError) {
            console.error('JSON parsing error:', parseError);
            throw new Error('Failed to parse response from Google Sheets');
        }
        teams = [];
        
        if (teamsData.table && teamsData.table.rows) {
            teamsData.table.rows.forEach(row => {
                if (row.c && row.c[0] && row.c[0].v) {
                    teams.push(row.c[0].v);
                }
            });
        }
        
        console.log('Loaded teams:', teams);
        
        // Matches
        const matchesUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=Matches`;
        console.log('Fetching matches from:', matchesUrl);
        
        const matchesResponse = await fetch(matchesUrl);
        
        if (!matchesResponse.ok) {
            throw new Error(`HTTP ${matchesResponse.status}: ${matchesResponse.statusText}`);
        }
        
        const matchesText = await matchesResponse.text();
        console.log('Matches response length:', matchesText.length);
        
        // More robust JSON parsing for matches
        let matchesData;
        try {
            // Google Sheets returns JSONP, need to extract JSON
            const jsonStart = matchesText.indexOf('(') + 1;
            const jsonEnd = matchesText.lastIndexOf(')');
            const jsonString = matchesText.substring(jsonStart, jsonEnd);
            matchesData = JSON.parse(jsonString);
        } catch (parseError) {
            console.error('Matches JSON parsing error:', parseError);
            throw new Error('Failed to parse matches response from Google Sheets');
        }
        matches = [];
        
        if (matchesData.table && matchesData.table.rows) {
            matchesData.table.rows.forEach(row => {
                if (row.c && row.c[0] && row.c[0].v) {
                    matches.push({
                        team1: row.c[0]?.v || '',
                        team2: row.c[1]?.v || '',
                        team1Runs: row.c[2]?.v ? parseInt(row.c[2].v) : 0,
                        team1Overs: row.c[3]?.v ? parseFloat(row.c[3].v) : 0,
                        team2Runs: row.c[4]?.v ? parseInt(row.c[4].v) : 0,
                        team2Overs: row.c[5]?.v ? parseFloat(row.c[5].v) : 0,
                        winner: row.c[6]?.v || '',
                        date: row.c[7]?.v || ''
                    });
                }
            });
        }
        
        console.log('Loaded matches:', matches);
        
        // Final validation - ensure we have data
        if (teams.length === 0) {
            throw new Error('No teams found in the Teams sheet. Please check your sheet structure.');
        }
        
        isConnected = true;
        updateStatus(`✅ Connected! Loaded ${teams.length} teams and ${matches.length} matches`, 'connected');
        updateTeamSelects();
        updateTeamsList();
        updateStandings();
        displayMatches();
        
        // Update header stats
        updateHeaderStats();
        
        console.log('✅ Data loading completed successfully!');
        
    } catch (error) {
        console.error('Error loading data:', error);
        
        // Double-check if data was actually loaded despite the error
        if (teams.length > 0) {
            console.log('Data was loaded successfully despite error, updating status...');
            isConnected = true;
            updateStatus(`✅ Connected! Loaded ${teams.length} teams and ${matches.length} matches`, 'connected');
            updateTeamSelects();
            updateTeamsList();
            updateStandings();
            displayMatches();
            updateHeaderStats();
            return;
        }
        
        let errorMessage = '❌ Error connecting to Google Sheets. ';
        
        if (error.message.includes('Invalid input') || error.message.includes('404')) {
            errorMessage += 'Sheet ID not found or invalid.';
        } else if (error.message.includes('403')) {
            errorMessage += 'Sheet is not public. Please make it viewable by anyone with the link.';
        } else if (error.message.includes('CORS') || error.message.includes('network')) {
            errorMessage += 'Network error. Please check your internet connection.';
        } else {
            errorMessage += 'Please check your Sheet ID and make sure it\'s public.';
        }
        
        updateStatus(errorMessage, 'error');
        isConnected = false;
        
        // Show troubleshooting tips
        showTroubleshootingTips();
    }
}

function showTroubleshootingTips() {
    const statusEl = document.getElementById('status');
    if (statusEl) {
        statusEl.innerHTML += `
            <div style="margin-top: 10px; font-size: 12px; line-height: 1.4; background: rgba(239, 68, 68, 0.1); padding: 10px; border-radius: 8px; border: 1px solid rgba(239, 68, 68, 0.2);">
                <strong>🔧 Troubleshooting Tips:</strong><br>
                1. Make sure your Google Sheet is <strong>public</strong> (Anyone with link can view)<br>
                2. Your sheet should have <strong>"Teams"</strong> and <strong>"Matches"</strong> tabs<br>
                3. Teams tab should have team names in column A<br>
                4. Matches tab should have: Team1, Team2, Team1Runs, Team1Overs, Team2Runs, Team2Overs, Winner, Date<br>
                5. Try the default sheet ID: <code style="background: rgba(0,0,0,0.1); padding: 2px 4px; border-radius: 3px;">${DEFAULT_SHEET_ID}</code><br>
                6. Check browser console (F12) for detailed error messages<br>
                <br>
                <button onclick="createSampleSheet()" style="background: var(--primary); color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 11px; margin-top: 5px;">
                    📋 Create Sample Sheet Template
                </button>
            </div>
        `;
    }
}

function createSampleSheet() {
    const instructions = `
To create a Google Sheet for this app:

1. Go to https://sheets.google.com
2. Create a new sheet
3. Create two tabs: "Teams" and "Matches"

Teams Tab (Column A):
- Mumbai Indians
- Chennai Super Kings
- Royal Challengers Bangalore
- Delhi Capitals

Matches Tab (Columns A-H):
Team1 | Team2 | Team1Runs | Team1Overs | Team2Runs | Team2Overs | Winner | Date
Mumbai Indians | Chennai Super Kings | 180 | 20 | 175 | 20 | Mumbai Indians | 2024-01-15

4. Make the sheet public:
   - Click "Share" button
   - Change "Restricted" to "Anyone with the link"
   - Set permission to "Viewer"
   - Copy the sheet ID from the URL

5. The sheet ID is the long string in the URL:
   https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit

Example working sheet: ${DEFAULT_SHEET_ID}
    `;
    
    alert(instructions);
}

function testDefaultSheet() {
    document.getElementById('sheet-id').value = DEFAULT_SHEET_ID;
    connectToSheet();
}

function updateTeamSelects() {
    const team1Select = document.getElementById('team1');
    const team2Select = document.getElementById('team2');
    team1Select.innerHTML = '<option value="">Select Team 1</option>';
    team2Select.innerHTML = '<option value="">Select Team 2</option>';
    teams.forEach(team => {
        team1Select.innerHTML += `<option value="${team}">${team}</option>`;
        team2Select.innerHTML += `<option value="${team}">${team}</option>`;
    });
}

function updateTeamsList() {
    const teamsList = document.getElementById('teams-list');
    teamsList.innerHTML = '';
    teams.forEach(team => {
        teamsList.innerHTML += `<tr><td>${team}</td></tr>`;
    });
}

async function addTeam() {
    if (!isConnected) { alert('Please connect to Google Sheets first'); return; }
    const teamName = document.getElementById('team-name').value.trim();
    if (!teamName) return;
    if (teams.includes(teamName)) {
        alert('Team already exists!');
        document.getElementById('team-name').value = '';
        return;
    }
    updateStatus('Adding team...');
    try {
        const response = await fetch(`${APPS_SCRIPT_URL}?sheet=Teams`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ row: [teamName] })
        });
        const json = await response.json();
        if (json.result === "Success") {
            updateStatus('✅ Team added!', 'connected');
            document.getElementById('team-name').value = '';
            setTimeout(loadData, 600);
        } else {
            updateStatus('❌ Failed to add team: ' + JSON.stringify(json), 'error');
        }
    } catch (err) {
        updateStatus('❌ Failed to add team (network error)', 'error');
    }
}

async function addMatch() {
    if (!isConnected) { alert('Please connect to Google Sheets first'); return; }
    const team1 = document.getElementById('team1').value;
    const team2 = document.getElementById('team2').value;
    const team1Runs = parseInt(document.getElementById('team1-runs').value);
    const team1Overs = parseFloat(document.getElementById('team1-overs').value);
    const team2Runs = parseInt(document.getElementById('team2-runs').value);
    const team2Overs = parseFloat(document.getElementById('team2-overs').value);

    if (!team1 || !team2 || team1 === team2) { alert('Please select two different teams.'); return; }
    if (isNaN(team1Runs) || isNaN(team1Overs) || isNaN(team2Runs) || isNaN(team2Overs)) {
        alert('Please fill in all match scores.'); return;
    }
    const winner = team1Runs > team2Runs ? team1 : (team2Runs > team1Runs ? team2 : 'Tie');
    const date = new Date().toLocaleDateString();

    updateStatus('Adding match...');
    try {
        const response = await fetch(`${APPS_SCRIPT_URL}?sheet=Matches`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ row: [team1, team2, team1Runs, team1Overs, team2Runs, team2Overs, winner, date] })
        });
        const json = await response.json();
        if (json.result === "Success") {
            updateStatus('✅ Match added!', 'connected');
            document.getElementById('match-form').reset();
            setTimeout(loadData, 600);
        } else {
            updateStatus('❌ Failed to add match: ' + JSON.stringify(json), 'error');
        }
    } catch (err) {
        updateStatus('❌ Failed to add match (network error)', 'error');
    }
}

function calculateNRR(teamName) {
    let runsScored = 0, oversPlayed = 0, runsConceded = 0, oversBowled = 0;
    matches.forEach(match => {
        if (match.team1 === teamName) {
            runsScored += match.team1Runs;
            oversPlayed += match.team1Overs;
            runsConceded += match.team2Runs;
            oversBowled += match.team2Overs;
        } else if (match.team2 === teamName) {
            runsScored += match.team2Runs;
            oversPlayed += match.team2Overs;
            runsConceded += match.team1Runs;
            oversBowled += match.team1Overs;
        }
    });
    if (oversPlayed === 0 || oversBowled === 0) return 0;
    return ((runsScored / oversPlayed) - (runsConceded / oversBowled)).toFixed(3);
}

function getTeamStats(teamName) {
    let played = 0, won = 0, lost = 0;
    matches.forEach(match => {
        if (match.team1 === teamName || match.team2 === teamName) {
            played++;
            if (match.winner === teamName) won++;
            else if (match.winner !== 'Tie') lost++;
        }
    });
    return { played, won, lost, points: won * 2 };
}

function updateStandings() {
    const standingsBody = document.getElementById('standings-body');
    const standings = [];
    teams.forEach(team => {
        const stats = getTeamStats(team);
        const nrr = calculateNRR(team);
        standings.push({ team, ...stats, nrr: parseFloat(nrr) });
    });
    standings.sort((a, b) => b.points !== a.points ? b.points - a.points : b.nrr - a.nrr);
    standingsBody.innerHTML = '';
    standings.forEach((team, index) => {
        const nrrClass = team.nrr > 0 ? 'nrr-positive' : team.nrr < 0 ? 'nrr-negative' : '';
        standingsBody.innerHTML += `
            <tr>
                <td>${index + 1}</td>
                <td><strong>${team.team}</strong></td>
                <td>${team.played}</td>
                <td>${team.won}</td>
                <td>${team.lost}</td>
                <td><strong>${team.points}</strong></td>
                <td class="${nrrClass}">${team.nrr.toFixed(3)}</td>
            </tr>
        `;
    });
}



// Enhanced functions for new features

function updateStandingsCards() {
    const standingsCards = document.getElementById('standings-cards');
    if (!standingsCards) return;
    
    const standings = [];
    teams.forEach(team => {
        const stats = getTeamStats(team);
        const nrr = calculateNRR(team);
        standings.push({ team, ...stats, nrr: parseFloat(nrr) });
    });
    standings.sort((a, b) => b.points !== a.points ? b.points - a.points : b.nrr - a.nrr);
    
    standingsCards.innerHTML = '';
    standings.forEach((team, index) => {
        const nrrClass = team.nrr > 0 ? 'nrr-positive' : team.nrr < 0 ? 'nrr-negative' : '';
        const rankClass = index < 3 ? `rank-${index + 1}` : '';
        
        standingsCards.innerHTML += `
            <div class="standing-card ${rankClass}">
                <div class="standing-header">
                    <div class="team-rank">${index + 1}</div>
                    <div class="team-name-standing">${team.team}</div>
                </div>
                <div class="standing-stats">
                    <div class="standing-stat">
                        <div class="stat-number">${team.played}</div>
                        <div class="stat-label">Matches</div>
                    </div>
                    <div class="standing-stat">
                        <div class="stat-number">${team.won}</div>
                        <div class="stat-label">Won</div>
                    </div>
                    <div class="standing-stat">
                        <div class="stat-number">${team.points}</div>
                        <div class="stat-label">Points</div>
                    </div>
                </div>
                <div class="run-rate ${nrrClass}">NRR: ${team.nrr.toFixed(3)}</div>
            </div>
        `;
    });
    
    // Update league summary
    updateLeagueSummary(standings);
}

function updateLeagueSummary(standings) {
    if (standings.length === 0) return;
    
    const leaderEl = document.getElementById('league-leader');
    const highestNrrEl = document.getElementById('highest-nrr');
    const mostWinsEl = document.getElementById('most-wins');
    
    if (leaderEl) leaderEl.textContent = standings[0].team;
    
    const highestNrr = standings.reduce((max, team) => team.nrr > max.nrr ? team : max);
    if (highestNrrEl) highestNrrEl.textContent = `${highestNrr.team} (${highestNrr.nrr.toFixed(3)})`;
    
    const mostWins = standings.reduce((max, team) => team.won > max.won ? team : max);
    if (mostWinsEl) mostWinsEl.textContent = `${mostWins.team} (${mostWins.won})`;
}



function updateTeamsGrid() {
    const teamsGrid = document.getElementById('teams-grid');
    if (!teamsGrid) return;
    
    teamsGrid.innerHTML = '';
    teams.forEach(team => {
        const stats = getTeamStats(team);
        const nrr = calculateNRR(team);
        
        teamsGrid.innerHTML += `
            <div class="team-card">
                <div class="team-card-name">${team}</div>
                <div class="team-card-stats">
                    <div>
                        <div class="stat-number">${stats.played}</div>
                        <div class="stat-label">Matches</div>
                    </div>
                    <div>
                        <div class="stat-number">${stats.won}</div>
                        <div class="stat-label">Won</div>
                    </div>
                    <div>
                        <div class="stat-number">${nrr}</div>
                        <div class="stat-label">NRR</div>
                    </div>
                </div>
            </div>
        `;
    });
}

function updatePerformanceCards() {
    const performanceCards = document.getElementById('performance-cards');
    if (!performanceCards) return;
    
    performanceCards.innerHTML = '';
    teams.forEach(team => {
        const stats = getTeamStats(team);
        const nrr = parseFloat(calculateNRR(team));
        const winRate = stats.played > 0 ? ((stats.won / stats.played) * 100).toFixed(1) : '0.0';
        
        performanceCards.innerHTML += `
            <div class="team-card">
                <div class="team-card-name">${team}</div>
                <div class="team-card-stats">
                    <div>
                        <div class="stat-number">${winRate}%</div>
                        <div class="stat-label">Win Rate</div>
                    </div>
                    <div>
                        <div class="stat-number">${stats.points}</div>
                        <div class="stat-label">Points</div>
                    </div>
                    <div>
                        <div class="stat-number ${nrr > 0 ? 'text-success' : nrr < 0 ? 'text-error' : ''}">${nrr.toFixed(2)}</div>
                        <div class="stat-label">NRR</div>
                    </div>
                </div>
            </div>
        `;
    });
}

function updateAnalytics() {
    updateKeyMetrics();
}

function updateKeyMetrics() {
    const teams50plusEl = document.getElementById('teams-50plus');
    const teams30plusEl = document.getElementById('teams-30plus');
    const highestRunScorerEl = document.getElementById('highest-run-scorer');
    const totalRunsEl = document.getElementById('total-runs');
    
    if (matches.length === 0) {
        if (teams50plusEl) teams50plusEl.textContent = '-';
        if (teams30plusEl) teams30plusEl.textContent = '0';
        if (highestRunScorerEl) highestRunScorerEl.textContent = '-';
        if (totalRunsEl) totalRunsEl.textContent = '0';
        return;
    }
    
    // Calculate teams with most 50+ scores
    const team50plusCounts = {};
    matches.forEach(match => {
        if (match.team1Runs >= 50) {
            team50plusCounts[match.team1] = (team50plusCounts[match.team1] || 0) + 1;
        }
        if (match.team2Runs >= 50) {
            team50plusCounts[match.team2] = (team50plusCounts[match.team2] || 0) + 1;
        }
    });

    const counts50 = Object.keys(team50plusCounts).map(team => team50plusCounts[team]);
    const max50Count = counts50.length > 0 ? Math.max(...counts50) : 0;
    const top50Teams = Object.keys(team50plusCounts).filter(team => team50plusCounts[team] === max50Count);

    if (teams50plusEl) {
        if (max50Count === 0) {
            teams50plusEl.textContent = '-';
            teams50plusEl.setAttribute('data-full-text', '-');
            teams50plusEl.setAttribute('data-short-text', '-');
        } else if (top50Teams.length === 1) {
            const text = `${top50Teams[0]} (${max50Count})`;
            teams50plusEl.textContent = text;
            teams50plusEl.setAttribute('data-full-text', text);
            teams50plusEl.setAttribute('data-short-text', text);
        } else {
            // Store both full and truncated versions
            const fullText = `${top50Teams.join(', ')} (${max50Count})`;
            const maxDisplayTeams = 3;
            let shortText;
            if (top50Teams.length <= maxDisplayTeams) {
                shortText = fullText;
            } else {
                const displayTeams = top50Teams.slice(0, maxDisplayTeams);
                const remainingCount = top50Teams.length - maxDisplayTeams;
                shortText = `${displayTeams.join(', ')} and ${remainingCount} more (${max50Count})`;
            }
            
            teams50plusEl.textContent = fullText;
            teams50plusEl.setAttribute('data-full-text', fullText);
            teams50plusEl.setAttribute('data-short-text', shortText);
        }
    }
    
    // Calculate teams with most 30+ scores (>=30 && <50)
    const team30plusCounts = {};
    matches.forEach(match => {
        if (match.team1Runs >= 30 && match.team1Runs < 50) {
            team30plusCounts[match.team1] = (team30plusCounts[match.team1] || 0) + 1;
        }
        if (match.team2Runs >= 30 && match.team2Runs < 50) {
            team30plusCounts[match.team2] = (team30plusCounts[match.team2] || 0) + 1;
        }
    });
    
    const counts30 = Object.keys(team30plusCounts).map(team => team30plusCounts[team]);
    const maxCount = counts30.length > 0 ? Math.max(...counts30) : 0;
    const topTeams = Object.keys(team30plusCounts).filter(team => team30plusCounts[team] === maxCount);
    
    if (teams30plusEl) {
        if (maxCount === 0) {
            teams30plusEl.textContent = '0';
            teams30plusEl.setAttribute('data-full-text', '0');
            teams30plusEl.setAttribute('data-short-text', '0');
        } else if (topTeams.length === 1) {
            const text = `${topTeams[0]} (${maxCount})`;
            teams30plusEl.textContent = text;
            teams30plusEl.setAttribute('data-full-text', text);
            teams30plusEl.setAttribute('data-short-text', text);
        } else {
            // Store both full and truncated versions
            const fullText = `${topTeams.join(', ')} (${maxCount})`;
            const maxDisplayTeams = 3;
            let shortText;
            if (topTeams.length <= maxDisplayTeams) {
                shortText = fullText;
            } else {
                const displayTeams = topTeams.slice(0, maxDisplayTeams);
                const remainingCount = topTeams.length - maxDisplayTeams;
                shortText = `${displayTeams.join(', ')} and ${remainingCount} more (${maxCount})`;
            }
            
            teams30plusEl.textContent = fullText;
            teams30plusEl.setAttribute('data-full-text', fullText);
            teams30plusEl.setAttribute('data-short-text', shortText);
        }
    }
    
    // Find highest run scored with team name
    let highestRun = 0;
    let highestRunTeam = '';
    matches.forEach(match => {
        if (match.team1Runs > highestRun) {
            highestRun = match.team1Runs;
            highestRunTeam = match.team1;
        }
        if (match.team2Runs > highestRun) {
            highestRun = match.team2Runs;
            highestRunTeam = match.team2;
        }
    });
    
    if (highestRunScorerEl) {
        if (highestRun === 0) {
            highestRunScorerEl.textContent = '-';
        } else {
            highestRunScorerEl.textContent = `${highestRunTeam} (${highestRun})`;
        }
    }
    
    // Calculate total runs
    const totalRuns = matches.reduce((sum, match) => sum + match.team1Runs + match.team2Runs, 0);
    if (totalRunsEl) totalRunsEl.textContent = totalRuns.toLocaleString();
    
    // Set responsive text based on screen size
    setResponsiveText();
}



function displayMatches() {
    const matchesList = document.getElementById('matches-list');
    if (matchesList) {
        matchesList.innerHTML = '';
        if (matches.length === 0) {
            matchesList.innerHTML = '<p>No matches found.</p>';
            return;
        }
        
        const reversedMatches = [...matches].reverse();
        reversedMatches.forEach(match => {
            const resultText = match.winner === 'Tie'
                ? 'Match Tied'
                : `${match.winner} won by ${Math.abs(match.team1Runs - match.team2Runs)} runs`;
            matchesList.innerHTML += `
                <div class="match-item">
                    <div class="match-teams">${match.team1} vs ${match.team2}</div>
                    <div class="match-score">
                        <span>${match.team1}: ${match.team1Runs}/${match.team1Overs}</span>
                        <span>${match.team2}: ${match.team2Runs}/${match.team2Overs}</span>
                    </div>
                    <div class="match-result">${resultText}</div>
                    <small>Date: ${match.date}</small>
                </div>
            `;
        });
    }
}



function updateHeaderStats() {
    const totalTeamsEl = document.getElementById('total-teams');
    const totalMatchesEl = document.getElementById('total-matches');
    
    if (totalTeamsEl) totalTeamsEl.textContent = teams.length;
    if (totalMatchesEl) totalMatchesEl.textContent = matches.length;
}

// Update the loadData function to include header stats
const originalLoadData = loadData;
loadData = async function() {
    await originalLoadData();
    updateHeaderStats();
    
    // Update team filter options
    const teamFilter = document.getElementById('team-filter');
    if (teamFilter) {
        const currentValue = teamFilter.value;
        teamFilter.innerHTML = '<option value="">All Teams</option>';
        teams.forEach(team => {
            teamFilter.innerHTML += `<option value="${team}">${team}</option>`;
        });
        teamFilter.value = currentValue;
    }
};

// Auto-refresh every 30 seconds when connected
setInterval(() => { if (isConnected) loadData(); }, 30000);

// Handle screen resize to update text display
window.addEventListener('resize', () => {
    setResponsiveText();
});
