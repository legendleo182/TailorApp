import { supabase } from "./supabase.js";

const shopNameInput = document.getElementById("shop-name");
const addShopBtn = document.getElementById("add-shop-btn");
const shopsList = document.getElementById("shops-list");

async function loadShops() {
  const { data, error } = await supabase
    .from("shops")
    .select("id, name")
    .order("created_at", { ascending: false });
  if (error) {
    alert(error.message);
    return;
  }
  renderShops(data || []);
}

function renderShops(shops) {
  shopsList.innerHTML = "";
  const tpl = document.getElementById("shop-card-template");
  shops.forEach((shop) => {
    const node = tpl.content.cloneNode(true);
    node.querySelector(".shop-name").textContent = shop.name;
    node.querySelector('[data-action="edit"]').addEventListener("click", () => editShop(shop));
    node.querySelector('[data-action="delete"]').addEventListener("click", () => deleteShop(shop));
    shopsList.appendChild(node);
  });
}

async function addShop() {
  const name = shopNameInput.value.trim();
  if (!name) return;
  const { error } = await supabase.from("shops").insert({ name });
  if (error) return alert(error.message);
  shopNameInput.value = "";
  await loadShops();
  // refresh dropdowns used elsewhere
  document.dispatchEvent(new CustomEvent("shops:updated"));
}

async function editShop(shop) {
  const name = prompt("Edit shop name", shop.name);
  if (!name) return;
  const { error } = await supabase.from("shops").update({ name }).eq("id", shop.id);
  if (error) return alert(error.message);
  await loadShops();
  document.dispatchEvent(new CustomEvent("shops:updated"));
}

async function deleteShop(shop) {
  if (!confirm("Delete this shop and its related data?")) return;
  const { error } = await supabase.from("shops").delete().eq("id", shop.id);
  if (error) return alert(error.message);
  await loadShops();
  document.dispatchEvent(new CustomEvent("shops:updated"));
}

addShopBtn.addEventListener("click", addShop);

loadShops();


