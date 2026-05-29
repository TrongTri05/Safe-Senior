import api from "./api.js";
document.addEventListener("DOMContentLoaded", async () => {
    const productList = document.getElementById("product-list");
    try {
        const response = await api.get("/products");
        const products = response.data.result;
        productList.innerHTML = products.map(product => `           
            <div class="bg-white rounded-2xl border border-gray-100 p-3 shadow-sm hover:shadow-md transition flex flex-col justify-between">
                <div>
                    <div class="rounded-xl overflow-hidden aspect-[4/3] bg-gray-50 relative mb-4 flex items-center justify-center">
                        <img src="img/sos.png" alt="product image" class="w-full h-full object-cover"></div>
                    <div class="px-1">
                        <h3 class="font-semibold text-sm text-gray-800">
                            ${product.name}
                        </h3>
                        <p class="font-bold text-sm mt-1 text-brand">
                            $${product.price}
                        </p>
                    </div>
                </div>
                <button 
                    class="buy-btn w-full mt-4 bg-brand text-white text-xs font-semibold py-2 rounded-xl hover:bg-brand-dark transition flex items-center justify-center gap-1.5"
                    data-id="${product.id}">             
                    Buy Now
                </button>
            </div>
        `).join("");
        // add event
        const buyButtons = document.querySelectorAll(".buy-btn");
        buyButtons.forEach(button => {
            button.addEventListener("click", () => {
                const productId = button.dataset.id;
                console.log("Buy product:", productId);
            });
        });
    } catch (error) {
        console.error(error);
        productList.innerHTML = `
            <p class="text-red-500">
                Cannot load products
            </p>
        `;
    }
});