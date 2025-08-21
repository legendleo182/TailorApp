import { supabase } from "./supabase.js";

const form = document.getElementById("auth-form");
const loginBtn = document.getElementById("login-btn");
const signupBtn = document.getElementById("signup-btn");

async function redirectIfLoggedIn() {
  const { data } = await supabase.auth.getSession();
  if (data.session) {
    window.location.href = "app.html";
  }
}

redirectIfLoggedIn();

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginBtn.disabled = true;
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  loginBtn.disabled = false;
  if (error) {
    alert(error.message);
  } else {
    window.location.href = "app.html";
  }
});

signupBtn.addEventListener("click", async () => {
  signupBtn.disabled = true;
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const { error } = await supabase.auth.signUp({ email, password });
  signupBtn.disabled = false;
  if (error) {
    alert(error.message);
  } else {
    alert("Check your email to confirm your account, then login.");
  }
});


