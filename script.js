// Fasosam Enterprise - Core Application Logic
document.addEventListener('DOMContentLoaded', function() {
    // Initialize localStorage keys if they don't exist
    if (!localStorage.getItem('fasosam_users')) {
        localStorage.setItem('fasosam_users', JSON.stringify([]));
    }
    if (!localStorage.getItem('fasosam_products')) {
        localStorage.setItem('fasosam_products', JSON.stringify([]));
    }
    if (!localStorage.getItem('fasosam_orders')) {
        localStorage.setItem('fasosam_orders', JSON.stringify([]));
    }

    // Handle registration form submission
    const registrationForm = document.getElementById('registrationForm');
    if (registrationForm) {
        registrationForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const user = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                password: document.getElementById('password').value,
                type: document.querySelector('input[name="userType"]:checked').value,
                createdAt: new Date().toISOString()
            };

            // Check if user already exists
            const users = JSON.parse(localStorage.getItem('fasosam_users'));
            if (users.some(u => u.email === user.email)) {
                alert('User with this email already exists!');
                return;
            }

            // Save new user
            users.push(user);
            localStorage.setItem('fasosam_users', JSON.stringify(users));
            alert('Registration successful! Please login.');
            window.location.href = 'login.html';
        });
    }

    // Handle login form submission
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            const users = JSON.parse(localStorage.getItem('fasosam_users'));
            
            const user = users.find(u => u.email === email && u.password === password);
            if (user) {
                // Store current session
                sessionStorage.setItem('currentUser', JSON.stringify(user));
                
                // Redirect based on user type
                if (user.type === 'seller') {
                    window.location.href = 'upload.html';
                } else {
                    window.location.href = 'browse.html';
                }
            } else {
                alert('Invalid email or password!');
            }
        });
    }

    // Check for active session on protected pages
    const protectedPages = ['upload.html', 'browse.html', 'cart.html'];
    if (protectedPages.some(page => window.location.pathname.endsWith(page))) {
        if (!sessionStorage.getItem('currentUser')) {
            window.location.href = 'login.html';
        }
    }

    // Handle product upload form
    const productForm = document.getElementById('productForm');
    if (productForm) {
        productForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
            if (!currentUser || currentUser.type !== 'seller') {
                alert('Only sellers can list products!');
                return;
            }

            const product = {
                id: Date.now().toString(),
                sellerEmail: currentUser.email,
                variety: document.getElementById('variety').value,
                quality: document.getElementById('quality').value,
                price: parseFloat(document.getElementById('price').value),
                quantity: parseInt(document.getElementById('quantity').value),
                location: document.getElementById('location').value,
                description: document.getElementById('description').value,
                image: 'https://images.pexels.com/photos/102104/pexels-photo-102104.jpeg', // Placeholder
                createdAt: new Date().toISOString()
            };

            const products = JSON.parse(localStorage.getItem('fasosam_products'));
            products.push(product);
            localStorage.setItem('fasosam_products', JSON.stringify(products));
            
            alert('Product listed successfully!');
            productForm.reset();
            displaySellerProducts();
        });
    }

    // Display seller's products
    function displaySellerProducts() {
        const sellerProducts = document.getElementById('sellerProducts');
        if (sellerProducts) {
            const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
            if (!currentUser) return;

            const products = JSON.parse(localStorage.getItem('fasosam_products'));
            const sellerProductsList = products.filter(p => p.sellerEmail === currentUser.email);

            sellerProducts.innerHTML = sellerProductsList.map(product => `
                <div class="bg-white shadow-md rounded-lg overflow-hidden">
                    <img src="${product.image}" alt="${product.variety}" class="w-full h-48 object-cover">
                    <div class="p-4">
                        <h4 class="font-semibold text-lg">${product.variety} (Grade ${product.quality})</h4>
                        <p class="text-yellow-600 font-bold">$${product.price.toFixed(2)}/kg</p>
                        <p class="text-gray-600">${product.quantity} kg available</p>
                        <p class="text-gray-500 text-sm mt-2">${product.location}</p>
                    </div>
                </div>
            `).join('');
        }
    }

    // Initialize seller products display
    if (window.location.pathname.endsWith('upload.html')) {
        displaySellerProducts();
    }

    // Display all products for buyers
    function displayAllProducts() {
        const productGrid = document.getElementById('productGrid');
        if (productGrid) {
            const products = JSON.parse(localStorage.getItem('fasosam_products'));
            
            productGrid.innerHTML = products.map(product => `
                <div class="bg-white shadow-md rounded-lg overflow-hidden">
                    <img src="${product.image}" alt="${product.variety}" class="w-full h-48 object-cover">
                    <div class="p-4">
                        <div class="flex justify-between items-start">
                            <div>
                                <h4 class="font-semibold text-lg">${product.variety}</h4>
                                <span class="inline-block px-2 py-1 text-xs rounded-full 
                                    ${product.quality === 'A' ? 'bg-green-100 text-green-800' : 
                                      product.quality === 'B' ? 'bg-blue-100 text-blue-800' : 
                                      'bg-gray-100 text-gray-800'}">
                                    Grade ${product.quality}
                                </span>
                            </div>
                            <p class="text-yellow-600 font-bold">$${product.price.toFixed(2)}/kg</p>
                        </div>
                        <p class="text-gray-600 mt-2">${product.quantity} kg available</p>
                        <p class="text-gray-500 text-sm mt-2">${product.location}</p>
                        <button onclick="addToCart('${product.id}')" 
                                class="btn-primary text-white font-bold py-2 px-4 rounded-lg w-full mt-4">
                            Add to Cart
                        </button>
                    </div>
                </div>
            `).join('');
        }
    }

    // Cart functionality
    function addToCart(productId) {
        const products = JSON.parse(localStorage.getItem('fasosam_products'));
        const product = products.find(p => p.id === productId);
        
        if (!product) return;

        let cart = JSON.parse(localStorage.getItem('fasosam_cart')) || [];
        const existingItem = cart.find(item => item.productId === productId);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({
                productId: product.id,
                quantity: 1,
                addedAt: new Date().toISOString()
            });
        }
        
        localStorage.setItem('fasosam_cart', JSON.stringify(cart));
        updateCartCount();
        alert(`${product.variety} added to cart!`);
    }

    function updateCartCount() {
        const cartCount = document.getElementById('cartCount');
        if (cartCount) {
            const cart = JSON.parse(localStorage.getItem('fasosam_cart')) || [];
            const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
            cartCount.textContent = totalItems;
        }
    }

    // Initialize product display and cart count
    if (window.location.pathname.endsWith('browse.html')) {
        displayAllProducts();
        updateCartCount();
    }

    // Display cart items and calculate totals
    function displayCartItems() {
        const cartItems = document.getElementById('cartItems');
        const emptyCartMessage = document.getElementById('emptyCartMessage');
        const cartSummary = document.getElementById('cartSummary');
        
        if (!cartItems) return;

        const cart = JSON.parse(localStorage.getItem('fasosam_cart')) || [];
        const products = JSON.parse(localStorage.getItem('fasosam_products'));

        if (cart.length === 0) {
            emptyCartMessage.classList.remove('hidden');
            cartSummary.classList.add('hidden');
            return;
        }

        emptyCartMessage.classList.add('hidden');
        cartSummary.classList.remove('hidden');

        let subtotal = 0;
        cartItems.innerHTML = cart.map(item => {
            const product = products.find(p => p.id === item.productId);
            if (!product) return '';
            
            const itemTotal = product.price * item.quantity;
            subtotal += itemTotal;

            return `
                <div class="flex flex-col md:flex-row border-b border-gray-200 py-4">
                    <div class="flex-shrink-0 mb-4 md:mb-0">
                        <img src="${product.image}" alt="${product.variety}" class="w-32 h-32 object-cover rounded">
                    </div>
                    <div class="flex-grow md:ml-6">
                        <div class="flex justify-between">
                            <h4 class="font-semibold">${product.variety} (Grade ${product.quality})</h4>
                            <p class="text-yellow-600 font-bold">$${product.price.toFixed(2)}/kg</p>
                        </div>
                        <p class="text-gray-500 text-sm mt-1">${product.location}</p>
                        <div class="flex items-center mt-4">
                            <button onclick="updateQuantity('${product.id}', -1)" 
                                    class="bg-gray-200 px-3 py-1 rounded-l">
                                <i class="fas fa-minus"></i>
                            </button>
                            <span class="bg-gray-100 px-4 py-1">${item.quantity}</span>
                            <button onclick="updateQuantity('${product.id}', 1)" 
                                    class="bg-gray-200 px-3 py-1 rounded-r">
                                <i class="fas fa-plus"></i>
                            </button>
                            <button onclick="removeFromCart('${product.id}')" 
                                    class="ml-auto text-red-500 hover:text-red-700">
                                <i class="fas fa-trash"></i> Remove
                            </button>
                        </div>
                        <div class="text-right mt-2">
                            <span class="font-semibold">$${itemTotal.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        const shipping = 5.00;
        const total = subtotal + shipping;

        document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
        document.getElementById('shipping').textContent = `$${shipping.toFixed(2)}`;
        document.getElementById('total').textContent = `$${total.toFixed(2)}`;
    }

    function updateQuantity(productId, change) {
        let cart = JSON.parse(localStorage.getItem('fasosam_cart')) || [];
        const item = cart.find(item => item.productId === productId);
        
        if (item) {
            item.quantity += change;
            if (item.quantity <= 0) {
                cart = cart.filter(item => item.productId !== productId);
            }
            localStorage.setItem('fasosam_cart', JSON.stringify(cart));
            displayCartItems();
            updateCartCount();
        }
    }

    function removeFromCart(productId) {
        let cart = JSON.parse(localStorage.getItem('fasosam_cart')) || [];
        cart = cart.filter(item => item.productId !== productId);
        localStorage.setItem('fasosam_cart', JSON.stringify(cart));
        displayCartItems();
        updateCartCount();
    }

    // Initialize cart display
    if (window.location.pathname.endsWith('cart.html')) {
        displayCartItems();
        updateCartCount();

        document.getElementById('checkoutBtn')?.addEventListener('click', function() {
            const cart = JSON.parse(localStorage.getItem('fasosam_cart')) || [];
            if (cart.length === 0) return;

            // Create order
            const order = {
                id: Date.now().toString(),
                items: cart,
                total: parseFloat(document.getElementById('total').textContent.replace('$', '')),
                status: 'processing',
                createdAt: new Date().toISOString()
            };

            // Save order
            const orders = JSON.parse(localStorage.getItem('fasosam_orders')) || [];
            orders.push(order);
            localStorage.setItem('fasosam_orders', JSON.stringify(orders));

            // Clear cart
            localStorage.removeItem('fasosam_cart');
            window.location.href = 'order-confirmation.html?id=' + order.id;
        });
    }

    // Display order confirmation details
    if (window.location.pathname.endsWith('order-confirmation.html')) {
        const urlParams = new URLSearchParams(window.location.search);
        const orderId = urlParams.get('id');
        
        if (orderId) {
            const orders = JSON.parse(localStorage.getItem('fasosam_orders')) || [];
            const order = orders.find(o => o.id === orderId);
            
            if (order) {
                document.getElementById('orderId').textContent = order.id;
                document.getElementById('orderTotal').textContent = `$${order.total.toFixed(2)}`;
                
                // Calculate delivery date (3 days from now)
                const deliveryDate = new Date();
                deliveryDate.setDate(deliveryDate.getDate() + 3);
                document.getElementById('deliveryDate').textContent = 
                    deliveryDate.toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        month: 'short', 
                        day: 'numeric' 
                    });
            }
        }
    }

    // Handle review submission
    if (window.location.pathname.endsWith('review.html')) {
        // Initialize star rating
        const stars = document.querySelectorAll('#starRating i');
        stars.forEach(star => {
            star.addEventListener('click', function() {
                const rating = parseInt(this.getAttribute('data-rating'));
                document.getElementById('ratingValue').value = rating;
                
                stars.forEach((s, index) => {
                    if (index < rating) {
                        s.classList.remove('far');
                        s.classList.add('fas', 'text-yellow-500');
                    } else {
                        s.classList.remove('fas', 'text-yellow-500');
                        s.classList.add('far', 'text-gray-300');
                    }
                });
            });
        });

        // Handle review form submission
        document.getElementById('reviewForm')?.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const rating = parseInt(document.getElementById('ratingValue').value);
            const reviewText = document.getElementById('reviewText').value;
            
            if (rating === 0) {
                alert('Please select a rating');
                return;
            }

            // Save review
            const review = {
                rating: rating,
                text: reviewText,
                createdAt: new Date().toISOString()
            };

            const reviews = JSON.parse(localStorage.getItem('fasosam_reviews')) || [];
            reviews.push(review);
            localStorage.setItem('fasosam_reviews', JSON.stringify(reviews));
            
            alert('Thank you for your review!');
            this.reset();
            
            // Reset stars
            stars.forEach(star => {
                star.classList.remove('fas', 'text-yellow-500');
                star.classList.add('far', 'text-gray-300');
            });
            document.getElementById('ratingValue').value = 0;
        });
    }
});
