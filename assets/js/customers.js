// Use global supabase instead of import
const supabase = window.supabase;

const shopSelect = document.getElementById("customers-shop-select");
const nameInput = document.getElementById("customer-name");
const addressInput = document.getElementById("customer-address");
const phoneInput = document.getElementById("customer-phone");
const addBtn = document.getElementById("add-customer-btn");
const listEl = document.getElementById("customers-list");

async function loadShopsForCustomers() {
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
    .select("id, name, address, phone, created_at")
    .eq("shop_id", shopId)
    .order("created_at", { ascending: false });
  if (error) return alert(error.message);
  renderCustomers(data || []);
  updateCustomersCount(data?.length || 0);
}

function renderCustomers(customers) {
  listEl.innerHTML = "";
  const tpl = document.getElementById("customer-card-template");
  customers.forEach((c) => {
    const node = tpl.content.cloneNode(true);
    node.querySelector(".customer-name").textContent = c.name;
    node.querySelector(".customer-address").textContent = c.address || "";
    node.querySelector(".customer-phone").textContent = c.phone || "";
    
    // Format and display the date
    if (c.created_at) {
      const date = new Date(c.created_at);
      const formattedDate = date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      node.querySelector(".customer-date").textContent = `Added: ${formattedDate}`;
    }
    
    node.querySelector('[data-action="edit"]').addEventListener("click", () => editCustomer(c));
    node.querySelector('[data-action="delete"]').addEventListener("click", () => deleteCustomer(c));
    listEl.appendChild(node);
  });
}

async function addCustomer() {
  const shopId = shopSelect.value;
  const name = nameInput.value.trim();
  const address = addressInput.value.trim();
  const phone = phoneInput.value.trim();
  if (!shopId || !name) return;
  const { error } = await supabase.from("customers").insert({ shop_id: shopId, name, address, phone });
  if (error) return alert(error.message);
  nameInput.value = addressInput.value = phoneInput.value = "";
  await loadCustomers();
}

async function editCustomer(c) {
  const name = prompt("Edit name", c.name);
  if (!name) return;
  const address = prompt("Edit address", c.address || "");
  const phone = prompt("Edit phone", c.phone || "");
  const { error } = await supabase
    .from("customers")
    .update({ name, address, phone })
    .eq("id", c.id);
  if (error) return alert(error.message);
  await loadCustomers();
}

function updateCustomersCount(count) {
  const countElement = document.getElementById("customers-count");
  if (countElement) {
    countElement.textContent = count;
  }
}

async function deleteCustomer(c) {
  if (!confirm("Delete this customer and related bills?")) return;
  const { error } = await supabase.from("customers").delete().eq("id", c.id);
  if (error) return alert(error.message);
  await loadCustomers();
}

shopSelect.addEventListener("change", loadCustomers);
addBtn.addEventListener("click", addCustomer);

document.addEventListener("shops:updated", loadShopsForCustomers);

loadShopsForCustomers();


