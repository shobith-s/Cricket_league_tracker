// == Replace with your deployed Apps Script web app URL ==
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx9bKNJB4oJdeGbyRe9xWP5am3j8x7FBRyZ2N6zFHmAaYnu723IscSjlStEFfPnp4jfRw/exec";
const DEFAULT_SHEET_ID = "1gBvi2v5LYHUMBsbSwAoUfLpDPG_zN_KBzMNq55K03fY";

let teams = [], matches = [], sheetId = DEFAULT_SHEET_ID, isConnected = false;

window.onload = () => {
    document.getElementById('sheet-id').value = DEFAULT_SHEET_ID;
    document.getElementById('setup-section').classList.remove('active');
};

function updateStatus(message, type = 'loading') {
    const status = document.getElementById('status');
    status.textContent = message;
    status.className = `status ${type}`;
}

function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');
    document.getElementById('setup-section').classList.toggle('active', tabName === 'setup');
    if (isConnected) {
        if (tabName === 'standings') updateStandings();
        else if (tabName === 'matches') updateMatchesList();
    }
}

function connectToSheet() {
    const id = document.getElementById('sheet-id').value.trim();
    if (!id) { alert('Please enter a Google Sheet ID'); return; }
    sheetId = id;
    updateStatus('Connecting to Google Sheets...', 'loading');
    loadData();
}

async function loadData() {
    if (!sheetId) { updateStatus('Please connect to Google Sheets first', 'error'); return; }
    try {
        updateStatus('Loading data...', 'loading');
        // Teams
        const teamsUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=Teams`;
        const teamsResponse = await fetch(teamsUrl);
        const teamsText = await teamsResponse.text();
        const teamsData = JSON.parse(teamsText.substr(47).slice(0, -2));
        teams = [];
        if (teamsData.table.rows) {
            teamsData.table.rows.forEach(row => {
                if (row.c[0] && row.c[0].v) teams.push(row.c[0].v);
            });
        }
        // Matches
        const matchesUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=Matches`;
        const matchesResponse = await fetch(matchesUrl);
        const matchesText = await matchesResponse.text();
        const matchesData = JSON.parse(matchesText.substr(47).slice(0, -2));
        matches = [];
        if (matchesData.table.rows) {
            matchesData.table.rows.forEach(row => {
                if (row.c[0] && row.c[0].v) {
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
        isConnected = true;
        updateStatus('✅ Connected to Google Sheets - Data loaded successfully!', 'connected');
        updateTeamSelects();
        updateTeamsList();
        updateStandings();
        updateMatchesList();
    } catch (error) {
        console.error('Error loading data:', error);
        updateStatus('❌ Error connecting to Google Sheets. Check your Sheet ID and make sure it\'s public.', 'error');
        isConnected = false;
    }
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

function updateMatchesList() {
    const matchesList = document.getElementById('matches-list');
    matchesList.innerHTML = '';
    if (matches.length === 0) { matchesList.innerHTML = '<p>No matches played yet.</p>'; return; }
    const reversedMatches = [...matches].reverse();
    reversedMatches.forEach(match => {
        const resultText = match.winner === 'Tie'
            ? 'Match Tied'
            : `${match.winner} won by ${Math.abs(match.team1Runs - match.team2Runs)} runs`;
        matchesList.innerHTML += `
            <div class="match-item">
                <div class="match-teams">${match.team1} vs ${match.team2}</div>
                <div class="match-score">${match.team1}: ${match.team1Runs}/${match.team1Overs} overs</div>
                <div class="match-score">${match.team2}: ${match.team2Runs}/${match.team2Overs} overs</div>
                <div class="match-result">${resultText}</div>
                <small>Date: ${match.date}</small>
            </div>
        `;
    });
}

// Form listeners
document.getElementById('team-form').addEventListener('submit', function (e) { e.preventDefault(); addTeam(); });
document.getElementById('match-form').addEventListener('submit', function (e) { e.preventDefault(); addMatch(); });
// Auto-refresh every 30 seconds when connected
setInterval(() => { if (isConnected) loadData(); }, 30000);
