from django.db import models
from django.contrib.auth import get_user_model
from products.models import Product

User = get_user_model()

class Sale(models.Model):
    # Sales ID (unique identifier for each sale)
    sales_id = models.CharField(max_length=50, unique=True, null=True, blank=True)
    
    # Customer Information
    customer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='purchases')
    
    # Product Information
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='sales')
    quantity = models.PositiveIntegerField(default=1)
    
    # Pricing Information
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Charges and Fees
    shipping_cost = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    tax_amount = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    service_fee = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    final_total = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Customer Details
    customer_name = models.CharField(max_length=200)
    customer_email = models.EmailField()
    customer_phone = models.CharField(max_length=20, blank=True, null=True)
    
    # Shipping Address
    shipping_address_line1 = models.CharField(max_length=255)
    shipping_address_line2 = models.CharField(max_length=255, blank=True, null=True)
    shipping_city = models.CharField(max_length=100)
    shipping_state = models.CharField(max_length=100)
    shipping_country = models.CharField(max_length=100)
    shipping_postal_code = models.CharField(max_length=20)
    
    # Billing Address (can be same as shipping)
    billing_same_as_shipping = models.BooleanField(default=True)
    billing_address_line1 = models.CharField(max_length=255, blank=True, null=True)
    billing_address_line2 = models.CharField(max_length=255, blank=True, null=True)
    billing_city = models.CharField(max_length=100, blank=True, null=True)
    billing_state = models.CharField(max_length=100, blank=True, null=True)
    billing_country = models.CharField(max_length=100, blank=True, null=True)
    billing_postal_code = models.CharField(max_length=20, blank=True, null=True)
    
    # Payment Information
    payment_method = models.CharField(max_length=50, choices=[
        ('stripe_demo', 'Stripe Demo'),
        ('credit_card', 'Credit Card'),
        ('debit_card', 'Debit Card'),
        ('paypal', 'PayPal'),
        ('bank_transfer', 'Bank Transfer'),
        ('cash_on_delivery', 'Cash on Delivery'),
    ], default='credit_card')
    payment_status = models.CharField(max_length=20, choices=[
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    ], default='completed')
    
    # Order Information
    order_id = models.CharField(max_length=50, unique=True)
    order_status = models.CharField(max_length=20, choices=[
        ('processing', 'Processing'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    ], default='delivered')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    shipped_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    
    # Additional Notes
    notes = models.TextField(blank=True, null=True)
    
    class Meta:
        db_table = 'transactions_sale'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['customer', 'created_at']),
            models.Index(fields=['product', 'created_at']),
            models.Index(fields=['order_id']),
        ]
    
    def __str__(self):
        return f"Sale {self.order_id} - {self.customer.username} - {self.product.name}"
    
    def save(self, *args, **kwargs):
        # Auto-generate sales_id if not provided
        if not self.sales_id:
            import uuid
            self.sales_id = f"SALE-{uuid.uuid4().hex[:8].upper()}"
        
        # Auto-calculate final total if not provided
        if not self.final_total:
            self.final_total = self.total_amount + self.shipping_cost + self.tax_amount + self.service_fee
        super().save(*args, **kwargs)

class Review(models.Model):
    # Core Review Information
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    sale = models.ForeignKey(Sale, on_delete=models.CASCADE, related_name='reviews', null=True, blank=True)
    sales_id = models.CharField(max_length=50, null=True, blank=True, help_text="Sales ID from transactions_sale table")
    
    # Review Content
    rating = models.PositiveIntegerField(choices=[(i, i) for i in range(1, 6)])  # 1-5 stars
    title = models.CharField(max_length=200, blank=True, null=True)
    comment = models.TextField()
    
    # Review Metadata
    verified_purchase = models.BooleanField(default=False)
    helpful_count = models.PositiveIntegerField(default=0)
    
    # Moderation
    is_approved = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'transactions_review'
        unique_together = ['user', 'product']  # One review per user per product
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['product', 'rating']),
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['verified_purchase', 'is_approved']),
        ]
    
    def __str__(self):
        return f"Review by {self.user.username} for {self.product.name} - {self.rating} stars"
