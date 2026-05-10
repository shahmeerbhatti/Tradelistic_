from django.db import models
from django.conf import settings


class Store(models.Model):
    owner = models.OneToOneField(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='store'
    )
    seller_name = models.CharField(max_length=255, blank=True, help_text="Seller display name")
    name = models.CharField(max_length=255, help_text="Business/Store Name")
    description = models.TextField(help_text="Describe your business")
    logo = models.ImageField(upload_to='store_logos/', null=True, blank=True)
    
    # Contact Information
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    website = models.URLField(blank=True)
    
    # Address Information
    address_line1 = models.CharField(max_length=255, blank=True)
    address_line2 = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, blank=True)
    postal_code = models.CharField(max_length=20, blank=True)
    
    # Business Details
    business_type = models.CharField(
        max_length=50,
        choices=[
            ('manufacturer', 'Manufacturer'),
            ('wholesaler', 'Wholesaler'), 
            ('distributor', 'Distributor'),
            ('trader', 'Trader'),
            ('other', 'Other')
        ],
        default='manufacturer'
    )
    
    established_year = models.PositiveIntegerField(null=True, blank=True)
    employee_count = models.CharField(
        max_length=20,
        choices=[
            ('1-10', '1-10 employees'),
            ('11-50', '11-50 employees'),
            ('51-200', '51-200 employees'),
            ('201-500', '201-500 employees'),
            ('500+', '500+ employees')
        ],
        blank=True
    )
    
    # Settings
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.name} - {self.owner.username}"
    
    class Meta:
        ordering = ['-created_at']
