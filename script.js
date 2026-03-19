import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDwxD9ZZyqMhKEq05kI366x9-mdTsK18LU",
  authDomain: "inventory-system-7a606.firebaseapp.com",
  projectId: "inventory-system-7a606",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Add product
window.addProduct = async function () {
    let name = document.getElementById("name").value;
    let quantity = document.getElementById("quantity").value;

    if (name === "" || quantity === "") {
        alert("Enter all fields!");
        return;
    }

    await addDoc(collection(db, "products"), {
        name: name,
        quantity: Number(quantity)
    });

    alert("Added!");
    displayProducts(); // refresh list
};

// Display products
async function displayProducts() {
    let list = document.getElementById("productList");
    list.innerHTML = "";

    try {
        const querySnapshot = await getDocs(collection(db, "products"));

        querySnapshot.forEach((docSnap) => {
            let p = docSnap.data();

            let li = document.createElement("li");
            li.innerHTML = `
                ${p.name} - ${p.quantity}
                <button onclick="deleteProduct('${docSnap.id}')">Delete</button>
            `;

            list.appendChild(li);
        });

    } catch (error) {
        console.error("Error fetching:", error);
    }
}

// Delete product
window.deleteProduct = async function (id) {
    await deleteDoc(doc(db, "products", id));
    displayProducts();
};

// Load on start
displayProducts();