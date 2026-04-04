import "./styles/main.css";
import { renderLoginPage } from "./features/auth/login.js";

const app = document.querySelector("#app");
renderLoginPage(app);
