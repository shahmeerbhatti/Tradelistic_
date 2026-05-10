from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SaleViewSet, ReviewViewSet, admin_sales_data, admin_transactions_analytics

router = DefaultRouter()
router.register(r'sales', SaleViewSet, basename='sale')
router.register(r'reviews', ReviewViewSet, basename='review')

urlpatterns = [
    path('', include(router.urls)),
    # Admin endpoints for transaction management
    path('admin/sales/', admin_sales_data, name='admin_sales_data'),
    path('admin/analytics/', admin_transactions_analytics, name='admin_transactions_analytics'),
]