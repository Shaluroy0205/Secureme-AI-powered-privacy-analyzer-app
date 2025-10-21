// SecureMe - Privacy Analyzer Script (Clean Version)

// --- Tooltip setup for app info ---
function setupInfoTooltips() {
    document.querySelectorAll('.info').forEach(function(infoIcon) {
        infoIcon.addEventListener('mouseenter', showTooltip);
        infoIcon.addEventListener('focus', showTooltip);
        infoIcon.addEventListener('mouseleave', hideTooltip);
        infoIcon.addEventListener('blur', hideTooltip);
    });
}
function showTooltip(e) {
    const label = e.target.closest('label');
    const info = label.querySelector('input').getAttribute('data-info');
    if (!info) return;
    let tooltip = document.createElement('span');
    tooltip.className = 'info-tooltip';
    tooltip.innerText = info;
    label.appendChild(tooltip);
    tooltip.style.display = 'block';
    tooltip.style.position = 'absolute';
    tooltip.style.left = (e.target.offsetLeft + 20) + 'px';
    tooltip.style.top = (e.target.offsetTop + 20) + 'px';
}
function hideTooltip(e) {
    const label = e.target.closest('label');
    const tooltip = label.querySelector('.info-tooltip');
    if (tooltip) tooltip.remove();
}

document.addEventListener('DOMContentLoaded', setupInfoTooltips);

// --- Get selected apps (including custom) ---
function getSelectedApps() {
    const checked = Array.from(document.querySelectorAll('input[name="apps"]:checked')).map(app => app.value);
    const custom = document.getElementById('customApp').value.trim();
    if (custom) checked.push(custom);
    return checked;
}

// --- App permissions database ---
const APP_PERMISSIONS = {
    Facebook: ['Contacts', 'Location', 'Camera', 'Microphone', 'Device Info', 'Browsing History'],
    WhatsApp: ['Contacts', 'Media', 'Camera', 'Microphone'],
    TikTok: ['Camera', 'Microphone', 'Location', 'Clipboard'],
    Instagram: ['Camera', 'Microphone', 'Contacts'],
    Twitter: ['Contacts', 'Location'],
    Snapchat: ['Camera', 'Microphone', 'Location'],
    LinkedIn: ['Contacts', 'Location'],
    Amazon: ['Browsing History', 'Device Info', 'Location'],
    Flipkart: ['Browsing History', 'Device Info'],
};

// --- Reset form and result ---
document.getElementById('resetBtn').addEventListener('click', function() {
    document.getElementById('privacyForm').reset();
    document.getElementById('customApp').value = '';
    document.getElementById('result').innerHTML = '';
    updateRiskBar(0, 'low');
    savePreferences();
});

// --- Dark mode toggle ---
const darkModeToggle = document.getElementById('darkModeToggle');
darkModeToggle.addEventListener('click', function() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
});
if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
}

// --- Progress bar/risk meter ---
function updateRiskBar(score, level) {
    const bar = document.getElementById('riskBar');
    let percent = Math.min(Math.round((score / 10) * 100), 100);
    bar.style.width = percent + '%';
    bar.className = 'progress-bar ' + level;
}

// --- Save/load preferences (localStorage) ---
function savePreferences() {
    const prefs = {
        name: document.getElementById('name').value,
        apps: Array.from(document.querySelectorAll('input[name="apps"]')).map(i => i.checked),
        customApp: document.getElementById('customApp').value,
        location: document.getElementById('location').checked,
        cookies: document.getElementById('cookies').checked,
        thirdparty: document.getElementById('thirdparty').checked,
        language: document.getElementById('language').value
    };
    localStorage.setItem('secureMePrefs', JSON.stringify(prefs));
}
function loadPreferences() {
    const prefs = JSON.parse(localStorage.getItem('secureMePrefs') || '{}');
    if (prefs.name) document.getElementById('name').value = prefs.name;
    if (prefs.apps) {
        Array.from(document.querySelectorAll('input[name="apps"]')).forEach((i, idx) => i.checked = !!prefs.apps[idx]);
    }
    if (prefs.customApp) document.getElementById('customApp').value = prefs.customApp;
    if (prefs.location) document.getElementById('location').checked = prefs.location;
    if (prefs.cookies) document.getElementById('cookies').checked = prefs.cookies;
    if (prefs.thirdparty) document.getElementById('thirdparty').checked = prefs.thirdparty;
    if (prefs.language) document.getElementById('language').value = prefs.language;
}
loadPreferences();

document.getElementById('language').addEventListener('change', function() {
    savePreferences();
});

// --- Privacy News Feed (placeholder) ---
function loadNewsFeed() {
    const news = [
        'Meta fined €1.2B for GDPR violations (2023)',
        'Google updates privacy controls for users',
        'TikTok faces scrutiny over data collection',
        'WhatsApp introduces new privacy features',
        'Apple enhances app tracking transparency',
    ];
    const newsList = document.getElementById('newsList');
    newsList.innerHTML = news.map(item => `<li>${item}</li>`).join('');
}
loadNewsFeed();

// --- Export as Text ---
document.getElementById('exportBtn').addEventListener('click', function() {
    const result = document.getElementById('result').innerText;
    const blob = new Blob([result], {type: 'text/plain'});
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'privacy_report.txt';
    link.click();
});

// --- Share Result (Web Share API or fallback) ---
document.getElementById('shareBtn').addEventListener('click', function() {
    const result = document.getElementById('result').innerText;
    if (navigator.share) {
        navigator.share({title: 'My Privacy Report', text: result});
    } else {
        alert('Sharing is not supported on this device. You can copy the result manually.');
    }
});

// --- Main Privacy Analysis Logic ---
document.getElementById("privacyForm").addEventListener("submit", function(event) {
    event.preventDefault();

    // Get user name
    const name = document.getElementById("name").value.trim();

    // Get selected apps (including custom)
    const apps = getSelectedApps();

    // Apps permissions analysis
    let allPermissions = [];
    apps.forEach(app => {
        if (APP_PERMISSIONS[app]) {
            allPermissions = [...allPermissions, ...APP_PERMISSIONS[app]];
        }
    });
    allPermissions = [...new Set(allPermissions)];

    // Get privacy settings
    const location = document.getElementById("location").checked;
    const cookies = document.getElementById("cookies").checked;
    const thirdparty = document.getElementById("thirdparty").checked;

    // Analyze privacy risk (simple rule-based logic)
    let riskScore = 0;
    let suggestions = [];
    let links = [];

    // Apps risk (some apps are known for more data collection)
    const riskyApps = ["Facebook", "Instagram", "TikTok", "Snapchat", "Amazon", "Flipkart"];
    const riskyUsed = apps.filter(app => riskyApps.includes(app));
    riskScore += riskyUsed.length * 2;
    if (riskyUsed.length > 0) {
        suggestions.push("Consider limiting use of: " + riskyUsed.join(", ") + ". These apps are known for collecting a lot of data.");
    }

    // Personalized links to privacy settings
    const privacyLinks = {
        'Facebook': 'https://www.facebook.com/settings?tab=privacy',
        'Instagram': 'https://www.instagram.com/accounts/privacy_and_security/',
        'TikTok': 'https://www.tiktok.com/safety/en/privacy-settings/',
        'Snapchat': 'https://support.snapchat.com/en-US/a/privacy-settings',
        'Amazon': 'https://www.amazon.com/gp/help/customer/display.html?nodeId=201909010',
        'Flipkart': 'https://www.flipkart.com/account/privacy',
        'Twitter': 'https://twitter.com/settings/privacy_and_safety',
        'LinkedIn': 'https://www.linkedin.com/psettings/privacy',
        'Google Drive': 'https://myaccount.google.com/privacy',
        'Microsoft Teams': 'https://docs.microsoft.com/en-us/microsoftteams/hc-data-privacy',
        'Zoom': 'https://zoom.us/privacy',
    };
    riskyUsed.forEach(app => {
        if (privacyLinks[app]) {
            links.push(`<a href="${privacyLinks[app]}" target="_blank">${app} Privacy Settings</a>`);
        }
    });

    // Location risk
    if (location) {
        riskScore += 2;
        suggestions.push("Disable location access for apps that don't need it.");
    }

    // Cookies risk
    if (cookies) {
        riskScore += 1;
        suggestions.push("Block third-party cookies in your browser settings for more privacy.");
    }

    // Third-party sharing risk
    if (thirdparty) {
        riskScore += 2;
        suggestions.push("Avoid allowing apps to share your data with third parties.");
    }

    // General suggestions
    let riskLevel = '';
    if (riskScore <= 2) {
        riskLevel = "<span style='color:green;font-weight:bold;'>Low</span>";
        suggestions.push("Great job! Your data is relatively safe. Keep reviewing your privacy settings regularly.");
    } else if (riskScore <= 5) {
        riskLevel = "<span style='color:orange;font-weight:bold;'>Medium</span>";
        suggestions.push("Review your app permissions and privacy settings to reduce your risk.");
    } else {
        riskLevel = "<span style='color:red;font-weight:bold;'>High</span>";
        suggestions.push("Your data is at high risk! Take action to improve your privacy.");
    }

    // Update risk bar
    let barLevel = 'low';
    if (riskScore > 5) barLevel = 'high';
    else if (riskScore > 2) barLevel = 'medium';
    updateRiskBar(riskScore, barLevel);

    // Display result
    const result = `
        <h3>Hello, ${name ? name : "User"} 👋</h3>
        <p><b>Apps you use:</b> ${apps.length > 0 ? apps.join(", ") : "None selected"}</p>
        <p><b>Location Enabled:</b> ${location ? "Yes" : "No"}</p>
        <p><b>Cookies Enabled:</b> ${cookies ? "Yes" : "No"}</p>
        <p><b>Third-Party Sharing:</b> ${thirdparty ? "Yes" : "No"}</p>
        <p><b>Privacy Risk Level:</b> ${riskLevel}</p>
        <p><b>Your data accessed by selected apps:</b> ${allPermissions.length > 0 ? allPermissions.join(', ') : "No data (info not available)"}</p>
        <h4>Suggestions:</h4>
        <ul>${suggestions.map(s => `<li>${s}</li>`).join("")}</ul>
        ${links.length > 0 ? `<h4>Quick Links:</h4><ul>${links.map(l => `<li>${l}</li>`).join('')}</ul>` : ''}
    `;
    document.getElementById("result").innerHTML = result;
    savePreferences();
});
