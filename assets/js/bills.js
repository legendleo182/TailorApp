// Use global supabase instead of import
const supabase = window.supabase;

console.log("Bills.js loaded v1.0.8", supabase);
console.log("Completion feature is now ENABLED with separate Add Reason button!");
console.log("Bill filtering system is now ENABLED with separate Status and Reason Complete filters!");
console.log("Complete backup system is now ENABLED!");

// Storage cleanup utility - available immediately
window.cleanupStorage = async function() {
  console.log("Starting storage cleanup...");
  
  // Get all files in storage
  const { data: files, error: listError } = await window.supabase.storage.from("bills").list();
  if (listError) {
    console.error("Error listing files:", listError);
    return;
  }
  
  console.log("Files in storage:", files.map(f => f.name));
  
  // Get all image URLs from database
  const { data: bills, error: dbError } = await window.supabase.from("bills").select("image_url");
  if (dbError) {
    console.error("Error getting bills:", dbError);
    return;
  }
  
  const usedFiles = bills
    .filter(b => b.image_url)
    .map(b => b.image_url.split('/bills/')[1])
    .filter(f => f);
  
  console.log("Files used in database:", usedFiles);
  
  // Find unused files
  const unusedFiles = files
    .filter(f => f.name !== '.emptyFolderPlaceholder')
    .filter(f => !usedFiles.includes(f.name))
    .map(f => f.name);
  
  console.log("Unused files to delete:", unusedFiles);
  
  if (unusedFiles.length > 0) {
    const confirmed = confirm(`Delete ${unusedFiles.length} unused files from storage?`);
    if (confirmed) {
      const { data, error } = await window.supabase.storage.from("bills").remove(unusedFiles);
      console.log("Cleanup result:", { data, error });
      alert(`Cleanup completed. Deleted ${data?.length || 0} files.`);
    }
  } else {
    alert("No unused files found!");
  }
};

console.log("Storage cleanup utility available as window.cleanupStorage()");

const shopSelect = document.getElementById("bills-shop-select");
const customerSelect = document.getElementById("bills-customer-select");
const stitchingInput = document.getElementById("stitching-amount");
const balanceInput = document.getElementById("balance-amount");
const statusSelect = document.getElementById("balance-status");
const photoInput = document.getElementById("bill-photo");
const addBillBtn = document.getElementById("add-bill-btn");
const billsList = document.getElementById("bills-list");

// Filter variables
let allBills = [];
let currentFilter = "all";

async function loadShops() {
  const { data, error } = await supabase.from("shops").select("id, name").order("name");
  if (error) return alert(error.message);
  shopSelect.innerHTML = data.map((s) => `<option value="${s.id}">${s.name}</option>`).join("");
  await loadCustomers();
}

async function loadCustomers() {
  const shopId = shopSelect.value;
  if (!shopId) return;
  const { data, error } = await supabase
    .from("customers")
    .select("id, name")
    .eq("shop_id", shopId)
    .order("name");
  if (error) return alert(error.message);
  customerSelect.innerHTML = data.map((c) => `<option value="${c.id}">${c.name}</option>`).join("");
  await loadBills();
}

async function loadBills() {
  const shopId = shopSelect.value;
  if (!shopId) return;
  
  console.log("Loading bills for shop:", shopId);
  
  try {
    // Query with completion fields now that migration is done
    const { data, error } = await supabase
      .from("bills")
      .select("id, customer_id, stitching_amount, balance_amount, status, image_url, created_at, is_completed, completion_reason, customers(name)")
      .eq("shop_id", shopId)
      .order("is_completed", { ascending: true })
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("Error loading bills:", error);
      alert("Error loading bills: " + error.message);
      return;
    }
    
    console.log("Bills loaded successfully:", data?.length || 0, "bills");
    
         // Use actual data from database
     const billsWithDefaults = (data || []).map(bill => ({
       ...bill,
       is_completed: bill.is_completed || false,
       completion_reason: bill.completion_reason || null
     }));
     
     // Store all bills for filtering
     allBills = billsWithDefaults;
     
     // Apply current filter
     applyFilter(currentFilter);
     updateBillsCount(billsWithDefaults.length);
    
  } catch (err) {
    console.error("Error loading bills:", err);
    alert("Error loading bills: " + err.message);
  }
}

function renderBills(bills) {
  console.log("renderBills called with:", bills.length, "bills");
  billsList.innerHTML = "";
  const tpl = document.getElementById("bill-card-template");
  console.log("Template found:", !!tpl);
  
  if (!tpl) {
    console.error("Template not found!");
    return;
  }
  
  bills.forEach((b, index) => {
    try {
      console.log(`Rendering bill ${index}:`, b.id, "with image:", b.image_url);
    const node = tpl.content.cloneNode(true);
    node.querySelector(".bill-customer").textContent = b.customers?.name || b.customer_id;
    node.querySelector(".bill-stitching").textContent = Number(b.stitching_amount || 0).toFixed(2);
    node.querySelector(".bill-balance").textContent = Number(b.balance_amount || 0).toFixed(2);
    node.querySelector(".bill-status").textContent = b.status === "paid_sf" ? "Bill Paid SF" : "Mere Paas";
    
    // Handle completion status
    const statusBadge = node.querySelector(".status-badge");
    const completionReason = node.querySelector(".completion-reason");
    const completeBtn = node.querySelector('[data-action="complete"]');
    
    if (b.is_completed) {
      statusBadge.textContent = "Complete";
      statusBadge.setAttribute("data-status", "complete");
      completeBtn.textContent = "Mark Incomplete";
      completeBtn.setAttribute("data-action", "incomplete");
      
      if (b.completion_reason) {
        completionReason.querySelector(".reason-text").textContent = b.completion_reason;
        completionReason.classList.remove("hidden");
      } else {
        completionReason.classList.add("hidden");
      }
    } else {
      statusBadge.textContent = "Incomplete";
      statusBadge.setAttribute("data-status", "incomplete");
      completeBtn.textContent = "Mark Complete";
      completeBtn.setAttribute("data-action", "complete");
      
      if (b.completion_reason) {
        completionReason.querySelector(".reason-text").textContent = b.completion_reason;
        completionReason.classList.remove("hidden");
      } else {
        completionReason.classList.add("hidden");
      }
    }
    
    // Format and display the date
    if (b.created_at) {
      const date = new Date(b.created_at);
      const formattedDate = date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      node.querySelector(".bill-date").textContent = `Added: ${formattedDate}`;
    }
    const img = node.querySelector(".bill-image");
    if (b.image_url) {
      img.src = b.image_url;
      img.style.display = "block";
      img.style.cursor = "zoom-in";
      img.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log("Image thumbnail clicked", b.image_url);
        
        // Use same direct approach
        const testModal = document.getElementById("image-modal");
        const testImg = document.getElementById("image-modal-img");
        
        if (testModal && testImg) {
          testImg.src = b.image_url;
          testModal.classList.remove("hidden");
          testModal.style.display = "grid";
        }
      });
         } else {
       img.style.display = "none";
     }
    const fileInput = node.querySelector(".file-replace");
    const replaceBtn = node.querySelector('[data-action="replace"]');
    replaceBtn.addEventListener("click", () => {
      console.log("Replace photo clicked");
      fileInput.click();
    });
    fileInput.addEventListener("change", async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const url = await uploadPhoto(file);
      if (!url) return;
      const { error } = await supabase.from("bills").update({ image_url: url }).eq("id", b.id);
      if (error) return alert(error.message);
      await loadBills();
      document.dispatchEvent(new CustomEvent("bills:updated"));
    });

    // Complete/Incomplete button - now enabled
    completeBtn.addEventListener("click", () => {
      console.log("Complete/Incomplete button clicked for bill:", b.id);
      toggleBillCompletion(b);
    });
    
    // Add Reason button
    const addReasonBtn = node.querySelector('[data-action="add-reason"]');
    addReasonBtn.addEventListener("click", () => {
      console.log("Add Reason button clicked for bill:", b.id);
      addBillReason(b);
    });
    
    node.querySelector('[data-action="edit"]').addEventListener("click", () => {
      console.log("Edit button clicked for bill:", b.id);
      editBill(b);
    });
    
    const deleteBtn = node.querySelector('[data-action="delete"]');
    console.log(`Setting up delete button for bill ${index}:`, b.id, deleteBtn);
    deleteBtn.addEventListener("click", () => {
      console.log("Delete button clicked for bill:", b.id);
      deleteBill(b);
    });
    billsList.appendChild(node);
    console.log(`Bill ${index} appended to DOM`);
    } catch (err) {
      console.error(`Error rendering bill ${index}:`, err);
    }
  });
  console.log("renderBills completed");
}

// Complete Image Modal System
function showImageInModal(imageUrl) {
  if (!imageUrl) {
    console.log("No image URL provided");
    return;
  }
  
  console.log("showImageInModal called with:", imageUrl);
  
  // Get modal elements
  const modal = document.getElementById("image-modal");
  const modalImg = document.getElementById("image-modal-img");
  
  console.log("Modal elements found:", {modal: !!modal, modalImg: !!modalImg});
  
  if (!modal || !modalImg) {
    console.error("Modal elements not found!");
    console.log("Trying to find modal globally...");
    
    // Try one more time to find modal
    setTimeout(() => {
      const retryModal = document.getElementById("image-modal");
      const retryModalImg = document.getElementById("image-modal-img");
      
      console.log("Retry found:", {modal: !!retryModal, img: !!retryModalImg});
      
      if (retryModal && retryModalImg) {
        retryModalImg.src = imageUrl;
        retryModal.classList.remove("hidden");
        retryModal.style.display = "grid";
        console.log("Modal opened on retry!");
      } else {
        // Final fallback
        const userChoice = confirm("Modal not available. Open image in new window?");
        if (userChoice) {
          window.open(imageUrl, "_blank", "noopener,noreferrer");
        }
      }
    }, 50);
    return;
  }
  
  // Set image and show modal
  modalImg.src = imageUrl;
  modalImg.onload = () => {
    console.log("Image loaded successfully");
    modal.classList.remove("hidden");
    modal.style.display = "grid";
    console.log("Modal should be visible now");
  };
  
  modalImg.onerror = () => {
    console.error("Failed to load image:", imageUrl);
    alert("Failed to load image");
  };
}

function hideImageModal() {
  const modal = document.getElementById("image-modal");
  const modalImg = document.getElementById("image-modal-img");
  
  if (modal && modalImg) {
    modal.classList.add("hidden");
    modal.style.display = "none";
    modalImg.src = "";
    console.log("Modal hidden");
  }
}

// Backup functions
function setupBackupButtons() {
  const downloadBtn = document.getElementById("download-backup-btn");
  const infoBtn = document.getElementById("view-backup-info-btn");
  const backupInfo = document.getElementById("backup-info");
  
  if (downloadBtn) {
    downloadBtn.addEventListener("click", createCompleteBackup);
  }
  
  if (infoBtn) {
    infoBtn.addEventListener("click", () => {
      backupInfo.classList.toggle("hidden");
    });
  }
}

async function createCompleteBackup() {
  try {
    console.log("Creating complete backup...");
    const downloadBtn = document.getElementById("download-backup-btn");
    downloadBtn.disabled = true;
    downloadBtn.textContent = "🔄 Creating Backup...";
    
    // Get all data
    const { data: shops } = await supabase.from("shops").select("*");
    const { data: customers } = await supabase.from("customers").select("*");
    const { data: bills } = await supabase.from("bills").select("*");
    
    // Create backup object
    const backup = {
      timestamp: new Date().toISOString(),
      version: "1.0.7",
      data: {
        shops: shops || [],
        customers: customers || [],
        bills: bills || []
      },
      schema: {
        shops: ["id", "name", "created_at"],
        customers: ["id", "shop_id", "name", "address", "phone", "created_at"],
        bills: ["id", "shop_id", "customer_id", "stitching_amount", "balance_amount", "status", "image_url", "is_completed", "completion_reason", "created_at"]
      }
    };
    
    // Create and download file
    const backupStr = JSON.stringify(backup, null, 2);
    const blob = new Blob([backupStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement("a");
    a.href = url;
    a.download = `tailor-crm-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log("Backup created successfully!");
    alert("✅ Backup created successfully! File download ho gaya hai.");
    
  } catch (error) {
    console.error("Backup error:", error);
    alert("❌ Backup error: " + error.message);
  } finally {
    const downloadBtn = document.getElementById("download-backup-btn");
    downloadBtn.disabled = false;
    downloadBtn.textContent = "📥 Download Complete Backup";
  }
}

// Setup modal close handlers when bills section loads
function setupModalHandlers() {
  const modal = document.getElementById("image-modal");
  const closeBtn = document.getElementById("image-modal-close");
  const backdrop = modal?.querySelector(".modal-backdrop");
  
  console.log("Setting up modal handlers", {modal: !!modal, closeBtn: !!closeBtn, backdrop: !!backdrop});
  
  if (closeBtn) {
    closeBtn.addEventListener("click", (e) => {
      e.preventDefault();
      console.log("Close button clicked");
      hideImageModal();
    });
  }
  if (backdrop) {
    backdrop.addEventListener("click", (e) => {
      console.log("Backdrop clicked");
      hideImageModal();
    });
  }
  
  // ESC key to close
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      console.log("ESC key pressed");
      hideImageModal();
    }
  });
}

async function uploadPhoto(file) {
  if (!file) return null;
  const filePath = `${Date.now()}_${file.name}`;
  const { data, error } = await supabase.storage.from("bills").upload(filePath, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) {
    alert(error.message);
    return null;
  }
  const { data: publicUrl } = supabase.storage.from("bills").getPublicUrl(data.path);
  return publicUrl.publicUrl;
}

function updateBillsCount(count) {
  const countElement = document.getElementById("bills-count");
  if (countElement) {
    countElement.textContent = count;
  }
}

// Filter functions
function setupFilterButtons() {
  const filterButtons = document.querySelectorAll('.filter-btn');
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.getAttribute('data-filter');
      setActiveFilter(filter);
      applyFilter(filter);
    });
  });
}

function setActiveFilter(filter) {
  // Remove active class from all buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Add active class to clicked button
  document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
  currentFilter = filter;
}

function applyFilter(filter) {
  let filteredBills = [];
  
  switch(filter) {
    case 'all':
      filteredBills = allBills;
      break;
    case 'status-complete':
      filteredBills = allBills.filter(bill => bill.is_completed === true);
      break;
    case 'reason-complete':
      filteredBills = allBills.filter(bill => 
        bill.completion_reason && 
        bill.completion_reason.toLowerCase().includes('complete')
      );
      break;
    case 'ordered':
      filteredBills = allBills.filter(bill => 
        bill.completion_reason && 
        bill.completion_reason.toLowerCase().includes('ordered')
      );
      break;
    case 'working':
      filteredBills = allBills.filter(bill => 
        bill.completion_reason && 
        bill.completion_reason.toLowerCase().includes('working')
      );
      break;
    default:
      filteredBills = allBills;
  }
  
  renderBills(filteredBills);
  updateFilterCount(filteredBills.length, allBills.length);
}

function updateFilterCount(filteredCount, totalCount) {
  const filterCountElement = document.getElementById('filter-count');
  if (filterCountElement) {
    if (currentFilter === 'all') {
      filterCountElement.textContent = `Showing all ${totalCount} bills`;
    } else {
      filterCountElement.textContent = `Showing ${filteredCount} of ${totalCount} bills (${currentFilter} filter)`;
    }
  }
}

async function addBill() {
  const shopId = shopSelect.value;
  const customerId = customerSelect.value;
  const stitching = Number(stitchingInput.value || 0);
  const balance = Number(balanceInput.value || 0);
  const status = statusSelect.value; // 'paid_sf' | 'unpaid'
  if (!shopId || !customerId) return;

  let imageUrl = null;
  if (photoInput.files && photoInput.files[0]) {
    imageUrl = await uploadPhoto(photoInput.files[0]);
  }

  try {
    // Insert with completion fields
    const { error } = await supabase.from("bills").insert({
      shop_id: shopId,
      customer_id: customerId,
      stitching_amount: stitching,
      balance_amount: balance,
      status,
      image_url: imageUrl,
      is_completed: false,
      completion_reason: null
    });
    
    if (error) {
      console.error("Error adding bill:", error);
      alert("Error adding bill: " + error.message);
      return;
    }

    console.log("Bill added successfully");
    stitchingInput.value = balanceInput.value = "";
    if (photoInput) photoInput.value = "";
    await loadBills();
    document.dispatchEvent(new CustomEvent("bills:updated"));
  } catch (err) {
    console.error("Error adding bill:", err);
    alert("Error adding bill: " + err.message);
  }
}

async function editBill(b) {
  const stitching = Number(prompt("Edit stitching amount", b.stitching_amount ?? 0) || 0);
  const balance = Number(prompt("Edit balance amount", b.balance_amount ?? 0) || 0);
  const status = prompt("Edit status (paid_sf/unpaid)", b.status || "unpaid");
  const { error } = await supabase
    .from("bills")
    .update({ stitching_amount: stitching, balance_amount: balance, status })
    .eq("id", b.id);
  if (error) return alert(error.message);
  await loadBills();
  document.dispatchEvent(new CustomEvent("bills:updated"));
}

async function addBillReason(b) {
  const currentReason = b.completion_reason || "";
  const newReason = prompt("Enter reason for this bill:", currentReason);
  
  if (newReason === null) return; // User cancelled
  
  try {
    const { error } = await supabase
      .from("bills")
      .update({ 
        completion_reason: newReason || null
      })
      .eq("id", b.id);
      
    if (error) {
      console.error("Error updating reason:", error.message);
      alert("Error updating reason: " + error.message);
      return;
    }
    
    await loadBills();
    document.dispatchEvent(new CustomEvent("bills:updated"));
  } catch (err) {
    console.error("Error updating reason:", err);
    alert("Error updating reason: " + err.message);
  }
}

async function toggleBillCompletion(b) {
  const isCurrentlyCompleted = b.is_completed;
  let completionReason = null;
  
  if (!isCurrentlyCompleted) {
    // Marking as complete - ask for reason
    completionReason = prompt("Enter completion reason (optional):");
    if (completionReason === null) return; // User cancelled
  } else {
    // Marking as incomplete - also ask for reason
    completionReason = prompt("Enter incomplete reason (optional):");
    if (completionReason === null) return; // User cancelled
  }
  
  try {
    const { error } = await supabase
      .from("bills")
      .update({ 
        is_completed: !isCurrentlyCompleted,
        completion_reason: completionReason || null
      })
      .eq("id", b.id);
      
    if (error) {
      console.error("Error updating completion status:", error.message);
      alert("Error updating completion status: " + error.message);
      return;
    }
    
    await loadBills();
    document.dispatchEvent(new CustomEvent("bills:updated"));
  } catch (err) {
    console.error("Error toggling completion:", err);
    alert("Error updating completion status: " + err.message);
  }
}

async function deleteBill(b) {
  console.log("=== DELETE BILL CALLED ===", b);
  if (!confirm("Delete this bill?")) return;
  console.log("User confirmed deletion");
  
  // Delete from database first
  const { error } = await supabase.from("bills").delete().eq("id", b.id);
  if (error) return alert(error.message);
  
  // If bill had an image, delete it from storage too
  if (b.image_url) {
    console.log("Deleting image from storage:", b.image_url);
    
    try {
      // Extract file path from URL - try multiple methods
      let fileName;
      
      if (b.image_url.includes('/storage/v1/object/public/bills/')) {
        // Method 1: Standard Supabase URL
        fileName = b.image_url.split('/bills/')[1];
      } else {
        // Method 2: Fallback - get last part after last slash
        const urlParts = b.image_url.split('/');
        fileName = urlParts[urlParts.length - 1];
      }
      
      console.log("Extracted filename:", fileName);
      
      if (!fileName) {
        console.error("Could not extract filename from URL");
        return;
      }
      
      // Delete from storage
      console.log("Attempting to delete file:", fileName);
      const { data, error: storageError } = await supabase.storage
        .from("bills")
        .remove([fileName]);
      
      console.log("Storage delete response:", { data, error: storageError });
      
      if (storageError) {
        console.error("Failed to delete image from storage:", storageError);
        // Show error to user for debugging
        alert(`Storage deletion failed: ${storageError.message}`);
      } else {
        console.log("Image deleted successfully from storage", data);
      }
    } catch (err) {
      console.error("Error during image deletion:", err);
    }
  }
  
  await loadBills();
  document.dispatchEvent(new CustomEvent("bills:updated"));
}

// Storage cleanup utility
window.cleanupStorage = async function() {
  console.log("Starting storage cleanup...");
  
  // Get all files in storage
  const { data: files, error: listError } = await supabase.storage.from("bills").list();
  if (listError) {
    console.error("Error listing files:", listError);
    return;
  }
  
  console.log("Files in storage:", files.map(f => f.name));
  
  // Get all image URLs from database
  const { data: bills, error: dbError } = await supabase.from("bills").select("image_url");
  if (dbError) {
    console.error("Error getting bills:", dbError);
    return;
  }
  
  const usedFiles = bills
    .filter(b => b.image_url)
    .map(b => b.image_url.split('/bills/')[1])
    .filter(f => f);
  
  console.log("Files used in database:", usedFiles);
  
  // Find unused files
  const unusedFiles = files
    .filter(f => f.name !== '.emptyFolderPlaceholder')
    .filter(f => !usedFiles.includes(f.name))
    .map(f => f.name);
  
  console.log("Unused files to delete:", unusedFiles);
  
  if (unusedFiles.length > 0) {
    const confirmed = confirm(`Delete ${unusedFiles.length} unused files from storage?`);
    if (confirmed) {
      const { data, error } = await supabase.storage.from("bills").remove(unusedFiles);
      console.log("Cleanup result:", { data, error });
      alert(`Cleanup completed. Deleted ${data?.length || 0} files.`);
    }
  } else {
    alert("No unused files found!");
  }
};

// Make deleteBill accessible for testing
window.testDeleteBill = deleteBill;
console.log("Storage cleanup utility available as window.cleanupStorage()");
console.log("deleteBill exposed as window.testDeleteBill");

shopSelect.addEventListener("change", loadCustomers);
customerSelect.addEventListener("change", loadBills);
addBillBtn.addEventListener("click", addBill);

document.addEventListener("shops:updated", loadShops);

loadShops();

// Make deleteBill global for testing
window.deleteBill = deleteBill;

// Setup modal when DOM is ready
console.log("About to setup modal handlers...");
setTimeout(() => {
  console.log("Setting up modal with delay...");
  setupModalHandlers();
  setupFilterButtons();
  setupBackupButtons();
  console.log("Modal setup completed");
  console.log("Filter buttons setup completed");
  console.log("Backup buttons setup completed");
}, 100);


