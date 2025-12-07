const toggle = document.getElementById('toggle');
const siteList = document.getElementById('siteList');
const newSiteInput = document.getElementById('newSite');
const addBtn = document.getElementById('addBtn');
const blockCountEl = document.getElementById('blockCount');
const cooldownInput = document.getElementById('cooldown');

function loadData() {
    chrome.storage.local.get(['blockedSites', 'enabled', 'blockCount', 'cooldownMinutes'], (data) => {
        // Update toggle
        toggle.classList.toggle('active', data.enabled !== false);

        // Update block count
        blockCountEl.textContent = data.blockCount || 0;

        // Update cooldown
        cooldownInput.value = data.cooldownMinutes || 5;

        // Render site list
        siteList.innerHTML = '';
        (data.blockedSites || []).forEach((site, i) => {
            const div = document.createElement('div');
            div.className = 'site-item';
            div.innerHTML = `
        <span>${site}</span>
        <button class="remove-btn" data-index="${i}">×</button>
      `;
            siteList.appendChild(div);
        });
    });
}

toggle.addEventListener('click', () => {
    chrome.storage.local.get(['enabled'], (data) => {
        chrome.storage.local.set({ enabled: data.enabled === false });
        loadData();
    });
});

addBtn.addEventListener('click', () => {
    const site = newSiteInput.value.trim().toLowerCase()
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .split('/')[0];

    if (!site) return;

    chrome.storage.local.get(['blockedSites'], (data) => {
        const sites = data.blockedSites || [];
        if (!sites.includes(site)) {
            sites.push(site);
            chrome.storage.local.set({ blockedSites: sites });
            newSiteInput.value = '';
            loadData();
        }
    });
});

newSiteInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addBtn.click();
});

siteList.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-btn')) {
        const index = parseInt(e.target.dataset.index);
        chrome.storage.local.get(['blockedSites'], (data) => {
            const sites = data.blockedSites || [];
            sites.splice(index, 1);
            chrome.storage.local.set({ blockedSites: sites });
            loadData();
        });
    }
});

cooldownInput.addEventListener('change', () => {
    const mins = Math.max(1, Math.min(60, parseInt(cooldownInput.value) || 5));
    chrome.storage.local.set({ cooldownMinutes: mins });
});

loadData();