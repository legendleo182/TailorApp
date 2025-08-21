// Use global supabase - wait for it to be ready
console.log("Analytics.js loaded");

// Simple function to get elements and calculate
function updateAnalytics() {
  if (!window.supabase) {
    console.error("Supabase not ready yet");
    return;
  }
  
  console.log("Updating analytics...");
  loadTotals();
  loadShopsReport();
}

// Wait for supabase to be ready
setTimeout(updateAnalytics, 500);

const totalPaidEl = document.getElementById("total-paid");
const totalUnpaidEl = document.getElementById("total-unpaid");
const totalStitchingEl = document.getElementById("total-stitching");
const fiftyPercentDeductedEl = document.getElementById("fifty-percent-deducted");
const shopsReportEl = document.getElementById("shops-report");

async function loadTotals() {
  console.log("loadTotals called");
  const supabase = window.supabase;
  
  // Sum paid balances (status = 'paid_sf')
  const { data: paidRows, error: paidErr } = await supabase
    .from("bills")
    .select("balance_amount")
    .eq("status", "paid_sf");
  if (paidErr) return alert(paidErr.message);
  const paid = (paidRows || []).reduce((sum, r) => sum + Number(r.balance_amount || 0), 0);
  totalPaidEl.textContent = paid.toFixed(2);

  const { data: unpaidRows, error: unpaidErr } = await supabase
    .from("bills")
    .select("balance_amount")
    .eq("status", "unpaid");
  if (unpaidErr) return alert(unpaidErr.message);
  const unpaid = (unpaidRows || []).reduce((sum, r) => sum + Number(r.balance_amount || 0), 0);
  totalUnpaidEl.textContent = unpaid.toFixed(2);

  const { data: stitchRows, error: stitchErr } = await supabase
    .from("bills")
    .select("stitching_amount");
  if (stitchErr) return alert(stitchErr.message);
  const stitch = (stitchRows || []).reduce((sum, r) => sum + Number(r.stitching_amount || 0), 0);
  totalStitchingEl.textContent = stitch.toFixed(2);
  
  // Calculate 50% deducted (half of total stitching)
  const fiftyPercentDeducted = stitch / 2;
  console.log("Calculating 50%:", stitch, "/ 2 =", fiftyPercentDeducted);
  console.log("Setting element:", fiftyPercentDeductedEl);
  fiftyPercentDeductedEl.textContent = fiftyPercentDeducted.toFixed(2);
  console.log("50% value set to:", fiftyPercentDeducted.toFixed(2));
}

async function loadShopsReport() {
  console.log("loadShopsReport called");
  const supabase = window.supabase;
  const { data: shops, error } = await supabase.from("shops").select("id, name");
  if (error) return alert(error.message);
  shopsReportEl.innerHTML = "";
  const fragment = document.createDocumentFragment();
  (shops || []).forEach((s) => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="card-row"><strong>${s.name}</strong></div>
      <div class="muted" data-shop="${s.id}">Loading...</div>
    `;
    fragment.appendChild(card);
  });
  shopsReportEl.appendChild(fragment);

  // For each shop, compute aggregates
  for (const node of shopsReportEl.querySelectorAll("[data-shop]")) {
    const shopId = node.getAttribute("data-shop");
    const { data, error: err } = await supabase
      .from("bills")
      .select("balance_amount, status, stitching_amount")
      .eq("shop_id", shopId);
    if (err) {
      node.textContent = err.message;
      continue;
    }
    const paid = (data || [])
      .filter((b) => b.status === "paid_sf")
      .reduce((s, b) => s + Number(b.balance_amount || 0), 0);
    const unpaid = (data || [])
      .filter((b) => b.status === "unpaid")
      .reduce((s, b) => s + Number(b.balance_amount || 0), 0);
    const stitch = (data || []).reduce((s, b) => s + Number(b.stitching_amount || 0), 0);
    const shopFiftyPercent = stitch / 2;
    node.textContent = `Paid: ${paid.toFixed(2)} | Unpaid: ${unpaid.toFixed(2)} | Stitching: ${stitch.toFixed(2)} | 50% Deducted: ${shopFiftyPercent.toFixed(2)}`;
  }
}

async function refreshAnalytics() {
  await Promise.all([loadTotals(), loadShopsReport()]);
}

document.addEventListener("bills:updated", updateAnalytics);

// Initial load when page loads
document.addEventListener("DOMContentLoaded", updateAnalytics);


