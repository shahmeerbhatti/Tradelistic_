from django.contrib import admin
from .models import Product, ProductImage, ProductView, Favorite, Cart, CartItem

class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1
    max_num = 4
    fields = ('image', 'order')

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'price', 'category', 'owner', 'created_at')
    list_filter = ('category', 'created_at', 'owner')
    search_fields = ('name', 'description', 'owner__username')
    inlines = [ProductImageInline]

@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    list_display = ('product', 'order', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('product__name',)

@admin.register(ProductView)
class ProductViewAdmin(admin.ModelAdmin):
    list_display = ('product', 'user', 'ip_address', 'viewed_at')
    list_filter = ('viewed_at', 'product__owner', 'product__category')
    search_fields = ('product__name', 'user__username', 'ip_address')
    readonly_fields = ('product', 'user', 'ip_address', 'user_agent', 'viewed_at', 'referrer', 'session_id')
    
    def has_add_permission(self, request):
        return False  # Don't allow manual creation through admin
    
    def has_change_permission(self, request, obj=None):
        return False  # Don't allow editing through admin

@admin.register(Favorite)
class FavoriteAdmin(admin.ModelAdmin):
    list_display = ('user', 'product', 'created_at')
    list_filter = ('created_at', 'product__category', 'product__owner')
    search_fields = ('user__username', 'product__name')
    readonly_fields = ('created_at',)

class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 0
    readonly_fields = ('created_at', 'updated_at', 'total_price')

@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ('user', 'total_items', 'total_price', 'updated_at')
    list_filter = ('created_at', 'updated_at')
    search_fields = ('user__username',)
    readonly_fields = ('created_at', 'updated_at', 'total_items', 'total_price')
    inlines = [CartItemInline]

@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = ('cart', 'product', 'quantity', 'total_price', 'updated_at')
    list_filter = ('created_at', 'updated_at', 'product__category')
    search_fields = ('cart__user__username', 'product__name')
    readonly_fields = ('created_at', 'updated_at', 'total_price')
