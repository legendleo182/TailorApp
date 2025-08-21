// Use global supabase
const supabase = window.supabase;

// Wait for supabase to be ready
if (!window.supabase) {
  console.error("Supabase not loaded");
}

const emailEl = document.getElementById("session-email");
const logoutBtn = document.getElementById("logout-btn");

const navButtons = {
  shops: document.getElementById("nav-shops"),
  customers: document.getElementById("nav-customers"),
  bills: document.getElementById("nav-bills"),
  analytics: document.getElementById("nav-analytics"),
};

const sections = {
  shops: document.getElementById("section-shops"),
  customers: document.getElementById("section-customers"),
  bills: document.getElementById("section-bills"),
  analytics: document.getElementById("section-analytics"),
};

function showSection(name) {
  Object.values(sections).forEach((s) => s.classList.remove("active"));
  sections[name].classList.add("active");
}

navButtons.shops.addEventListener("click", () => showSection("shops"));
navButtons.customers.addEventListener("click", () => showSection("customers"));
navButtons.bills.addEventListener("click", () => showSection("bills"));
navButtons.analytics.addEventListener("click", () => showSection("analytics"));

// Simple logout handler
if (supabase) {
  supabase.auth.onAuthStateChange((_event, session) => {
    if (!session) {
      window.location.href = "index.html";
    } else {
      emailEl.textContent = session.user.email;
    }
  });
}

logoutBtn.addEventListener("click", async () => {
  await supabase.auth.signOut();
});


