/**
 * Project: Vouch MVP Logic
 * Founder: Rejoice Uzodinma
 * Engine: LocalStorage Persistence
 * Description: Manages escrow lifecycle from contract creation to fund release.
 */

// ===== CORE STATE MANAGEMENT =====
let transactions = JSON.parse(localStorage.getItem('vouch_transactions')) || [];
let totalEscrowVolume = parseFloat(localStorage.getItem('vouch_total_volume')) || 0;
let activeTransactionIndex = null;


const saveToDisk = () => {
    localStorage.setItem('vouch_transactions', JSON.stringify(transactions));
    localStorage.setItem('vouch_total_volume', totalEscrowVolume);
};

// ===== UI RENDERERS =====


const updateVolumeDisplay = (newAmount = 0) => {
    const amountAsNumber = parseFloat(newAmount);
    if (!isNaN(amountAsNumber)) {
        totalEscrowVolume += amountAsNumber;
    }
    
    const displayElement = document.getElementById('total-amount-display');
    if (displayElement) {
        displayElement.innerText = totalEscrowVolume.toLocaleString();
    }
    saveToDisk();
};


const renderLedger = () => {
    const tableBody = document.getElementById("transaction-table");
    if (!tableBody) return;

    tableBody.innerHTML = transactions.map((t, index) => `
        <tr onclick="setActiveTransaction(${index})" 
            class="${activeTransactionIndex === index ? 'selected-row' : ''}" 
            style="cursor:pointer">
            <td data-label="BUYER">${t.buyer}</td>
            <td data-label="SELLER">${t.seller}</td>
            <td data-label="ITEM">${t.item}</td>
            <td data-label="AMOUNT">₦${Number(t.amount).toLocaleString()}</td>
            <td data-label="STATUS"><span class="status-${t.status.toLowerCase()}">${t.status.toUpperCase()}</span></td> 
        </tr>
    `).join('');
    
    updateVolumeDisplay(); 
};
/**
 * Updates the Vault Control Panel based on selection
 */
const renderVaultUI = () => {
    const statusText = document.getElementById("status-text");
    const secureBtn = document.getElementById("secure-btn");
    const releaseBtn = document.getElementById("release-btn");
    const disputeBtn = document.getElementById("dispute-btn");

    if (activeTransactionIndex === null || !transactions[activeTransactionIndex]) {
        if (statusText) statusText.textContent = "SELECT A TRANSACTION";
        [secureBtn, releaseBtn, disputeBtn].forEach(btn => { if(btn) btn.disabled = true; });
        return;
    }

    const current = transactions[activeTransactionIndex];
    
  
    if (statusText) {
        statusText.textContent = current.status.toUpperCase();
        statusText.className = `status-${current.status}`;
    }

    // Contextual Button Logic
    if (secureBtn) secureBtn.disabled = (current.status !== "pending");
    if (releaseBtn) releaseBtn.disabled = (current.status !== "secured");
    if (disputeBtn) disputeBtn.disabled = (current.status !== "secured");
};



const setActiveTransaction = (index) => {
    activeTransactionIndex = index;
    renderLedger();
    renderVaultUI();
};

/**
 * Changes status and triggers appropriate alerts
 */
const handleStatusChange = (newStatus) => {
    if (activeTransactionIndex === null) return;

    const transaction = transactions[activeTransactionIndex];
    if (transaction.status === newStatus) return;

    transaction.status = newStatus;

    const notifications = {
        'secured': "VAULT ACTIVE: Payment is now secured in Vouch Escrow. 🔐",
        'released': "SUCCESS: Funds disbursed to Seller. Transaction complete. ✅",
        'disputed': "FROZEN: Dispute logged. Vouch is now protecting these funds. ⚠️"
    };
    
    if (notifications[newStatus]) alert(notifications[newStatus]);

    saveToDisk();
    renderVaultUI();
    renderLedger();
};



document.addEventListener("DOMContentLoaded", () => {
    updateVolumeDisplay(0); // Initialize display
    renderLedger();
    renderVaultUI();

    // Contract Form Submission
    const contractForm = document.getElementById("contract-form");
    if (contractForm) {
        contractForm.addEventListener("submit", (e) => {
            e.preventDefault();

            const newEntry = {
                buyer: document.getElementById("buyer-name").value, 
                seller: document.getElementById("seller-name").value,
                item: document.getElementById("item-desc").value,
                amount: document.getElementById("amount").value,
                status: "pending"
            };

            transactions.push(newEntry);
            updateVolumeDisplay(newEntry.amount);
            
            // Auto-select the new transaction
            activeTransactionIndex = transactions.length - 1;
            
            alert("Contract secured on the Vouch Server! 🔐"); 
            
            renderLedger();
            renderVaultUI();
            e.target.reset(); 
        });
    }

    // Vault Control Buttons
    document.getElementById("secure-btn").onclick = () => handleStatusChange("secured");
    document.getElementById("release-btn").onclick = () => handleStatusChange("released");
    document.getElementById("dispute-btn").onclick = () => handleStatusChange("disputed");
});


window.clearVouchData = () => {
    if(confirm("VAULT SECURITY: Wipe all transaction history? This cannot be undone. ⚠️")) {
        localStorage.clear();
        location.reload(); 
    }
};
