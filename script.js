import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
    getFirestore,
    collection,
    addDoc,
    deleteDoc,
    doc,
    updateDoc,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyDwxD9ZZyqMhKEq05kI366x9-mdTsK18LU",
    authDomain: "inventory-system-7a606.firebaseapp.com",
    projectId: "inventory-system-7a606"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const isDashboardPage = window.location.pathname.endsWith("dashboard.html");
const isLoginPage = window.location.pathname.endsWith("index.html") || window.location.pathname === "/";

let currentEditId = null;
let allProducts = [];
let searchTimeout = null;

const STOCK_LIMIT = 5;

function getElement(id) {
    return document.getElementById(id);
}

function showToast(message) {
    const toast = getElement("toast");

    if (!toast) {
        return;
    }

    toast.textContent = message;
    toast.classList.add("show");

    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => {
        toast.classList.remove("show");
    }, 2200);
}

function setGuestMode(enabled) {
    if (enabled) {
        sessionStorage.setItem("guestMode", "true");
    } else {
        sessionStorage.removeItem("guestMode");
    }
}

function isGuestMode() {
    return sessionStorage.getItem("guestMode") === "true";
}

function redirectTo(page) {
    window.location.href = page;
}

function getStatus(quantity) {
    if (quantity === 0) {
        return { text: "Out of Stock", className: "badge badge-danger" };
    }

    if (quantity <= STOCK_LIMIT) {
        return { text: "Low Stock", className: "badge badge-warning" };
    }

    return { text: "In Stock", className: "badge badge-success" };
}

function updateSessionLabel(user) {
    const sessionLabel = getElement("sessionLabel");

    if (!sessionLabel) {
        return;
    }

    if (user) {
        sessionLabel.textContent = `Signed in as ${user.email}`;
        return;
    }

    sessionLabel.textContent = isGuestMode() ? "Guest session active" : "Session unavailable";
}

function applyTheme() {
    const savedTheme = localStorage.getItem("theme") || "dark";
    document.body.classList.toggle("light", savedTheme === "light");
    document.body.classList.toggle("dark", savedTheme !== "light");
}

window.toggleDark = function () {
    const nextTheme = document.body.classList.contains("light") ? "dark" : "light";
    localStorage.setItem("theme", nextTheme);
    applyTheme();
};

async function handleAuthAction(action) {
    const email = getElement("email")?.value.trim();
    const password = getElement("password")?.value.trim();

    if (!email || !password) {
        showToast("Please enter email and password.");
        return;
    }

    try {
        setGuestMode(false);
        await action(email, password);
        showToast("Authentication successful.");
        redirectTo("dashboard.html");
    } catch (error) {
        showToast(error.message);
    }
}

window.login = function () {
    return handleAuthAction((email, password) =>
        signInWithEmailAndPassword(auth, email, password)
    );
};

window.signup = function () {
    return handleAuthAction((email, password) =>
        createUserWithEmailAndPassword(auth, email, password)
    );
};

window.continueGuest = function () {
    setGuestMode(true);
    redirectTo("dashboard.html");
};

window.logout = async function () {
    try {
        setGuestMode(false);

        if (auth.currentUser) {
            await signOut(auth);
        }

        showToast("Logged out successfully.");
    } catch (error) {
        showToast(error.message);
    } finally {
        redirectTo("index.html");
    }
};

function protectRoute() {
    onAuthStateChanged(auth, (user) => {
        if (isLoginPage && user) {
            redirectTo("dashboard.html");
            return;
        }

        if (isDashboardPage && !user && !isGuestMode()) {
            redirectTo("index.html");
            return;
        }

        updateSessionLabel(user);

        if (isDashboardPage) {
            initializeDashboard();
        }
    });
}

function setLoading(isLoading) {
    const loadingState = getElement("loadingState");
    if (loadingState) {
        loadingState.classList.toggle("hidden", !isLoading);
    }
}

function toggleEmptyState(products) {
    const emptyState = getElement("emptyState");
    if (emptyState) {
        emptyState.classList.toggle("hidden", products.length > 0);
    }
}

function updateDashboard(products) {
    const total = products.length;
    const lowStock = products.filter((product) => product.quantity > 0 && product.quantity <= STOCK_LIMIT).length;
    const outOfStock = products.filter((product) => product.quantity === 0).length;

    if (getElement("total")) {
        getElement("total").textContent = total;
    }

    if (getElement("low")) {
        getElement("low").textContent = lowStock;
    }

    if (getElement("out")) {
        getElement("out").textContent = outOfStock;
    }
}

function resetFormState() {
    currentEditId = null;

    if (getElement("formTitle")) {
        getElement("formTitle").textContent = "Add Product";
    }
}

function clearInputs() {
    ["name", "quantity", "category"].forEach((id) => {
        const field = getElement(id);
        if (field) {
            field.value = "";
        }
    });

    resetFormState();
}

window.resetForm = function () {
    clearInputs();
};

function createProductCard(product) {
    const status = getStatus(product.quantity);

    return `
        <article class="product-card">
            <div>
                <span class="${status.className}">${status.text}</span>
            </div>
            <div>
                <h3>${product.name}</h3>
            </div>
            <div class="product-meta">
                <span>Quantity: ${product.quantity}</span>
                <span>Category: ${product.category}</span>
            </div>
            <div class="action-row">
                <button class="btn btn-edit" type="button" onclick="editProduct('${product.id}')">Edit</button>
                <button class="btn btn-delete" type="button" onclick="deleteProduct('${product.id}')">Delete</button>
            </div>
        </article>
    `;
}

function renderProducts(products) {
    const list = getElement("productList");

    if (!list) {
        return;
    }

    list.innerHTML = products.map(createProductCard).join("");
    toggleEmptyState(products);
    updateDashboard(allProducts);
}

function filterProducts(searchText) {
    const query = searchText.trim().toLowerCase();

    if (!query) {
        renderProducts(allProducts);
        return;
    }

    const filteredProducts = allProducts.filter((product) => {
        const statusText = getStatus(product.quantity).text.toLowerCase();

        return [product.name, product.category, statusText]
            .join(" ")
            .toLowerCase()
            .includes(query);
    });

    renderProducts(filteredProducts);
}

function setupSearch() {
    const searchInput = getElement("search");

    if (!searchInput || searchInput.dataset.ready === "true") {
        return;
    }

    searchInput.dataset.ready = "true";

    searchInput.addEventListener("input", (event) => {
        const value = event.target.value;

        window.clearTimeout(searchTimeout);
        searchTimeout = window.setTimeout(() => {
            filterProducts(value);
        }, 180);
    });
}

window.editProduct = function (id) {
    const product = allProducts.find((item) => item.id === id);

    if (!product) {
        return;
    }

    getElement("name").value = product.name;
    getElement("quantity").value = product.quantity;
    getElement("category").value = product.category;
    currentEditId = id;

    if (getElement("formTitle")) {
        getElement("formTitle").textContent = "Edit Product";
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
};

window.deleteProduct = async function (id) {
    const confirmed = window.confirm("Are you sure you want to delete this product?");

    if (!confirmed) {
        return;
    }

    try {
        await deleteDoc(doc(db, "products", id));
        showToast("Product deleted.");
    } catch (error) {
        showToast(error.message);
    }
};

window.saveProduct = async function () {
    const name = getElement("name")?.value.trim();
    const quantity = Number(getElement("quantity")?.value);
    const category = getElement("category")?.value.trim();

    if (!name || Number.isNaN(quantity) || quantity < 0 || !category) {
        showToast("Please fill all fields correctly.");
        return;
    }

    const productData = {
        name,
        quantity,
        category
    };

    try {
        if (currentEditId) {
            await updateDoc(doc(db, "products", currentEditId), productData);
            showToast("Product updated.");
        } else {
            await addDoc(collection(db, "products"), {
                ...productData,
                createdAt: new Date()
            });
            showToast("Product added.");
        }

        clearInputs();
    } catch (error) {
        showToast(error.message);
    }
};

function subscribeToProducts() {
    if (!isDashboardPage || subscribeToProducts.started) {
        return;
    }

    subscribeToProducts.started = true;
    setLoading(true);

    onSnapshot(
        collection(db, "products"),
        (snapshot) => {
            allProducts = snapshot.docs.map((item) => ({
                id: item.id,
                ...item.data()
            }));

            setLoading(false);
            filterProducts(getElement("search")?.value || "");
        },
        (error) => {
            setLoading(false);
            showToast(error.message);
        }
    );
}

function initializeDashboard() {
    if (!isDashboardPage || initializeDashboard.started) {
        return;
    }

    initializeDashboard.started = true;
    setupSearch();
    subscribeToProducts();
}

applyTheme();
protectRoute();
