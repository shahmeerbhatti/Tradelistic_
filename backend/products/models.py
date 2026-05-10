from django.db import models
from django.conf import settings

CATEGORY_CHOICES = [
    ('electronics', 'Electronics'),
    ('fashion', 'Fashion'),
    ('home', 'Home & Living'),
    ('books', 'Books'),
    ('others', 'Others'),
]

SUBCATEGORY_CHOICES = {
    'electronics': [
        ('laptops', 'Laptops'),
        ('mobile_phones', 'Mobile Phones'),
        ('tablets', 'Tablets'),
        ('accessories', 'Accessories'),
        ('cameras', 'Cameras'),
    ],
    'fashion': [
        ('mens_clothing', "Men's Clothing"),
        ('womens_clothing', "Women's Clothing"),
        ('shoes', 'Shoes'),
        ('bags', 'Bags'),
        ('jewelry', 'Jewelry'),
    ],
    'home': [
        ('furniture', 'Furniture'),
        ('kitchen', 'Kitchen & Dining'),
        ('bedding', 'Bedding'),
        ('decor', 'Home Decor'),
        ('appliances', 'Appliances'),
    ],
    'books': [
        ('fiction', 'Fiction'),
        ('non_fiction', 'Non-Fiction'),
        ('educational', 'Educational'),
        ('comics', 'Comics & Graphic Novels'),
        ('magazines', 'Magazines'),
    ],
    'others': [
        ('sports', 'Sports & Fitness'),
        ('toys', 'Toys & Games'),
        ('beauty', 'Beauty & Personal Care'),
        ('automotive', 'Automotive'),
        ('office', 'Office Supplies'),
    ],
}

class Product(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    image = models.ImageField(upload_to='products/', null=True, blank=True)  # Keep for backward compatibility
    created_at = models.DateTimeField(auto_now_add=True)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='products')
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='others')
    subcategory = models.CharField(max_length=50, blank=True, default='')
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name

class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='products/')
    order = models.PositiveIntegerField(default=0)  # To maintain image order
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', 'created_at']

    def __str__(self):
        return f"{self.product.name} - Image {self.order + 1}"

class ProductView(models.Model):
    """
    Track product views for analytics and recommendation engine
    """
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='views')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True)  # Anonymous users allowed
    ip_address = models.GenericIPAddressField()  # Track by IP for anonymous users
    user_agent = models.TextField(blank=True)  # Browser/device info
    viewed_at = models.DateTimeField(auto_now_add=True)
    
    # Additional tracking info
    referrer = models.URLField(blank=True)  # Where they came from
    session_id = models.CharField(max_length=255, blank=True)  # Session tracking
    
    class Meta:
        ordering = ['-viewed_at']
        indexes = [
            models.Index(fields=['product', '-viewed_at']),
            models.Index(fields=['user', '-viewed_at']),
            models.Index(fields=['ip_address', '-viewed_at']),
        ]
    
    def __str__(self):
        user_info = self.user.username if self.user else f"Anonymous ({self.ip_address})"
        return f"{self.product.name} viewed by {user_info} at {self.viewed_at}"

class Favorite(models.Model):
    """
    Track user favorites for products
    """
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='favorites')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='favorited_by')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('user', 'product')  # Prevent duplicate favorites
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['product', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.user.username} favorites {self.product.name}"

class Cart(models.Model):
    """
    User's shopping cart
    """
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='cart')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.username}'s Cart"
    
    @property
    def total_items(self):
        return self.items.aggregate(total=models.Sum('quantity'))['total'] or 0
    
    @property
    def total_price(self):
        return sum(item.total_price for item in self.items.all())

class CartItem(models.Model):
    """
    Individual items in a user's cart
    """
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('cart', 'product')  # Prevent duplicate items in same cart
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.quantity}x {self.product.name} in {self.cart.user.username}'s cart"
    
    @property
    def total_price(self):
        return self.quantity * self.product.price

class ProductOffer(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('countered', 'Countered'),
        ('importer_countered', 'Importer Countered'),
        ('importer_accepted', 'Importer Accepted'),
        ('importer_rejected', 'Importer Rejected'),
        ('paid', 'Paid'),
    ]

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='offers')
    importer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_offers')
    exporter = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='received_offers')
    quantity = models.PositiveIntegerField(default=1)
    offered_price = models.DecimalField(max_digits=10, decimal_places=2)
    counter_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    note = models.TextField(blank=True)
    exporter_note = models.TextField(blank=True)
    importer_response_note = models.TextField(blank=True)
    importer_requirements = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['importer', '-updated_at']),
            models.Index(fields=['exporter', '-updated_at']),
            models.Index(fields=['product', 'status']),
        ]

    @property
    def active_unit_price(self):
        return self.counter_price if self.counter_price is not None else self.offered_price

    @property
    def total_value(self):
        return self.active_unit_price * self.quantity

    def __str__(self):
        return f"{self.importer.username} offer for {self.product.name} ({self.status})"

class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ('offer_created', 'Offer Created'),
        ('offer_accepted', 'Offer Accepted'),
        ('offer_rejected', 'Offer Rejected'),
        ('offer_countered', 'Offer Countered'),
        ('offer_importer_countered', 'Importer Countered'),
        ('offer_importer_accepted', 'Importer Accepted'),
        ('offer_importer_rejected', 'Importer Rejected'),
        ('offer_paid', 'Offer Paid'),
        ('general', 'General'),
    ]

    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='sent_notifications')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, null=True, blank=True, related_name='notifications')
    offer = models.ForeignKey(ProductOffer, on_delete=models.CASCADE, null=True, blank=True, related_name='notifications')
    notification_type = models.CharField(max_length=32, choices=NOTIFICATION_TYPES, default='general')
    title = models.CharField(max_length=160)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', 'is_read', '-created_at']),
            models.Index(fields=['offer', '-created_at']),
        ]

    def __str__(self):
        return f"{self.title} -> {self.recipient.username}"
